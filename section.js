class SectionJSEvent extends Event {
    constructor(name, context) {
        super(name);

        this.context = context;
    }
}

class Section {
    constructor() {
        this.constructor.elements[this.constructor.elements.length] = this;
    }

    static defer(delegate) {
        if(!Section.deferred) Section.deferred = [];

        Section.deferred.push(delegate);
    }

    static load(tag) {
        let context = {
            tag: tag,
            tagName: tag.getAttribute("data-tag"),
            importDocument: tag.import,
            elements: [],
            base: null
        };

        context.base = Object.create(HTMLElement.prototype);
        context.base.createdCallback = () => {
            let templateElement = null;

            let templateElements = context.importDocument.getElementsByTagName("template");
            if (!templateElements || templateElements.length !== 1) throw new Error("requires exactly one template");

            templateElement = templateElements[0];

            let clone = document.importNode(templateElement.content, true);

            //Section.defer(() => {
                let element = document.getElementsByTagName(context.tagName)[context.elements.length];

                let children = [];

                let hasContentElement = !!(clone.querySelector("content"));

                if (hasContentElement) {
                    while (element.firstChild) {
                        children.push(element.removeChild(element.firstChild));
                    }
                }

                element.appendChild(clone);

                if (hasContentElement) {
                    let contentElement = element.getElementsByTagName("content");

                    if (contentElement && contentElement.length > 0) {
                        children.forEach((child) => contentElement[0].appendChild(child));
                    } else {
                        throw new Error("somehow we lost the content element");
                    }
                }

                let event = new SectionJSEvent("tagcreated", context);
                context.tag.dispatchEvent(event);
                context.importDocument.dispatchEvent(event);

            //}, false);
        };

        document.registerElement(context.tagName, {prototype: context.base });
    }

    static register(tag, template) {
        const Type = this;

        Type.tagName = tag;
        Type.importDocument = document.currentScript.ownerDocument;
        Type.elements = [];

        Type.base = Object.create(HTMLElement.prototype);

        Type.base.createdCallback = () => {
            let templateElement = null;

            if (!template) {
                let templateElements = Type.importDocument.getElementsByTagName("template");

                if (!templateElements || templateElements.length != 1) throw new Error("requires exactly one template");

                templateElement = templateElements[0];
            } else if (typeof template === "string") {
                templateElement = Type.importDocument.getElementById(template);

                if (!templateElement) throw new Error(`template by id ${template} undefined`);
            } else {
                templateElement = template;
            }

            let clone = document.importNode(templateElement.content, true);

            Section.defer(() => {
                let element = document.getElementsByTagName(Type.tagName)[Type.elements.length];

                let children = [];

                let hasContentElement = !!(clone.querySelector("content"));

                if (hasContentElement) {
                    while (element.firstChild) {
                        children.push(element.removeChild(element.firstChild));
                    }
                }

                element.appendChild(clone);

                if (hasContentElement) {
                    let contentElement = element.getElementsByTagName("content");

                    if (contentElement && contentElement.length > 0) {
                        children.forEach((child) => contentElement[0].appendChild(child));
                    } else {
                        throw new Error("somehow we lost the content element");
                    }
                }

                new Type(element);
            }, false);
        };

        return document.registerElement(Type.tagName, {prototype: Type.base });
    }
};

window.addEventListener("load", () => {
    let delegate = null;
    if (!Section.deferred) Section.deferred = [];
    while(delegate = Section.deferred.pop()) {
        delegate();
    }
});

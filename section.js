class Section {
    constructor(element) {
        this.constructor.elements[this.constructor.elements.length] = this;

        this.element = element || {};
        this.element.controller = this;
    }

    static defer(delegate) {
        if(!Section.deferred) Section.deferred = [];

        Section.deferred.push(delegate);
    }

    static create() {
        if (this.tag) {
            let el = new this.tag();

            return this.creator.create(el);
        }

        throw new Error("Create called before registration");
    }

    static register(tag, template) {
        const Type = this;

        Type.tagName = tag;
        Type.importDocument = document.currentScript.ownerDocument;
        Type.elements = [];
        Type.creator = {};

        Type.base = Object.create(HTMLElement.prototype);

        Type.base.createdCallback = () => {
            Type.template = null;

            if (!template) {
                let templateElements = Type.importDocument.getElementsByTagName("template");

                if (!templateElements || templateElements.length !== 1) throw new Error("requires exactly one template");

                Type.template = templateElements[0];
            } else if (typeof template === "string") {
                Type.template = Type.importDocument.getElementById(template);

                if (!Type.template) throw new Error(`template by id ${template} undefined`);
            } else {
                Type.template = template;
            }

            Type.creator.createWithElement = (element) => {
                let clone = document.importNode(Type.template.content, true);

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

                return new Type(element);
            };

            Type.creator.create = (el) => {
                return Type.creator.createWithElement(el || document.createElement(Type.tagName));
            };

            if (!Section.loaded) {
                Section.defer(() => {
                    Type.creator.createWithElement(document.getElementsByTagName(Type.tagName)[Type.elements.length]);
                }, false);
            }
        };

        Type.tag = document.registerElement(Type.tagName, {prototype: Type.base });

        return Type.tag;
    }
}

window.addEventListener("load", () => {
    let delegate;
    if (!Section.deferred) Section.deferred = [];
    while(delegate = Section.deferred.pop()) {
        delegate();
    }
    Section.loaded = true;
});

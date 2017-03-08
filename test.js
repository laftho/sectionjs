const assert = require('assert');

window = {
  addEventListener: () => {}
};

describe('sectionjs', () => {
  it('should require', () => {
    const Section = require('./section');

    assert.equal(Section.name, "Section");
  });
});

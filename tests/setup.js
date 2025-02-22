global.requestAnimationFrame = callback => {
  global.setTimeout(callback, 0);
};

global.cancelAnimationFrame = id => {
  global.clearTimeout(id);
};

const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

Object.assign(Enzyme.ReactWrapper.prototype, {
  openPicker(index = 0) {
    this.find('input')
      .at(index)
      .simulate('mousedown')
      .simulate('focus');
  },
  closePicker(index = 0) {
    this.find('input')
      .at(index)
      .simulate('blur');
  },
  isOpen() {
    const openDiv = this.find('.rc-picker-dropdown').hostNodes();
    return (
      openDiv &&
      openDiv.length &&
      !openDiv.hasClass('rc-picker-dropdown-hidden')
    );
  },
  selectCell(text, index = 0) {
    let matchCell;

    const panel = index ? this.find('InnerPicker').at(index) : this;
    panel.find('td').forEach(td => {
      if (
        td.text() === String(text) &&
        td.props().className.includes('-in-view')
      ) {
        matchCell = td;
        td.simulate('click');
      }
    });

    if (!matchCell) {
      throw new Error('Cell not match in picker panel.');
    }

    return matchCell;
  },
  clickButton(type) {
    let matchBtn;
    this.find('button').forEach(btn => {
      if (btn.props().className.includes(`-header-${type}-btn`)) {
        matchBtn = btn;
      }
    });

    matchBtn.simulate('click');

    return matchBtn;
  },
  clearValue(index = 0) {
    this.find('Picker')
      .at(index)
      .find('.rc-picker-clear-btn')
      .simulate('click');
  },
  keyDown(which, info = {}) {
    this.find('input').simulate('keydown', { ...info, which });
  },
});

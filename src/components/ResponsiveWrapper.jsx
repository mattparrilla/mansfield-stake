import { PropTypes, Component, cloneElement } from 'react';

class ResponsiveWrapper extends Component {
  constructor() {
    super();
    this.state = {
      width: 0,
      height: 0,
    };
  }

  componentDidMount() {
    this.update();
    const win = window;
    if (win.addEventListener) {
      win.addEventListener('resize', this.onResize, false);
    } else if (win.attachEvent) {
      win.attachEvent('onresize', this.onResize);
    } else {
      win.onresize = this.onResize;
    }
  }

  onResize() {
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(this.update, 16);
  }

  update() {
    const win = window;
    const widthOffset = win.innerWidth < 680 ? 0 : 100;
    const width = win.innerWidth - widthOffset;

    this.setState({
      renderPage: true,
      width,
      height: width * 0.5,
    });
  }

  render() {
    return cloneElement(this.props.children, {
      width: this.state.width,
      height: this.state.height,
    });
  }
}

ResponsiveWrapper.propTypes = {
  children: PropTypes.element,
};

export default ResponsiveWrapper;

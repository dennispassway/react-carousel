const containerStyle = {
  boxSizing: 'border-box',
  display: 'block',
  height: 'auto',
  position: 'relative',
}

const frameStyle = {
  boxSizing: 'border-box',
  display: 'block',
  height: 'auto',
  margin: '0px',
  overflow: 'hidden',
  padding: '0px',
  position: 'relative',
  touchAction: 'pan-y pinch-zoom',
  transform: 'translateX(0px)',
}

const slideContainerStyle = (slideAmount, width, height, currentSlide, dragX, rtl) => ({
  boxSizing: 'border-box',
  cursor: 'pointer',
  display: 'block',
  height: height,
  margin: 0,
  padding: 0,
  position: 'relative',
  touchAction: 'pan-y pinch-zoom',
  transform: `translateX(${dragX ? dragX : (currentSlide * width) * (rtl ? 1 : -1)}px)`,
  width: slideAmount * width,
  transition: dragX ? 'none' : 'transform ease-in-out 200ms',
})

const slideStyle = (pos, width) => ({
  boxSizing: 'border-box',
  display: 'inline-block',
  height: 'auto',
  left: pos * width,
  margin: 'auto 0px',
  position: 'absolute',
  top: 0,
  width: width,
})

const dotContainerStyles = { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }
const arrowContainerStyles = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%' }

const invisibleButtonStyles = { backgroundColor: 'transparent', border: 'none', padding: 0, outline: 'none', cursor: 'pointer' }

const leftArrowStyles = { ...invisibleButtonStyles, position: 'absolute', left: 0 }
const rightArrowStyles = { ...invisibleButtonStyles, position: 'absolute', right: 0, transform: 'rotate(180deg)' }

export default class Carousel extends Component {

  state = {
    currentSlide: this.props.initialSlide || 0,
    slideHeight: 0,
    slideWidth: 0,
    dragX: null
  }

  componentDidMount() {
    this.mounted = true
    this.addEventListeners()
    this.onResize()
    setTimeout(() => this.onResize(), 0) // On repaint, calculate height and width
  }

  componentWillUnmount() {
    this.removeEventListeners()
    this.mounted = false
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize)
    window.addEventListener('mouseup', this.dragEnd)
    window.addEventListener('touchend', this.dragEnd)
  }

  removeEventListeners() {
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('mouseup', this.dragEnd)
    window.removeEventListener('touchend', this.dragEnd)
  }

  onResize = () => {
    this.mounted && this.setState(this.slideWidthAndHeight())
  }

  slideWidthAndHeight() {
    if (!this.frame) {
      return null
    }

    const slideHeight = this.getSlideHeight(this.frame)
    const slideWidth = this.getSlideWidth(this.frame)

    return { slideHeight, slideWidth }
  }

  getSlideHeight(frame) {
    let maxHeight = 0

    const childNodesArray = [...frame.childNodes[0].childNodes]

    childNodesArray.forEach(c => {
      maxHeight = c.offsetHeight > maxHeight ? c.offsetHeight : maxHeight
    })

    return maxHeight
  }

  getSlideWidth(frame) {
    return frame ? frame.offsetWidth : 0
  }

  dragStart = e => {
    this.mounted && this.setState({ dragging: true })

    const { rtl, children } = this.props
    const { x, width } = this.slidesContainer.getBoundingClientRect()
    const frameX = this.frame.getBoundingClientRect().x
    const rtlOffset = (width / children.length) * (children.length - 1)

    const initialPosition = rtl ? (x - frameX) + rtlOffset : x - frameX

    this.dragObject = {
      initial: initialPosition,
      currentPosition: initialPosition
    }

    if (e.type === 'touchstart') {
      this.dragObject.start = e.touches[0].clientX
    } else {
      this.dragObject.start = e.clientX
    }
  }

  dragMove = e => {
    if (!this.state.dragging) {
      return
    }

    const { start } = this.dragObject

    if (e.type === 'touchmove') {
      this.dragObject.end = start - e.touches[0].clientX;
      this.dragObject.start = e.touches[0].clientX;
    } else {
      this.dragObject.end = start - e.clientX;
      this.dragObject.start = e.clientX;
    }

    const newPosition = this.dragObject.currentPosition - this.dragObject.end
    this.dragObject.currentPosition = newPosition

    this.mounted && this.setState({ dragX: newPosition })
  }

  dragEnd = () => {
    const { currentSlide, dragging } = this.state
    const { rtl } = this.props

    if (!dragging) {
      return
    }

    const { initial, currentPosition } = this.dragObject

    const minimumDragDistance = 100

    if (currentPosition - initial < -minimumDragDistance) {
      this.goToSlide(rtl ? currentSlide - 1 : currentSlide + 1)
    } else if (currentPosition - initial > minimumDragDistance) {
      this.goToSlide(rtl ? currentSlide + 1 : currentSlide - 1)
    } else {
      this.mounted && this.setState({ dragX: initial })
    }

    this.dragObject = null

    this.mounted && this.setState({ dragging: false, dragX: null })
  }

  goToSlide = index => {
    const { currentSlide } = this.state
    const { children } = this.props

    this.mounted && this.setState({ dragX: null })

    if (index === currentSlide) {
      return
    }

    if (index < 0 || index > children.length - 1) {
      return
    }


    this.mounted && this.setState({ currentSlide: index })
  }

  render() {
    const { slideHeight, slideWidth, currentSlide, dragX } = this.state
    const { children, rtl, hideDots, hideArrows } = this.props

    const childrenInCorrectOrder = rtl ? [...children].reverse() : children

    return (
      <div id='container'
        style={containerStyle}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <div id='frame'
          ref={el => { this.frame = el }}
          style={frameStyle}
          onMouseDown={this.dragStart}
          onMouseMove={this.dragMove}
          onMouseUp={this.dragEnd}
          onTouchStart={this.dragStart}
          onTouchMove={this.dragMove}
          onTouchEnd={this.dragEnd}
        >
          <div id='slidesContainer'
            ref={el => { this.slidesContainer = el }}
            style={slideContainerStyle(React.Children.count(children), slideWidth, slideHeight, currentSlide, dragX, rtl)}
          >
            {childrenInCorrectOrder.map((child, i) => <div id='slide' style={slideStyle(i, slideWidth)} key={i}>{child}</div>)}
          </div>
        </div>

        {!hideArrows && this.renderArrows()}
        {!hideDots && this.renderDots()}
      </div >
    )
  }

  renderArrows() {
    const { currentSlide } = this.state
    const { children, rtl, arrowPadding, arrowColor } = this.props

    return (
      <div id='arrowsContainer' style={arrowContainerStyles}>
        {(currentSlide > 0) && (
          <button style={rtl ? { ...rightArrowStyles, right: arrowPadding || 0 } : { ...leftArrowStyles, left: arrowPadding || 0 }} onClick={() => this.goToSlide(currentSlide - 1)} type='button'>
            <Chevron fill={arrowColor} />
          </button>
        )}
        {(currentSlide < (children.length - 1)) && (
          <button style={rtl ? { ...leftArrowStyles, left: arrowPadding || 0 } : { ...rightArrowStyles, right: arrowPadding || 0 }} onClick={() => this.goToSlide(currentSlide + 1)} type='button'>
            <Chevron fill={arrowColor} />
          </button>
        )}
      </div>
    )
  }

  renderDots() {
    const { currentSlide } = this.state
    const { children } = this.props

    return (
      <div id='dotsContainer' style={dotContainerStyles}>
        {children.map((_, i) => (
          <button
            key={i}
            style={invisibleButtonStyles}
            onClick={() => this.goToSlide(i)}
            type='button'
          >
            <Dot active={currentSlide === i} style={{ marginLeft: 5, marginRight: 5 }} />
          </button>
        ))}
      </div>
    )
  }
}

function Dot({ style, active }) {
  return (
    <svg style={style} width='5' height='5' viewBox='0 0 5 5' xmlns='http://www.w3.org/2000/svg'>
      <circle fill={active ? '#000000' : '#D8D8D8'} cx='2.5' cy='2.5' r='2.5' fillRule='evenodd' />
    </svg>
  )
}

function Chevron({ fill, style }) {
  return (
    <svg style={style} width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill={fill || '#000000'}>
      <path d='M16.618 3.412L10.03 10l6.588 6.588a.763.763 0 0 1 .236.558.763.763 0 0 1-.236.559l-2.06 2.06A.763.763 0 0 1 14 20a.763.763 0 0 1-.558-.236l-9.206-9.206A.763.763 0 0 1 4 10c0-.215.079-.401.236-.558L13.442.236A.763.763 0 0 1 14 0c.215 0 .401.079.558.236l2.06 2.06a.763.763 0 0 1 .236.558.763.763 0 0 1-.236.558z' fillRule='evenodd' />
    </svg>
  )
}

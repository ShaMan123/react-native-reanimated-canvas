import React, { Component, forwardRef } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import RCanvas from 'react-native-reanimated-canvas';
import { RectButton } from 'react-native-gesture-handler';

class RNSketchCanvas extends Component {

  static defaultProps = {
    containerStyle: null,
    canvasStyle: null,
    onStrokeStart: () => { },
    onStrokeChanged: () => { },
    onStrokeEnd: () => { },
    onClosePressed: () => { },
    onUndoPressed: () => { },
    onClearPressed: () => { },
    onPathsChange: () => { },
    user: null,

    closeComponent: null,
    eraseComponent: null,
    undoComponent: null,
    clearComponent: null,
    saveComponent: null,
    strokeComponent: null,
    strokeSelectedComponent: null,
    strokeWidthComponent: null,

    strokeColors: [
      { color: '#000000' },
      { color: '#FF0000' },
      { color: '#00FFFF' },
      { color: '#0000FF' },
      { color: '#0000A0' },
      { color: '#ADD8E6' },
      { color: '#800080' },
      { color: '#FFFF00' },
      { color: '#00FF00' },
      { color: '#FF00FF' },
      { color: '#FFFFFF' },
      { color: '#C0C0C0' },
      { color: '#808080' },
      { color: '#FFA500' },
      { color: '#A52A2A' },
      { color: '#800000' },
      { color: '#008000' },
      { color: '#808000' }],
    alphlaValues: ['33', '77', 'AA', 'FF'],
    defaultStrokeIndex: 0,
    defaultStrokeWidth: 3,

    minStrokeWidth: 3,
    maxStrokeWidth: 15,
    strokeWidthStep: 3,

    savePreference: null,
    onSketchSaved: () => { },

    text: null,
    localSourceImage: null,

    permissionDialogTitle: '',
    permissionDialogMessage: '',
  };

  _ref = React.createRef();

  constructor(props) {
    super(props)

    this.state = {
      color: props.strokeColors[props.defaultStrokeIndex].color,
      strokeWidth: props.defaultStrokeWidth,
      alpha: 'FF'
    }

    this._colorChanged = false
    this._strokeWidthStep = props.strokeWidthStep
    this._alphaStep = -1
  }

  ref() {
    return this.props.forwardedRef.current;
  }

  save() {
    if (this.props.savePreference) {
      const p = this.props.savePreference()
      this.ref().save(p.imageType, p.transparent, p.folder ? p.folder : '', p.filename, p.includeImage !== false, p.includeText !== false, p.cropToImageSize || false)
    } else {
      const date = new Date()
      this.ref().save('png', false, '',
        date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + ('0' + date.getDate()).slice(-2) + ' ' + ('0' + date.getHours()).slice(-2) + '-' + ('0' + date.getMinutes()).slice(-2) + '-' + ('0' + date.getSeconds()).slice(-2),
        true, true, false)
    }
  }

  nextStrokeWidth() {
    if ((this.state.strokeWidth >= this.props.maxStrokeWidth && this._strokeWidthStep > 0) ||
      (this.state.strokeWidth <= this.props.minStrokeWidth && this._strokeWidthStep < 0))
      this._strokeWidthStep = -this._strokeWidthStep
    this.setState({ strokeWidth: this.state.strokeWidth + this._strokeWidthStep })
  }

  _renderItem = ({ item, index }) => (
    <TouchableOpacity style={{ marginHorizontal: 2.5 }} onPress={() => {
      if (this.state.color === item.color) {
        const index = this.props.alphlaValues.indexOf(this.state.alpha)
        if (this._alphaStep < 0) {
          this._alphaStep = index === 0 ? 1 : -1
          this.setState({ alpha: this.props.alphlaValues[index + this._alphaStep] })
        } else {
          this._alphaStep = index === this.props.alphlaValues.length - 1 ? -1 : 1
          this.setState({ alpha: this.props.alphlaValues[index + this._alphaStep] })
        }
      } else {
        this.setState({ color: item.color })
        this._colorChanged = true
      }
    }}>
      {this.state.color !== item.color && this.props.strokeComponent && this.props.strokeComponent(item.color)}
      {this.state.color === item.color && this.props.strokeSelectedComponent && this.props.strokeSelectedComponent(item.color + this.state.alpha, index, this._colorChanged)}
    </TouchableOpacity>
  )

  componentDidUpdate() {
    this._colorChanged = false
  }


  render() {
    console.log(this.props.onSketchSaved)
    return (
      <View style={this.props.containerStyle}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-start' }}>
            {this.props.eraseComponent && (
              <TouchableOpacity onPress={() => { this.setState({ color: '#00000000' }) }}>
                {this.props.eraseComponent}
              </TouchableOpacity>)
            }
          </View>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
            {this.props.strokeWidthComponent && (
              <TouchableOpacity onPress={() => { this.nextStrokeWidth() }}>
                {this.props.strokeWidthComponent(this.state.strokeWidth)}
              </TouchableOpacity>)
            }

            {this.props.undoComponent && (
              <TouchableOpacity onPress={() => { this.props.onUndoPressed(this.ref().undo()) }}>
                {this.props.undoComponent}
              </TouchableOpacity>)
            }

            {this.props.clearComponent && (
              <TouchableOpacity onPress={() => { this.ref().clear(); this.props.onClearPressed() }}>
                {this.props.clearComponent}
              </TouchableOpacity>)
            }

            {this.props.saveComponent && (
              <TouchableOpacity onPress={() => { this.save() }}>
                {this.props.saveComponent}
              </TouchableOpacity>)
            }
          </View>
        </View>
        <RCanvas
          {...this.props}
          ref={this.props.forwardedRef}
          style={this.props.canvasStyle}
          strokeColor={this.state.color + (this.state.color.length === 9 ? '' : this.state.alpha)}
          strokeWidth={this.state.strokeWidth}
        />
        <View style={{ flexDirection: 'row' }}>
          <FlatList
            data={this.props.strokeColors}
            extraData={this.state}
            keyExtractor={() => Math.ceil(Math.random() * 10000000).toString()}
            renderItem={this._renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>
    );
  }
};

export default React.forwardRef((props, ref) => <RNSketchCanvas {...props} forwardedRef={ref} />);
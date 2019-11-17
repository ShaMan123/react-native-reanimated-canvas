
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import RNSketchCanvas from '../App/RNSketchCanvas';
import CommonExample from './common';
import RCanvas, { RCanvasModule } from 'react-native-reanimated-canvas';
import { useCanvasContext, styles } from './common';


export default function Example() {
  const context = useCanvasContext();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={styles.functionButton} onPress={() => {
            context.dispatch({ example: 0 })
          }}>
            <Text style={{ color: 'white' }}>Close</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              context.dispatch({ thickness: 10 })
            }}>
              <Text style={{ color: 'white' }}>Thick</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionButton} onPress={() => {
              context.dispatch({ thickness: 5 })
            }}>
              <Text style={{ color: 'white' }}>Thin</Text>
            </TouchableOpacity>
          </View>
        </View>
        <RCanvas
          {...context.canvas}
          localSourceImage={{ filename: 'whale.png', directory: RCanvasModule.MAIN_BUNDLE, mode: 'AspectFit' }}
          // localSourceImage={{ filename: 'bulb.png', directory: RNSketchCanvas.MAIN_BUNDLE }}
          style={{ flex: 1 }}
          strokeColor={this.state.color}
          strokeWidth={this.state.thickness}
          onStrokeStart={(ev) => {
            context.dispatch({ message: 'Start' })
          }}
          onStrokeChanged={(ev) => {
            context.dispatch({ message: 'Changed' })
          }}
          onStrokeEnd={() => {
            context.dispatch({ message: 'End' })
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.functionButton, { backgroundColor: 'red' }]} onPress={() => {
              context.dispatch({ color: '#FF0000' })
            }}>
              <Text style={{ color: 'white' }}>Red</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.functionButton, { backgroundColor: 'black' }]} onPress={() => {
              context.dispatch({ color: '#000000' })
            }}>
              <Text style={{ color: 'white' }}>Black</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ marginRight: 8, fontSize: 20 }}>{this.state.message}</Text>
          <TouchableOpacity style={[styles.functionButton, { backgroundColor: 'black', width: 90 }]} onPress={() => {
            console.log(context._canvas.getPaths())
            //Alert.alert(JSON.stringify(this.canvas.getPaths()))
            context._canvas.getBase64('jpg', false, true, true, true, (err, result) => {
              console.log(result)
            })
          }}>
            <Text style={{ color: 'white' }}>Get Paths</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
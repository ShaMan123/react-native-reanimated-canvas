import * as React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeWrapper } from 'react-native-gesture-handler';
import RCanvas from 'react-native-reanimated-canvas';
import { TabBar, TabView } from 'react-native-tab-view';
import GCanva from './Gestures';


const GHSC = createNativeWrapper(RCanvas, {
  disallowInterruption: true,
  enabled: true,
  shouldActivateOnStart: true,
  shouldCancelWhenOutside: false
});


export default class DynamicTabBar extends React.Component {
  static title = 'Scrollable tab bar (auto width)';
  static backgroundColor = '#3f51b5';
  static appbarElevation = 0;

  routeRefs = {
    first: React.createRef(),
    second: React.createRef(),
    third: React.createRef(),
  };

  state = {
    index: 0,
    routes: [
      { key: 'first', title: 'Article' },
      { key: 'second', title: 'Contacts' },
      { key: 'third', title: 'Albums' },
    ],
  };

  componentDidMount() {
    setTimeout(() => {
      const { routes } = this.state;
      routes.push(
        { key: 'fourth', title: 'Added Dynamically' },
        { key: 'fifth', title: 'Added Dynamically 2' }
      );
      this.setState({
        routes
      })
    }, 5000);
  }

  handleIndexChange = (index) =>
    this.setState({
      index,
    });

  renderTabBar = (props) => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={styles.indicator}
      style={styles.tabbar}
      labelStyle={styles.label}
      tabStyle={styles.tabStyle}
    />
  );

  renderScene = ({ position, layout, jumpTo, route }) => {
    return <GCanva />;
    /*
    return <GHSC
      ref={this.routeRefs[route.key]}
      strokeWidth={24}
      strokeColor={'red'}
      style={{ flex: 1 }}
    />;
    */
  };

  render() {
    return (
      <TabView
        navigationState={this.state}
        renderScene={this.renderScene}
        renderTabBar={this.renderTabBar}
        onIndexChange={this.handleIndexChange}
      /*
      gestureHandlerProps={{
        waitFor: _.values(this.routeRefs)[this.state.index]
      }}
      */
      />
    );
  }
}

const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: '#3f51b5',
  },
  indicator: {
    backgroundColor: '#ffeb3b',
  },
  label: {
    fontWeight: '400',
  },
  tabStyle: {
    width: 'auto',
  },
});
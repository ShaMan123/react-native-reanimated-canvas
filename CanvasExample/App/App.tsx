import { createBrowserApp } from '@react-navigation/web';
import React, { useCallback } from 'react';
import { FlatList, Platform, StyleSheet, Text, View, YellowBox, TabBarIOS } from 'react-native';
import { RectButton, ScrollView } from 'react-native-gesture-handler';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import _ from 'lodash';
/*
YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Module RCTImageLoader',
]);
// refers to bug in React Navigation which should be fixed soon
// https://github.com/react-navigation/react-navigation/issues/3956
*/

import E1 from './E1';
import E2 from './E2';
import E3 from './E3';
import E4 from './E4';
import E5 from './E5';
import E6 from './E6';
import E7 from './E7';
import E8 from './E8';
import Tabs from './Tabs';
import CommonExample from './common';

const SCREENS = {
  E1: { screen: E1, title: 'D' },
  E2: { screen: E2, title: 'A' },
  E3: { screen: E3, title: 'Sync two canvases' },
  E4: { screen: E4, title: 'Take a photo first' },
  E5: { screen: E5, title: 'Load local image' },
  E6: { screen: E6, title: 'Draw text on canvas' },
  E7: { screen: E7, title: 'Multiple canvases in ScrollView' },
  E8: { screen: E8, title: 'R' },
  E9: { screen: Tabs, title: 'Tabs' }
};

_.map(SCREENS, ({ screen, title }) => _.set(screen, 'navigationOptions.title', title));

function MainScreen(props) {
  const data = Object.keys(SCREENS).map(key => ({ key }));
  return (
    <FlatList
      style={styles.list}
      data={data}
      ItemSeparatorComponent={ItemSeparator}
      renderItem={p => (
        <MainScreenItem
          {...p}
          onPressItem={({ key }) => props.navigation.navigate(key)}
        />
      )}
      renderScrollComponent={props => <ScrollView {...props} />}
    />
  );
}

const ItemSeparator = () => <View style={styles.separator} />;

function MainScreenItem(props) {
  const _onPress = useCallback(() => props.onPressItem(props.item), [props])
  const { key } = props.item;
  return (
    <RectButton style={styles.button} onPress={_onPress}>
      <Text style={styles.buttonText}>{SCREENS[key].title || key}</Text>
    </RectButton>
  );
}

const ExampleApp = createStackNavigator(
  {
    Main: { screen: MainScreen },
    ..._.mapValues(SCREENS, ({ screen: Screen, title }) => ({
      screen: (props: any) => <CommonExample><Screen {...props} /></CommonExample>,
      title
    }))
  },
  {
    initialRouteName: 'Main',
    headerMode: 'screen',
  }
);

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

const createApp = Platform.select({
  web: input => createBrowserApp(input, { history: 'hash' }),
  default: input => createAppContainer(input),
});

export default createApp(ExampleApp);

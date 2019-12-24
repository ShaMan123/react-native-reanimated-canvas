
import React from 'react';
import ReactDOM from 'react-dom';
import RedBox from 'redbox-react';
import App from 'component-docs/dist/templates/App.js';
import data from './app.data';
import 'component-docs/dist/styles/reset.css';
import 'component-docs/dist/styles/globals.css';

import 'C:/Users/DELL/Autodidact/react-native-reanimated-canvas/docs/assets/styles.css';

const root = document.getElementById('root');
const render = () => {
  try {
    ReactDOM.hydrate(
      <App
        name={window.__INITIAL_PATH__}
        data={data}
        github={"https://github.com/ShaMan123/react-native-reanimated-canvas"}
        logo={undefined}
      />,
      root
    );
  } catch (e) {
    ReactDOM.render(
      <RedBox error={e} />,
      root
    );
  }
};

if (module.hot) {
  module.hot.accept(() => {
    render();
  });
}

render();

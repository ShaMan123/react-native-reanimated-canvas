/* tslint:disable: no-console */

const fs = require('fs');
const _ = require('lodash');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'CanvasExample', 'dev.config.json');
const config = require('../CanvasExample/dev.config.json');
const defaultConfig = {
    "useBaseImplementation": false,
    "useLocalReanimatedModule": false
}

module.exports = {
    prepareExample() {
        fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, '\t'));
    },

    restoreExample() {
        fs.writeFileSync(filePath, JSON.stringify(config, null, '\t'));
    }
}




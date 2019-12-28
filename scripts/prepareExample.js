/* tslint:disable: no-console */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'example.config.json');
const defaultConfig = {
    "useBaseImplementation": false,
    "useLocalReanimatedModule": false
}


class Handler {

    config = {};

    constructor() {
        this.config = this.read();
    }

    writeDefaultConfig() {
        fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, '\t'));
    }

    read() {
        this.config = fs.existsSync(filePath) ? require(filePath) : defaultConfig;
        return this.config;
    }

    touch() {
        !fs.existsSync(filePath) && this.writeDefaultConfig();
    }

    prepare() {
        this.read();
        this.writeDefaultConfig();
    }

    restore() {
        fs.writeFileSync(filePath, JSON.stringify(this.config, null, '\t'));
    }
}

module.exports = Handler;




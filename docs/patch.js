
const path = require('path');
const fs = require('fs');

const pn = path.resolve(__dirname, 'node_modules').replace(/\\/g, '/');
const p = path.resolve(__dirname).replace(/\\/g, '/');

function patch() {
  const needsPatch = path.resolve(__dirname, 'dist', 'app.src.js');
  let rawContent = fs.readFileSync(needsPatch).toString();
  rawContent = rawContent.replace(/\\/g, '/');
  rawContent = rawContent.replace(new RegExp(`${pn}/`, 'g'), '');
  rawContent = rawContent.replace(new RegExp(`${p}/`, 'g'), '../');

  fs.writeFileSync(needsPatch, rawContent);
}

patch();
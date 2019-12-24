
const path = require('path');
const fs = require('fs');

function patch() {
  const needsPatch = path.resolve(__dirname, 'dist', 'app.src.js');
  const newContent = fs.readFileSync(needsPatch).toString().replace(/\\/g, '/');
  fs.writeFileSync(needsPatch, newContent);
}

patch();
const fs = require('fs');
const content = fs.readFileSync('d:/Ispoved/src/data/prayers.js', 'utf-8');
const canon = fs.readFileSync('d:/Ispoved/src/data/canon.txt', 'utf-8');

const updated = content.replace(/(\s+beforeCommunion:\s+`)/g, '\n        repentanceCanon: `\n' + canon + '`,\n$1');

fs.writeFileSync('d:/Ispoved/src/data/prayers.js', updated, 'utf-8');
console.log('Done');

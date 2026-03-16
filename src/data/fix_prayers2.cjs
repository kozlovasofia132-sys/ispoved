const fs = require('fs');
let content = fs.readFileSync('d:/Ispoved/src/data/prayers.js', 'utf-8');

// Replace any instance of closing backtick and comma followed by another closing backtick and comma
content = content.replace(/`,\s*`,\s*/g, '`,\n\n        ');

fs.writeFileSync('d:/Ispoved/src/data/prayers.js', content, 'utf-8');
console.log('Fixed extra backticks globally');

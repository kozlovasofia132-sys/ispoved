const fs = require('fs');
const content = fs.readFileSync('d:/Ispoved/src/data/prayers.js', 'utf-8');

// Replace the duplicated "repentanceCanon: \`\n        repentanceCanon: \`" with just one
const updated = content.replace(/repentanceCanon:\s*`\s*repentanceCanon:\s*`/g, 'repentanceCanon: `');

fs.writeFileSync('d:/Ispoved/src/data/prayers.js', updated, 'utf-8');
console.log('Fixed syntax error');

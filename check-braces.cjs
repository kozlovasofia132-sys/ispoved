const fs = require('fs');
const code = fs.readFileSync('src/main.js', 'utf8');

let braceDepth = 0;
let parenDepth = 0;
let inString = false;
let stringChar = null;
let inComment = false;
let inTemplate = false;

for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i - 1] : '';
    const next = i < code.length - 1 ? code[i + 1] : '';
    const line = code.substring(0, i).split('\n').length;
    
    // Handle template literals
    if (char === '`' && prev !== '\\') {
        inTemplate = !inTemplate;
    }
    
    // Handle string literals
    if ((char === '"' || char === "'") && prev !== '\\' && !inTemplate) {
        if (!inString) {
            inString = true;
            stringChar = char;
        } else if (char === stringChar) {
            inString = false;
            stringChar = null;
        }
    }
    
    // Handle comments
    if (!inString && !inTemplate && char === '/' && next === '/') {
        inComment = true;
    }
    if (inComment && char === '\n') {
        inComment = false;
    }
    
    // Skip everything inside strings, templates, comments
    if (inString || inTemplate || inComment) continue;
    
    // Count braces and parens
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    
    if (braceDepth < 0) {
        console.log(`ERROR: Extra '}' at line ${line}, char ${i}`);
        console.log(`Context: ${JSON.stringify(code.substring(i-20, i+20))}`);
        braceDepth = 0; // Reset to continue
    }
    if (parenDepth < 0) {
        console.log(`ERROR: Extra ')' at line ${line}, char ${i}`);
        console.log(`Context: ${JSON.stringify(code.substring(i-20, i+20))}`);
        parenDepth = 0; // Reset to continue
    }
}

console.log(`\nFinal: braceDepth=${braceDepth}, parenDepth=${parenDepth}`);

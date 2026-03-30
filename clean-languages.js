// Скрипт для удаления uk и en переводов из sins.js
const fs = require('fs');
const path = require('path');

const sinsPath = path.join(__dirname, 'src', 'data', 'sins.js');
let content = fs.readFileSync(sinsPath, 'utf8');

// Удаляем uk и en из title, subtitle, text, explanation
// Паттерн для title/subtitle: { ru: '...', uk: '...', en: '...' }
// Паттерн для text/explanation: { ru: '...', uk: '...', en: '...' }

// Функция для очистки объекта перевода
function cleanTranslationObject(match, p1, p2, p3) {
    // p1 = ru контент, p2 = uk контент, p3 = en контент
    // Оставляем только ru
    return `{ ru: ${p1} }`;
}

// Очищаем title и subtitle (простые объекты)
content = content.replace(
    /title:\s*\{\s*ru:\s*('[^']*'),\s*uk:\s*'[^']*',\s*en:\s*'[^']*'\s*\}/g,
    "title: { ru: $1 }"
);

content = content.replace(
    /subtitle:\s*\{\s*ru:\s*('[^']*'),\s*uk:\s*'[^']*',\s*en:\s*'[^']*'\s*\}/g,
    "subtitle: { ru: $1 }"
);

// Очищаем text в грехах
content = content.replace(
    /text:\s*\{\s*ru:\s*('[^']*'),\s*uk:\s*'[^']*',\s*en:\s*'[^']*'\s*\}/g,
    "text: { ru: $1 }"
);

// Очищаем explanation в грехах
content = content.replace(
    /explanation:\s*\{\s*ru:\s*('[^']*'),\s*uk:\s*'[^']*',\s*en:\s*'[^']*'\s*\}/g,
    "explanation: { ru: $1 }"
);

// Также обрабатываем варианты с двойными кавычками
content = content.replace(
    /title:\s*\{\s*ru:\s*("[^"]*"),\s*uk:\s*"[^"]*",\s*en:\s*"[^"]*"\s*\}/g,
    "title: { ru: $1 }"
);

content = content.replace(
    /subtitle:\s*\{\s*ru:\s*("[^"]*"),\s*uk:\s*"[^"]*",\s*en:\s*"[^"]*"\s*\}/g,
    "subtitle: { ru: $1 }"
);

content = content.replace(
    /text:\s*\{\s*ru:\s*("[^"]*"),\s*uk:\s*"[^"]*",\s*en:\s*"[^"]*"\s*\}/g,
    "text: { ru: $1 }"
);

content = content.replace(
    /explanation:\s*\{\s*ru:\s*("[^"]*"),\s*uk:\s*"[^"]*",\s*en:\s*"[^"]*"\s*\}/g,
    "explanation: { ru: $1 }"
);

fs.writeFileSync(sinsPath, content, 'utf8');
console.log('✓ Очистка завершена. Удалены uk и en переводы из sins.js');

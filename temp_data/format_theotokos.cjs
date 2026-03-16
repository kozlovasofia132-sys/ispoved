const fs = require('fs');

const rawText = fs.readFileSync('d:/Ispoved/temp_data/theotokos_raw.txt', 'utf-8');
const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

let html = `<h2 class="text-2xl font-bold mb-6 text-center text-amber-500 uppercase">Канон молебный ко Пресвятой Богородице</h2>\n\n`;

let currentSection = null;

function closeSection() {
    if (currentSection) {
        html += `    </div>\n</div>\n\n`;
        currentSection = null;
    }
}

function openSection(title) {
    closeSection();
    html += `<div class="mb-12">\n`;
    html += `    <h3 class="font-bold text-xl mb-4 text-red-600 text-center uppercase">${title}</h3>\n`;
    html += `    <div class="space-y-4">\n`;
    currentSection = title;
}

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('Аудио:') || line.match(/^\d+:\d+$/)) continue;

    if (line.startsWith('Тропaрь Богородице') || line.startsWith('Псалом 50') || line.startsWith('Канон.') || line.match(/^Пе́снь \d+/) || line.match(/^Тропа́рь, гла́с \d+/) || line.match(/^Конда́к, гла́с \d+/) || line.startsWith('Другой кондак') || line.startsWith('Стихира') || line.match(/^Стихиры, глас \d+/) || line.startsWith('Моли́тва')) {
        openSection(line.replace('1', '')); // Remove '1' at the end of titles if present
        continue;
    }

    if (!currentSection) {
         html += `<div class="mb-12">\n    <div class="space-y-4">\n`;
         currentSection = "Default";
    }

    if (line.startsWith('Ирмо́с:')) {
        let text = line.replace('Ирмо́с:', '').trim();
        html += `        <p class="mb-4"><span class="font-bold">Ирмо́с:</span> <span class="italic">${text}</span></p>\n`;
    } else if (line.startsWith('Припе́в:')) {
        let text = line.replace('Припе́в:', '').trim();
        html += `        <p class="mb-2"><span class="font-bold text-red-600">Припе́в:</span> ${text}</p>\n`;
    } else if (line.startsWith('Пресвята́я Богоро́дице, спаси́ на́с.')) {
        html += `        <p class="mb-2"><span class="text-red-600 font-bold">${line}</span></p>\n`;
    } else if (line.startsWith('Сла́ва Отцу') || line.startsWith('И ны́не')) {
        if (line.length < 100) {
            html += `        <p class="mb-2"><span class="text-red-600 font-bold">${line}</span></p>\n`;
        } else {
             let match = line.match(/^(Сла́ва Отцу[^.]+\.|И ны́не[^.]+\.)\s*(.*)/);
             if (match) {
                 html += `        <p class="mb-2"><span class="text-red-600 font-bold">${match[1]}</span></p>\n`;
                 let pText = match[2];
                 let firstChar = pText.charAt(0);
                 let rest = pText.slice(1);
                 html += `        <p class="mb-4"><span class="text-red-600">${firstChar}</span>${rest}</p>\n`;
             } else {
                 html += `        <p class="mb-4"><span class="text-red-600">${line.charAt(0)}</span>${line.slice(1)}</p>\n`;
             }
        }
    } else if (line === 'Богородичен') {
        html += `        <h4 class="font-bold text-lg mb-2 text-red-600 text-center">Богоро́дичен</h4>\n`;
    } else {
        let firstChar = line.charAt(0);
        let rest = line.slice(1);
        html += `        <p class="mb-4"><span class="text-red-600">${firstChar}</span>${rest}</p>\n`;
    }
}

closeSection();

fs.writeFileSync('d:/Ispoved/temp_data/theotokos_formatted.html', html, 'utf-8');
console.log('Formatted HTML written to d:/Ispoved/temp_data/theotokos_formatted.html');

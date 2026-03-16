const fs = require('fs');

let content = fs.readFileSync('d:/Ispoved/src/data/prayers.js', 'utf-8');

// 1. Песнь
content = content.replace(/<h3 class="font-bold[^>]*>(Пе́?снь \d+)<\/h3>/g, '<h3 class="font-bold text-xl mb-4 text-red-600 text-center uppercase">$1</h3>');

// Седален, Кондак, Икос and other headers with border-amber-500
content = content.replace(/<h3 class="font-bold[^>]*>([^<]+)<\/h3>/g, (match, p1) => {
    if (p1.startsWith('Пе') || p1 === 'Конда́к' || p1 === 'И́кос' || p1.startsWith('Седа́лен')) {
        return `<h3 class="font-bold text-xl mb-4 text-red-600 text-center uppercase">${p1}</h3>`;
    }
    return match;
});


// 2. Ирмос
content = content.replace(/<p class="rubric[^>]*>Ирмо́?с:\s*(.*?)<\/p>/g, '<p class="mb-4"><span class="font-bold">Ирмо́с:</span> <span class="italic">$1</span></p>');

// 3. Припев (the word in Red, the rest default)
content = content.replace(/<p class="mb-2">\s*<span class="rubric[^>]*">Припе́?в:\s*(.*?)<\/span>\s*<\/p>/g, '<p class="mb-2"><span class="font-bold text-red-600">Припе́в:</span> $1</p>');

// Also handle instances where 'Припев:' is not in the span alone
content = content.replace(/<span class="rubric[^>]*">Припе́?в: (.*?)<\/span>/g, '<span class="font-bold text-red-600">Припе́в:</span> $1');

// Other refrain lines just plain text
content = content.replace(/<p class="mb-2">\s*<span class="rubric[^>]*">(Поми́луй мя, Бо́же, поми́луй мя\.)<\/span>\s*<\/p>/g, '<p class="mb-2">$1</p>');

content = content.replace(/<p class="mb-2">\s*<span class="rubric[^>]*">(Сла́?ва.*?)<\/span>\s*<\/p>/g, '<p class="mb-2"><span class="text-red-600 font-bold">$1</span></p>');
content = content.replace(/<p class="mb-2">\s*<span class="rubric[^>]*">(И ны́?не.*?)<\/span>\s*<\/p>/g, '<p class="mb-2"><span class="text-red-600 font-bold">$1</span></p>');

content = content.replace(/<h4 class="font-bold[^>]*>Богоро́дичен<\/h4>/g, '<h4 class="font-bold text-lg mb-2 text-red-600 text-center">Богоро́дичен</h4>');

// 4. Первая буква абзаца красная (paragraphs without specific spans inside at the very beginning)
content = content.replace(/<p class="mb-4([^>]*)">([А-ЯЁа-яё])/g, '<p class="mb-4$1"><span class="text-red-600">$2</span>');

fs.writeFileSync('d:/Ispoved/src/data/prayers.js', content, 'utf-8');
console.log('Formatted prayers.js successfully.');

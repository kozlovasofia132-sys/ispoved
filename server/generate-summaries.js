/**
 * Weekly summaries generator for Ispoved app
 *
 * Fetches daily readings from azbyka.ru API for the next 21 days,
 * generates brief summaries via Claude AI, and saves to summaries.json.
 *
 * Run manually or via weekly cron: 0 3 * * 0 node /opt/ispoved/server/generate-summaries.js
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'data', 'summaries.json');
const DAYS_AHEAD = 21;
const DELAY_MS = 400; // между запросами к Claude

// Маппинг латинских сокращений Азбуки → русские сокращения
const BOOK_MAP = {
    'Mt': 'Мф.', 'Mk': 'Мк.', 'Lk': 'Лк.', 'In': 'Ин.',
    'Act': 'Деян.', 'Rm': 'Рим.',
    '1Cor': '1 Кор.', '2Cor': '2 Кор.', 'Gal': 'Гал.', 'Eph': 'Еф.',
    'Php': 'Флп.', 'Col': 'Кол.', '1Th': '1 Фес.', '2Th': '2 Фес.',
    '1Ti': '1 Тим.', '2Ti': '2 Тим.', 'Tit': 'Тит.', 'Phm': 'Флм.',
    'Heb': 'Евр.', 'Ja': 'Иак.', '1Pe': '1 Пет.', '2Pe': '2 Пет.',
    '1Jn': '1 Ин.', '2Jn': '2 Ин.', '3Jn': '3 Ин.', 'Jud': 'Иуд.',
    'Re': 'Откр.',
    // Ветхий Завет
    'Gen': 'Быт.', 'Ex': 'Исх.', 'Lev': 'Лев.', 'Num': 'Чис.', 'Dt': 'Втор.',
    'Is': 'Ис.', 'Ps': 'Пс.', 'Pr': 'Притч.', 'Job': 'Иов.',
    'Wis': 'Прем.', 'Sir': 'Сир.', 'Jer': 'Иер.', 'Ez': 'Иез.',
    'Dan': 'Дан.', 'Hos': 'Ос.', 'Joel': 'Иоил.', 'Am': 'Ам.',
    'Ob': 'Авд.', 'Jon': 'Ион.', 'Mic': 'Мих.', 'Nah': 'Наум.',
    'Hab': 'Авв.', 'Zep': 'Соф.', 'Hag': 'Агг.', 'Zec': 'Зах.', 'Mal': 'Мал.',
};

// Преобразует латинский ref азбуки (In.1.1) в русский (Ин. 1:1)
function refToRu(ref) {
    const parts = ref.split('.');
    const book = parts[0];
    const chapter = parts[1];
    const verse = parts[2];
    const ruBook = BOOK_MAP[book] || book;
    return `${ruBook} ${chapter}:${verse}`;
}

// Задержка между вызовами API
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Генерирует краткое содержание отрывка через Claude Haiku
async function generateSummary(client, ruRef) {
    await sleep(DELAY_MS);
    const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages: [{
            role: 'user',
            content: `Напиши краткое содержание этого библейского чтения в 2–3 предложениях на русском языке. Стиль: духовный, сжатый, понятный православному мирянину. Выдели главную мысль и ключевые события отрывка. Не начинай со слов «В этом отрывке», «Данное чтение», «Здесь» и подобных вводных фраз.\n\nЧтение: ${ruRef}`
        }]
    });
    return msg.content[0].text.trim();
}

// Обрабатывает один день: получает чтения, генерирует summaries
async function processDate(client, dateStr) {
    try {
        const res = await fetch(`https://azbyka.ru/days/api/day/${dateStr}.json`, {
            headers: { 'User-Agent': 'IspovedApp/2.0' },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
            console.log(`  [${dateStr}] API ответил ${res.status}, пропускаем`);
            return null;
        }
        const data = await res.json();

        const texts = data.texts || [];
        const readings = [];
        const seenRefs = new Set();

        for (const entry of texts) {
            const entryRefs = entry.refs || [];
            for (const ref of entryRefs) {
                if (seenRefs.has(ref)) continue;
                seenRefs.add(ref);

                const ruRef = refToRu(ref);
                console.log(`  Генерирую: ${ruRef}`);

                try {
                    const summary = await generateSummary(client, ruRef);
                    readings.push({ ref: ruRef, summary });
                } catch (e) {
                    console.error(`  Ошибка Claude для ${ruRef}:`, e.message);
                }
            }
        }

        // Данные о празднике
        let feast = null;
        if (data.description) {
            const desc = data.description;
            if (desc.includes('Пасха') || desc.includes('воскресение')) {
                feast = { name: desc, dvunadesyaty: false };
            } else if (desc.match(/двунадесят/i)) {
                feast = { name: desc, dvunadesyaty: true };
            }
        }

        if (readings.length === 0) return null;

        const result = { readings };
        if (feast) result.feast = feast;
        return result;

    } catch (e) {
        console.error(`  [${dateStr}] Ошибка:`, e.message);
        return null;
    }
}

async function main() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('Ошибка: переменная ANTHROPIC_API_KEY не задана в .env');
        process.exit(1);
    }

    const client = new Anthropic({ apiKey });

    // Создаём папку data/ если нет
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

    // Загружаем существующие данные
    let existing = {};
    try {
        const raw = await fs.readFile(OUTPUT_FILE, 'utf8');
        existing = JSON.parse(raw);
        console.log(`Загружено ${Object.keys(existing).length} существующих дней`);
    } catch {
        console.log('Начинаем с пустой базы');
    }

    const result = { ...existing };
    const today = new Date();
    let added = 0;

    for (let i = 0; i < DAYS_AHEAD; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);

        if (result[dateStr]) {
            console.log(`[${dateStr}] уже есть, пропускаем`);
            continue;
        }

        console.log(`\n[${dateStr}] Обрабатываем...`);
        const dayData = await processDate(client, dateStr);

        if (dayData) {
            result[dateStr] = dayData;
            added++;
            console.log(`  Добавлено ${dayData.readings.length} чтений`);
        } else {
            console.log(`  Нет данных`);
        }

        // Пауза между днями
        await sleep(1000);
    }

    // Удаляем старые записи (старше 60 дней)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    let removed = 0;
    for (const key of Object.keys(result)) {
        if (new Date(key) < cutoff) {
            delete result[key];
            removed++;
        }
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\nГотово! Добавлено: ${added}, удалено старых: ${removed}, итого дней: ${Object.keys(result).length}`);
    console.log(`Сохранено в: ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Критическая ошибка:', err);
    process.exit(1);
});

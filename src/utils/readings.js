/**
 * Разбор библейских ссылок Азбуки и построение чтений для экрана «Церковь».
 *
 * Азбука отдаёт ссылки в латинской нотации и с «хитрыми» диапазонами:
 *   1Thes.2:9-14, Hebr.11:33-12:2, Mt.10:1,5-8, Lk.1:39-49,56
 * Старый парсер по тексту `texts[].text` ломался на таких ссылках,
 * поэтому источником истины стал массив `refs` из API.
 */

// id — внутренний ключ книги, latin/ru — сокращения, name — подпись в интерфейсе
const BOOK_DEFS = [
    { id: 'mt', latin: ['mt', 'matt', 'matthew'], ru: ['мф'], name: 'Евангелие от Матфея', gospel: true },
    { id: 'mk', latin: ['mk', 'mark'], ru: ['мк'], name: 'Евангелие от Марка', gospel: true },
    { id: 'lk', latin: ['lk', 'luke'], ru: ['лк'], name: 'Евангелие от Луки', gospel: true },
    { id: 'jn', latin: ['jn', 'in', 'john'], ru: ['ин'], name: 'Евангелие от Иоанна', gospel: true },
    { id: 'acts', latin: ['act', 'acts'], ru: ['деян'], name: 'Деяния святых Апостолов' },
    { id: 'rom', latin: ['rom', 'rm', 'romans'], ru: ['рим'], name: 'Послание к Римлянам' },
    { id: '1cor', latin: ['1cor'], ru: ['1кор'], name: '1-е послание к Коринфянам' },
    { id: '2cor', latin: ['2cor'], ru: ['2кор'], name: '2-е послание к Коринфянам' },
    { id: 'gal', latin: ['gal'], ru: ['гал'], name: 'Послание к Галатам' },
    { id: 'eph', latin: ['eph'], ru: ['еф'], name: 'Послание к Ефесянам' },
    { id: 'phil', latin: ['phil', 'php'], ru: ['флп'], name: 'Послание к Филиппийцам' },
    { id: 'col', latin: ['col'], ru: ['кол'], name: 'Послание к Колоссянам' },
    { id: '1thess', latin: ['1thes', '1thess', '1th'], ru: ['1сол', '1фес'], name: '1-е послание к Фессалоникийцам' },
    { id: '2thess', latin: ['2thes', '2thess', '2th'], ru: ['2сол', '2фес'], name: '2-е послание к Фессалоникийцам' },
    { id: '1tim', latin: ['1tim', '1ti'], ru: ['1тим'], name: '1-е послание к Тимофею' },
    { id: '2tim', latin: ['2tim', '2ti'], ru: ['2тим'], name: '2-е послание к Тимофею' },
    { id: 'titus', latin: ['titus', 'tit'], ru: ['тит'], name: 'Послание к Титу' },
    { id: 'phlm', latin: ['phlm', 'phm'], ru: ['флм'], name: 'Послание к Филимону' },
    { id: 'heb', latin: ['heb', 'hebr'], ru: ['евр'], name: 'Послание к Евреям' },
    { id: 'jas', latin: ['jas', 'ja'], ru: ['иак'], name: 'Послание Иакова' },
    { id: '1pet', latin: ['1pet', '1pe'], ru: ['1пет'], name: '1-е послание Петра' },
    { id: '2pet', latin: ['2pet', '2pe'], ru: ['2пет'], name: '2-е послание Петра' },
    { id: '1jn', latin: ['1jn'], ru: ['1ин'], name: '1-е послание Иоанна' },
    { id: '2jn', latin: ['2jn'], ru: ['2ин'], name: '2-е послание Иоанна' },
    { id: '3jn', latin: ['3jn'], ru: ['3ин'], name: '3-е послание Иоанна' },
    { id: 'jude', latin: ['jude', 'jud'], ru: ['иуд'], name: 'Послание Иуды' },
    { id: 'rev', latin: ['rev', 're', 'apoc'], ru: ['откр'], name: 'Откровение Иоанна Богослова' },
    // Ветхий Завет — встречается в паремиях
    { id: 'gen', latin: ['gen'], ru: ['быт'], name: 'Книга Бытия' },
    { id: 'ex', latin: ['ex'], ru: ['исх'], name: 'Книга Исход' },
    { id: 'lev', latin: ['lev'], ru: ['лев'], name: 'Книга Левит' },
    { id: 'num', latin: ['num'], ru: ['чис'], name: 'Книга Чисел' },
    { id: 'dt', latin: ['dt', 'deut'], ru: ['втор'], name: 'Книга Второзакония' },
    { id: 'josh', latin: ['josh'], ru: ['нав'], name: 'Книга Иисуса Навина' },
    { id: 'judg', latin: ['judg'], ru: ['суд'], name: 'Книга Судей' },
    { id: 'ruth', latin: ['ruth'], ru: ['руф'], name: 'Книга Руфь' },
    { id: '1sam', latin: ['1sam'], ru: ['1цар'], name: '1-я книга Царств' },
    { id: '2sam', latin: ['2sam'], ru: ['2цар'], name: '2-я книга Царств' },
    { id: '1kgs', latin: ['1kgs'], ru: ['3цар'], name: '3-я книга Царств' },
    { id: '2kgs', latin: ['2kgs'], ru: ['4цар'], name: '4-я книга Царств' },
    { id: '1chr', latin: ['1chr'], ru: ['1пар'], name: '1-я книга Паралипоменон' },
    { id: '2chr', latin: ['2chr'], ru: ['2пар'], name: '2-я книга Паралипоменон' },
    { id: 'ezra', latin: ['ezra'], ru: ['езд'], name: 'Книга Ездры' },
    { id: 'neh', latin: ['neh'], ru: ['неем'], name: 'Книга Неемии' },
    { id: 'esth', latin: ['esth'], ru: ['есф'], name: 'Книга Есфирь' },
    { id: 'job', latin: ['job'], ru: ['иов'], name: 'Книга Иова' },
    { id: 'ps', latin: ['ps'], ru: ['пс'], name: 'Псалтирь' },
    { id: 'prov', latin: ['prov', 'pr'], ru: ['притч'], name: 'Книга Притчей Соломоновых' },
    { id: 'eccl', latin: ['eccl'], ru: ['еккл'], name: 'Книга Екклесиаста' },
    { id: 'song', latin: ['song'], ru: ['песн'], name: 'Песнь Песней' },
    { id: 'isa', latin: ['isa', 'is'], ru: ['ис'], name: 'Книга пророка Исаии' },
    { id: 'jer', latin: ['jer'], ru: ['иер'], name: 'Книга пророка Иеремии' },
    { id: 'lam', latin: ['lam'], ru: ['плач'], name: 'Плач Иеремии' },
    { id: 'ezek', latin: ['ezek', 'ez'], ru: ['иез'], name: 'Книга пророка Иезекииля' },
    { id: 'dan', latin: ['dan'], ru: ['дан'], name: 'Книга пророка Даниила' },
    { id: 'hos', latin: ['hos'], ru: ['ос'], name: 'Книга пророка Осии' },
    { id: 'joel', latin: ['joel'], ru: ['иоил'], name: 'Книга пророка Иоиля' },
    { id: 'amos', latin: ['amos'], ru: ['ам'], name: 'Книга пророка Амоса' },
    { id: 'obad', latin: ['obad', 'ob'], ru: ['авд'], name: 'Книга пророка Авдия' },
    { id: 'jonah', latin: ['jonah', 'jon'], ru: ['ион'], name: 'Книга пророка Ионы' },
    { id: 'mic', latin: ['mic'], ru: ['мих'], name: 'Книга пророка Михея' },
    { id: 'nah', latin: ['nah'], ru: ['наум'], name: 'Книга пророка Наума' },
    { id: 'hab', latin: ['hab'], ru: ['авв'], name: 'Книга пророка Аввакума' },
    { id: 'zeph', latin: ['zeph', 'zep'], ru: ['соф'], name: 'Книга пророка Софонии' },
    { id: 'hag', latin: ['hag'], ru: ['агг'], name: 'Книга пророка Аггея' },
    { id: 'zech', latin: ['zech', 'zec'], ru: ['зах'], name: 'Книга пророка Захарии' },
    { id: 'mal', latin: ['mal'], ru: ['мал'], name: 'Книга пророка Малахии' }
];

const BY_ID = new Map();
const BY_TOKEN = new Map();
const BY_NAME = new Map();

for (const book of BOOK_DEFS) {
    BY_ID.set(book.id, book);
    BY_NAME.set(book.name, book);
    for (const token of [...book.latin, ...book.ru]) {
        BY_TOKEN.set(token, book);
    }
}

export const BOOK_NAMES = Object.fromEntries(BOOK_DEFS.map(b => [b.id, b.name]));

const FULL_CHAPTER_TO = 999;

function normalizeToken(token) {
    return String(token || '').toLowerCase().replace(/[.\s]/g, '');
}

export function findBook(token) {
    if (!token) return null;
    return BY_TOKEN.get(normalizeToken(token)) || null;
}

function parseSegments(rest, startChapter) {
    const segments = [];
    let chapter = startChapter;

    for (const rawToken of String(rest).split(',')) {
        const token = rawToken.trim();
        if (!token) return null;

        let m;
        if ((m = token.match(/^(\d+)\s*:\s*(\d+)\s*[-–—]\s*(\d+)\s*:\s*(\d+)$/))) {
            // 10:1-11:5 — диапазон через главы
            const fromChapter = Number(m[1]);
            const toChapter = Number(m[3]);
            segments.push({ chapter: fromChapter, from: Number(m[2]), to: FULL_CHAPTER_TO });
            for (let c = fromChapter + 1; c < toChapter; c++) {
                segments.push({ chapter: c, from: 1, to: FULL_CHAPTER_TO });
            }
            segments.push({ chapter: toChapter, from: 1, to: Number(m[4]) });
            chapter = toChapter;
        } else if ((m = token.match(/^(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/))) {
            // 11:27-28 — новая глава внутри ссылки
            chapter = Number(m[1]);
            const from = Number(m[2]);
            const to = m[3] ? Number(m[3]) : from;
            segments.push({ chapter, from, to: Math.max(from, to) });
        } else if ((m = token.match(/^(\d+)\s*[-–—]\s*(\d+)\s*:\s*(\d+)$/))) {
            // 33-12:2 — от текущей главы до главы 12
            const toChapter = Number(m[2]);
            segments.push({ chapter, from: Number(m[1]), to: FULL_CHAPTER_TO });
            for (let c = chapter + 1; c < toChapter; c++) {
                segments.push({ chapter: c, from: 1, to: FULL_CHAPTER_TO });
            }
            segments.push({ chapter: toChapter, from: 1, to: Number(m[3]) });
            chapter = toChapter;
        } else if ((m = token.match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/))) {
            const from = Number(m[1]);
            const to = m[2] ? Number(m[2]) : from;
            segments.push({ chapter, from, to: Math.max(from, to) });
        } else {
            return null;
        }
    }

    return segments;
}

/**
 * Разбирает ссылку вида "1Thes.2:9-14" или "Мф. 21:1–11".
 * @returns {{ bookId: string|null, bookToken: string, chapter: number, segments: Array<{chapter:number,from:number,to:number}>, raw: string, gospel: boolean }|null}
 */
export function parseRef(ref) {
    if (!ref) return null;
    const raw = String(ref).trim();
    const m = raw.match(/^([1-3]?\s*[A-Za-zА-Яа-яЁё]+)\.?\s*(\d+)\s*:\s*(.+)$/);
    if (!m) return null;

    const bookToken = m[1];
    const chapter = Number(m[2]);
    const segments = parseSegments(m[3], chapter);
    if (!segments || segments.length === 0) return null;

    const book = findBook(bookToken);
    return {
        bookId: book ? book.id : null,
        bookToken,
        chapter,
        segments,
        raw,
        gospel: Boolean(book && book.gospel)
    };
}

function versesText(from, to) {
    if (to >= FULL_CHAPTER_TO) return `стихи ${from}`;
    if (from === to) return `стих ${from}`;
    return `стихи ${from}–${to}`;
}

/**
 * Человеческое описание стихов: "глава 9, стихи 49–56".
 */
export function describeSegments(segments) {
    if (!segments || segments.length === 0) return '';

    // Диапазон через главы: 11:33–12:2
    if (segments.length === 2 && segments[0].to >= FULL_CHAPTER_TO && segments[1].from === 1) {
        return `глава ${segments[0].chapter}, стихи ${segments[0].from} – глава ${segments[1].chapter}, стихи ${segments[1].to}`;
    }

    // Группируем подряд идущие отрывки одной главы
    const groups = [];
    for (const segment of segments) {
        const last = groups[groups.length - 1];
        if (last && last.chapter === segment.chapter) {
            last.items.push(segment);
        } else {
            groups.push({ chapter: segment.chapter, items: [segment] });
        }
    }

    return groups.map(group => {
        if (group.items.length === 1 && group.items[0].from === 1 && group.items[0].to >= FULL_CHAPTER_TO) {
            return `глава ${group.chapter}`;
        }
        const list = group.items
            .map(item => (item.from === item.to ? String(item.from) : `${item.from}–${item.to < FULL_CHAPTER_TO ? item.to : 'конца'}`))
            .join(', ');
        return `глава ${group.chapter}, ${group.items.length > 1 || group.items[0].from !== group.items[0].to ? 'стихи' : 'стих'} ${list}`;
    }).join('; ');
}

/** Тип чтения для подписи в интерфейсе. */
export function readingType(ref) {
    const parsed = typeof ref === 'string' ? parseRef(ref) : ref;
    return parsed && parsed.gospel ? 'Евангелие' : 'Апостол';
}

/** Ссылка на аудио Азбуки — формат как на сайте: zachala/Lk/Lk.9:49-56.mp3 */
export function refAudioUrl(ref) {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    return `https://azbyka.ru/audio/audio1/zachala/${parsed.bookToken}/${parsed.raw}.mp3`;
}

/** Декодирует минимальный набор HTML-сущностей и убирает теги. */
function cleanText(text) {
    return String(text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractZachaloNumbers(text) {
    return [...text.matchAll(/зач\s*\.?\s*(\d+)/gi)].map(m => m[1]);
}

function buildReading(ref, zachalo) {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    const book = parsed.bookId ? BY_ID.get(parsed.bookId) : null;
    const name = book ? book.name : parsed.bookToken;
    const prefix = zachalo ? `${zachalo} зач., ` : '';
    return {
        ref: parsed.raw,
        type: parsed.gospel ? 'Евангелие' : 'Апостол',
        text: `${name}, ${prefix}${describeSegments(parsed.segments)}`,
        link_mp3: refAudioUrl(parsed.raw),
        audio: refAudioUrl(parsed.raw)
    };
}

// Запасной разбор, если API не отдал refs (старые кэши)
function parseLegacy(text) {
    const readings = [];
    const regex = /([1-3]?[А-Яа-яЁё]+)\.?\s*(\d+):(\d+)\s*[-–—]\s*(\d+):?(\d+)?(?:\s*\(\s*зач\s*\.?\s*(\d+)\s*\))?/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const [, bookToken, chapter, startVerse, chapter2, endVerse, zachalo] = match;
        const endVerseFinal = endVerse || chapter2;
        const book = findBook(bookToken);
        const name = book ? book.name : bookToken;
        const prefix = zachalo ? `${zachalo} зач., ` : '';
        readings.push({
            ref: null,
            type: book && book.gospel ? 'Евангелие' : 'Апостол',
            text: `${name}, ${prefix}глава ${Number(chapter)}, стихи ${startVerse}–${endVerseFinal}`,
            link_mp3: null,
            audio: null
        });
    }
    return readings;
}

/**
 * Собирает чтения дня.
 * @param {string} text — поле texts[].text из API (нужно для номеров зачал)
 * @param {string[]} [refs] — поле texts[].refs из API
 */
export function parseReadings(text, refs) {
    const clean = cleanText(text);
    const refList = Array.isArray(refs) ? refs.filter(Boolean) : [];

    if (refList.length === 0) return parseLegacy(clean);

    const zachalos = extractZachaloNumbers(clean);
    const aligned = zachalos.length === refList.length ? zachalos : [];

    const result = [];
    refList.forEach((ref, index) => {
        const reading = buildReading(ref, aligned[index] || null);
        if (reading) result.push(reading);
    });

    // В API бывают повторы (одно чтение на разные службы) — оставляем первое
    const seen = new Set();
    return result.filter(reading => {
        if (seen.has(reading.ref)) return false;
        seen.add(reading.ref);
        return true;
    });
}

/**
 * Нормализует чтение (объект из parseReadings или строку текста) до вида,
 * пригодного для сопоставления с конспектом.
 */
export function readingParts(reading) {
    if (!reading) return null;

    if (typeof reading === 'object' && reading.ref) {
        const parsed = parseRef(reading.ref);
        if (parsed) return { bookId: parsed.bookId, segments: parsed.segments };
    }

    const text = typeof reading === 'string' ? reading : reading.text;
    if (!text) return null;

    const name = String(text).split(',')[0].trim();
    const book = BY_NAME.get(name);
    const chapterMatch = text.match(/глав[аеы]\s+(\d+)/i);
    const verseMatch = text.match(/стих[аи]?\s+(\d+)/i);
    if (!book || !chapterMatch || !verseMatch) return null;

    const chapter = Number(chapterMatch[1]);
    const from = Number(verseMatch[1]);
    return { bookId: book.id, segments: [{ chapter, from, to: from }] };
}

function segmentsOverlap(a, b) {
    if (a.chapter !== b.chapter) return false;
    return a.from <= b.to && b.from <= a.to;
}

/**
 * Насколько конспект подходит чтению:
 *   3 — совпадает книга, глава и первый стих;
 *   2 — первый стих конспекта входит в диапазон чтения;
 *   1 — отрывки пересекаются (чтение — часть более широкого конспекта);
 *   0 — не подходит.
 * Нужно, чтобы конспект через границу глав («Ин. 13:31–18:1»)
 * не приклеивался к следующему чтению («Ин. 18:1–28»).
 */
export function summaryScore(reading, summaryRef) {
    const parts = readingParts(reading);
    const summary = parseRef(summaryRef);
    if (!parts || !summary) return 0;
    if (parts.bookId && summary.bookId && parts.bookId !== summary.bookId) return 0;

    const first = summary.segments[0];
    let best = 0;

    for (const part of parts.segments) {
        if (part.chapter !== first.chapter) continue;
        if (part.from === first.from) {
            best = Math.max(best, 3);
        } else if (first.from >= part.from && first.from <= part.to) {
            best = Math.max(best, 2);
        }
    }
    if (best > 0) return best;

    const overlaps = parts.segments.some(part => summary.segments.some(segment => segmentsOverlap(part, segment)));
    return overlaps ? 1 : 0;
}

/**
 * Совпадает ли конспект (ref из readingSummaries) с чтением дня.
 */
export function summaryMatches(reading, summaryRef) {
    return summaryScore(reading, summaryRef) > 0;
}

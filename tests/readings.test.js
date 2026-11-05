import test from 'node:test';
import assert from 'node:assert/strict';
import {
    parseRef,
    describeSegments,
    parseReadings,
    readingParts,
    summaryMatches,
    summaryScore,
    refAudioUrl
} from '../src/utils/readings.js';

test('parseRef разбирает простую ссылку', () => {
    const ref = parseRef('Lk.9:49-56');
    assert.equal(ref.bookId, 'lk');
    assert.equal(ref.gospel, true);
    assert.deepEqual(ref.segments, [{ chapter: 9, from: 49, to: 56 }]);
});

test('parseRef разбирает номера посланий', () => {
    assert.equal(parseRef('1Thes.2:9-14').bookId, '1thess');
    assert.equal(parseRef('2Thes.1:1-10').bookId, '2thess');
    assert.equal(parseRef('1Cor.12:27-13:8').bookId, '1cor');
    assert.equal(parseRef('Hebr.11:33-12:2').bookId, 'heb');
    assert.equal(parseRef('Act.12:1-11').bookId, 'acts');
    assert.equal(parseRef('Phil.2:5-11').bookId, 'phil');
});

test('parseRef разбирает диапазон через главы', () => {
    const ref = parseRef('Hebr.11:33-12:2');
    assert.deepEqual(ref.segments, [
        { chapter: 11, from: 33, to: 999 },
        { chapter: 12, from: 1, to: 2 }
    ]);
});

test('parseRef разбирает перечисление стихов и глав', () => {
    assert.deepEqual(parseRef('Mt.10:1,5-8').segments, [
        { chapter: 10, from: 1, to: 1 },
        { chapter: 10, from: 5, to: 8 }
    ]);
    assert.deepEqual(parseRef('Lk.1:39-49,56').segments, [
        { chapter: 1, from: 39, to: 49 },
        { chapter: 1, from: 56, to: 56 }
    ]);
    assert.deepEqual(parseRef('Mt.10:32-33,37-38,19:27-30').segments, [
        { chapter: 10, from: 32, to: 33 },
        { chapter: 10, from: 37, to: 38 },
        { chapter: 19, from: 27, to: 30 }
    ]);
});

test('parseRef понимает русские сокращения с тире', () => {
    const ref = parseRef('Мф. 21:1–11');
    assert.equal(ref.bookId, 'mt');
    assert.deepEqual(ref.segments, [{ chapter: 21, from: 1, to: 11 }]);
});

test('parseRef возвращает null для мусора', () => {
    assert.equal(parseRef(''), null);
    assert.equal(parseRef('Рядовое'), null);
    assert.equal(parseRef('Лк.9'), null);
});

test('describeSegments собирает читаемую подпись', () => {
    assert.equal(describeSegments(parseRef('Lk.9:49-56').segments), 'глава 9, стихи 49–56');
    assert.equal(describeSegments(parseRef('Mt.10:1,5-8').segments), 'глава 10, стихи 1, 5–8');
    assert.equal(
        describeSegments(parseRef('Hebr.11:33-12:2').segments),
        'глава 11, стихи 33 – глава 12, стихи 2'
    );
    assert.equal(describeSegments(parseRef('Mk.16:8').segments), 'глава 16, стих 8');
});

test('parseReadings строит чтения из refs и подставляет зачала', () => {
    const text = 'Рядовое: Лит . – Ап.: 1Сол.2:9-14 ( зач . 265). Ев.: Лк.9:49-56 (зач. 48).';
    const readings = parseReadings(text, ['1Thes.2:9-14', 'Lk.9:49-56']);

    assert.equal(readings.length, 2);
    assert.equal(readings[0].ref, '1Thes.2:9-14');
    assert.equal(readings[0].type, 'Апостол');
    assert.equal(readings[0].text, '1-е послание к Фессалоникийцам, 265 зач., глава 2, стихи 9–14');
    assert.equal(readings[1].type, 'Евангелие');
    assert.equal(readings[1].text, 'Евангелие от Луки, 48 зач., глава 9, стихи 49–56');
    assert.equal(readings[1].link_mp3, 'https://azbyka.ru/audio/audio1/zachala/Lk/Lk.9:49-56.mp3');
});

test('parseReadings не дублирует повторяющиеся чтения', () => {
    const readings = parseReadings('', ['Jn.10:9-16', 'Mt.10:16-22', 'Jn.10:9-16']);
    assert.deepEqual(readings.map(r => r.ref), ['Jn.10:9-16', 'Mt.10:16-22']);
});

test('parseReadings без refs использует запасной разбор', () => {
    const readings = parseReadings('Ап.: 1Сол.2:9-14 (зач. 265). Ев.: Лк.9:49-56 (зач. 48).');
    assert.equal(readings.length, 2);
    assert.equal(readings[0].text, '1-е послание к Фессалоникийцам, 265 зач., глава 2, стихи 9–14');
    assert.equal(readings[1].text, 'Евангелие от Луки, 48 зач., глава 9, стихи 49–56');
});

test('refAudioUrl сохраняет исходное сокращение книги', () => {
    assert.equal(
        refAudioUrl('1Thes.2:9-14'),
        'https://azbyka.ru/audio/audio1/zachala/1Thes/1Thes.2:9-14.mp3'
    );
});

test('summaryMatches сопоставляет по книге, главе и стиху', () => {
    const reading = { ref: 'Lk.9:49-56' };
    assert.equal(summaryMatches(reading, 'Лк. 9:49–56'), true);
    assert.equal(summaryMatches(reading, 'Лк. 9:50–60'), true);
    assert.equal(summaryMatches(reading, 'Лк. 10:49–56'), false);
    assert.equal(summaryMatches(reading, 'Ин. 9:49–56'), false);
});

test('summaryMatches не путает разные чтения из одной главы', () => {
    const first = { ref: 'Lk.10:1-15' };
    const second = { ref: 'Lk.10:38-42,11:27-28' };
    assert.equal(summaryMatches(first, 'Лк. 10:1–15'), true);
    assert.equal(summaryMatches(first, 'Лк. 10:38–42'), false);
    assert.equal(summaryMatches(second, 'Лк. 10:38–42'), true);
    assert.equal(summaryMatches(second, 'Лк. 11:27–28'), true);
});

test('summaryMatches не приклеивает конспект через границу глав', () => {
    const longReading = { ref: 'Jn.13:31-18:1' };
    const nextReading = { ref: 'Jn.18:1-28' };
    assert.equal(summaryScore(longReading, 'Ин. 13:31–18:1'), 3);
    assert.equal(summaryScore(nextReading, 'Ин. 18:1–28'), 3);
    // Пограничный стих даёт лишь пересечение — такой конспект не должен побеждать точный
    assert.equal(summaryScore(nextReading, 'Ин. 13:31–18:1'), 1);
});

test('summaryScore понимает чтение как часть более широкого конспекта', () => {
    assert.equal(summaryScore({ ref: 'Lk.23:39-43' }, 'Лк. 23:32–49'), 1);
});

test('summaryMatches понимает старые записи с русскими сокращениями', () => {
    assert.equal(summaryMatches({ ref: 'Mt.21:1-11' }, 'Мф. 21:1–11'), true);
    assert.equal(summaryMatches({ ref: 'Acts.3:11-16' }, 'Деян. 3:11–16'), true);
    assert.equal(summaryMatches({ ref: '1Cor.12:27-13:8' }, '1 Кор. 12:27–13:8'), true);
});

test('summaryMatches работает с чтениями без ref (старый формат)', () => {
    const reading = { text: 'Евангелие от Луки, глава 9, стихи 49–56' };
    assert.equal(summaryMatches(reading, 'Лк. 9:49–56'), true);
    assert.equal(summaryMatches(reading, 'Лк. 10:49–56'), false);
});

test('readingParts возвращает null для нераспознанного текста', () => {
    assert.equal(readingParts({ text: 'Сол, глава 2, стихи 9–14' }), null);
    assert.equal(readingParts(null), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr, safeUrl } from '../src/utils/escapeHtml.js';

test('escapeHtml экранирует HTML-теги и кавычки', () => {
    assert.equal(
        escapeHtml('<img src=x onerror="alert(1)">'),
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
    assert.equal(escapeHtml("'><script>alert(1)</script>"), '&#39;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escapeHtml экранирует амперсанд один раз', () => {
    assert.equal(escapeHtml('&lt;script&gt;'), '&amp;lt;script&amp;gt;');
});

test('escapeHtml корректно обрабатывает пустые значения', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(''), '');
    assert.equal(escapeHtml(0), '0');
});

test('escapeHtml не меняет обычный русский текст', () => {
    assert.equal(escapeHtml('Помолимся, Господи!'), 'Помолимся, Господи!');
});

test('escapeAttr работает как escapeHtml', () => {
    assert.equal(escapeAttr('" onmouseover="x'), '&quot; onmouseover=&quot;x');
});

test('safeUrl пропускает безопасные URL и блокирует javascript:', () => {
    assert.equal(safeUrl('https://azbyka.ru/a.mp3'), 'https://azbyka.ru/a.mp3');
    assert.equal(safeUrl('http://example.com/a.json'), 'http://example.com/a.json');
    assert.equal(safeUrl('data:image/png;base64,AAA'), 'data:image/png;base64,AAA');
    assert.equal(safeUrl('/assets/icon.png'), '/assets/icon.png');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('  javascript:alert(1)'), '');
    assert.equal(safeUrl(null), '');
});

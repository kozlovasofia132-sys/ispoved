/**
 * Экранирование текста для безопасной вставки в HTML.
 *
 * Используется везде, где данные из localStorage, сети или пользовательского
 * ввода попадают в innerHTML. Без этого возможна XSS-инъекция (например,
 * подмена ответа сервера комментариев к чтениям через HTTP).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Экранирование значения для подстановки в атрибут (src, alt, data-*).
 * Отличается от escapeHtml только названием — удобно читать код.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeAttr(value) {
    return escapeHtml(value);
}

/**
 * Проверка, что URL безопасен для подстановки в src/href.
 * Разрешаем только https, http, data:image и относительные пути.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function safeUrl(value) {
    if (value === null || value === undefined) return '';
    const url = String(value).trim();
    if (!url) return '';
    if (/^(https?:|data:image\/|\/|\.\/)/i.test(url)) return url;
    return '';
}

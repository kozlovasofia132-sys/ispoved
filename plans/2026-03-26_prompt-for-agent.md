# Задача: Удалить дату из вкладок «Исповедь» и «Настройки»

## Контекст
Приложение имеет глобальный заголовок (`<header class="main-header">`), который отображается на всех вкладках. В заголовке есть элемент с датой (`<span id="header-date">`).

**Проблема:** Дата видна на всех вкладках, но должна отображаться **только** на вкладке «Церковный календарь» (`tab-church-empty`).

## Требуется

### 1. Удалить дату из глобального заголовка
Файл: `index.html`
Найти и удалить элемент:
```html
<span id="header-date" class="font-newsreader italic tracking-tight text-base" style="color: #92400e; font-family: 'Newsreader', serif;">26 марта 2026</span>
```

### 2. Добавить заголовок с датой внутрь вкладки «Церковный календарь»
Файл: `index.html`
Вкладка: `<main id="tab-church-empty">`

Добавить в начало вкладки (после спейсера `h-[40px]`):
```html
<!-- Date Header -->
<div class="px-4 py-3 flex items-center gap-2 border-b border-outline-variant/20 bg-surface-container-low">
    <span class="material-symbols-outlined" style="color: #92400e; font-size: 20px;">calendar_today</span>
    <span id="church-date-header" class="font-newsreader italic tracking-tight text-base" style="color: #92400e; font-family: 'Newsreader', serif;">26 марта 2026</span>
</div>
```

### 3. Обновить JavaScript
Файл: `src/main.js`

Функция `updateHeaderDate()` должна обновлять новый элемент `#church-date-header` вместо `#header-date`.

Вызов функции:
- При переключении на вкладку `church-empty`
- При нажатии кнопок предыдущий/следующий день

## Результат
- ✅ Вкладка «Церковный календарь» — дата отображается
- ✅ Вкладка «Исповедь» — даты нет
- ✅ Вкладка «Настройки» — даты нет

## Файлы для изменения
- `d:\Ispoved\index.html`
- `d:\Ispoved\src\main.js`

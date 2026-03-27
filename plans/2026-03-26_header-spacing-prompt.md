# Промт для агента: Динамический отступ шапки

## Контекст
Проект: Исповедь (православное приложение для подготовки к исповеди)
Стек: Vite + Vanilla JS + Tailwind CSS + Capacitor

## Задача
Сделать динамический отступ контента от фиксированной шапки в зависимости от её высоты.

## Выполненные изменения

### 3. Динамический отступ через CSS переменную
**Файл:** `src/style.css`
```css
:root {
  --header-height: 60px; /* Значение устанавливается через JS */
}
```

**Файл:** `index.html`
```html
<div class="w-full" style="height: var(--header-height);"></div>
```

### 4. JavaScript функция для вычисления высоты
**Файл:** `src/main.js`
```javascript
function updateHeaderSpacing() {
    const header = document.querySelector('.main-header');
    if (!header) return;
    
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
}
```

### 5. Точки вызова `updateHeaderSpacing()`
- При инициализации (DOMContentLoaded)
- После загрузки шрифтов (`document.fonts.ready`)
- При переключении вкладок (`switchTab()`)
- При смене языка (`updateLanguageUI()`)
- При смене темы (`applyTheme()`)
- При смене шрифта (`applyLanguageFont()`)

## Текущая проблема
Шапка накладывается на карточку с датой. Требуется:
1. Проверить корректность вызова `updateHeaderSpacing()`
2. Убедиться, что CSS переменная применяется правильно
3. При необходимости добавить отладочный вывод высоты шапки

## Команды для проверки
```bash
npm run dev    # Запуск dev-сервера
npm run build  # Сборка проекта
```

## Файлы для проверки
- `index.html` — разметка шапки и spacer
- `src/main.js` — функция `updateHeaderSpacing()` и точки вызова
- `src/style.css` — CSS переменная `--header-height`

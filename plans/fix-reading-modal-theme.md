# План: Исправление темы модального окна "Читать на исповеди"

## Проблема
Модальное окно "Читать на исповеди" (`#reading-mode-modal`) не корректно применяет тему приложения:
- В **светлой теме**: фон светлый, но карточки грехов белые с плохим контрастом
- В **тёмной теме**: фон тёмный, но карточки грехов остаются белыми

## Контекст
Окно должно использовать ту же тему, что и основное приложение (класс `.dark` на `documentElement`).

### Файлы для работы:
- `src/style.css` — CSS-переменные и стили для `#reading-mode-modal`
- `src/main.js` — функция `populateReadingMode()` и обработчики открытия окна
- `index.html` — разметка модального окна

## Задачи

- [ ] **1. Проверить CSS-переменные темы**
  - Убедиться, что `--color-bg`, `--color-surface`, `--color-text-main`, `--color-text-muted` определены в `:root` и `.dark`
  - Добавить `--color-danger`, `--color-secondary` в обе темы

- [ ] **2. Исправить CSS для модального окна**
  - Добавить правила с `!important` для всех элементов внутри `#reading-mode-modal`:
    ```css
    #reading-mode-modal {
      background-color: var(--color-bg) !important;
    }
    #reading-mode-modal header {
      background-color: var(--color-bg) !important;
    }
    #reading-mode-modal .reading-sin-item {
      background-color: var(--color-surface) !important;
      color: var(--color-text-main) !important;
    }
    #reading-mode-modal .reading-sin-text {
      color: var(--color-text-main) !important;
    }
    #reading-mode-modal .reading-sin-note {
      color: var(--color-text-muted) !important;
    }
    ```

- [ ] **3. Исправить JavaScript**
  - В функции `populateReadingMode()` убрать жёстко заданные классы Tailwind (`text-white`, `text-slate-400`, `border-white/10`)
  - Заменить на нейтральные классы или CSS-переменные

- [ ] **4. Принудительное применение темы**
  - При открытии окна явно устанавливать CSS-переменные через `style.setProperty()`:
    ```javascript
    const isDark = document.documentElement.classList.contains('dark');
    readingModeModal.style.setProperty('--color-bg', isDark ? '#120F16' : '#fbf9f4');
    readingModeModal.style.setProperty('--color-surface', isDark ? '#2a1f33' : '#ffffff');
    // и т.д.
    ```

- [ ] **5. Проверить сборку**
  - Запустить `npm run build`
  - Проверить отсутствие ошибок

- [ ] **6. Тестирование**
  - Открыть окно в светлой теме → фон `#fbf9f4`, карточки `#ffffff`, текст `#1b1c19`
  - Переключить на тёмную тему → фон `#120F16`, карточки `#2a1f33`, текст `#ffffff`
  - Проверить кнопку "Завершить исповедь" (должна быть с красным акцентом)

## Текущее состояние
- CSS-переменные определены в `src/style.css`
- JavaScript применяет тему при открытии окна (строки ~957, ~997)
- Проблема: стили переопределяются Tailwind или инлайн-стилями

## Примечания
- Окно чтения молитв (`#prayers-reading-modal`) должно остаться **всегда тёмным**
- Окно исповеди (`#reading-mode-modal`) должно быть **адаптивным** (светлая/тёмная тема)

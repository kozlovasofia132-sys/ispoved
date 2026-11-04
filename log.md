# Журнал операций (log.md)

| Дата | Операция | Файлы | Статус |
| --- | --- | --- | --- |
| 2026-04-19 | Настройка системы Карпати | `CLAUDE.md`, `wiki/`, `raw/` | Успешно |
| 2026-04-19 | Подключение Obsidian ("Второй мозг") как единого источника истины | `CLAUDE.md` | Успешно |
| 2026-11-04 | Версия 2.3.0: экранирование HTML (`src/utils/escapeHtml.js`), настройка `VITE_SUMMARIES_URL`, защита вебхука и `/v1/payments`, тесты, CI, чистка зависимостей и репозитория | `src/main.js`, `src/utils/`, `tests/`, `server/`, `.github/`, `package.json` | Успешно |
| 2026-11-04 | Версия 2.3.1: CSP в production, отказ от inline-обработчиков, `aria-label` и live-регионы, `AGENTS.md` | `vite.config.js`, `src/main.js`, `index.html`, `src/components/DonationScreen.js`, `AGENTS.md`, `package.json` | Успешно |
| 2026-11-04 | Версия 2.3.2: динамическая загрузка PDF-библиотек и восстановление экспорта PDF, обновление зависимостей (prod-audit 0), `aria-label` для иконочных кнопок | `src/main.js`, `index.html`, `src/components/DonationScreen.js`, `server/package.json`, `package.json` | Успешно |
| 2026-11-04 | Версия 2.3.3: DOCTYPE и meta description, robots.txt, иерархия заголовков и контраст (Lighthouse 100/100/100), `aria-label` для переключателей, `lang="cu"`, PNG-иконки PWA, удаление устаревших Android-плагинов из `build.gradle` | `index.html`, `src/main.js`, `src/data/translations.js`, `public/robots.txt`, `public/pwa-*.png`, `vite.config.js`, `android/app/build.gradle`, `.gitignore`, `package.json` | Успешно |
| 2026-11-04 | Версия 2.3.4: доступность модальных экранов (предпросмотр, пожертвования, календарь), переменная `--color-memorial`, контраст дат и кнопок | `index.html`, `src/style.css`, `src/components/DonationScreen.js`, `package.json` | Успешно |

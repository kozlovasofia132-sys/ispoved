# AGENTS.md

«Исповедь» — православное приложение: PWA на Vite (vanilla JS, без фреймворка) + Android-обёртка Capacitor. Отвечай пользователю по-русски.

## Источник истины

- Долговременная документация — `D:\ObsidianVault` (см. `CLAUDE.md`), локальные заметки о правках — `log.md`.
- `CLAUDE.md` подробно описывает архитектуру и ключи `localStorage`. Этот файл — краткая шпаргалка; при расхождении верь коду и скриптам.

## Команды

- `npm run dev` — Vite на порту 5173 (`host: true`).
- `npm run build` — `sync-version.js` → `vite build` → `npx cap sync` (копирует `dist/` в Android).
- `npm test` — только `tests/**/*.test.js`. Не запускай `node --test` без шаблона: он подхватит `server/test-webhook.js` — ручной скрипт, который ходит в сеть.
- Один файл тестов: `node --test tests/escapeHtml.test.js`.
- `npm run preview` — проверка production-сборки.

## Версия

- Единственный источник версии — `package.json`. Не правь `src/version.js` и `android/app/build.gradle` вручную.
- `node sync-version.js` переносит версию; `versionCode = major*10000 + minor*100 + patch`.
- `npm run release` делает bump patch, сборку, `git add .`, коммит и **push в GitHub**. Не запускай без явного разрешения.

## Архитектура

- `index.html` — весь HTML-каркас. `src/main.js` (~4000 строк) — вся логика в одном обработчике `DOMContentLoaded`; экраны переключаются вручную.
- `src/data/` — контент и i18n: `sins.js` (профили `adult`/`child`/`monastic`), `translations.js` (только `ru`/`cs`, не uk/en), `prayers.js`, `preparation.js`.
- `src/services/calendarService.js` — API `azbyka.ru/days/api`.
- `src/utils/readings.js` — разбор ссылок чтений (`refs` API), подписи «глава/стихи», аудио Азбуки и сопоставление с конспектами. Конспекты — `src/data/readingSummaries.js` (`{ "YYYY-MM-DD": { readings: [{ ref, summary }] } }`).
- `src/components/DonationScreen.js` — единственный вынесенный экран.
- Состояние хранится только в `localStorage`; список ключей — в `CLAUDE.md`.

## Безопасность

- Любой текст из `localStorage`, сети или `input` перед вставкой в `innerHTML` пропускай через `escapeHtml()` из `src/utils/escapeHtml.js`; URL в атрибутах — `escapeAttr(safeUrl(url))`.
- Production-сборка добавляет CSP (плагин в `vite.config.js`). Поэтому **никаких inline `onclick`/`onerror` в HTML** — только `addEventListener`. В dev CSP не действует, ошибку легко не заметить.
- `connect-src` и cleartext сейчас разрешают `http://82.146.34.140:3000`. После переезда на HTTPS (см. `server/README.md`) убрать адрес из CSP и из `android/app/src/main/res/xml/network_security_config.xml`.
- URL комментариев к чтениям задаётся через `VITE_SUMMARIES_URL` (`.env`, пример — `.env.example`); в production только `https://`.

## Серверы

- `server/` — актуальный backend (отдельный `package.json` и `node_modules`): `summaries.json`, вебхук ЮKassa, `/v1/payments` под `ADMIN_TOKEN`.
- `backend/` — устаревшая реализация, нигде не подключена; не трать время на её правки.
- Smoke-проверка: `/health` → 200, `/v1/payments` без токена → 401, вебхук с чужого IP → 403.

## Подводные камни

- Windows/PowerShell искажает кириллицу в выводе `Get-Content` и консоли. Читай файлы инструментом `read` или через Node с UTF-8; не суди о тексте по консольному выводу.
- Не записывай кириллицу через PowerShell here-string и Node-скрипты, запущенные из такой строки: в файл попадут `????`. Для правок с русским текстом используй `write`/`edit`, а генерируемые скрипты сохраняй отдельным файлом через `write`.
- `dist/`, `android/app/release/`, `*.png` (кроме иконок `public/pwa-*.png` и `public/apple-touch-icon.png`), `*.mp3`, `*.pdf` в `.gitignore`. Не коммить артефакты и не «восстанавливай» удалённый из индекса `dist/`.
- В рабочем дереве много мусорных untracked-файлов (скриншоты, `*.wav`, `.playwright-mcp/`). `git add .` в `release.js` захватит и их — коммить выборочно.
- В dev возможны CORS-ошибки `azbyka.ru` (API разрешает origin `https://localhost`) — это ограничение API, а не регрессия.
- `npx cap sync` перезаписывает `android/app/capacitor.build.gradle` и `android/capacitor.settings.gradle`; не редактируй их вручную.
- `jspdf` и `html2canvas` намеренно загружаются через динамический `import()` только при экспорте PDF — не возвращай статические импорты, иначе основной чанк снова вырастет почти втрое.
- В Android WebView страница открывается с `https://localhost`, поэтому любые `http://`-запросы блокируются как mixed content (CSP и `network_security_config` тут не помогают). Для HTTP-API используй нативный `CapacitorHttp` из `@capacitor/core`.
- Debug-APK нельзя поставить поверх release-сборки: подписи разные (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`). Чтобы обновиться на телефоне без потери `localStorage`, переподпиши debug-APK release-ключом: `apksigner sign --ks android/app/my-release-key.jks --ks-key-alias my-key-alias --ks-pass pass:270676 --key-pass pass:270676 --out signed.apk app-debug.apk`.
- После установки нового APK первый запуск может показать старый бандл из Service Worker, затем страница перезагружается на новый. Если проверяешь именно свежий код, дождись в логах `assets/index-<новый хэш>.js`.

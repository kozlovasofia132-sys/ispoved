# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Работа с базой знаний (Обсидиан / Второй мозг)

Моя основная база знаний находится по пути `D:\ObsidianVault`. Пожалуйста, используй эту папку как мой "Второй мозг" (Wiki).
При любых вопросах по архитектуре проекта или пояснениях кода сначала изучи файлы в `D:\ObsidianVault`.
Если в этой папке нет информации, посмотри файлы в текущем локальном проекте `Ispoved` (включая папки `wiki/` и `raw/`).
Все, что касается логики работы и документации, хранится в Obsidian. Считай это "единым источником истины".
Локальные изменения по-прежнему фиксируй в `log.md`.

## Язык общения

Всегда отвечай только на русском языке. Технические термины и идентификаторы кода оставляй в оригинальном виде.

## О проекте

«Исповедь» — православное приложение для подготовки к таинству исповеди. Работает как PWA и как нативное Android-приложение (через Capacitor). Поддерживает профили (взрослый, ребёнок, монашествующий) и два языка интерфейса: русский (`ru`) и церковнославянский (`cs`).

## Команды

```bash
npm run dev          # сервер разработки на http://localhost:5173
npm run build        # sync-version.js → vite build → cap sync (результат в dist/)
npm run preview      # предпросмотр production-сборки
npm run release      # увеличить patch + сборка + коммит + push на GitHub
npm run release:minor
npm run release:major
node sync-version.js # синхронизировать версию: package.json → src/version.js + android/app/build.gradle
node sync-github.js  # синхронизировать релиз на GitHub без bump версии
```

`release.js` требует файл `.env` с переменными `GITHUB_API_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`.

Тесты: `npm test` (`node:test`, каталог `tests/`). Пока покрыто только экранирование HTML — остальное проверяется вручную в браузере и на устройстве.

**Безопасность:** любой текст из `localStorage`, сети или пользовательского ввода перед вставкой в `innerHTML` обязан проходить через `escapeHtml()` из `src/utils/escapeHtml.js`. URL для `<img src>`/`data-*` — через `escapeAttr(safeUrl(url))`. Адрес сервера комментариев задаётся через `VITE_SUMMARIES_URL` (в production только `https://`).

## Архитектура

**Одностраничное приложение на vanilla JS без фреймворка.** Вся логика UI сосредоточена в `src/main.js` (один большой файл, ~2000 строк) внутри одного обработчика `DOMContentLoaded`. Структура HTML находится в `index.html`. Стили — Tailwind CSS (`style.css`).

- `src/main.js` — вся логика: переключение вкладок, воспроизведение аудио, TTS, генерация PDF, биометрия, PIN-защита, навигация по календарю, настройки, шаринг
- `src/data/` — статический контент: `sins.js` (списки грехов по профилям), `prayers.js`, `preparation.js`, `quotes.js`, `teachings.js`, `readingSummaries.js`, `translations.js` (строки i18n)
- `src/services/calendarService.js` — получение данных православного календаря с `https://azbyka.ru/days/api/day`
- `src/components/DonationScreen.js` — единственный вынесенный UI-компонент (экран пожертвований)
- `src/version.js` — управляется автоматически, не редактировать вручную

**Единственный источник версии — `package.json`.** `sync-version.js` распространяет её в `src/version.js` и `android/app/build.gradle` (versionCode вычисляется как `major*10000 + minor*100 + patch`).

**Capacitor** оборачивает Vite-сборку для Android. После `vite build` команда `cap sync` копирует `dist/` в Android-проект. Точка входа Android: `android/app/src/main/java/com/piskunov/ispoved/MainActivity.java`. Кастомные Android-плагины: `AudioNotificationPlugin.java`, `MediaNotificationService.java`.

**PWA / Workbox** (настроен в `vite.config.js`): аудио с `azbyka.ru` и `pravoslavie-audio.com` кэшируется стратегией CacheFirst (60 дней); API календаря — NetworkFirst (таймаут 5 сек).

## Структура данных

**Грехи** в `src/data/sins.js` организованы по категориям → элементам. Каждый элемент содержит `text.ru` (основной текст), `explanation.ru` (пояснение) и опциональное поле `severity: 'serious'`. В отдельных записях встречаются ключи `uk`/`en` — это незаконченные наброски, не являющиеся поддерживаемыми языками. Три списка (`adultSins`, `childSins`, `monasticSins`) экспортируются через `getSinsData(profile)`.

**i18n**: строки UI хранятся в `src/data/translations.js` в объекте `translations.ru` / `translations.cs`. Церковнославянский — это второй поддерживаемый язык (не `uk`/`en`).

**localStorage** — единственное хранилище состояния:

| Ключ | Тип | Описание |
|---|---|---|
| `selectedSins` | JSON-массив | Отмеченные грехи (предопределённые + пользовательские) |
| `personalReflections` | string | Личные заметки |
| `profile` | string | `adult` / `child` / `monastic` |
| `language` | string | `ru` / `cs` |
| `theme` | string | `light` / `dark` |
| `isLargeFont` | `'true'`/`'false'` | Крупный шрифт |
| `viewMode` | string | `detailed` / `simple` |
| `pinEnabled` | `'true'`/`'false'` | PIN-блокировка |
| `hashedPin` | string | Хэш PIN-кода |
| `biometricEnabled` | `'true'`/`'false'` | Биометрия |
| `digitalMentor` | `'true'`/`'false'` | Цифровой наставник |

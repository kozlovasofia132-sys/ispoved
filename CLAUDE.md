# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Язык общения

Всегда отвечай только на русском языке. Технические термины и идентификаторы кода оставляй в оригинальном виде.

## О проекте

«Исповедь» — православное приложение для подготовки к таинству исповеди. Работает как PWA и как нативное Android-приложение (через Capacitor). Поддерживает профили (взрослый, ребёнок, монашествующий) и два языка интерфейса: русский (`ru`) и церковнославянский (`cs`).

## Команды

```bash
npm run dev          # сервер разработки на http://localhost:5173
npm run build        # sync-version.js → vite build → cap sync (результат в dist/)
npm run release      # увеличить patch + сборка + коммит + push на GitHub
npm run release:minor
npm run release:major
node sync-version.js # синхронизировать версию: package.json → src/version.js + android/app/build.gradle
```

`release.js` требует файл `.env` с переменными `GITHUB_API_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`.

## Архитектура

**Одностраничное приложение на vanilla JS без фреймворка.** Вся логика UI сосредоточена в `src/main.js` (один большой файл, 2000+ строк). Структура HTML находится в `index.html`.

- `src/main.js` — вся логика: переключение вкладок, воспроизведение аудио, TTS, генерация PDF, биометрия, навигация по календарю, настройки
- `src/data/` — статический контент: `sins.js` (списки грехов по профилям), `prayers.js`, `preparation.js`, `quotes.js`, `translations.js` (строки i18n)
- `src/services/calendarService.js` — получение данных православного календаря с `https://azbyka.ru/days/api/day`
- `src/components/DonationScreen.js` — единственный вынесенный UI-компонент (экран пожертвований)
- `src/version.js` — управляется автоматически, не редактировать вручную

**Единственный источник версии — `package.json`.** `sync-version.js` распространяет её в `src/version.js` и `android/app/build.gradle` (versionCode вычисляется как `major*10000 + minor*100 + patch`).

**Capacitor** оборачивает Vite-сборку для Android. После `vite build` команда `cap sync` копирует `dist/` в Android-проект. Точка входа Android: `android/app/src/main/java/com/piskunov/ispoved/MainActivity.java`. Кастомные Android-плагины: `AudioNotificationPlugin.java`, `MediaNotificationService.java`.

**PWA / Workbox** (настроен в `vite.config.js`): аудио с `azbyka.ru` и `pravoslavie-audio.com` кэшируется стратегией CacheFirst (60 дней); API календаря — NetworkFirst (таймаут 5 сек).

## Структура данных

Грехи в `src/data/sins.js` организованы по категориям → элементам. Каждый элемент содержит текст в поле `ru` (основной). В отдельных записях `sins.js` встречаются ключи `uk`/`en` — это незаконченные наброски, не являющиеся поддерживаемыми языками. Списки по профилям (`adultSins`, `childSins`, `monasticSins`) экспортируются через `getSinsData(profile)`. Состояние (отмеченные грехи, профиль, язык, настройки) хранится в `localStorage`.

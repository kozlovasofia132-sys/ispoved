import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { getSinsData, setProfile, getProfile } from './data/sins.js';
import { translations } from './data/translations.js';

// Глобальная переменная для текущей даты навигации (объявлена здесь для избежания TDZ)
let currentNavDate;
import { preparationData, communionPrep } from './data/preparation.js';
import { quotes } from './data/quotes.js';
import { prayersData } from './data/prayers.js';
import { createDonationScreen, initDonationScreen, openDonationScreen, closeDonationScreen } from './components/DonationScreen.js';


document.addEventListener('DOMContentLoaded', () => {

    // --- Global Error Interceptor ---
    window.addEventListener('error', (event) => {
        console.error('[GLOBAL ERROR]', event.message, 'at', event.filename, ':', event.lineno);
    });
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[UNHANDLED PROMISE]', event.reason);
    });

    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        'church-empty': document.getElementById('tab-church-empty'),
        'church-today': document.getElementById('tab-church-today'),
        settings: document.getElementById('tab-settings'),
    };

    // --- Header Date ---
    function updateHeaderDate() {
        const dateToUse = (typeof currentNavDate !== 'undefined' && currentNavDate) ? currentNavDate : new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        let dateStr = dateToUse.toLocaleDateString('ru-RU', options);

        // Убираем " г." в конце даты
        dateStr = dateStr.replace(/\s*г\.$/, '');

        // Делаем первую букву заглавной
        const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        const headerDateEl = document.getElementById('header-date');
        if (headerDateEl) headerDateEl.textContent = formatted;

        const cardDateEl = document.getElementById('card-date-full');
        if (cardDateEl) cardDateEl.textContent = formatted;
    }

    // --- Header Spacing ---
    function updateHeaderSpacing() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        const headerHeight = header.offsetHeight;
        console.log('[Header Spacing] Header height:', headerHeight, 'px');
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }

    // --- Global Audio Utility ---
    function stopAllAudio() {
        // 1. Останавливаем синтез речи (Web Speech API)
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }

        // 2. Останавливаем динамически созданные объекты Audio (окно-уровень)
        if (window.currentAudio) {
            const wasReading = !!window.currentAudio._readingUrl;
            window.currentAudio.pause();
            window.currentAudio = null;
            if (wasReading) hideMediaNotification();
        }

        // 3. Останавливаем глобальный аудио-плеер (нижняя панель)
        const globalAudio = document.getElementById('global-audio-element');
        if (globalAudio) {
            globalAudio.pause();
        }

        // 4. Сбрасываем UI всех медиа-элементов (динамиков, кнопок и т.д.)
        if (typeof resetAllMediaUI === 'function') resetAllMediaUI();

        // Сбрасываем иконку основного плеера
        const playIcon = document.getElementById('audio-play-icon');
        if (playIcon) playIcon.textContent = 'play_arrow';

        // Сброс всех динамиков в "Подготовке"
        document.querySelectorAll('#preparation-intro-container button .material-symbols-outlined, #communion-prep-container button .material-symbols-outlined').forEach(i => {
            i.textContent = 'volume_up';
        });

        isAudioPlaying = false;
        console.log('[Audio] All media stopped.');
    }

    // --- Media Notification helpers (Android) ---
    function showMediaNotification(title, isPlaying) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioNotification) {
            window.Capacitor.Plugins.AudioNotification.show({ title, isPlaying });
        }
    }
    function updateMediaNotification(isPlaying) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioNotification) {
            window.Capacitor.Plugins.AudioNotification.updatePlayState({ isPlaying });
        }
    }
    function hideMediaNotification() {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioNotification) {
            window.Capacitor.Plugins.AudioNotification.hide({});
        }
    }

    // Слушаем нажатия кнопок в уведомлении
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AudioNotification) {
        window.Capacitor.Plugins.AudioNotification.addListener('mediaAction', function(data) {
            const action = data.action;
            if (action === 'pause') {
                if (window.currentAudio && !window.currentAudio.paused) {
                    window.currentAudio.pause();
                    if (window.currentReadingAudioIcon) {
                        window.currentReadingAudioIcon.textContent = 'volume_up';
                    }
                }
            } else if (action === 'play') {
                if (window.currentAudio && window.currentAudio.paused) {
                    window.currentAudio.play().catch(() => {});
                    if (window.currentReadingAudioIcon) {
                        window.currentReadingAudioIcon.textContent = 'pause';
                    }
                }
            } else if (action === 'stop') {
                stopAllAudio();
                if (window.currentReadingAudioIcon) {
                    window.currentReadingAudioIcon.textContent = 'volume_up';
                }
                window.currentReadingAudioIcon = null;
            }
        });
    }

    // --- Global Speech Function ---
    window.toggleSpeech = (text, iconId, audioIndex) => {
        console.log('[Speech] Toggling speech:', iconId, audioIndex);

        const icon = document.getElementById(iconId);

        // Если это ТЕКУЩИЙ файл и он ИГРАЕТ — просто ставим на паузу и выходим
        if (window.currentAudio && window.currentAudio._preparationIndex === audioIndex && !window.currentAudio.paused) {
            window.currentAudio.pause();
            if (icon) icon.textContent = 'volume_up';
            return;
        }

        // Во всех остальных случаях (новое аудио или возобновление старого из паузы) 
        // сначала останавливаем всё остальное
        stopAllAudio();

        // Воспроизводим аудиофайл подготовки
        if (audioIndex) {
            const audioUrl = `audio/preparation_${audioIndex}.mp3`;
            const audio = new Audio(audioUrl);
            audio._preparationIndex = audioIndex;
            window.currentAudio = audio;

            if (icon) icon.textContent = 'pause';

            audio.play().catch(err => {
                console.error('[Preparation Audio] Play error:', err);
                if (icon) icon.textContent = 'volume_up';
            });

            audio.addEventListener('ended', () => {
                if (icon) icon.textContent = 'volume_up';
                window.currentAudio = null;
            });

            audio.addEventListener('play', () => { if (icon) icon.textContent = 'pause'; });
            audio.addEventListener('pause', () => { if (icon) icon.textContent = 'volume_up'; });
        }
    };

    const headerTitle = document.getElementById('header-dynamic-title');
    const catalogContainer = document.getElementById('sins-container');
    const myListContainer = document.getElementById('my-list-container');
    const emptyState = document.getElementById('empty-state');
    const personalNotesArea = document.getElementById('personal-notes');
    const selectedCountValue = document.getElementById('selected-count-value');

    const customSinInput = document.getElementById('custom-sin-input');
    const addCustomSinBtn = document.getElementById('add-custom-sin-btn');

    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeButtons = document.querySelectorAll('.font-size-btn');
    const viewModeButtons = document.querySelectorAll('.view-mode-btn');
    const langButtons = document.querySelectorAll('.lang-btn');


    const clearModal = document.getElementById('clear-modal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');
    const clearAllBtn = document.getElementById('clear-all-btn-top');

    // Modals
    const aboutAppBtn = document.getElementById('about-app-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');
    const contactDevBtn = document.getElementById('contact-dev-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactBtn = document.getElementById('close-contact-btn');

    // Donation Modal
    const donateBtn = document.getElementById('donate-btn');
    const donateModal = document.getElementById('donate-modal');
    const closeDonateBtn = document.getElementById('close-donate-btn');
    const donateAmountBtns = document.querySelectorAll('.donate-amount-btn');
    const donateSubmitBtn = document.getElementById('donate-submit-btn');

    // Reading Mode Modal
    const readingModeModal = document.getElementById('reading-mode-modal');
    const openReadModeBtn = document.getElementById('open-read-mode-btn');
    const openReadModeBtnChurch = document.getElementById('open-read-mode-btn-church');
    const closeReadModeBtn = document.getElementById('close-read-mode-btn');
    const readModeContainer = document.getElementById('read-mode-container');
    const readModeContainerChurch = document.getElementById('read-mode-container-church');
    const readingModeContent = document.getElementById('reading-mode-content');
    const printPdfBtn = document.getElementById('print-pdf-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const previewSheet = document.getElementById('preview-sheet');
    const previewDate = document.getElementById('preview-date');

    // Prayers Reading Modal
    const prayersReadingModal = document.getElementById('prayers-reading-modal');
    const closePrayersModalBtn = document.getElementById('close-prayers-modal-btn');
    const prayerContentArea = document.getElementById('prayer-content-area');
    const prayerScrollArea = document.getElementById('prayer-scroll-area');
    const prayerProgressBar = document.getElementById('prayer-progress-bar');
    const prayerMenuItems = document.querySelectorAll('.prayer-menu-item');
    const prayersModalHeaderText = document.getElementById('prayers-modal-header-text');

    // Audio Player Bar Elements
    const audioPlayerBar = document.getElementById('audio-player-bar');
    const audioPlayPauseBtn = document.getElementById('audio-play-pause-btn');
    const audioPlayIcon = document.getElementById('audio-play-icon');
    const audioProgress = document.getElementById('audio-progress');
    const audioProgressContainer = document.getElementById('audio-progress-container');

    console.log('[Audio Debug] Player Bar:', !!audioPlayerBar);
    console.log('[Audio Debug] Play Button:', !!audioPlayPauseBtn);

    const previewIntro = document.getElementById('preview-intro');
    const previewContent = document.getElementById('preview-content');
    const previewNotesSection = document.getElementById('preview-notes-section');
    const previewNotes = document.getElementById('preview-notes');
    const shareSheetBtn = document.getElementById('share-sheet-btn');

    // My List Controls
    const toggleAllBtn = document.getElementById('toggle-all-btn');
    const formulaContainer = document.getElementById('formula-container');

    // Quote Elements
    const quoteTextEl = document.getElementById('confession-quote-text');
    const quoteAuthorEl = document.getElementById('confession-quote-author');
    const refreshQuoteBtn = document.getElementById('refresh-confession-quote-btn');

    // --- State ---
    let activeTab = 'church-empty';
    let selectedSins = JSON.parse(localStorage.getItem('selectedSins')) || [];
    let isLargeFont = localStorage.getItem('isLargeFont') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentLanguage = localStorage.getItem('language') || 'ru';
    let personalNotes = localStorage.getItem('personalReflections') || '';
    let isDetailedView = localStorage.getItem('viewMode') !== 'simple';
    let wakeLock = null;
    let isAllExpanded = false;

    // --- Синхронизация между вкладками ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'selectedSins') {
            console.log('[Storage Event] selectedSins changed in another tab');
            selectedSins = JSON.parse(e.newValue) || [];
            updateMyList();
            renderCatalog();
        }
        if (e.key === 'personalReflections') {
            console.log('[Storage Event] personalReflections changed in another tab');
            personalNotes = e.newValue || '';
            if (personalNotesArea) personalNotesArea.value = personalNotes;
        }
    });

    // --- New Features State ---

    let isDigitalMentorEnabled = localStorage.getItem('digitalMentor') === 'true';


    // --- Teleprompter State ---
    let isAutoscrolling = false;
    let autoscrollSpeed = 25; // pixels per second (базовая скорость - 25 px/sec при 50%)
    let autoscrollRequestId = null;
    let lastAutoscrollTimestamp = 0;
    let preciseScrollTop = 0; // Дробный аккумулятор для плавной прокрутки

    // --- Audio Player State ---
    let isAudioPlaying = false;
    let audioProgressValue = 0;
    let audioIntervalId = null;
    const currentGlobalAudio = document.getElementById('global-audio-element');
    let currentPrayerIdInPlayer = null;

    // --- Privacy by Design State ---
    let isPinEnabled = localStorage.getItem('pinEnabled') === 'true';
    let hashedPin = localStorage.getItem('hashedPin') || ''; // Stores hashed PIN
    let currentInputPin = '';
    let setupStep = 0; // 0: enter current/new, 1: confirm
    let tempSetupPin = '';
    let pendingTabAfterAuth = null;
    let pinPadSuccessCallback = null;
    let isUnlocked = false; // Флаг разблокировки вкладки "Моя исповедь"
    let isChangingPin = false; // Флаг процесса изменения ПИН

    // --- Localization ---
    function t(key) {
        if (!translations[currentLanguage]) return key;
        return translations[currentLanguage][key] || key;
    }

    function updateAppLanguage() {
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (key) el.textContent = t(key);
        });

        document.querySelectorAll('[data-t-placeholder]').forEach(el => {
            const key = el.getAttribute('data-t-placeholder');
            if (key) el.placeholder = t(key);
        });

        updateHeader();
        renderCatalog();
        renderPreparation();
        renderCommunionPrep();
        updateMyList();
        applyFontSize();
        applyTheme();
        applyViewMode();
        updateLanguageUI();
        applyLanguageFont();

        document.title = t('appName');
    }



    function applyLanguageFont() {
        document.body.classList.toggle('font-cs', currentLanguage === 'cs');

        // Обновляем отступ для шапки
        updateHeaderSpacing();
    }

    function updateHeader() {
        const headerTitle = document.getElementById('main-header-title');
        if (!headerTitle) return;

        let headerKey = '';
        switch (activeTab) {
            case 'church-empty': headerKey = 'churchTitle'; break;
            case 'church-today': headerKey = 'confessionTitle'; break;
            case 'settings': headerKey = 'settingsTitle'; break;
            default: headerKey = 'appName';
        }

        headerTitle.textContent = headerKey ? t(headerKey) : '';
        headerTitle.setAttribute('data-t', headerKey);
    }

    // --- Random Quote Function ---
    function renderRandomQuote() {
        if (!quoteTextEl || !quoteAuthorEl || quotes.length === 0) return;

        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];

        // Fade out
        quoteTextEl.classList.add('quote-fading');
        quoteAuthorEl.classList.add('quote-fading');

        setTimeout(() => {
            quoteTextEl.textContent = `«${quote.text}»`;
            quoteAuthorEl.textContent = quote.author;
            // Fade in
            quoteTextEl.classList.remove('quote-fading');
            quoteAuthorEl.classList.remove('quote-fading');
        }, 200);

        console.log('Цитата обновлена:', quote);
    }


    // --- Tab Navigation ---
    async function switchTab(tabId) {
        console.log('[switchTab] Called with tabId:', tabId);
        if (!tabContents[tabId]) {
            console.error('[switchTab] Tab not found:', tabId);
            return;
        }

        // Protection for "My Confession" tab — запрашиваем ПИН только если есть грехи в списке
        if (tabId === 'church-today' && isPinEnabled && selectedSins.length > 0) {
            console.log('[switchTab] PIN required. isPinEnabled:', isPinEnabled, 'selectedSins.length:', selectedSins.length, 'isUnlocked:', isUnlocked);
            // Если уже разблокировано в этой сессии, не запрашиваем ПИН снова
            if (!isUnlocked) {
                if (hashedPin) {
                    pendingTabAfterAuth = 'church-today';
                    console.log('[switchTab] Opening PIN pad');
                    openPinPad(false);
                    return;
                }
            }
        }

        console.log('[switchTab] Switching to tab:', tabId);
        activeTab = tabId;
        pendingTabAfterAuth = null;

        Object.keys(tabContents).forEach(id => {
            if (tabContents[id]) {
                const isTarget = id === tabId;
                tabContents[id].classList.toggle('hidden', !isTarget);
                if (isTarget) {
                    tabContents[id].classList.remove('tab-entering');
                    void tabContents[id].offsetWidth; // reflow to restart animation
                    tabContents[id].classList.add('tab-entering');
                }
                console.log('[switchTab] Tab', id, 'hidden:', tabContents[id].classList.contains('hidden'));
            }
        });

        navButtons.forEach(btn => {
            const isTarget = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('active', isTarget);
        });

        // Обновляем дату в карточке при переключении на вкладку церкви
        if (tabId === 'church-empty') {
            updateHeaderDate();
        }

        updateHeader();
        if (tabId === 'church-today' && typeof window.autoResizeNotes === 'function') {
            window.autoResizeNotes();
        }
        if (tabId === 'church-today') {
            renderPreparation();
            renderCatalog();
        }

        // Обновляем отступ для шапки
        updateHeaderSpacing();
    }


    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    // --- Render Catalog ---
    function renderCatalog() {
        if (!catalogContainer) return;
        const data = getSinsData();
        let catalogHtml = '';

        data.forEach((category) => {
            const title = category.titleKey ? t(category.titleKey) : (category.title[currentLanguage] || category.title.ru);
            const subtitle = category.subtitleKey ? t(category.subtitleKey) : (category.subtitle[currentLanguage] || category.subtitle.ru);

            const gradients = {
                god: 'from-black/80 to-transparent',
                neighbors: 'from-black/80 to-transparent',
                self: 'from-black/80 to-transparent'
            };

            const accentColor = category.id === 'god' ? 'text-primary' : (category.id === 'neighbors' ? 'text-blue-400' : 'text-emerald-400');
            const bgGradient = gradients[category.id] || 'from-slate-800/30 to-transparent';

            catalogHtml += `
            <details name="accordion-group" class="group glass-panel rounded-[28px] overflow-hidden transition-all duration-500 hover:shadow-primary/10">
                <summary class="cursor-pointer relative min-h-[170px] flex flex-col justify-end p-7 select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                    <div class="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 group-open:opacity-30 transition-all duration-700 scale-105 group-hover:scale-110 brightness-110 contrast-105 saturate-[1.25]" style="background-image: url('${category.image}')"></div>
                    <div class="absolute inset-0 z-0 bg-gradient-to-t ${bgGradient} opacity-95"></div>
                    
                    <div class="relative z-10 flex items-end justify-between w-full">
                        <div class="space-y-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            <span class="text-[10px] font-bold tracking-[0.2em] uppercase ${accentColor} block mb-1 font-serif italic drop-shadow-sm">${subtitle}</span>
                            <h3 class="text-3xl font-bold text-white tracking-tight font-serif drop-shadow-md">${title}</h3>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-open:rotate-180 transition-transform duration-500">
                             <span class="material-symbols-outlined text-white/90 text-[28px]">expand_more</span>
                        </div>
                    </div>
                </summary>
                <div class="px-5 pb-6 space-y-1.5 bg-background-dark/40 backdrop-blur-xl">
            `;

            category.sins.forEach((sin) => {
                const sinText = sin.text[currentLanguage] || sin.text.ru;
                const isSelected = selectedSins.some(s => s.id === sin.id);
                const hasDescription = sin.explanation && (sin.explanation[currentLanguage] || sin.explanation.ru);
                const isSerious = sin.severity === 'serious';

                // Найти заметку для этого греха
                const selectedSin = selectedSins.find(s => s.id === sin.id);
                const itemNote = selectedSin ? selectedSin.note || '' : '';
                const hasNote = itemNote.trim().length > 0;

                catalogHtml += `
                <div class="relative p-0.5 mb-2 rounded-2xl transition-all ${isSerious ? 'bg-gradient-to-r from-amber-500/30 to-transparent' : ''}">
                    <label class="flex items-start gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/item ${isSerious ? 'border-l-4 border-amber-500 pl-3' : ''}">
                            <input class="sin-checkbox mt-0.5 transition-all cursor-pointer" type="checkbox" value="${sin.id}" ${isSelected ? 'checked' : ''}/>
                            <div class="flex-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1">
                                        <p class="text-sm text-slate-900 dark:text-slate-200 font-bold group-hover/item:text-black dark:group-hover/item:text-white transition-colors leading-[1.4]">${sinText}</p>
                                        ${hasDescription ? `
                                        <p id="desc-${sin.id}" class="description-text hidden text-xs text-slate-400 mt-1 leading-relaxed" data-sin-id="${sin.id}">${sin.explanation[currentLanguage] || sin.explanation.ru}</p>
                                        ` : ''}
                                    </div>
                                    <div class="flex items-center gap-1 shrink-0">
                                        ${isDetailedView ? `
                                        <button type="button" class="note-toggle flex items-center gap-0.5 text-xs text-gray-400 hover:text-primary transition-colors px-2 py-1 rounded-full hover:bg-primary/10" data-sin-id="${sin.id}">
                                            <span class="material-symbols-outlined text-sm transition-transform ${hasNote ? 'rotate-180' : ''}" id="note-arrow-${sin.id}">expand_more</span>
                                        </button>
                                        ` : ''}
                                        ${hasDescription ? `
                                        <button type="button" class="description-toggle w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all" data-sin-id="${sin.id}">
                                            <span class="material-symbols-outlined text-lg">help</span>
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                                ${isDetailedView ? `
                                <textarea class="sin-note-input mt-2 w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-gray-500 focus:ring-[#7f19e6] focus:border-[#7f19e6] ${hasNote ? '' : 'hidden'}"
                                    placeholder="Добавить детали..."
                                    data-sin-id="${sin.id}">${itemNote}</textarea>
                                ` : ''}
                            </div>
                    </label>
                </div>
                `;
            });
            catalogHtml += '</div></details>';
        });

        catalogContainer.innerHTML = catalogHtml;

        // Auto-scroll logic for Catalog
        catalogContainer.querySelectorAll('details').forEach(details => {
            details.ontoggle = () => {
                if (details.open) {
                    // Проверяем, нужно ли запрашивать ПИН
                    if (isPinEnabled && selectedSins.length > 0 && !isUnlocked) {
                        // Закрываем accordion до авторизации
                        details.open = false;

                        pendingTabAfterAuth = 'catalog';
                        openPinPad(false, () => {
                            // После успешной проверки открываем accordion
                            details.open = true;
                            setTimeout(() => {
                                details.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 50);
                        });
                        return;
                    }

                    setTimeout(() => {
                        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            };
        });

        catalogContainer.querySelectorAll('.sin-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.value;
                console.log('[Checkbox Change] id:', id, 'checked:', e.target.checked);
                console.log('[Checkbox Change] selectedSins before:', selectedSins.length);
                
                if (e.target.checked) {
                    if (!selectedSins.some(s => s.id === id)) {
                        selectedSins.push({ id: id, type: 'predefined', note: '' });
                    }
                } else {
                    selectedSins = selectedSins.filter(s => s.id !== id);
                }
                
                console.log('[Checkbox Change] selectedSins after:', selectedSins.length);
                const saved = JSON.stringify(selectedSins);
                localStorage.setItem('selectedSins', saved);
                console.log('[Checkbox Change] Saved to localStorage:', saved.substring(0, 100) + '...');
                
                updateMyList();
            });
        });

        // Обработчик для textarea заметок в режиме "С деталями"
        catalogContainer.querySelectorAll('.sin-note-input').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sinId = textarea.getAttribute('data-sin-id');
                const noteText = textarea.value;

                const selectedSin = selectedSins.find(s => s.id === sinId);
                if (selectedSin) {
                    selectedSin.note = noteText;
                } else {
                    selectedSins.push({ id: sinId, type: 'predefined', note: noteText });
                }

                localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                console.log('Заметка сохранена:', sinId, noteText);
            });
        });

        // Обработчик для кнопки сворачивания/разворачивания заметок
        catalogContainer.querySelectorAll('.note-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sinId = btn.getAttribute('data-sin-id');
                const textarea = document.querySelector(`.sin-note-input[data-sin-id="${sinId}"]`);
                const arrow = document.getElementById(`note-arrow-${sinId}`);

                if (textarea && arrow) {
                    textarea.classList.toggle('hidden');
                    arrow.classList.toggle('rotate-180');
                }
            });
        });

        // Обработчик для кнопки показа/скрытия описания греха
        catalogContainer.querySelectorAll('.description-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sinId = btn.getAttribute('data-sin-id');
                const descText = document.getElementById(`desc-${sinId}`);
                const icon = btn.querySelector('.material-symbols-outlined');

                if (descText) {
                    descText.classList.toggle('hidden');
                    if (icon) {
                        icon.textContent = descText.classList.contains('hidden') ? 'help' : 'check_circle';
                    }
                }
            });
        });
    }

    // --- Render Preparation ---
    function renderPreparation() {
        const container = document.getElementById('preparation-intro-container');
        if (!container) {
            console.error('CRITICAL: preparation-intro-container not found!');
            return;
        }

        // 1. Clear container
        container.innerHTML = '';

        console.log('Starting renderPreparation. Items count:', preparationData.length);

        let resultHtml = '';

        // 2. Loop through ALL data
        preparationData.forEach((card, index) => {
            console.log(`Rendering card ${index + 1}: ${card.id}`);

            const title = t(card.titleKey);
            const body = t(card.bodyKey);

            const scripture = card.scriptureKey ? t(card.scriptureKey) : '';
            const scripture2 = card.scriptureKey2 ? t(card.scriptureKey2) : '';
            const scripture3 = card.scriptureKey3 ? t(card.scriptureKey3) : '';
            const saints = card.saintsKey ? t(card.saintsKey) : '';
            const advice = card.adviceKey ? t(card.adviceKey) : '';
            const setup = card.setupKey ? t(card.setupKey) : '';

            const speechParts = [body, scripture, scripture2, scripture3, saints, advice, setup].filter(p => p && p.trim().length > 0);
            const fullSpeechText = speechParts.join('. ');
            const quoteClass = "italic text-slate-300/90 border-l-4 border-[#E1C16E]/40 pl-4 my-4 leading-relaxed text-sm shadow-[0_0_10px_rgba(225,193,110,0.1)]";
            const onclickAttr = `onclick="event.preventDefault(); event.stopPropagation(); window.toggleSpeech(\`${fullSpeechText.replace(/"/g, '&quot;').replace(/'/g, "&#39;")}\`, 'tts-icon-${card.id}', ${index + 1}); return false;"`;

            resultHtml += `
            <details name="accordion-group" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 mb-4
                           bg-white dark:bg-gradient-to-br dark:from-[#1a1914] dark:via-[#1f1d1a] dark:to-[#151412]
                           shadow-sm dark:shadow-[inset_0_0_20px_rgba(225,193,110,0.03),0_4px_20px_rgba(0,0,0,0.4)]
                           hover:shadow-md dark:hover:shadow-[inset_0_0_30px_rgba(225,193,110,0.06),0_8px_30px_rgba(225,193,110,0.1)]
                           border border-black/5 dark:border-[#E1C16E]/10 hover:border-black/10 dark:hover:border-[#E1C16E]/20">
                <summary class="cursor-pointer flex items-center gap-4 p-5 select-none list-none [&::-webkit-details-marker]:hidden outline-none
                              hover:bg-[#E1C16E]/5 transition-all duration-300">
                    <span class="flex-1 text-lg font-bold text-[#E1C16E] tracking-tight drop-shadow-[0_0_8px_rgba(225,193,110,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(225,193,110,0.7)] transition-all duration-300">${title}</span>
                    <button class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-primary transition-all active:scale-90"
                            ${onclickAttr}>
                        <span id="tts-icon-${card.id}" class="material-symbols-outlined text-xl drop-shadow-sm dark:drop-shadow-[0_0_5px_currentColor]">volume_up</span>
                    </button>
                    <span class="material-symbols-outlined text-slate-400 dark:text-[#E1C16E]/40 group-open:rotate-180 transition-transform duration-300 text-xl drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(225,193,110,0.3)]">expand_more</span>
                </summary>
                <div class="px-5 pb-5 pt-1 bg-gradient-to-b from-transparent via-[#E1C16E]/[0.02] to-transparent">
                    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#E1C16E]/20 to-transparent mb-4 shadow-[0_0_10px_rgba(225,193,110,0.2)]"></div>
                    <p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed mb-4">${body}</p>
                    ${scripture && card.id !== 'prayer_fasting' ? `<p class="${quoteClass}">${scripture}</p>` : ''}
                    ${scripture && card.id === 'prayer_fasting' ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${scripture}</p>` : ''}
                    ${scripture2 && card.id === 'reconciliation' ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${scripture2}</p>` : ''}
                    ${scripture2 && card.id === 'prayer_fasting' ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${scripture2}</p>` : ''}
                    ${scripture2 && card.id === 'confession_day' ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${scripture2}</p>` : ''}
                    ${scripture2 && card.id !== 'reconciliation' && card.id !== 'prayer_fasting' && card.id !== 'confession_day' ? `<p class="${quoteClass}">${scripture2}</p>` : ''}
                    ${card.id === 'awareness' && saints ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${saints}</p>` : ''}
                    ${card.id === 'prayer_fasting' && saints ? `<p class="${quoteClass}">${saints}</p>` : ''}
                    ${card.id !== 'awareness' && card.id !== 'reconciliation' && card.id !== 'prayer_fasting' && card.id !== 'confession_day' && saints ? `<p class="${quoteClass}">${saints}</p>` : ''}
                    ${card.id === 'prayer_fasting' && advice ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${advice}</p>` : ''}
                    ${card.id === 'confession_day' && advice ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${advice}</p>` : ''}
                    ${card.id !== 'prayer_fasting' && card.id !== 'confession_day' && advice ? `<p class="text-sm font-bold text-amber-700 dark:text-[#E1C16E]/80 mb-2">${advice}</p>` : ''}
                    ${setup ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${setup}</p>` : ''}
                    ${scripture3 ? `<p class="${quoteClass}">${scripture3}</p>` : ''}
                </div>
            </details>
            `;
        });

        // 3. Update DOM once
        container.innerHTML = resultHtml;

        console.log('renderPreparation finished. Current container children:', container.children.length);

        // Auto-scroll logic
        container.querySelectorAll('details').forEach(details => {
            details.ontoggle = () => {
                if (details.open) {
                    setTimeout(() => {
                        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            };
        });

        // Initialize Refresh Quote Button
        if (refreshQuoteBtn) {
            refreshQuoteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Кнопка "Другая цитата" нажата');
                const icon = refreshQuoteBtn.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.style.transition = 'transform 0.3s ease';
                    icon.style.transform = 'rotate(360deg)';
                    setTimeout(() => { icon.style.transform = 'rotate(0deg)'; }, 300);
                }
                renderRandomQuote();
            });
        }
    }

    // Render Holy Communion Preparation
    function renderCommunionPrep() {
        const container = document.getElementById('communion-prep-container');
        if (!container) return;

        const card = communionPrep;
        const title = t(card.titleKey);
        const body = t(card.bodyKey);
        const scripture = card.scriptureKey ? t(card.scriptureKey) : '';
        const scripture2 = card.scriptureKey2 ? t(card.scriptureKey2) : '';
        const setup = card.setupKey ? t(card.setupKey) : '';

        const speechParts = [body, scripture, scripture2, setup].filter(p => p && p.trim().length > 0);
        const fullSpeechText = speechParts.join('. ');
        const quoteClass = "italic text-slate-300/90 border-l-4 border-[#E1C16E]/40 pl-4 my-4 leading-relaxed text-sm shadow-[0_0_10px_rgba(225,193,110,0.1)]";
        const onclickAttr = `onclick="event.preventDefault(); event.stopPropagation(); window.toggleSpeech(\`${fullSpeechText.replace(/"/g, '&quot;').replace(/'/g, "&#39;")}\`, 'tts-icon-${card.id}', 5); return false;"`;

        container.innerHTML = `
        <details name="communion-accordion" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 mb-4
                       bg-white dark:bg-gradient-to-br dark:from-[#1a1914] dark:via-[#1f1d1a] dark:to-[#151412]
                       shadow-sm dark:shadow-[inset_0_0_20px_rgba(225,193,110,0.03),0_4px_20px_rgba(0,0,0,0.4)]
                       hover:shadow-md dark:hover:shadow-[inset_0_0_30px_rgba(225,193,110,0.06),0_8px_30px_rgba(225,193,110,0.1)]
                       border border-black/5 dark:border-[#E1C16E]/10 hover:border-black/10 dark:hover:border-[#E1C16E]/20">
            <summary class="cursor-pointer flex items-center gap-4 p-5 select-none list-none [&::-webkit-details-marker]:hidden outline-none
                          hover:bg-[#E1C16E]/5 transition-all duration-300">
                <span class="flex-1 text-lg font-bold text-[#E1C16E] tracking-tight drop-shadow-[0_0_8px_rgba(225,193,110,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(225,193,110,0.7)] transition-all duration-300">${title}</span>
                <button class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-primary transition-all active:scale-90"
                        ${onclickAttr}>
                    <span id="tts-icon-${card.id}" class="material-symbols-outlined text-xl drop-shadow-sm dark:drop-shadow-[0_0_5px_currentColor]">volume_up</span>
                </button>
                <span class="material-symbols-outlined text-slate-400 dark:text-[#E1C16E]/40 group-open:rotate-180 transition-transform duration-300 text-xl drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(225,193,110,0.3)]">expand_more</span>
            </summary>
            <div class="px-5 pb-5 pt-1 bg-gradient-to-b from-transparent via-[#E1C16E]/[0.02] to-transparent">
                <div class="w-full h-px bg-gradient-to-r from-transparent via-[#E1C16E]/20 to-transparent mb-4 shadow-[0_0_10px_rgba(225,193,110,0.2)]"></div>
                <p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed mb-4">${body}</p>
                ${scripture ? `<p class="${quoteClass}">${scripture}</p>` : ''}
                ${scripture2 ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${scripture2}</p>` : ''}
                ${setup ? `<p class="text-base text-slate-700 dark:text-slate-200/90 leading-relaxed">${setup}</p>` : ''}
            </div>
        </details>
        `;

        // Auto-scroll logic
        container.querySelectorAll('details').forEach(details => {
            details.ontoggle = () => {
                if (details.open) {
                    setTimeout(() => {
                        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            };
        });
    }


    function updateMyList() {
        if (!myListContainer) return;

        if (selectedCountValue) selectedCountValue.textContent = selectedSins.length;

        if (selectedSins.length === 0) {
            myListContainer.innerHTML = '';
            if (emptyState) emptyState.classList.replace('hidden', 'flex');
            if (readModeContainer) readModeContainer.classList.add('hidden');
            if (toggleAllBtn) toggleAllBtn.classList.add('hidden');
            if (formulaContainer) formulaContainer.classList.add('hidden');
            updateChurchReadButtonVisibility();
            return;
        }

        if (emptyState) emptyState.classList.replace('flex', 'hidden');
        if (readModeContainer) readModeContainer.classList.remove('hidden');
        if (toggleAllBtn) toggleAllBtn.classList.remove('hidden');
        if (formulaContainer) formulaContainer.classList.remove('hidden');
        updateChurchReadButtonVisibility();

        let listHtml = '';
        const data = getSinsData();

        selectedSins.forEach((item) => {
            let sinTitle = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinTitle = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinTitle = item.text;
            }

            const itemNote = item.note || '';
            const indicatorIcon = itemNote ? 'description' : 'expand_more';

            if (isDetailedView) {
                listHtml += `
                <div class="sin-card-wrapper animate-fade-in-up" data-sin-id="${item.id}">
                    <div class="sin-card-main">
                        <div class="sin-card-header">
                            <p class="sin-card-title">${sinTitle}</p>
                            <div class="flex items-center gap-2">
                                <button class="delete-inline-btn text-red-400/50 hover:text-red-400 transition-colors p-1">
                                    <span class="material-symbols-outlined text-lg">close</span>
                                </button>
                                <span class="sin-card-indicator material-symbols-outlined">${indicatorIcon}</span>
                            </div>
                        </div>
                        <div class="sin-card-body">
                            <span class="details-label" data-t="sinDetailsLabel">${t('sinDetailsLabel')}</span>
                            <textarea class="sin-note-input" 
                                      placeholder="${t('sinNotePlaceholder')}"
                                      data-sin-id="${item.id}">${itemNote}</textarea>
                        </div>
                    </div>
                </div>
                `;
            } else {
                listHtml += `
                <div class="sin-card-wrapper simple-view animate-fade-in-up" data-sin-id="${item.id}">
                    <div class="sin-card-main">
                        <div class="sin-card-header flex items-center justify-between py-3 px-4">
                            <p class="sin-card-title text-sm font-bold flex-1">${sinTitle}</p>
                            <button class="delete-inline-btn text-red-400 opacity-60 hover:opacity-100 transition-opacity ml-2">
                                <span class="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }
        });

        myListContainer.innerHTML = listHtml;

        // Add Logic for Interactions
        myListContainer.querySelectorAll('.sin-card-wrapper').forEach(card => {
            const header = card.querySelector('.sin-card-header');
            const sinId = card.getAttribute('data-sin-id');
            const input = card.querySelector('.sin-note-input');
            const deleteInlineBtn = card.querySelector('.delete-inline-btn');

            // 1. Accordion Toggle (Only if detailed)
            if (isDetailedView && header) {
                header.addEventListener('click', (e) => {
                    // Don't toggle if we clicked delete
                    if (e.target.closest('.delete-inline-btn')) return;
                    card.classList.toggle('open');
                });
            }

            // 2. Note Input Update (Only if detailed)
            if (isDetailedView && input) {
                input.addEventListener('input', (e) => {
                    const note = e.target.value;
                    const index = selectedSins.findIndex(s => s.id === sinId);
                    if (index !== -1) {
                        selectedSins[index].note = note;
                        localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                        // Update indicator icon if it was empty
                        if (note.length === 1 || note.length === 0) {
                            card.querySelector('.sin-card-indicator').textContent = note.length > 0 ? 'description' : 'expand_more';
                        }
                    }
                });
            }

            // Delete for all views
            if (deleteInlineBtn) {
                deleteInlineBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedSins = selectedSins.filter(s => s.id !== sinId);
                    localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                    renderCatalog();
                    updateMyList();
                });
            }
        });
    }

    // --- Toggle All Logic ---
    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', () => {
            isAllExpanded = !isAllExpanded;
            const cards = myListContainer.querySelectorAll('.sin-card-wrapper');
            cards.forEach(c => c.classList.toggle('open', isAllExpanded));

            const btnText = toggleAllBtn.querySelector('[data-t]');
            const btnIcon = toggleAllBtn.querySelector('.material-symbols-outlined');

            if (isAllExpanded) {
                btnText.textContent = t('collapseAllBtn');
                btnIcon.textContent = 'unfold_less';
            } else {
                btnText.textContent = t('expandAllBtn');
                btnIcon.textContent = 'unfold_more';
            }
        });
    }

    // --- Reading Mode Logic ---
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    const prayerModal = document.getElementById('prayer-modal');
    const prayerModalCloseBtn = document.getElementById('prayer-modal-close-btn');
    const prayerModalCloseXBtn = document.getElementById('prayer-modal-close-x-btn'); // Кнопка закрытия (X) в углу экрана
    const readingModeFooter = document.getElementById('reading-mode-footer');
    const finishConfessionBtn = document.getElementById('finish-confession-btn'); // Кнопка "Завершить исповедь"

    function populateReadingMode() {
        if (!readingModeContent) return;
        const data = getSinsData();
        let contentHtml = '';

        selectedSins.forEach((item) => {
            let sinText = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinText = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinText = item.text;
            }

            contentHtml += `
                <div class="reading-sin-item">
                    <p class="reading-sin-text text-white font-bold">${sinText}</p>
                    ${item.note ? `<p class="reading-sin-note italic text-slate-400 mt-2">${item.note}</p>` : ''}
                </div>
            `;
        });

        if (personalNotes.trim()) {
            contentHtml += `
                <div class="pt-8 border-t border-white/10">
                    <p class="text-[11px] font-bold tracking-[0.2em] text-primary uppercase mb-4">${t('personalReflections')}</p>
                    <p class="text-xl text-slate-300 leading-relaxed italic">${personalNotes}</p>
                </div>
            `;
        }
        readingModeContent.innerHTML = contentHtml;

        // Show/hide footer based on content
        if (selectedSins.length > 0 || personalNotes.trim()) {
            readingModeFooter.classList.remove('hidden');
        } else {
            readingModeFooter.classList.add('hidden');
        }
    }

    if (openReadModeBtn && readingModeModal) {
        openReadModeBtn.addEventListener('click', () => {
            populateReadingMode();

            // Force show modal with !important styles
            readingModeModal.classList.remove('hidden');
            readingModeModal.classList.add('flex');
            readingModeModal.style.display = 'flex';
            readingModeModal.style.visibility = 'visible';
            readingModeModal.style.opacity = '1';
            readingModeModal.style.zIndex = '99999';

            // === TELEPROMPTER - ОТКЛЮЧЕН для режима чтения ===
            const teleControls = document.getElementById('teleprompter-controls');
            if (teleControls) {
                teleControls.classList.add('hidden');
                teleControls.style.display = 'none';
            }

            const modalScrollArea = readingModeModal.querySelector('.overflow-y-auto');
            if (modalScrollArea) modalScrollArea.scrollTop = 0;
            requestWakeLock();
        });
    } else {
        console.error('[Reading Mode] Missing elements:', {
            openReadModeBtn: !!openReadModeBtn,
            readingModeModal: !!readingModeModal
        });
    }

    // Кнопка "Читать на исповеди" в церковной вкладке
    if (openReadModeBtnChurch && readingModeModal) {
        openReadModeBtnChurch.addEventListener('click', () => {
            // Проверяем ПИН если включено и есть грехи
            if (isPinEnabled && selectedSins.length > 0 && !isUnlocked) {
                if (hashedPin) {
                    pendingTabAfterAuth = 'church-read-mode';
                    console.log('[Church Read Button] Opening PIN pad');
                    openPinPad(false);
                    return;
                }
            }
            
            // Открываем режим чтения
            openReadModeBtnChurchClickHandler();
        });
    }
    
    // Обработчик клика кнопки "Читать на исповеди" (после успешной PIN-проверки)
    function openReadModeBtnChurchClickHandler() {
        populateReadingMode();

        // Force show modal with !important styles
        readingModeModal.classList.remove('hidden');
        readingModeModal.classList.add('flex');
        readingModeModal.style.display = 'flex';
        readingModeModal.style.visibility = 'visible';
        readingModeModal.style.opacity = '1';
        readingModeModal.style.zIndex = '99999';

        // === TELEPROMPTER - ОТКЛЮЧЕН для режима чтения ===
        const teleControls = document.getElementById('teleprompter-controls');
        if (teleControls) {
            teleControls.classList.add('hidden');
            teleControls.style.display = 'none';
        }

        const modalScrollArea = readingModeModal.querySelector('.overflow-y-auto');
        if (modalScrollArea) modalScrollArea.scrollTop = 0;
        requestWakeLock();
    }

    // Функция обновления видимости кнопки в церковной вкладке
    function updateChurchReadButtonVisibility() {
        const readModeContainerChurch = document.getElementById('read-mode-container-church');
        if (readModeContainerChurch) {
            // Показываем кнопку только если есть грехи
            const hasSins = selectedSins && selectedSins.length > 0;
            
            if (hasSins) {
                readModeContainerChurch.classList.remove('hidden');
            } else {
                readModeContainerChurch.classList.add('hidden');
            }
        }
    }

    if (closeReadModeBtn && readingModeModal) {
        closeReadModeBtn.addEventListener('click', () => {
            readingModeModal.classList.add('hidden');
            releaseWakeLock();
        });
    }

    // Кнопка "Завершить исповедь" — очистка данных и возврат в каталог
    if (finishConfessionBtn) {
        finishConfessionBtn.addEventListener('click', () => {
            console.log('[Confession] Finishing confession');

            // Очищаем список грехов
            selectedSins = [];
            localStorage.setItem('selectedSins', '[]');

            // Очищаем личные заметки
            personalNotes = '';
            localStorage.setItem('personalReflections', '');
            if (personalNotesArea) {
                personalNotesArea.value = '';
            }

            // Закрываем модальное окно чтения
            readingModeModal.classList.add('hidden');
            releaseWakeLock();

            // Обновляем отображение
            renderCatalog();
            updateMyList();

            // Переключаемся на вкладку Исповедь
            switchTab('church-today');

            // Показываем уведомление
            showToast(t('confessionCompleted'));

            console.log('[Confession] Confession completed');
        });
    }

    if (prayerModalCloseBtn && prayerModal) {
        prayerModalCloseBtn.addEventListener('click', () => {
            prayerModal.classList.add('hidden');
        });
        prayerModal.addEventListener('click', (e) => {
            if (e.target === prayerModal) {
                prayerModal.classList.add('hidden');
            }
        });
    }

    // Обработчик кнопки закрытия (X) для Prayer Modal
    if (prayerModalCloseXBtn && prayerModal) {
        prayerModalCloseXBtn.addEventListener('click', () => {
            prayerModal.classList.add('hidden');
        });
    }


    // --- Personal Notes (General pool) ---
    if (personalNotesArea) {
        personalNotesArea.value = personalNotes;
        window.autoResizeNotes = () => {
            personalNotesArea.style.height = 'auto';
            personalNotesArea.style.height = personalNotesArea.scrollHeight + 'px';
        };
        personalNotesArea.addEventListener('input', (e) => {
            personalNotes = e.target.value;
            localStorage.setItem('personalReflections', personalNotes);
            window.autoResizeNotes();
        });
        setTimeout(window.autoResizeNotes, 0);
    }

    // --- Custom Sins ---
    if (addCustomSinBtn && customSinInput) {
        function addCustomSin() {
            const text = customSinInput.value.trim();
            if (text) {
                const newId = 'custom_' + Date.now();
                selectedSins.push({ id: newId, type: 'custom', text: text, note: '' });
                localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                customSinInput.value = '';
                updateMyList();
            }
        }
        addCustomSinBtn.addEventListener('click', addCustomSin);
        customSinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSin();
            }
        });
    }

    // --- Actions ---
    const clearAllBtnTop = document.getElementById('clear-all-btn-top');
    const openClearModal = () => {
        // Проверяем, разблокирована ли вкладка "Моя исповедь"
        if (isPinEnabled && !isUnlocked) {
            console.log('[PIN] Clear blocked - requires authentication');
            // Если ПИН включен, но не разблокировано — запрашиваем ПИН
            pendingTabAfterAuth = 'church-today';
            openPinPad(false, () => {
                // После успешной разблокировки открываем модальное окно
                if (clearModal) clearModal.classList.remove('hidden');
            });
            return;
        }
        if (clearModal) clearModal.classList.remove('hidden');
    };
    const closeClearModal = () => { if (clearModal) clearModal.classList.add('hidden'); };

    if (clearAllBtn) clearAllBtn.addEventListener('click', openClearModal);
    if (clearAllBtnTop) clearAllBtnTop.addEventListener('click', openClearModal);
    if (cancelClearBtn) cancelClearBtn.addEventListener('click', closeClearModal);

    if (confirmClearBtn) {
        confirmClearBtn.addEventListener('click', () => {
            selectedSins = [];
            localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
            personalNotes = '';
            localStorage.setItem('personalReflections', personalNotes);
            if (personalNotesArea) personalNotesArea.value = '';
            renderCatalog();
            updateMyList();
            closeClearModal();
        });
    }

    // --- Modals Logic ---
    function setupModal(trigger, modal, close) {
        if (trigger && modal) trigger.addEventListener('click', () => modal.classList.remove('hidden'));
        if (close && modal) close.addEventListener('click', () => modal.classList.add('hidden'));
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }
    setupModal(aboutAppBtn, aboutModal, closeAboutBtn);

    // Contact Dev - открывает модальное окно с контактами (включая MAX)
    if (contactDevBtn && contactModal) {
        contactDevBtn.addEventListener('click', () => {
            contactModal.classList.remove('hidden');
        });
        if (closeContactBtn) {
            closeContactBtn.addEventListener('click', () => {
                contactModal.classList.add('hidden');
            });
        }
    }

    // --- Donation Logic ---
    const DONATION_URL = 'https://pay.cloudtips.ru/p/07c2c144';

    // Создаем и добавляем экран пожертвований
    const donationScreen = createDonationScreen();
    document.body.appendChild(donationScreen);

    // Инициализируем обработчики экрана пожертвований
    initDonationScreen();

    // Открытие экрана пожертвований (кнопка в настройках)
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            openDonationScreen();
        });
    }

    // Открытие экрана пожертвований (кнопка в модальном окне «О приложении»)
    const donateFromAboutBtn = document.getElementById('donate-from-about-btn');
    if (donateFromAboutBtn) {
        donateFromAboutBtn.addEventListener('click', () => {
            openDonationScreen();
        });
    }

    // Обработка старой кнопки закрытия модального окна (для совместимости)
    if (closeDonateBtn) {
        closeDonateBtn.addEventListener('click', () => {
            if (donateModal) donateModal.classList.add('hidden');
            closeDonationScreen();
        });
    }

    // --- Language Selection ---
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLanguage = btn.dataset.lang;
            localStorage.setItem('language', currentLanguage);
            updateAppLanguage();
        });
    });

    function updateLanguageUI() {
        langButtons.forEach(btn => {
            const isActive = btn.dataset.lang === currentLanguage;
            if (isActive) {
                btn.classList.add('bg-primary', 'text-white');
                btn.classList.remove('bg-white/5', 'text-slate-300');
            } else {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('bg-white/5', 'text-slate-300');
            }
        });

        // Обновляем отступ для шапки
        updateHeaderSpacing();
    }

    // --- Appearance Settings ---
    async function applyTheme() {
        const isDark = currentTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
        if (themeToggle) themeToggle.checked = isDark;

        // Обновляем цвет системной панели навигации (meta)
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', isDark ? '#120F16' : '#fbf9f4');
        }

        // Native control via Capacitor
        try {
            if (Capacitor.isNativePlatform()) {
                // Status Bar (Top)
                await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
                if (!isDark) {
                    await StatusBar.setBackgroundColor({ color: '#fbf9f4' });
                } else {
                    await StatusBar.setBackgroundColor({ color: '#120F16' });
                }

                // Navigation Bar (Bottom) - Android
                if (Capacitor.getPlatform() === 'android') {
                    await NavigationBar.setColor({ color: isDark ? '#120F16' : '#fbf9f4' });
                    await NavigationBar.setDarkIcons({ darkIcons: !isDark });
                }
            }
        } catch (err) {
            console.warn('[Native Theme] Failed to update system bars:', err);
        }

        // Обновляем отступ для шапки
        updateHeaderSpacing();
    }
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            currentTheme = e.target.checked ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
            applyTheme();
        });
    }
    function applyFontSize() {
        document.documentElement.style.fontSize = isLargeFont ? '18px' : '16px';
        fontSizeButtons.forEach(btn => {
            const isTarget = (btn.dataset.font === 'large' && isLargeFont) ||
                (btn.dataset.font === 'normal' && !isLargeFont);
            btn.classList.toggle('bg-primary', isTarget);
            btn.classList.toggle('text-white', isTarget);
        });
    }
    fontSizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            isLargeFont = btn.dataset.font === 'large';
            localStorage.setItem('isLargeFont', isLargeFont);
            applyFontSize();
        });
    });

    function applyViewMode() {
        viewModeButtons.forEach(btn => {
            const isActive = (btn.dataset.view === 'detailed' && isDetailedView) ||
                (btn.dataset.view === 'simple' && !isDetailedView);
            btn.classList.toggle('active', isActive);
        });
        // Обновляем описание режима
        const viewModeDesc = document.getElementById('view-mode-desc');
        if (viewModeDesc) {
            viewModeDesc.textContent = isDetailedView ? t('viewModeDetailedDesc') : t('viewModeSimpleDesc');
        }
        if (toggleAllBtn) {
            toggleAllBtn.classList.toggle('hidden', !isDetailedView || selectedSins.length === 0);
        }
    }

    viewModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            isDetailedView = btn.dataset.view === 'detailed';
            localStorage.setItem('viewMode', isDetailedView ? 'detailed' : 'simple');
            applyViewMode();
            renderCatalog();
            updateMyList();
        });
    });

    // --- Privacy & Security Features ---
    const pinPadModal = document.getElementById('pin-pad-modal');
    const pinPadStatus = document.getElementById('pin-pad-title');
    const pinCells = document.querySelectorAll('.pin-cell');
    const pinBtns = document.querySelectorAll('.pin-btn');
    const pinBackspace = document.getElementById('pin-delete-btn');
    const pinCancel = document.getElementById('pin-cancel-btn');
    const pinClearBtn = document.getElementById('pin-clear-btn'); // Кнопка "Удалить" (очистка всего ПИН)
    const pinPadCloseBtn = document.getElementById('pin-pad-close-btn'); // Кнопка закрытия (X)
    const pinToggle = document.getElementById('pin-toggle');

    // Custom Confirm Modal elements
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    let confirmCallback = null; // Callback for "Yes" action

    function updatePinDots() {
        if (!pinCells || pinCells.length === 0) return;
        pinCells.forEach((cell, i) => {
            if (i < currentInputPin.length) {
                cell.classList.add('bg-white', 'border-white');
                cell.classList.remove('border-white/30');
            } else {
                cell.classList.remove('bg-white', 'border-white');
                cell.classList.add('border-white/30');
            }
            // Remove error state
            cell.classList.remove('border-red-500');
        });
    }

    async function hashPin(pin) {
        // Simple hash (Base64) for basic obfuscation as requested
        return btoa(pin + '_ispoved_salt');
    }

    async function handlePinInput(val) {
        if (currentInputPin.length >= 4) return;
        currentInputPin += val;
        updatePinDots();

        if (currentInputPin.length === 4) {
            setTimeout(async () => {
                const hashedInput = await hashPin(currentInputPin);

                // Mode 1: Verification (ПИН уже установлен, проверяем для включения/разблокировки)
                // Проверяем: есть ли сохраненный ПИН и НЕ в режиме установки
                if (hashedPin && pinPadModal && !pinPadModal.classList.contains('setup-mode')) {
                    if (hashedInput === hashedPin) {
                        // Успешная проверка — устанавливаем isUnlocked и вызываем колбэк если есть
                        isUnlocked = true;
                        console.log('[PIN] PIN verified, isUnlocked = true');

                        if (typeof pinPadSuccessCallback === 'function') {
                            pinPadSuccessCallback();
                            pinPadSuccessCallback = null;
                        }
                        closePinPad();
                    } else {
                        if (pinPadStatus) {
                            pinPadStatus.textContent = t('incorrectPin');
                            pinPadStatus.classList.add('text-red-400');
                        }
                        if (pinCells && pinCells.length > 0) {
                            pinCells.forEach(cell => cell.classList.add('border-red-500', 'text-red-500'));
                        }
                        shakePinPad();
                        setTimeout(resetPinInput, 500); // Small delay to show red cells
                    }
                }
                // Mode 2: PIN Setup (режим установки нового ПИН-кода)
                else if (setupStep === 0) {
                    tempSetupPin = hashedInput;
                    setupStep = 1;
                    if (pinPadStatus) pinPadStatus.textContent = t('pinConfirmNewTitle');
                    resetPinInput();
                } else if (setupStep === 1) {
                    if (hashedInput === tempSetupPin) {
                        hashedPin = hashedInput;
                        localStorage.setItem('hashedPin', hashedPin);
                        isPinEnabled = true;
                        localStorage.setItem('pinEnabled', 'true');

                        // Call success callback if it exists (e.g., from toggle setup)
                        if (typeof pinPadSuccessCallback === 'function') {
                            pinPadSuccessCallback();
                            pinPadSuccessCallback = null;
                        }

                        updatePrivacyUI(); // Enable privacy options now that PIN is set
                        showToast(t('pinSuccess'));
                        closePinPad();
                    } else {
                        if (pinPadStatus) {
                            pinPadStatus.textContent = t('pinMismatch');
                            pinPadStatus.classList.add('text-red-400');
                        }
                        if (pinCells && pinCells.length > 0) {
                            pinCells.forEach(cell => cell.classList.add('border-red-500', 'text-red-500'));
                        }
                        shakePinPad();
                        setupStep = 0;
                        setTimeout(() => {
                            if (pinPadStatus) {
                                pinPadStatus.textContent = t('pinSetupNewTitle');
                                pinPadStatus.classList.remove('text-red-400');
                            }
                            resetPinInput();
                        }, 1000);
                    }
                }
            }, 250);
        }
    }

    function resetPinInput() {
        currentInputPin = '';
        updatePinDots();
    }

    function shakePinPad() {
        if (!pinPadModal) return;
        const modalDiv = pinPadModal.querySelector('div');
        if (modalDiv) {
            modalDiv.classList.add('animate-shake');
            setTimeout(() => modalDiv.classList.remove('animate-shake'), 500);
        }
    }

    function openPinPad(isSetup = false, onSuccess = null) {
        console.log('[PIN] openPinPad called, isSetup=', isSetup);
        pinPadSuccessCallback = onSuccess;

        if (!pinPadModal) {
            console.error('[PIN] pinPadModal not found!');
            return;
        }
        if (!pinPadStatus) {
            console.error('[PIN] pinPadStatus not found!');
            return;
        }

        currentInputPin = '';
        setupStep = 0;

        // === ПРИНУДИТЕЛЬНОЕ ОТОБРАЖЕНИЕ МОДАЛЬНОГО ОКНА ===
        pinPadModal.classList.remove('hidden');
        pinPadModal.classList.add('flex');

        // Показываем кнопку закрытия
        if (pinPadCloseBtn) {
            pinPadCloseBtn.classList.remove('hidden');
            pinPadCloseBtn.style.display = 'flex';
        }

        console.log('[PIN] Modal classes after show:', pinPadModal.classList.toString());
        // ====================================================

        pinPadModal.classList.toggle('setup-mode', isSetup);

        // Обновляем текст в зависимости от режима
        if (isSetup) {
            // В режиме установки показываем разные заголовки для этапов
            if (setupStep === 0) {
                pinPadStatus.textContent = t('pinSetupNewTitle');
            } else {
                pinPadStatus.textContent = t('pinConfirmNewTitle');
            }
            if (pinCancel) pinCancel.classList.remove('hidden');
        } else {
            // Режим проверки ПИН для доступа к вкладке "Моя исповедь"
            pinPadStatus.textContent = t('pinVerificationNote');
            if (pinCancel) pinCancel.classList.add('hidden');
        }

        pinPadStatus.classList.remove('text-red-400');
        updatePinDots();

        // Отладка: проверка содержимого модального окна
        console.log('[PIN] DOM Modal HTML:', document.getElementById('pin-pad-modal')?.innerHTML);
        console.log('[PIN] Modal element exists:', !!document.getElementById('pin-pad-modal'));
        console.log('[PIN] Modal computed styles:', {
            display: window.getComputedStyle(pinPadModal).display,
            height: window.getComputedStyle(pinPadModal).height,
            width: window.getComputedStyle(pinPadModal).width,
            visibility: window.getComputedStyle(pinPadModal).visibility,
            opacity: window.getComputedStyle(pinPadModal).opacity
        });
    }

    function closePinPad() {
        const wasSetup = pinPadModal && pinPadModal.classList.contains('setup-mode');

        // Жесткое скрытие модального окна
        if (pinPadModal) {
            pinPadModal.classList.add('hidden');
            pinPadModal.classList.remove('flex');
        }

        // Скрываем кнопку закрытия
        if (pinPadCloseBtn) {
            pinPadCloseBtn.classList.add('hidden');
            pinPadCloseBtn.style.display = 'none';
        }

        resetPinInput();

        // Переключаем вкладку только если это не процесс изменения ПИН
        if (!wasSetup && pendingTabAfterAuth && !isChangingPin) {
            if (pendingTabAfterAuth === 'church-read-mode') {
                // Открываем режим чтения из церковной вкладки
                openReadModeBtnChurchClickHandler();
            } else {
                switchTab(pendingTabAfterAuth);
            }
            pendingTabAfterAuth = null;
        }
    }

    if (pinBtns && pinBtns.length > 0) {
        pinBtns.forEach(btn => {
            btn.addEventListener('click', () => handlePinInput(btn.dataset.val));
        });
    } else {
        console.error('[PIN] pinBtns not found!');
    }

    if (pinBackspace) {
        pinBackspace.addEventListener('click', () => {
            currentInputPin = currentInputPin.slice(0, -1);
            updatePinDots();
        });
    }

    // Кнопка "Удалить" — сброс всех данных (ПИН + грехи + заметки)
    if (pinClearBtn) {
        pinClearBtn.addEventListener('click', () => {
            console.log('[PIN] Clear button clicked - showing confirm modal');

            // Показываем модальное окно подтверждения сброса
            showConfirmModal(t('pinResetConfirm'), () => {
                console.log('[PIN] User confirmed full reset');

                // Очищаем все данные в localStorage
                localStorage.setItem('selectedSins', '[]');
                localStorage.setItem('personalReflections', '');
                localStorage.setItem('hashedPin', '');
                localStorage.setItem('pinEnabled', 'false');
                localStorage.setItem('biometricEnabled', 'false');
                localStorage.setItem('isUnlocked', 'false');

                // Сбрасываем переменные состояния
                isPinEnabled = false;
                hashedPin = '';
                selectedSins = [];
                personalNotes = '';
                isUnlocked = false;

                updatePrivacyUI();

                // Очищаем личные заметки в интерфейсе
                if (personalNotesArea) {
                    personalNotesArea.value = '';
                }

                // Обновляем отображение на вкладках
                renderCatalog();
                updateMyList();

                // Выключаем тумблер
                if (pinToggle) {
                    pinToggle.checked = false;
                }

                // Закрываем модальное окно ПИН
                closePinPad();

                // Показываем уведомление
                showToast(t('pinDisabled'));
            });
        });
    }

    if (pinCancel) {
        pinCancel.addEventListener('click', () => {
            const wasSetup = pinPadModal.classList.contains('setup-mode');

            // Если отменили процесс изменения ПИН — сбрасываем флаг
            if (isChangingPin) {
                isChangingPin = false;
                console.log('[PIN] Cancelled PIN change process');
            }

            closePinPad();

            // Если отменили настройку ПИН - выключаем тумблер
            if (wasSetup && !isChangingPin) {
                console.log('[PIN] Cancelled PIN setup - turning off toggle');
                if (pinToggle) pinToggle.checked = false;
                isPinEnabled = false;
                localStorage.setItem('pinEnabled', 'false');
                localStorage.setItem('hashedPin', '');
            } else {
                // Просто закрыли окно разблокировки
                if (pinToggle) pinToggle.checked = isPinEnabled;
            }
        });
    }

    // === Custom Confirm Modal Functions ===
    function showConfirmModal(message, onConfirm) {
        if (!confirmModal) return;

        confirmCallback = onConfirm;
        if (confirmMessage) {
            confirmMessage.textContent = message || t('pinAlreadySetConfirm');
        }

        // Показываем модалку
        confirmModal.classList.remove('hidden');
        confirmModal.classList.add('flex');
        console.log('[Confirm] Modal shown');
    }

    function hideConfirmModal() {
        if (!confirmModal) return;

        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
        confirmCallback = null;
        console.log('[Confirm] Modal hidden');
    }

    // Обработчики кнопок модалки
    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', () => {
            console.log('[Confirm] Yes clicked');
            if (confirmCallback) {
                confirmCallback();
            }
            hideConfirmModal();
        });
    }

    if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', () => {
            console.log('[Confirm] No clicked');
            hideConfirmModal();
        });
    }

    // Обработчик кнопки закрытия (X) на окне ввода ПИН
    if (pinPadCloseBtn) {
        pinPadCloseBtn.addEventListener('click', () => {
            console.log('[PIN] Close button clicked');
            closePinPad();
        });
    }

    // === СБРОС СОСТОЯНИЯ ПРИ ЗАПУСКЕ ===
    function resetPinStateIfNeeded() {
        const storedPinEnabled = localStorage.getItem('pinEnabled') === 'true';
        const storedHashedPin = localStorage.getItem('hashedPin');

        // Если ПИН включен в настройках, но хэш пуст - сбрасываем
        if (storedPinEnabled && !storedHashedPin) {
            console.log('[PIN] Reset: pinEnabled=true but hashedPin is empty');
            localStorage.setItem('pinEnabled', 'false');
            isPinEnabled = false;
        }

        // Синхронизируем переменные с localStorage
        isPinEnabled = storedPinEnabled && !!storedHashedPin;
        hashedPin = storedHashedPin || '';

        console.log('[PIN] After reset: isPinEnabled=', isPinEnabled, 'hashedPin=', hashedPin);
    }

    // Вызываем сброс при запуске (ДО объявления pinToggle)
    resetPinStateIfNeeded();

    // === ОБРАБОТЧИК TUMBLER'А ПИН-КОДА ===
    if (pinToggle) {
        console.log('[PIN] pinToggle found, isPinEnabled=', isPinEnabled, 'hashedPin=', hashedPin);

        // Устанавливаем начальное состояние тумблера — включен, если функция ПИН активна
        pinToggle.checked = isPinEnabled && !!hashedPin;
        console.log('[PIN] Initial toggle state:', pinToggle.checked);

        // Обработчик на change event
        pinToggle.addEventListener('change', (e) => {
            console.log('TUMBLER CLICKED! checked =', e.target.checked);
            console.log('[PIN] toggle changed:', e.target.checked, 'existingPin=', localStorage.getItem('hashedPin'));

            const existingPin = localStorage.getItem('hashedPin');

            if (e.target.checked) {
                // Пользователь хочет ВКЛЮЧИТЬ функцию ПИН-кода
                if (existingPin) {
                    // ПИН уже есть — просто включаем функцию
                    console.log('[PIN] Enabling PIN function (PIN already exists)');
                    isPinEnabled = true;
                    localStorage.setItem('pinEnabled', 'true');
                    updatePrivacyUI();
                    showToast(t('pinEnabled'));
                } else {
                    // ПИНа нет — открываем режим установки
                    e.target.checked = false; // Визуально выключаем обратно
                    console.log('[PIN] No PIN - opening setup modal');

                    openPinPad(true, () => {
                        // Это onSuccess колбэк
                        pinToggle.checked = true;
                        isPinEnabled = true;
                        localStorage.setItem('pinEnabled', 'true');
                        updatePrivacyUI();
                        console.log('[PIN] PIN setup success - toggle activated');
                    });
                }
            } else {
                // Пользователь хочет ВЫКЛЮЧИТЬ функцию ПИН-кода
                console.log('[PIN] Disabling PIN function');
                isPinEnabled = false;
                localStorage.setItem('pinEnabled', 'false');
                // Сбрасываем hashedPin при выключении функции
                hashedPin = '';
                localStorage.removeItem('hashedPin');

                updatePrivacyUI();

                showToast(t('pinDisabled'));
            }
        });
    } else {
        console.error('[PIN] pin-toggle element NOT FOUND in DOM!');
    }

    const changePinContainer = document.getElementById('change-pin-container');
    const changePinBtn = document.getElementById('change-pin-btn');

    function updatePrivacyUI() {
        const pinActive = isPinEnabled && hashedPin;

        // Показываем/скрываем кнопку "Изменить ПИН-код"
        if (changePinContainer) {
            changePinContainer.classList.toggle('hidden', !pinActive);
        }
    }

    updatePrivacyUI();
    // Обработчик кнопки "Изменить ПИН-код"
    if (changePinBtn) {
        changePinBtn.addEventListener('click', () => {
            console.log('[PIN] Opening PIN change modal');
            // Устанавливаем флаг изменения ПИН
            isChangingPin = true;
            // Сначала запрашиваем ввод старого ПИН для подтверждения
            openPinPad(false, () => {
                // После успешной проверки — открываем режим установки нового
                console.log('[PIN] Old PIN verified - opening new PIN setup');
                openPinPad(true, () => {
                    // Сбрасываем флаг после успешной установки
                    isChangingPin = false;
                    showToast(t('pinSuccess'));
                    console.log('[PIN] PIN changed successfully');
                });
            });
        });
    }

    // --- Experimental / Digital Mentor Logic ---
    const toggleDigitalMentor = document.getElementById('toggle-digital-mentor');
    if (toggleDigitalMentor) {
        toggleDigitalMentor.checked = isDigitalMentorEnabled;
        toggleDigitalMentor.addEventListener('change', (e) => {
            isDigitalMentorEnabled = e.target.checked;
            localStorage.setItem('digitalMentor', isDigitalMentorEnabled);
            if (isDigitalMentorEnabled) {
                alert('Эта функция находится в разработке. Скоро ИИ сможет анализировать ваши записи и давать советы святых отцов по вашей ситуации.');
            }
        });
    }

    // --- Preview Modal Logic ---
    function populatePreviewModal() {
        if (!previewContent) return;
        const data = getSinsData();

        previewDate.textContent = new Date().toLocaleDateString(currentLanguage === 'cs' ? 'ru' : currentLanguage, {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Use localized confessionIntro if updated in translations, otherwise fallback
        previewIntro.textContent = t('confessionIntro');

        let contentHtml = '<ul class="list-none p-0 m-0">';
        selectedSins.forEach((item) => {
            let sinText = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinText = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinText = item.text;
            }

            contentHtml += `
                <li class="mb-4 flex items-start gap-3">
                    <span class="font-bold">•</span>
                    <div>
                        <span class="block font-bold">${sinText}</span>
                        ${item.note ? `<span class="block italic text-sm mt-1 border-l-2 border-black/10 pl-3">${item.note}</span>` : ''}
                    </div>
                </li>
            `;
        });
        contentHtml += '</ul>';
        previewContent.innerHTML = contentHtml;

        if (personalNotes.trim()) {
            previewNotesSection.classList.remove('hidden');
            previewNotes.textContent = personalNotes;
        } else {
            previewNotesSection.classList.add('hidden');
        }
    }

    function openPreviewModal() {
        populatePreviewModal();
        previewModal.classList.remove('hidden');
        requestWakeLock();
    }

    function closePreviewModal() {
        previewModal.classList.add('hidden');
        releaseWakeLock();
    }

    if (printPdfBtn) {
        printPdfBtn.addEventListener('click', openPreviewModal);
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', closePreviewModal);
    }

    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) closePreviewModal();
        });
    }

    if (shareSheetBtn) {
        shareSheetBtn.addEventListener('click', shareConfession);
    }

    // --- Share Confession ---
    function buildShareText() {
        if (selectedSins.length === 0 && !personalNotes.trim()) return '';
        const data = getSinsData();
        const date = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });
        let lines = [`🕊 Моя исповедь — ${date}\n`];
        selectedSins.forEach(item => {
            let sinText = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinText = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinText = item.text;
            }
            lines.push(`• ${sinText}${item.note ? `\n  (${item.note})` : ''}`);
        });
        if (personalNotes.trim()) {
            lines.push(`\nЛичные заметки:\n${personalNotes.trim()}`);
        }
        return lines.join('\n');
    }

    async function shareConfession() {
        if (selectedSins.length === 0 && !personalNotes.trim()) return;
        const text = buildShareText();

        // Нативный шит (iOS Safari, Android Chrome, Capacitor)
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Моя исповедь', text });
                return;
            } catch (e) {
                if (e.name === 'AbortError') return; // пользователь закрыл
            }
        }

        // Fallback — показываем мессенджеры
        const encoded = encodeURIComponent(text);
        const messengers = [
            { name: 'Telegram',  icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg',  url: `https://t.me/share/url?url=&text=${encoded}` },
            { name: 'WhatsApp',  icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg',  url: `https://wa.me/?text=${encoded}` },
            { name: 'Viber',     icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/viber.svg',     url: `viber://forward?text=${encoded}` },
            { name: 'VK',        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/vk.svg',        url: `https://vk.com/share.php?comment=${encoded}` },
        ];

        const list = document.getElementById('messenger-share-list');
        list.innerHTML = messengers.map(m => `
            <a href="${m.url}" target="_blank" rel="noopener"
               class="flex flex-col items-center gap-2 active:scale-95 transition-all">
                <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center p-3">
                    <img src="${m.icon}" alt="${m.name}" class="w-8 h-8" style="filter:invert(0.3)">
                </div>
                <span class="text-[11px] font-semibold text-slate-600">${m.name}</span>
            </a>
        `).join('');

        document.getElementById('messenger-share-modal').classList.remove('hidden');
    }

    // --- PDF Generation ---
    async function generatePDF() {
        if (selectedSins.length === 0 && !personalNotes.trim()) return;

        // Create a temporary hidden container for PDF content
        const pdfContent = document.createElement('div');
        pdfContent.style.position = 'absolute';
        pdfContent.style.left = '-9999px';
        pdfContent.style.top = '0';
        pdfContent.style.width = '210mm'; // A4 Width
        pdfContent.style.minHeight = '297mm'; // A4 Height
        pdfContent.style.padding = '20mm';
        pdfContent.style.backgroundColor = '#ffffff';
        pdfContent.style.color = '#000000';
        pdfContent.style.fontFamily = '"Times New Roman", Times, serif';
        pdfContent.style.lineHeight = '1.6';

        // Styling for clean paper look (Strict B&W)
        const style = document.createElement('style');
        style.innerHTML = `
            .pdf-container { color: #000; font-family: "Times New Roman", serif; background: #fff; width: 100%; }
            .pdf-header { text-align: center; margin-bottom: 40px; }
            .pdf-title { font-size: 24pt; font-weight: bold; margin-bottom: 5px; }
            .pdf-date { font-size: 11pt; color: #000; margin-bottom: 20px; }
            .pdf-intro { font-size: 14pt; margin-bottom: 30px; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .pdf-list { list-style-type: none; padding: 0; }
            .pdf-item { margin-bottom: 15px; font-size: 13pt; display: flex; align-items: flex-start; }
            .pdf-bullet { margin-right: 12px; font-weight: bold; }
            .pdf-note { font-style: italic; color: #000; margin-left: 24px; font-size: 11pt; margin-top: 4px; display: block; }
            .pdf-personal-section { margin-top: 50px; padding-top: 15px; border-top: 1px solid #000; }
            .pdf-personal-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
            .pdf-personal-text { font-size: 13pt; line-height: 1.5; white-space: pre-wrap; }
        `;
        pdfContent.appendChild(style);

        const current_date = new Date().toLocaleDateString(currentLanguage === 'cs' ? 'ru' : currentLanguage, {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        let sinsListHtml = '';
        const data = getSinsData();
        selectedSins.forEach(item => {
            let sinText = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinText = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinText = item.text;
            }
            sinsListHtml += `
                <li class="pdf-item">
                    <span class="pdf-bullet">•</span>
                    <div>
                        <span>${sinText}</span>
                        ${item.note ? `<span class="pdf-note">${item.note}</span>` : ''}
                    </div>
                </li>
            `;
        });

        const personalSection = personalNotes.trim() ? `
            <div class="pdf-personal-section">
                <p class="pdf-personal-title">${t('personalReflections')}</p>
                <p class="pdf-personal-text">${personalNotes}</p>
            </div>
        ` : '';

        pdfContent.innerHTML += `
            <div class="pdf-container">
                <div class="pdf-header">
                    <div class="pdf-title">${t('pdfTitle')}</div>
                    <div class="pdf-date">${current_date}</div>
                </div>
                <div class="pdf-intro">${t('formulaText')}</div>
                <ul class="pdf-list">
                    ${sinsListHtml}
                </ul>
                ${personalSection}
            </div>
        `;

        document.body.appendChild(pdfContent);

        try {
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            const pdfBlob = pdf.output('blob');
            const fileName = 'moya-ispoved.pdf';

            // Android Share logic or Fallback download
            if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                await navigator.share({
                    files: [new File([pdfBlob], fileName, { type: 'application/pdf' })],
                    title: t('pdfTitle'),
                    text: t('pdfTitle')
                });
            } else {
                pdf.save(fileName);
            }
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Ошибка при создании PDF.');
        } finally {
            document.body.removeChild(pdfContent);
        }
    }

    // --- Prayers Reading Mode ---
    function updatePrayerProgress() {
        if (!prayerScrollArea || !prayerProgressBar) return;
        const scrolled = prayerScrollArea.scrollTop;
        const height = prayerScrollArea.scrollHeight - prayerScrollArea.clientHeight;
        const progress = height > 0 ? (scrolled / height) * 100 : 0;
        prayerProgressBar.style.width = `${progress}%`;
    }

    if (prayerScrollArea) {
        prayerScrollArea.addEventListener('scroll', updatePrayerProgress);
    }

    function openPrayersModal(prayerId) {
        if (!prayersReadingModal || !prayerContentArea) {
            console.error('[Prayer Modal] Missing modal or content area!');
            return;
        }

        // Force close PIN Pad if open
        if (pinPadModal) {
            pinPadModal.classList.add('hidden');
            pinPadModal.classList.remove('flex');
        }
        if (pinPadCloseBtn) {
            pinPadCloseBtn.classList.add('hidden');
            pinPadCloseBtn.style.display = 'none';
        }

        // Reset audio player state when opening new prayer
        if (currentGlobalAudio) {
            currentGlobalAudio.pause();
            currentGlobalAudio.src = '';
            currentGlobalAudio.dataset.loadedId = '';
        }
        currentPrayerIdInPlayer = null;
        isAudioPlaying = false;

        const prayer = prayersData[prayerId];
        if (!prayer) {
            console.error('[Prayer Modal] No prayer data found for:', prayerId);
            showToast('Ошибка: текст молитвы не найден');
            return;
        }

        let content = '';
        if (prayer.content) {
            content = prayer.content[currentLanguage] || prayer.content.ru || '';
        } else {
            // Support legacy structure if some items haven't been migrated yet
            const langData = prayersData[currentLanguage] || prayersData.ru;
            content = langData ? langData[prayerId] : '';
        }

        if (content) {
            prayerContentArea.innerHTML = content;

            // Determine Hero Image
            const heroImage = document.getElementById('prayer-hero-image');
            if (heroImage) {
                if (prayerId === 'repentanceCanon') {
                    heroImage.src = '/spasitel.jpg';
                } else if (prayerId === 'theotokosCanon') {
                    heroImage.src = '/theotokos.jpg';
                } else if (prayerId === 'guardianAngelCanon') {
                    heroImage.src = '/angel.jpg';
                } else if (prayerId === 'beforeCommunion') {
                    heroImage.src = '/56456454.jpg';
                } else if (prayerId === 'canons') {
                    heroImage.src = '/angel.jpg';
                } else {
                    heroImage.src = '/56456454.jpg';
                }

                console.log('[Prayer Modal] Hero image set:', heroImage.src);

                // Check if image loads
                heroImage.onload = () => {
                    console.log('[Prayer Modal] Hero image loaded successfully');
                };
                heroImage.onerror = () => {
                    console.error('[Prayer Modal] Hero image failed to load');
                };
            }

            // Hide header text - audio player shows in header instead
            // if (prayersModalHeaderText) {
            //     // Determine title from prayerId or data-t
            //     const titleKey = prayerId === 'canons' ? 'threeCanons' :
            //         prayerId === 'theotokosCanon' ? 'theotokosCanon' :
            //             prayerId === 'guardianAngelCanon' ? 'guardianAngelCanon' :
            //                 prayerId === 'repentanceCanon' ? 'repentanceCanon' :
            //                     (prayerId === 'beforeCommunion' ? 'beforeCommunion' : 'afterCommunion');
            //     prayersModalHeaderText.textContent = t(titleKey);
            // }
            // Показываем модальное окно с принудительными стилями
            prayersReadingModal.classList.remove('hidden');
            prayersReadingModal.classList.add('flex', 'modal-active');
            prayersReadingModal.style.display = 'flex';
            prayersReadingModal.style.visibility = 'visible';
            prayersReadingModal.style.opacity = '1';
            prayersReadingModal.style.zIndex = '99999';

            console.log('[Prayer Modal] Modal opened, classes:', prayersReadingModal.classList.toString());

            // === TELEPROMPTER - ВКЛЮЧЕН С АВТО-СКРЫТИЕМ ===
            const teleControls = document.getElementById('teleprompter-controls');
            const teleprompterContent = document.getElementById('teleprompter-content');

            if (teleControls) {
                // Сначала убеждаемся, что панель не скрыта через .hidden
                teleControls.classList.remove('hidden');
                
                // Сбрасываем возможные классы смещения
                teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
                
                // Force reflow
                void teleControls.offsetWidth;
                
                // 1. Сначала ПЛАВНО ВЫПЛЫВАЕТ КРУГ (translateX(150%) -> 0)
                teleControls.classList.add('visible');
                
                // 2. ПОСЛЕ ВЫПЛЫВАНИЯ (800мс) - РАСКРЫВАЕТСЯ
                setTimeout(() => {
                    if (teleprompterContent) {
                        teleprompterContent.classList.remove('opacity-0', 'max-h-0');
                        teleprompterContent.classList.add('opacity-100', 'max-h-96');
                    }
                    
                    // 3. После раскрытия ждем 4 секунды и уходим
                    if (typeof resetAutohideTimer === 'function') {
                        resetAutohideTimer();
                    }
                }, 800); 
            }

            // Ждем следующего кадра для правильного рендеринга
            requestAnimationFrame(() => {
                if (prayerScrollArea) {
                    prayerScrollArea.scrollTop = 0;

                    // Force height calculation
                    const modal = document.getElementById('prayers-reading-modal');
                    const header = modal?.querySelector('header');
                    if (modal && header) {
                        const modalHeight = modal.clientHeight;
                        const headerHeight = header.clientHeight;
                        const scrollAreaHeight = modalHeight - headerHeight;

                        prayerScrollArea.style.height = scrollAreaHeight + 'px';
                        prayerScrollArea.style.flex = 'none';
                    }

                    updatePrayerProgress();
                }

                // Запрашиваем wake lock асинхронно
                requestWakeLock();

                // Показываем аудио плеер
                showAudioPlayerBar(prayerId);
            });
        }
    }

    function closePrayersModal() {
        if (prayersReadingModal) {
            stopAutoscroll();
            
            // Очищаем таймер авто-скрытия
            if (typeof autohideTimer !== 'undefined' && autohideTimer) {
                clearTimeout(autohideTimer);
            }
            
            const teleControls = document.getElementById('teleprompter-controls');
            const teleprompterContent = document.getElementById('teleprompter-content');
            
            if (teleControls) {
                // Запускаем анимацию скрытия (300мс)
                teleControls.classList.remove('visible');
                
                // Если контент был развернут, сворачиваем его
                if (teleprompterContent) {
                    teleprompterContent.classList.remove('opacity-100', 'max-h-96');
                    teleprompterContent.classList.add('opacity-0', 'max-h-0');
                }
            }

            // Ждем завершения анимации (300мс) перед закрытием всего модального окна
            setTimeout(() => {
                prayersReadingModal.classList.add('hidden');
                prayersReadingModal.classList.remove('flex', 'modal-active');
                prayersReadingModal.style.removeProperty('z-index');
                releaseWakeLock();
                hideAudioPlayerBar();
            }, 300);
        }
    }

    prayerMenuItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const prayerId = btn.dataset.prayerId;
            openPrayersModal(prayerId);
        });
    });

    if (closePrayersModalBtn) {
        closePrayersModalBtn.addEventListener('click', () => {
            closePrayersModal();
        });
    }

    // Close on backdrop click
    if (prayersReadingModal) {
        prayersReadingModal.addEventListener('click', (e) => {
            if (e.target === prayersReadingModal) closePrayersModal();
        });
    }

    // --- Toast Notification ---
    function showToast(message) {
        // Remove existing toast if any
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] ' +
            'bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 ' +
            'text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl ' +
            'flex items-center gap-3 animate-fade-in-up';
        toast.innerHTML = `
            <span class="material-symbols-outlined text-primary text-lg">info</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Audio Player Bar Logic ---
    function toggleAudioPlayPause() {
        if (!currentGlobalAudio) return;

        // Если аудиоплеер УЖЕ играет, просто ставим на паузу и выходим
        if (!currentGlobalAudio.paused && currentGlobalAudio.dataset.loadedId === currentPrayerIdInPlayer) {
            currentGlobalAudio.pause();
            isAudioPlaying = false;
            if (audioPlayIcon) audioPlayIcon.textContent = 'play_arrow';
            return;
        }

        // Если же мы собираемся ВКЛЮЧИТЬ аудио — останавливаем всё остальное
        stopAllAudio();

        if (!currentGlobalAudio.src || currentGlobalAudio.dataset.loadedId !== currentPrayerIdInPlayer) {
            let audioUrl = '';
            if (currentPrayerIdInPlayer === 'repentanceCanon') {
                audioUrl = 'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/01-bulchuk_kanon_pokayannyy_ko_gospodu_iisusu_hristu.mp3';
            } else if (currentPrayerIdInPlayer === 'theotokosCanon') {
                audioUrl = 'https://pravoslavie-audio.com/wp-content/uploads/2020/12/kanon-molebnyj-ko-presvyatoj-bogoroditse.mp3';
            } else if (currentPrayerIdInPlayer === 'guardianAngelCanon') {
                audioUrl = 'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/03-bulchuk_kanon_angelu_hranitelyu.mp3';
            } else if (currentPrayerIdInPlayer === 'beforeCommunion') {
                audioUrl = 'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/32_ermakov-posledovanie-ko-svjatomu-prichashheniju.mp3';
            } else {
                showToast(t('audioPlaybackNotAvailable'));
                return;
            }

            console.log('[Audio Debug] Loading Audio URL:', audioUrl);
            currentGlobalAudio.src = audioUrl;
            currentGlobalAudio.dataset.loadedId = currentPrayerIdInPlayer;

            showToast("Загрузка аудио...");

            // One-time events
            if (!currentGlobalAudio.dataset.eventsSet) {
                currentGlobalAudio.addEventListener('timeupdate', () => {
                    let progress = 0;
                    let dur = currentGlobalAudio.duration;

                    // Fallbacks for streaming Infinity duration bugs
                    if (!dur || dur === Infinity) {
                        if (currentPrayerIdInPlayer === 'repentanceCanon') dur = 1011; // 16:51
                        else if (currentPrayerIdInPlayer === 'theotokosCanon') dur = 900; // ~15:00
                        else if (currentPrayerIdInPlayer === 'guardianAngelCanon') dur = 900; // ~15:00
                        else if (currentPrayerIdInPlayer === 'beforeCommunion') dur = 1500; // ~25:00
                        else dur = 1200; // Fallback 20 mins
                    }

                    if (dur > 0) {
                        progress = (currentGlobalAudio.currentTime / dur) * 100;
                    }
                    const progressEl = document.getElementById('audio-progress');
                    if (progressEl && !isNaN(progress)) progressEl.style.width = `${progress}%`;

                    const timeEl = document.getElementById('audio-time');
                    if (timeEl) {
                        const mins = Math.floor(currentGlobalAudio.currentTime / 60) || 0;
                        const secs = Math.floor(currentGlobalAudio.currentTime % 60) || 0;
                        const totalMins = Math.floor(dur / 60) || 0;
                        const totalSecs = Math.floor(dur % 60) || 0;
                        timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} / ${totalMins.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`;
                    }
                });

                if (audioProgressContainer) {
                    audioProgressContainer.addEventListener('click', (e) => {
                        let dur = currentGlobalAudio.duration;
                        if (!dur || dur === Infinity) {
                            if (currentPrayerIdInPlayer === 'repentanceCanon') dur = 1011;
                            else if (currentPrayerIdInPlayer === 'theotokosCanon') dur = 900;
                            else if (currentPrayerIdInPlayer === 'guardianAngelCanon') dur = 900;
                            else if (currentPrayerIdInPlayer === 'beforeCommunion') dur = 1500;
                            else dur = 1200;
                        }
                        const rect = audioProgressContainer.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const width = rect.width;
                        const percentage = clickX / width;
                        currentGlobalAudio.currentTime = dur * percentage;
                    });
                }

                currentGlobalAudio.addEventListener('ended', () => {
                    resetAudioPlayer();
                });

                currentGlobalAudio.addEventListener('error', (e) => {
                    if (!isAudioPlaying) return;

                    // Fallback to alternative URLs
                    if (currentPrayerIdInPlayer === 'repentanceCanon' && !currentGlobalAudio.src.includes('04-kanon-pokayanny.mp3')) {
                        currentGlobalAudio.src = '/04-kanon-pokayanny.mp3';
                        currentGlobalAudio.play();
                        return; // Stop here if fallback is started
                    } else if (currentPrayerIdInPlayer === 'theotokosCanon' && currentGlobalAudio.src.includes('pravoslavie-audio.com')) {
                        currentGlobalAudio.src = 'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/02-bulchuk_kanon_molebnyy_ko_presvyatoy_bogorodice.mp3';
                        currentGlobalAudio.play();
                        return;
                    }

                    // Only show toast if all fallbacks failed
                    const error = currentGlobalAudio.error;
                    let errorMsg = "Ошибка загрузки";
                    if (error) {
                        switch (error.code) {
                            case 1: errorMsg = "Загрузка прервана"; break;
                            case 2: errorMsg = "Ошибка сети"; break;
                            case 3: errorMsg = "Ошибка декодирования"; break;
                            case 4: errorMsg = "Файл не найден"; break;
                        }
                    }
                    showToast(errorMsg);
                });
                currentGlobalAudio.dataset.eventsSet = "true";
            }
        }

        if (currentGlobalAudio.paused) {
            console.log('[Audio Debug] Attempting to play...');
            currentGlobalAudio.play().then(() => {
                console.log('[Audio Debug] Play started successfully');
                showToast("Воспроизведение...");
            }).catch(err => {
                console.error('[Audio Player] Play error:', err);
                showToast("Ошибка воспроизведения: " + err.message);
            });
            isAudioPlaying = true;
            if (audioPlayIcon) audioPlayIcon.textContent = 'pause';
        } else {
            console.log('[Audio Debug] Pausing...');
            currentGlobalAudio.pause();
            isAudioPlaying = false;
            if (audioPlayIcon) audioPlayIcon.textContent = 'play_arrow';
        }
    }

    function startAudioProgress() { }
    function stopAudioProgress() { }

    function resetAudioPlayer() {
        if (currentGlobalAudio) {
            currentGlobalAudio.pause();
            currentGlobalAudio.src = "";
            currentGlobalAudio.dataset.loadedId = "";
        }
        isAudioPlaying = false;
        audioProgressValue = 0;
        if (audioPlayIcon) audioPlayIcon.textContent = 'play_arrow';
        if (audioProgress) audioProgress.style.width = '0%';
        const timeEl = document.getElementById('audio-time');
        if (timeEl) timeEl.textContent = '00:00 / 00:00';
    }

    function showAudioPlayerBar(prayerId) {
        currentPrayerIdInPlayer = prayerId;
        if (audioPlayerBar) {
            audioPlayerBar.classList.remove('hidden');
            audioPlayerBar.classList.add('flex');
            audioPlayerBar.style.setProperty('display', 'flex', 'important');
        }
    }

    function hideAudioPlayerBar() {
        if (audioPlayerBar) {
            audioPlayerBar.classList.add('hidden');
            audioPlayerBar.classList.remove('flex');
        }
        resetAudioPlayer();
    }

    if (audioPlayPauseBtn) {
        audioPlayPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAudioPlayPause();
        });
    }

    // --- Teleprompter / Auto-scroll Logic ---
    const teleControls = document.getElementById('teleprompter-controls');
    const toggleAutoscrollBtn = document.getElementById('toggle-autoscroll-btn');
    const autoscrollSpeedInput = document.getElementById('autoscroll-speed');
    const autoscrollIcon = document.getElementById('autoscroll-icon');
    const speedUpBtn = document.getElementById('speed-up-btn');
    const speedDownBtn = document.getElementById('speed-down-btn');

    let autohideTimer = null;
    const AUTOHIDE_DELAY = 4000;

    function resetAutohideTimer() {
        if (!teleControls) return;
        const teleprompterContent = document.getElementById('teleprompter-content');
        
        if (!teleControls.classList.contains('visible')) {
            teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
            teleControls.classList.add('visible');
            setTimeout(() => {
                if (teleprompterContent) {
                    teleprompterContent.classList.remove('opacity-0', 'max-h-0');
                    teleprompterContent.classList.add('opacity-100', 'max-h-96');
                }
                startAutoHideTimer();
            }, 800);
        } else {
            if (teleprompterContent) {
                teleprompterContent.classList.remove('opacity-0', 'max-h-0');
                teleprompterContent.classList.add('opacity-100', 'max-h-96');
            }
            startAutoHideTimer();
        }

        function startAutoHideTimer() {
            if (autohideTimer) clearTimeout(autohideTimer);
            autohideTimer = setTimeout(() => {
                if (teleprompterContent) {
                    teleprompterContent.classList.remove('opacity-100', 'max-h-96');
                    teleprompterContent.classList.add('opacity-0', 'max-h-0');
                }
                setTimeout(() => {
                    if (teleControls) {
                        teleControls.classList.remove('visible');
                        teleControls.classList.add('translate-x-[80%]', 'opacity-0');
                    }
                }, 800);
            }, AUTOHIDE_DELAY);
        }
    }

    if (teleControls) {
        const teleprompterContent = document.getElementById('teleprompter-content');
        toggleAutoscrollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isAutoscrolling) {
                stopAutoscroll();
                teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
            } else {
                startAutoscroll();
                // При запуске скрываем панель для удобства чтения
                teleControls.classList.add('translate-x-[80%]', 'opacity-0');
            }
        });
        
        const handleSpeedChange = () => {
            teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
            if (autoscrollSpeedInput) {
                const val = parseInt(autoscrollSpeedInput.value);
                // Unified: Map 0-100 to 0-50 pixels per second
                autoscrollSpeed = (val / 100) * 50; 
            }
            resetAutohideTimer();
        };

        speedUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (autoscrollSpeedInput) {
                autoscrollSpeedInput.value = Math.min(100, parseInt(autoscrollSpeedInput.value) + 10);
                handleSpeedChange();
            }
        });
        speedDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (autoscrollSpeedInput) {
                autoscrollSpeedInput.value = Math.max(0, parseInt(autoscrollSpeedInput.value) - 10);
                handleSpeedChange();
            }
        });
        if (autoscrollSpeedInput) {
            autoscrollSpeedInput.addEventListener('input', handleSpeedChange);
        }
        teleControls.addEventListener('mouseenter', () => {
            teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
            if (teleprompterContent) {
                teleprompterContent.classList.remove('opacity-0', 'max-h-0');
                teleprompterContent.classList.add('opacity-100', 'max-h-96');
            }
            resetAutohideTimer();
        });
        teleControls.addEventListener('touchstart', () => {
            teleControls.classList.remove('translate-x-[80%]', 'opacity-0');
            if (teleprompterContent) {
                teleprompterContent.classList.remove('opacity-0', 'max-h-0');
                teleprompterContent.classList.add('opacity-100', 'max-h-96');
            }
            resetAutohideTimer();
        }, { passive: true });
    }
    // --- Teleprompter Scrolling Logic ---

    function getActiveScrollContainer() {
        console.log('[Teleprompter] getActiveScrollContainer called');
        console.log('[Teleprompter] prayersReadingModal hidden:', prayersReadingModal.classList.contains('hidden'));
        console.log('[Teleprompter] prayerScrollArea:', prayerScrollArea);
        if (!prayersReadingModal.classList.contains('hidden')) {
            console.log('[Teleprompter] Returning prayerScrollArea');
            return prayerScrollArea;
        }
        if (!readingModeModal.classList.contains('hidden')) {
            console.log('[Teleprompter] Returning readingModeModal scroll area');
            return readingModeModal.querySelector('.overflow-y-auto');
        }
        console.log('[Teleprompter] No active container found');
        return null;
    }

    function smoothAutoscroll(timestamp) {
        if (!isAutoscrolling) return;

        if (!lastAutoscrollTimestamp) lastAutoscrollTimestamp = timestamp;
        const deltaTime = (timestamp - lastAutoscrollTimestamp) / 1000;
        lastAutoscrollTimestamp = timestamp;

        const container = getActiveScrollContainer();
        if (container) {
            // Накапливаем дробную часть в аккумуляторе
            preciseScrollTop += autoscrollSpeed * deltaTime;

            // Берём целую часть для прокрутки
            const scrollAmount = Math.floor(preciseScrollTop);
            if (scrollAmount >= 1) {
                container.scrollTop += scrollAmount;  // ИСПРАВЛЕНО: += вместо =
                preciseScrollTop -= scrollAmount;
            }

            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
                stopAutoscroll();
            }
        }
        autoscrollRequestId = requestAnimationFrame(smoothAutoscroll);
    }

    function startAutoscroll() {
        console.log('[Teleprompter] startAutoscroll called');
        if (isAutoscrolling) {
            console.log('[Teleprompter] Already scrolling');
            return;
        }
        const container = getActiveScrollContainer();
        console.log('[Teleprompter] Active container:', container);
        if (!container) {
            console.log('[Teleprompter] No container found');
            return;
        }

        isAutoscrolling = true;
        lastAutoscrollTimestamp = 0;
        // Сбрасываем аккумулятор в 0 при запуске
        preciseScrollTop = 0;
        if (autoscrollIcon) autoscrollIcon.textContent = 'pause';
        console.log('[Teleprompter] Starting scroll with speed:', autoscrollSpeed);
        autoscrollRequestId = requestAnimationFrame(smoothAutoscroll);
    }

    function stopAutoscroll() {
        isAutoscrolling = false;
        if (autoscrollRequestId) cancelAnimationFrame(autoscrollRequestId);
        autoscrollRequestId = null;
        if (autoscrollIcon) autoscrollIcon.textContent = 'play_arrow';
    }

    // === Обработчик для синхронизации при ручном скролле ===
    function setupManualScrollSync(container) {
        if (!container) return;
        let scrollTimeout = null;

        container.addEventListener('scroll', () => {
            // Если автоскролл активен - временно останавливаем при ручном скролле
            if (isAutoscrolling) {
                // Не вызываем stopAutoscroll(), просто приостанавливаем
                preciseScrollTop = 0; // Сбрасываем аккумулятор
            }

            // Сбрасываем таймер
            clearTimeout(scrollTimeout);

            // Если пользователь не скроллит 1 секунду - возобновляем автоскролл
            if (isAutoscrolling) {
                scrollTimeout = setTimeout(() => {
                    // Сбрасываем timestamp, чтобы не было скачка
                    lastAutoscrollTimestamp = 0;
                    preciseScrollTop = 0;
                }, 1000);
            }
        }, { passive: true });
    }

    // Initialization: set initial speed based on HTML input value
    if (autoscrollSpeedInput) {
        const initialValue = parseInt(autoscrollSpeedInput.value) || 30;
        autoscrollSpeed = (initialValue / 100) * 50;
    }

    // Auto-pause was disabled at user request: the text will now keep moving during manual scroll.
    const setupAutoPause = (container) => {
        if (!container) return;
        ['mousedown', 'touchstart', 'wheel'].forEach(evt => {
            container.addEventListener(evt, (e) => {
                // We no longer call stopAutoscroll() here to allow continuous movement
            }, { passive: true });
        });
    };

    // Initialize auto-pause for prayer modal
    setupAutoPause(prayerScrollArea);
    setupManualScrollSync(prayerScrollArea);

    // Initialize auto-pause for reading mode modal
    const readingModeScrollArea = readingModeModal.querySelector('.overflow-y-auto');
    setupAutoPause(readingModeScrollArea);
    setupManualScrollSync(readingModeScrollArea);

    // === Church Tab - Orthodox Calendar (Azbyka.ru API) ===
    let currentDate = new Date();
    // currentNavDate объявлена глобально в начале файла

    // Format date for day display (e.g., "19")
    function formatDateDay(date) {
        return date.getDate().toString();
    }

    // Format month for display (e.g., "марта")
    function formatDateMonth(date) {
        const month = date.toLocaleDateString('ru-RU', { month: 'long' });
        // Convert month from nominative to genitive case
        const monthGenitiveMap = {
            'январь': 'января',
            'февраль': 'февраля',
            'март': 'марта',
            'апрель': 'апреля',
            'май': 'мая',
            'июнь': 'июня',
            'июль': 'июля',
            'август': 'августа',
            'сентябрь': 'сентября',
            'октябрь': 'октября',
            'ноябрь': 'ноября',
            'декабрь': 'декабря'
        };
        const monthGenitive = monthGenitiveMap[month] || month;
        return monthGenitive;
    }

    // Format date for display (e.g., "19 марта")
    function formatDateShort(date) {
        return `${formatDateDay(date)} ${formatDateMonth(date)}`;
    }

    // Get Old Style (Julian) date - Julian calendar is 13 days behind Gregorian in 20th-21st centuries
    function getOldStyleDate(date) {
        const oldStyleDate = new Date(date);
        oldStyleDate.setDate(date.getDate() - 13);
        return formatDateShort(oldStyleDate);
    }

    // Get Old Style day
    function getOldStyleDay(date) {
        const oldStyleDate = new Date(date);
        oldStyleDate.setDate(date.getDate() - 13);
        return formatDateDay(oldStyleDate);
    }

    // Get Old Style month
    function getOldStyleMonth(date) {
        const oldStyleDate = new Date(date);
        oldStyleDate.setDate(date.getDate() - 13);
        return formatDateMonth(oldStyleDate);
    }

    // Format full date (e.g., "Среда, 14 августа 2024")
    function formatDateFull(date) {
        const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleDateString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        // Capitalize first letter
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} ${month} ${year}`;
    }

    // Get date string in YYYY-MM-DD format
    function getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Render icon of the day
    function renderIconOfDay(iconUrl, holyDayTitle, saintsIcons = []) {
        const container = document.getElementById('icon-of-day-container');
        const iconBlock = document.getElementById('icon-of-day-block');

        // Скрываем блок с иконами святых
        if (iconBlock) iconBlock.style.display = 'none';
        if (container) container.innerHTML = '';
    }

    // Render fasting tag - упрощённая логика: ПОСТ или МЯСОЕД
    function renderFastingTag(fastingType, fastingDescription) {
        const tag = document.getElementById('fasting-tag');
        const tagText = document.getElementById('fasting-tag-text');
        if (!tag || !tagText) return;

        // Определяем, есть ли пост: если fastingType не 'no_fast' или есть описание поста
        const isFast = fastingType && fastingType !== 'no_fast' && fastingType !== 'unknown';

        // Проверяем описание на наличие слов "пост"
        const hasFastInDescription = fastingDescription &&
            (fastingDescription.toLowerCase().includes('пост') ||
                fastingDescription.toLowerCase().includes('fast'));

        const isFastDay = isFast || hasFastInDescription;

        if (isFastDay) {
            // ПОСТ - красный/бордовый цвет
            tag.className = 'px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border bg-red-900/50 text-red-400 border-red-500/30';
            tagText.textContent = t('fastStatus') || 'ПОСТ';
        } else {
            // МЯСОЕД - зелёный цвет
            tag.className = 'px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border bg-emerald-900/50 text-emerald-400 border-emerald-500/30';
            tagText.textContent = t('meatEaterStatus') || 'МЯСОЕД';
        }
    }

    // Парсинг текста чтений из API
    function parseReadingsText(text) {
        console.log('[parseReadingsText] Input:', text);

        if (!text) return [];

        const readings = [];

        // Декодируем HTML-сущности
        function decodeHtml(html) {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }

        // Очищаем текст от HTML тегов, сущностей, переносов строк и лишних пробелов
        let cleanText = decodeHtml(text)
            .replace(/&ndash;/g, '–')
            .replace(/&mdash;/g, '—')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]*>/g, '')  // Удаляем все HTML теги
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        console.log('[parseReadingsText] Clean text:', cleanText);

        // Определяем тип службы по префиксу
        const serviceTypes = {
            'утр.': 'Утреня',
            'утр': 'Утреня',
            'лит.': 'Литургия',
            'лит': 'Литургия',
            'мчч.': 'Мученики',
            'мчч': 'Мученики',
            'мч.': 'Мученик',
            'мч': 'Мученик',
            'за упокой': 'За упокой',
            'на 6-м часе': 'На 6-м часе',
            'на веч.': 'На вечерне',
            'на веч': 'На вечерне',
            'веч.': 'На вечерне',
            'веч': 'На вечерне'
        };

        // Разбиваем текст на части по точкам, но не после сокращений служб
        // Используем более умное разбиение: точка + пробел + заглавная буква (не после утр/лит/мчч и т.д.)
        const parts = cleanText.split(/(?<!\bутр|лит|мчч|мч|веч)\.\s+/i);

        console.log('[parseReadingsText] Parts:', parts);

        let currentServiceType = '';

        for (let part of parts) {
            part = part.trim();
            if (!part) continue;

            // Разбиваем часть на подчасти по ". " где следующая буква заглавная
            const subParts = part.split(/\.\s+(?=[А-Я])/);

            for (let subPart of subParts) {
                subPart = subPart.trim();
                if (!subPart) continue;

                // Для каждой подчасти заново определяем тип службы
                let partServiceType = currentServiceType;
                
                // Проверяем, есть ли тип службы в начале части
                for (const [abbrev, fullName] of Object.entries(serviceTypes)) {
                    const regex = new RegExp(`^${abbrev.replace('.', '\\.')}\\s*[:–-]\\s*`, 'i');
                    if (regex.test(subPart)) {
                        partServiceType = fullName;
                        currentServiceType = fullName; // Сохраняем для следующих чтений
                        subPart = subPart.replace(regex, '');
                        break;
                    }
                }

                // Используем regex для поиска всех вхождений чтений
                // Паттерн: Книга Глава:Стихи (зач. Номер) или Книга.Глава:Стихи (зач. Номер)
                // Примеры: "Ис.37:33–38:6", "Быт.13:12–18", "Притч.14:27–15:4"
                // Поддерживаем диапазон глав: 37:33–38:6
                // Используем более гибкий паттерн для тире
                const regex = /([А-Яа-я]+)\.?(\d+):(\d+)\s*[-–—]\s*(\d+):?(\d+)?(?:\s*\(\s*зач\s*\.?\s*(\d+)\s*\))?/g;
                let match;

                while ((match = regex.exec(subPart)) !== null) {
                    const [, book, chapter1, startVerse, chapter2, endVerse, zachalo] = match;

                    console.log('[parseReadingsText] Match found:', { book, chapter1, startVerse, chapter2, endVerse, zachalo });

                    // Если есть вторая глава, используем её для конца диапазона
                    const endVerseFinal = endVerse || chapter2;
                    const chapter = chapter1;

                    // Определяем тип чтения и полное название книги
                    let type = partServiceType || 'Апостол';
                    const bookLower = book.toLowerCase();

                    // Если тип службы не установлен, определяем по книге
                    if (!partServiceType) {
                        if (['мк', 'мф', 'лк', 'ин'].some(b => bookLower.includes(b))) {
                            type = 'Евангелие';
                        } else {
                            type = 'Апостол';
                        }
                    }

                    // Расшифровка сокращений книг
                    const bookNames = {
                        'Ис.': 'Книга пророка Исаии',
                        'Ис': 'Книга пророка Исаии',
                        'Быт.': 'Книга Бытия',
                        'Быт': 'Книга Бытия',
                        'Притч.': 'Книга Притчей Соломоновых',
                        'Притч': 'Книга Притчей Соломоновых',
                        'Евр.': 'Послание к Евреям',
                        'Евр': 'Послание к Евреям',
                        'Мк.': 'Евангелие от Марка',
                        'Мк': 'Евангелие от Марка',
                        'Мф.': 'Евангелие от Матфея',
                        'Мф': 'Евангелие от Матфея',
                        'Лк.': 'Евангелие от Луки',
                        'Лк': 'Евангелие от Луки',
                        'Ин.': 'Евангелие от Иоанна',
                        'Ин': 'Евангелие от Иоанна',
                        'Кор.': 'Послание к Коринфянам',
                        'Кор': 'Послание к Коринфянам',
                        '1Кор.': '1-е послание к Коринфянам',
                        '1Кор': '1-е послание к Коринфянам',
                        '2Кор.': '2-е послание к Коринфянам',
                        '2Кор': '2-е послание к Коринфянам',
                        '1Фес.': '1-е послание к Фессалоникийцам',
                        '1Фес': '1-е послание к Фессалоникийцам',
                        '2Фес.': '2-е послание к Фессалоникийцам',
                        '2Фес': '2-е послание к Фессалоникийцам',
                        '1Тим.': '1-е послание к Тимофею',
                        '1Тим': '1-е послание к Тимофею',
                        '2Тим.': '2-е послание к Тимофею',
                        '2Тим': '2-е послание к Тимофею',
                        '1Пет.': '1-е послание Петра',
                        '1Пет': '1-е послание Петра',
                        '2Пет.': '2-е послание Петра',
                        '2Пет': '2-е послание Петра',
                        '1Ин.': '1-е послание Иоанна',
                        '1Ин': '1-е послание Иоанна',
                        '2Ин.': '2-е послание Иоанна',
                        '2Ин': '2-е послание Иоанна',
                        '3Ин.': '3-е послание Иоанна',
                        '3Ин': '3-е послание Иоанна',
                        'Гал.': 'Послание к Галатам',
                        'Гал': 'Послание к Галатам',
                        'Еф.': 'Послание к Ефесянам',
                        'Еф': 'Послание к Ефесянам',
                        'Флп.': 'Послание к Филиппийцам',
                        'Флп': 'Послание к Филиппийцам',
                        'Кол.': 'Послание к Колоссянам',
                        'Кол': 'Послание к Колоссянам',
                        'Рим.': 'Послание к Римлянам',
                        'Рим': 'Послание к Римлянам',
                        'Деян.': 'Деяния святых Апостолов',
                        'Деян': 'Деяния святых Апостолов',
                        'Иак.': 'Послание Иакова',
                        'Иак': 'Послание Иакова',
                        'Иуд.': 'Послание Иуды',
                        'Иуд': 'Послание Иуды',
                        'Тит.': 'Послание к Титу',
                        'Тит': 'Послание к Титу',
                        'Флм.': 'Послание к Филимону',
                        'Флм': 'Послание к Филимону',
                        'Откр.': 'Откровение Иоанна Богослова',
                        'Откр': 'Откровение Иоанна Богослова'
                    };

                    // Получаем полное название книги
                    let fullBookName = book;
                    let bookAbbrev = book;
                    for (const [abbrev, fullName] of Object.entries(bookNames)) {
                        if (book === abbrev || book === abbrev.replace('.', '')) {
                            fullBookName = fullName;
                            bookAbbrev = abbrev.replace('.', '');
                            break;
                        }
                    }

                    // Форматируем текст: Полное название, глава, стихи (зачало опционально)
                    const formattedText = zachalo
                        ? `${fullBookName}, ${zachalo} зач., глава ${parseInt(chapter)}, стихи ${startVerse}–${endVerseFinal}`
                        : `${fullBookName}, глава ${parseInt(chapter)}, стихи ${startVerse}–${endVerseFinal}`;

                    // Генерируем MP3 ссылку для Азбуки.ru
                    // Формат: https://azbyka.ru/audio/audio1/zachala/In/In.20.19.mp3
                    let mp3Url = null;
                    if (zachalo) {
                        // Для зачал используем формат с номером зачала
                        mp3Url = `https://azbyka.ru/audio/audio1/zachala/${bookAbbrev}/${bookAbbrev}.${zachalo}.mp3`;
                    }

                    readings.push({
                        type: type,
                        text: formattedText,
                        link_mp3: mp3Url,
                        audio: mp3Url,
                        mp3_remote: mp3Url
                    });
                }
            }
        }

        console.log('[parseReadingsText] Result:', readings);

        return readings;
    }

    // Преобразование арабских цифр в римские
    function toRoman(num) {
        const roman = {
            M: 1000, CM: 900, D: 500, CD: 400,
            C: 100, XC: 90, L: 50, XL: 40,
            X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let result = '';
        for (const [key, value] of Object.entries(roman)) {
            const count = Math.floor(num / value);
            num %= value;
            result += key.repeat(count);
        }
        return result;
    }

    // Универсальный сброс UI всех медиа-элементов
    function resetAllMediaUI() {
        // Сброс чтений
        document.querySelectorAll('.reading-row').forEach(row => {
            const icon = row.querySelector('.play-btn span');
            const hasAudio = row.dataset.hasAudio === 'true';
            if (icon) icon.textContent = hasAudio ? 'play_arrow' : 'volume_up';
            const progress = row.querySelector('.audio-progress');
            if (progress) progress.classList.add('opacity-0');
        });

        // Сброс Псалма 50
        const p50Btn = document.getElementById('psalm-50-play-btn');
        if (p50Btn) p50Btn.querySelector('span').textContent = 'play_arrow';
        const p50Progress = document.getElementById('psalm-50-audio-progress-container');
        if (p50Progress) p50Progress.classList.add('hidden');
    }

    // Логика аудио для Псалма 50
    function initPsalm50Audio() {
        const playBtn = document.getElementById('psalm-50-play-btn');
        const progressContainer = document.getElementById('psalm-50-audio-progress-container');
        const progressBar = document.getElementById('psalm-50-audio-progress-bar');

        if (!playBtn) return;

        playBtn.addEventListener('click', () => {
            const audioUrl = t('psalm50AudioUrl');

            // Если этот псалом уже играет — ставим на паузу
            if (window.currentAudio && window.currentAudio._isPsalm50 && !window.currentAudio.paused) {
                window.currentAudio.pause();
                playBtn.querySelector('span').textContent = 'play_arrow';
                return;
            }

            // Если ВКЛЮЧАЕМ псалом — останавливаем всё остальное
            stopAllAudio();

            // Запускаем аудио Псалма 50
            const audio = new Audio(audioUrl);
            audio._isPsalm50 = true;
            window.currentAudio = audio;

            if (progressContainer) progressContainer.classList.remove('hidden');
            playBtn.querySelector('span').textContent = 'pause';

            audio.play().catch(err => {
                console.error("Psalm 50 audio play error:", err);
                resetAllMediaUI();
            });

            audio.addEventListener('timeupdate', () => {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${percent}%`;
            });

            audio.addEventListener('ended', () => {
                resetAllMediaUI();
                window.currentAudio = null;
            });

            audio.addEventListener('play', () => { playBtn.querySelector('span').textContent = 'pause'; });
            audio.addEventListener('pause', () => { playBtn.querySelector('span').textContent = 'play_arrow'; });
        });
    }

    // Render readings
    // Render readings (Stitch_1 Style)
    function getDeclension(number, titles) {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    function renderReadings(readings, texts) {
        const container = document.getElementById('readings-container');
        const readingsCount = document.getElementById('readings-count');
        if (!container) return;

        // Если readings пустой, собираем из всех записей texts
        if ((!readings || readings.length === 0) && texts && texts.length > 0) {
            const allParsed = [];
            texts.forEach(textEntry => {
                if (!textEntry.text) return;
                const parsedReadings = parseReadingsText(textEntry.text);
                if (parsedReadings.length > 0) {
                    // Привязываем MP3 ссылки из refs если количество совпадает
                    if (textEntry.refs && textEntry.refs.length === parsedReadings.length) {
                        parsedReadings.forEach((r, i) => {
                            const ref = textEntry.refs[i];
                            const bookPart = ref.split('.')[0];
                            r.link_mp3 = 'https://azbyka.ru/audio/audio1/zachala/' + bookPart + '/' + ref + '.mp3';
                        });
                    }
                    allParsed.push(...parsedReadings);
                }
            });
            if (allParsed.length > 0) readings = allParsed;
        }

        // Расшифровка сокращений книг
        const bookNames = {
            'Евр.': 'Послание к Евреям',
            'Евр': 'Послание к Евреям',
            'Мк.': 'Евангелие от Марка',
            'Мк': 'Евангелие от Марка',
            'Мф.': 'Евангелие от Матфея',
            'Мф': 'Евангелие от Матфея',
            'Лк.': 'Евангелие от Луки',
            'Лк': 'Евангелие от Луки',
            'Ин.': 'Евангелие от Иоанна',
            'Ин': 'Евангелие от Иоанна',
            '1Кор.': '1-е послание к Коринфянам',
            '1Кор': '1-е послание к Коринфянам',
            '2Кор.': '2-е послание к Коринфянам',
            '2Кор': '2-е послание к Коринфянам',
            '1Фес.': '1-е послание к Фессалоникийцам',
            '2Фес.': '2-е послание к Фессалоникийцам',
            '1Тим.': '1-е послание к Тимофею',
            '2Тим.': '2-е послание к Тимофею',
            '1Пет.': '1-е послание Петра',
            '2Пет.': '2-е послание Петра',
            '1Ин.': '1-е послание Иоанна',
            '2Ин.': '2-е послание Иоанна',
            '3Ин.': '3-е послание Иоанна',
            'Гал.': 'Послание к Галатам',
            'Гал': 'Послание к Галатам',
            'Еф.': 'Послание к Ефесянам',
            'Еф': 'Послание к Ефесянам',
            'Флп.': 'Послание к Филиппийцам',
            'Флп': 'Послание к Филиппийцам',
            'Кол.': 'Послание к Колоссянам',
            'Кол': 'Послание к Колоссянам',
            'Рим.': 'Послание к Римлянам',
            'Рим': 'Послание к Римлянам',
            'Деян.': 'Деяния святых Апостолов',
            'Деян': 'Деяния святых Апостолов',
            'Иак.': 'Послание Иакова',
            'Иуд.': 'Послание Иуды',
            'Тит.': 'Послание к Титу',
            'Флм.': 'Послание к Филимону',
            'Откр.': 'Откровение Иоанна Богослова'
        };

        function formatReadingText(text) {
            if (!text) return '';

            let formatted = text;

            // Заменяем "зач." на "зачало"
            formatted = formatted.replace(/(\d+)\s*зач\./g, '$1 зачало');

            // Форматируем главы и стихи
            const chapterVerseMatch = formatted.match(/,\s*([IVX]+),\s*(\d+)\s*[–-]\s*(\d+)/);
            if (chapterVerseMatch) {
                const [, chapter, startVerse, endVerse] = chapterVerseMatch;
                formatted = formatted.replace(
                    /,\s*[IVX]+,\s*\d+\s*[–-]\s*\d+/,
                    ', глава ' + chapter + ', стихи ' + startVerse + '–' + endVerse
                );
            }

            return formatted;
        }

        // Очищаем контейнер
        container.innerHTML = '';

        if (!readings || readings.length === 0) {
            container.innerHTML = '<div class="text-center text-on-surface-variant/60"><span class="material-symbols-outlined text-4xl mb-3 block">auto_stories</span><p class="text-sm font-label font-bold uppercase tracking-widest">' + (t('noReadings') || 'Чтений на этот день не запланировано') + '</p></div>';
            return;
        }

        // Drop cap letters for each reading type
        const dropCapLetters = {
            'Апостольское чтение': 'А',
            'Евангельское чтение': 'Е',
            'Утреня': 'У',
            'Литургия': 'Л',
            'На 6-м часе': 'Н',
            'На вечерне': 'Н'
        };

        let html = '<div class="space-y-12">';

        readings.forEach((reading, index) => {
            const audioUrl = reading.link_mp3 || reading.audio || reading.mp3_remote;
            const formattedText = formatReadingText(reading.text || reading);
            const dropCapLetter = dropCapLetters[reading.type] || (reading.type ? reading.type[0].toUpperCase() : '');
            const typeLabel = reading.type.charAt(0).toUpperCase() + reading.type.slice(1);

            html += `
            <div class="group relative transition-all duration-300 hover:translate-x-2 flex items-start justify-between gap-4">
                <span class="absolute -left-6 -top-6 font-headline text-6xl transition-opacity duration-300 group-hover:opacity-30" style="color: var(--color-primary); opacity: 0.2; pointer-events: none;">${dropCapLetter}</span>
                <div class="space-y-2 flex-1">
                    <span class="font-label text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 group-hover:text-primary" style="color: var(--color-secondary);">${typeLabel}</span>
                    <h5 class="font-headline text-2xl transition-colors duration-300 group-hover:text-primary" style="color: var(--color-on-surface);">${formattedText}</h5>
                </div>
                ${audioUrl ? `<div class="flex flex-col items-center gap-1">
                    <button class="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-all duration-300 active:scale-95 hover:bg-primary/20 hover:scale-110 reading-audio-btn" data-audio-url="${audioUrl}" data-reading-index="${index}">
                        <span class="material-symbols-outlined text-xl">volume_up</span>
                    </button>
                    <span class="reading-audio-time text-[9px] font-bold text-primary font-label" data-reading-index="${index}"></span>
                </div>` : ''}
            </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Обновляем счётчик чтений
        if (readingsCount) {
            const count = readings.length || 0;
            const countText = count + ' ' + getDeclension(count, ['чтение', 'чтения', 'чтений']);
            readingsCount.textContent = countText;
        }

        // Показываем/скрываем кнопку "Читать на исповеди" в церковной вкладке
        updateChurchReadButtonVisibility();

        // Добавляем обработчики для кнопок воспроизведения
        setTimeout(() => {
            document.querySelectorAll('.reading-audio-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    const audioUrl = this.getAttribute('data-audio-url');
                    const icon = this.querySelector('.material-symbols-outlined');
                    const readingIndex = this.getAttribute('data-reading-index');

                    if (!audioUrl) return;

                    // Если это же аудио уже играет — ставим на паузу
                    if (window.currentAudio && window.currentAudio._readingUrl === audioUrl && !window.currentAudio.paused) {
                        window.currentAudio.pause();
                        icon.textContent = 'volume_up';
                        updateMediaNotification(false);
                        return;
                    }

                    // Если это же аудио на паузе — продолжаем воспроизведение
                    if (window.currentAudio && window.currentAudio._readingUrl === audioUrl && window.currentAudio.paused) {
                        window.currentAudio.play().catch(err => {
                            console.error('[Reading Audio] Play error:', err);
                            icon.textContent = 'volume_up';
                        });
                        icon.textContent = 'pause';
                        updateMediaNotification(true);
                        return;
                    }

                    // Останавливаем всё остальное аудио
                    stopAllAudio();
                    
                    // Скрываем время на всех кнопках
                    document.querySelectorAll('.reading-audio-time').forEach(el => {
                        el.textContent = '';
                    });

                    // Запускаем новое аудио
                    const container = this.closest('.group');
                    const titleEl = container ? container.querySelector('h5') : null;
                    const readingTitle = titleEl ? titleEl.textContent.trim() : 'Отрывок из Писания';

                    const audio = new Audio(audioUrl);
                    audio._readingUrl = audioUrl;
                    window.currentAudio = audio;
                    window.currentReadingAudioIcon = icon;

                    icon.textContent = 'pause';

                    // Функция форматирования времени
                    function formatTime(seconds) {
                        const mins = Math.floor(seconds / 60);
                        const secs = Math.floor(seconds % 60);
                        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    }

                    // Обновляем время при загрузке метаданных
                    audio.addEventListener('loadedmetadata', () => {
                        // Не показываем время пока не началось воспроизведение
                    });

                    // Обновляем время воспроизведения (показываем сколько осталось)
                    audio.addEventListener('timeupdate', () => {
                        const totalTime = audio.duration || 0;
                        const currentTime = audio.currentTime;
                        const remainingTime = totalTime - currentTime;
                        const timeEl = document.querySelector(`.reading-audio-time[data-reading-index="${readingIndex}"]`);
                        if (timeEl && totalTime > 0 && currentTime > 0) {
                            timeEl.textContent = `- ${formatTime(remainingTime)}`;
                        }
                    });

                    audio.play().catch(err => {
                        console.error('[Reading Audio] Play error:', err);
                        icon.textContent = 'volume_up';
                        hideMediaNotification();
                    });
                    showMediaNotification(readingTitle, true);

                    audio.addEventListener('ended', () => {
                        icon.textContent = 'volume_up';
                        window.currentAudio = null;
                        window.currentReadingAudioIcon = null;
                        hideMediaNotification();
                        // Скрываем время
                        const timeEl = document.querySelector(`.reading-audio-time[data-reading-index="${readingIndex}"]`);
                        if (timeEl) timeEl.textContent = '';
                    });

                    audio.addEventListener('error', () => {
                        console.error('[Reading Audio] Error loading:', audioUrl);
                        icon.textContent = 'volume_off';
                        window.currentAudio = null;
                        window.currentReadingAudioIcon = null;
                        hideMediaNotification();
                    });
                });
            });
        }, 100);
    }

    // Расшифровка сокращений святости
    function expandSanctityType(sanctityType) {
        if (!sanctityType) return '';

        const sanctityMap = {
            'прпп.': 'преподобные',
            'прп.': 'преподобный',
            'сщмчч.': 'священномученики',
            'сщмч.': 'священномученик',
            'мчч.': 'мученики',
            'мч.': 'мученик',
            'мцц.': 'мученицы',
            'мц.': 'мученица',
            'свтт.': 'святители',
            'свт.': 'святитель',
            'св.': 'святой',
            'свв.': 'святые',
            'вввв.': 'великомученики',
            'вмчч.': 'великомученики',
            'вмч.': 'великомученик',
            'вмцц.': 'великомученицы',
            'вмц.': 'великомученица',
            'блжж.': 'блаженные',
            'блж.': 'блаженный',
            'испп.': 'исповедники',
            'исп.': 'исповедник',
            'прав.': 'праведный',
            'правв.': 'праведные',
            'апст.': 'апостолы',
            'ап.': 'апостол',
            'прор.': 'пророк',
            'прорр.': 'пророки',
            'сщиспп.': 'священноисповедники',
            'сщисп.': 'священноисповедник',
            'прмчч.': 'преподобномученики',
            'прмч.': 'преподобномученик',
            'прмцц.': 'преподобномученицы',
            'прмц.': 'преподобномученица',
            'равноап.': 'равноапостольный',
            'блгв.': 'благоверный',
            'вел. кн.': 'великий князь',
            'блгв. вел. кн.': 'благоверный великий князь',
            'кн.': 'князь',
            'кнг.': 'княгиня',
            'црц.': 'царица',
            'цр.': 'царь'
        };

        // Проверяем точное совпадение (с учётом регистра)
        const lowerSanctity = sanctityType.toLowerCase();
        if (sanctityMap[lowerSanctity]) {
            return sanctityMap[lowerSanctity];
        }

        // Особые случаи с дополнительными словами
        // "ап. от 70-ти" → "апостол от 70-ти"
        if (lowerSanctity.includes('ап. от 70')) {
            return sanctityType.replace(/ап\./gi, 'апостол');
        }

        // Если не нашли, возвращаем как есть
        return sanctityType;
    }

    // Преобразование имени из именительного падежа в родительный
    function toGenitiveCase(name) {
        if (!name) return '';

        let result = name.trim();

        // Словарь имён для склонения (именительный -> родительный)
        const firstNames = {
            'Афана́сий': 'Афана́сия',
            'Ана́стасия': 'Ана́стасии',
            'Григо́рий': 'Григо́рия',
            'Кири́лл': 'Кири́лла',
            'Влади́мир': 'Влади́мира',
            'Ла́зарь': 'Ла́заря',
            'Феофила́кт': 'Феофила́кта',
            'Феодори́т': 'Феодори́та',
            'Доме́тий': 'Доме́тия',
            'Иоа́нн': 'Иоа́нна',
            'Ерм': 'Е́рма'
        };

        // Словарь прозваний для склонения
        const surnames = {
            'Никомидийский': 'Никомидийского',
            'Муромский': 'Муромского',
            'Мурманский': 'Мурманского',
            'Олонецкий': 'Олонецкого',
            'Персиянин': 'Персиянина',
            'Знаменский': 'Знаменского',
            'Ушков': 'Ушкова',
            'Антиохийский': 'Антиохийского',
            'Филиппопольский': 'Филиппопольского'
        };

        // Склоняем первое имя (берём первое слово до пробела или запятой)
        const firstWord = result.split(/[\s,]/)[0];
        for (const [nom, gen] of Object.entries(firstNames)) {
            // Сравниваем без учёта ударений
            if (firstWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
                nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
                result = result.replace(firstWord, gen);
                break;
            }
        }

        // Склоняем прозвания
        for (const [nom, gen] of Object.entries(surnames)) {
            const regex = new RegExp(nom.replace(/[\u0300-\u036f]/g, ''), 'gi');
            result = result.replace(regex, gen);
        }

        // Исповедник -> Исповедника
        result = result.replace(/Испове[д́]?дник/gi, (match) => {
            if (match.includes('́')) {
                return 'Испове́дника';
            }
            return 'Исповедника';
        });

        return result;
    }

    // Render Saints Memory (Stitch_1 Style)
    function renderSaints(saints) {
        const container = document.getElementById('saints-container');
        const countEl = document.getElementById('saints-count');
        if (!container) return;

        if (countEl) {
            const countText = saints.length + ' ' + getDeclension(saints.length, ['святой', 'святых', 'святых']);
            countEl.textContent = countText;
        }

        if (!saints || saints.length === 0) {
            container.innerHTML = `
                <div class="col-span-full p-8 text-center" style="color: var(--color-on-surface-variant); opacity: 0.6;">
                    <span class="material-symbols-outlined text-4xl mb-3 block">auto_stories</span>
                    <p class="text-sm font-label font-bold uppercase tracking-widest">Нет данных о святых</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        saints.forEach((saint, index) => {
            const saintName = saint.title || saint.name || 'Без имени';
            const sanctityType = saint.type_of_sanctity || '';
            const expandedSanctity = expandSanctityType(sanctityType);
            const genitiveName = toGenitiveCase(saintName);
            const fullName = expandedSanctity ? expandedSanctity + ' ' + genitiveName : genitiveName;

            // Get saint icon
            const iconUrl = saint.imgs && saint.imgs.length > 0
                ? (saint.imgs[0].preview_absolute_url_2x || saint.imgs[0].original_absolute_url)
                : null;

            const saintCard = document.createElement('div');
            saintCard.className = 'group bg-surface-container-low p-4 rounded-lg flex items-center gap-4 hover:bg-surface-container-lowest transition-colors border border-transparent hover:border-outline-variant/20';

            saintCard.innerHTML = `
                <div class="w-16 h-20 overflow-hidden bg-surface-container-highest flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                    ${iconUrl
                    ? '<img class="w-full h-full object-contain" src="' + iconUrl + '" alt="' + saintName + '">'
                    : '<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1; color: var(--color-primary-container);">person</span>'
                }
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-serif font-bold text-sm leading-tight" style="color: var(--color-on-surface); word-break: break-word;">${fullName}</h4>
                    <p class="font-label text-[10px] uppercase tracking-widest mt-0.5" style="color: var(--color-on-surface-variant); opacity: 0.7;">${expandedSanctity || 'Святой'}</p>
                </div>
            `;

            container.appendChild(saintCard);
        });
    }

    // Render date slider (fallback function)
    function renderDateSlider(date) {
        console.log('[renderDateSlider] Rendering for:', date);
        // Fallback: just update the date display
        const cardDateDay = document.getElementById('card-date-day');
        const cardDateMonth = document.getElementById('card-date-month');
        if (cardDateDay) cardDateDay.textContent = formatDateDay(date);
        if (cardDateMonth) cardDateMonth.textContent = formatDateMonth(date);
    }

    // Load calendar data for specific date
    async function loadCalendarDate(date) {
        const dateStr = getDateString(date);

        // Обновляем дату и день недели сразу (не зависит от API)
        const cardDateDay = document.getElementById('card-date-day');
        const cardDateMonth = document.getElementById('card-date-month');
        if (cardDateDay) cardDateDay.textContent = formatDateDay(date);
        if (cardDateMonth) cardDateMonth.textContent = formatDateMonth(date);

        const dayOfWeek = document.getElementById('day-of-week');
        const isSunday = date.getDay() === 0;
        if (dayOfWeek) {
            const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
            dayOfWeek.textContent = days[date.getDay()];
            dayOfWeek.style.color = isSunday ? '#ef4444' : '';
        }
        if (cardDateDay) cardDateDay.style.color = isSunday ? '#ef4444' : '';
        if (cardDateMonth) cardDateMonth.style.color = isSunday ? '#ef4444' : '';

        // Вспомогательные функции прогресс-бара кэша
        function showProgress(pct, label) {
            const wrap = document.getElementById('cache-progress-wrap');
            const bar = document.getElementById('cache-progress-bar');
            const pctEl = document.getElementById('cache-progress-pct');
            const lblEl = document.getElementById('cache-progress-label');
            if (!wrap) return;
            wrap.classList.remove('hidden');
            if (bar) bar.style.width = pct + '%';
            if (pctEl) pctEl.textContent = pct + '%';
            if (lblEl && label) lblEl.textContent = label;
        }
        function hideProgress() {
            const wrap = document.getElementById('cache-progress-wrap');
            if (wrap) {
                showProgress(100, 'Сохранено в кэш');
                setTimeout(() => wrap.classList.add('hidden'), 1200);
            }
        }

        showProgress(10, 'Загрузка данных...');

        try {
            const response = await fetch(`https://azbyka.ru/days/api/day/${dateStr}.json`);
            if (!response.ok) throw new Error('API error');
            showProgress(40, 'Получены данные...');
            const data = await response.json();
            showProgress(70, 'Обработка чтений...');

            // Update Old Style Date (day and month separately)
            const oldStyleDateDay = document.getElementById('old-style-date-day');
            const oldStyleDateMonth = document.getElementById('old-style-date-month');
            if (oldStyleDateDay) oldStyleDateDay.textContent = getOldStyleDay(date);
            if (oldStyleDateMonth) oldStyleDateMonth.textContent = getOldStyleMonth(date);

            // Update Sedmitsa & Fasting Info
            const sedmitsaText = document.getElementById('sedmitsa-text');
            const fastingToneText = document.getElementById('fasting-tone-text');
            const holidayTitleEl = document.getElementById('holiday-title-text');
            const holidayTitle = data.holidays?.find(h => h.title)?.title?.replace(/<[^>]*>/g, '') || '';
            const roundWeek = (data.fasting?.round_week || '').replace(/<[^>]*>/g, '');

            if (holidayTitleEl) {
                if (holidayTitle) {
                    holidayTitleEl.textContent = holidayTitle;
                    holidayTitleEl.classList.remove('hidden');
                } else {
                    holidayTitleEl.textContent = '';
                    holidayTitleEl.classList.add('hidden');
                }
            }

            // Красный цвет даты в праздник или воскресенье
            const dateColor = (holidayTitle || isSunday) ? '#ef4444' : '';
            if (cardDateDay) cardDateDay.style.color = dateColor;
            if (cardDateMonth) cardDateMonth.style.color = dateColor;
            if (sedmitsaText) {
                const isDuplicate = holidayTitle && roundWeek && roundWeek.includes(holidayTitle.split('.')[0]);
                sedmitsaText.textContent = isDuplicate ? '' : roundWeek;
            }

            const memorialEl = document.getElementById('memorial-text');
            if (memorialEl) {
                const fastingWeeks = (data.fasting?.weeks || '').replace(/<[^>]*>/g, '').trim();
                const isMemorial = /родительская|Радоница|поминовение/i.test(fastingWeeks);
                if (isMemorial && fastingWeeks) {
                    memorialEl.textContent = '† ' + fastingWeeks;
                    memorialEl.classList.remove('hidden');
                } else {
                    memorialEl.textContent = '';
                    memorialEl.classList.add('hidden');
                }
            }

            if (fastingToneText) {
                const fastingInfo = [];
                let fastingType = data.fasting?.type || data.fasting?.fasting || '';
                const voice = data.fasting?.voice || null;
                const NON_FAST_TYPES = ['no_fast', 'not_fasting', 'unknown', ''];

                // Праздники, в которые разрешается рыба даже в пост
                const FISH_FEAST_URIS = [
                    'blagoveshchenie-presvjatoj-bogorodicy', // Благовещение
                    'vhod-gospoden-v-ierusalim',             // Вербное воскресенье
                    'vxod-gospoden-v-ierusalim',
                ];
                const holidays = data.holidays || [];
                const hasFishFeast = holidays.some(h =>
                    FISH_FEAST_URIS.includes(h.uri) ||
                    (h.title && /благовещение|вход господень/i.test(h.title))
                );
                if (hasFishFeast && fastingType && !NON_FAST_TYPES.includes(fastingType)) {
                    fastingType = 'fish_fast';
                }

                if (fastingType && !NON_FAST_TYPES.includes(fastingType)) {
                    const fastingLabels = {
                        'fish_fast':   'Постный день. 🐟 Рыба разрешена',
                        'strict_fast': 'Строгий пост',
                        'milk_fast':   'Постный день. Молочная пища разрешена',
                        'full_fast':   'Полный пост (без пищи)',
                        'fast':        'Постный день',
                        'fasting':     'Постный день',
                    };
                    fastingInfo.push(fastingLabels[fastingType] || 'Постный день');
                }
                if (voice) {
                    fastingInfo.push(`Глас ${voice}`);
                }
                fastingToneText.textContent = fastingInfo.join('. ');
            }

            // Vigil Block
            const vigilBlock = document.getElementById('vigil-block');
            if (vigilBlock) {
                if (data.service && data.service.toLowerCase().includes('бдение')) {
                    vigilBlock.classList.remove('hidden');
                } else {
                    vigilBlock.classList.add('hidden');
                }
            }

            // Saints Short List
            const saintsEl = document.getElementById('saints-short-list');
            if (saintsEl) {
                // Формируем полные имена с типом святости в родительном падеже
                const names = (data.saints || data.memory || []).map(s => {
                    if (s.type_of_sanctity && s.title) {
                        // Используем type_of_sanctity (прп., сщмч., мч. и т.д.)
                        const sanctityType = s.type_of_sanctity;
                        const expandedSanctity = expandSanctityType(sanctityType);
                        const genitiveName = toGenitiveCase(s.title);
                        return `${expandedSanctity} ${genitiveName}`;
                    } else if (s.title) {
                        return s.title;
                    } else if (s.name) {
                        return s.name;
                    } else {
                        return s;
                    }
                }).slice(0, 3);
                saintsEl.textContent = names.length > 0 ? names.join(', ') + (names.length < (data.saints?.length || 0) ? '...' : '.') : '';
            }

            // Fasting Pill
            const fastingPillText = document.getElementById('fasting-pill-text');
            if (fastingPillText) {
                let fastType = data.fasting?.type || data.fasting?.fasting || '';
                const NON_FAST_PILL = ['no_fast', 'not_fasting', 'unknown', ''];
                const roundWeek = data.fasting?.round_week || '';
                // Переопределяем тип поста при праздниках с рыбой
                const holidaysList = data.holidays || [];
                const hasFishFeastPill = holidaysList.some(h =>
                    ['blagoveshchenie-presvjatoj-bogorodicy', 'vhod-gospoden-v-ierusalim', 'vxod-gospoden-v-ierusalim'].includes(h.uri) ||
                    (h.title && /благовещение|вход господень/i.test(h.title))
                );
                if (hasFishFeastPill && fastType && !NON_FAST_PILL.includes(fastType)) {
                    fastType = 'fish_fast';
                }
                const fastingPillLabels = {
                    'fish_fast':   '🐟 РЫБА',
                    'strict_fast': 'СТРОГИЙ ПОСТ',
                    'milk_fast':   'МОЛОКО',
                    'full_fast':   'ПОЛНЫЙ ПОСТ',
                    'fast':        'ПОСТ',
                    'fasting':     'ПОСТ',
                };
                if (fastType === 'fish_fast') {
                    fastingPillText.textContent = '🐟 РЫБА';
                } else if (roundWeek) {
                    fastingPillText.textContent = roundWeek.replace(/<[^>]*>/g, '').split('.')[0].toUpperCase();
                } else if (!NON_FAST_PILL.includes(fastType)) {
                    fastingPillText.textContent = fastingPillLabels[fastType] || 'ПОСТ';
                } else {
                    fastingPillText.textContent = 'МЯСОЕД';
                }
            }

            // Tone Pill
            const tonePillText = document.getElementById('tone-pill-text');
            if (tonePillText) {
                tonePillText.textContent = data.voice ? `Глас ${data.voice}` : 'Без гласа';
            }

            // Debug: log API response for icon
            console.log('[Calendar] API Response:', {
                image: data.image,
                icon: data.icon,
                description: data.description,
                texts: data.texts
            });

            console.log('[Calendar] texts[0].text:', data.texts?.[0]?.text);

            // --- Редактирование: Улучшенная логика извлечения иконки ---
            let dayIconUrl = null;

            // 1. Приоритет праздникам
            if (data.holidays && data.holidays.length > 0) {
                const holiday = data.holidays.find(h => h.imgs && h.imgs.length > 0);
                if (holiday) dayIconUrl = holiday.imgs[0].original_absolute_url;
            }

            // 2. Иконы Божией Матери
            if (!dayIconUrl && data.ikons && data.ikons.length > 0) {
                const ikon = data.ikons.find(i => i.imgs && i.imgs.length > 0);
                if (ikon) dayIconUrl = ikon.imgs[0].original_absolute_url;
            }

            // 3. Святые дня
            if (!dayIconUrl && data.saints && data.saints.length > 0) {
                const saint = data.saints.find(s => s.imgs && s.imgs.length > 0);
                if (saint) dayIconUrl = saint.imgs[0].original_absolute_url;
            }

            // Fallback на старые поля, если вдруг появятся
            if (!dayIconUrl) dayIconUrl = data.image || data.icon;

            // Собираем иконы святых (по одной иконе от каждого святого)
            const saintsIcons = [];
            if (data.saints && data.saints.length > 0) {
                data.saints.forEach(saint => {
                    if (saint.imgs && saint.imgs.length > 0) {
                        // Берём первую икону в высоком качестве (2x)
                        saintsIcons.push(saint.imgs[0].preview_absolute_url_2x || saint.imgs[0].original_absolute_url);
                    }
                });
            }

            renderIconOfDay(dayIconUrl, data.description, saintsIcons);

            console.log('[Calendar] API readings:', data.readings);
            console.log('[Calendar] API texts:', data.texts);

            renderSaints(data.saints || data.memory || []);

            // Собираем все отрывки из всех texts
            const allTexts = data.texts || [];
            const allReadings = [];
            allTexts.forEach(entry => {
                if (!entry.text) return;
                const parsed = parseReadingsText(entry.text);
                if (parsed.length > 0) {
                    if (entry.refs && entry.refs.length === parsed.length) {
                        parsed.forEach((r, i) => {
                            const ref = entry.refs[i];
                            r.link_mp3 = 'https://azbyka.ru/audio/audio1/zachala/' + ref.split('.')[0] + '/' + ref + '.mp3';
                        });
                    }
                    allReadings.push(...parsed);
                }
            });

            // Показываем каждый отрывок пошагово в прогресс-баре
            const total = allReadings.length || 1;
            let saved = 0;
            showProgress(0, `Сохранение отрывков: 0 / ${allReadings.length}`);

            function saveNext() {
                if (saved >= allReadings.length) {
                    // Сохраняем только нужные поля — без изображений
                    const textsSlim = (data.texts || []).map(t => ({
                        text: t.text || '',
                        refs: t.refs || [],
                        type: t.type
                    }));
                    const saintsSlim = (data.saints || data.memory || []).map(s => ({
                        title: s.title || '',
                        name: s.name || '',
                        type_of_sanctity: s.type_of_sanctity || ''
                    }));
                    try {
                        localStorage.setItem('day_cache_' + dateStr, JSON.stringify({
                            texts: textsSlim,
                            saints: saintsSlim,
                            ts: Date.now()
                        }));
                    } catch (e) {
                        console.error('[Cache] Ошибка сохранения:', e);
                    }
                    hideProgress();
                    return;
                }
                const r = allReadings[saved];
                saved++;
                const pct = Math.round((saved / total) * 100);
                const readingLabel = r.text ? r.text.split(',')[0] : 'отрывок ' + saved;

                // Предзагружаем MP3 — SW сохранит в azbyka-audio-cache
                if (r.link_mp3) {
                    showProgress(pct, `Аудио: ${readingLabel} (${saved}/${allReadings.length})`);
                    fetch(r.link_mp3, { mode: 'no-cors' })
                        .catch(() => {})
                        .finally(() => setTimeout(saveNext, 80));
                } else {
                    showProgress(pct, `${readingLabel} (${saved}/${allReadings.length})`);
                    setTimeout(saveNext, 80);
                }
            }
            saveNext();

            renderReadings(data.readings || [], data.texts || []);

        } catch (error) {
            console.error('[Calendar] Error:', error);
            const wrap = document.getElementById('cache-progress-wrap');
            if (wrap) wrap.classList.add('hidden');

            // Пробуем загрузить из кэша
            try {
                const raw = localStorage.getItem('day_cache_' + dateStr);
                if (raw) {
                    const cached = JSON.parse(raw);
                    showProgress(100, 'Загружено из кэша');
                    setTimeout(() => {
                        const w = document.getElementById('cache-progress-wrap');
                        if (w) w.classList.add('hidden');
                    }, 1200);
                    renderReadings([], cached.texts || []);
                    renderSaints(cached.saints || []);
                } else {
                    // Нет кэша и нет интернета
                    showOfflineMessage();
                }
            } catch {
                showOfflineMessage();
            }
        }
    }

    function showOfflineMessage() {
        // Блок календарной информации (седмица, пост)
        const sedmitsaText = document.getElementById('sedmitsa-text');
        const fastingToneText = document.getElementById('fasting-tone-text');
        const holidayTitleEl = document.getElementById('holiday-title-text');
        const memorialEl = document.getElementById('memorial-text');
        if (sedmitsaText) sedmitsaText.textContent = 'Нет подключения к интернету';
        if (fastingToneText) fastingToneText.textContent = '';
        if (holidayTitleEl) { holidayTitleEl.textContent = ''; holidayTitleEl.classList.add('hidden'); }
        if (memorialEl) { memorialEl.textContent = ''; memorialEl.classList.add('hidden'); }

        // Блок чтений дня
        const container = document.getElementById('readings-container');
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <span class="material-symbols-outlined text-5xl" style="color: var(--color-text-muted); opacity: 0.5;">wifi_off</span>
                    <p class="font-bold text-base" style="color: var(--color-text-muted);">Нет интернета</p>
                    <p class="text-sm" style="color: var(--color-text-muted); opacity: 0.7;">Данные за этот день ещё не сохранены в кэш. Откройте этот день при наличии интернета.</p>
                </div>`;
        }
        const readingsCount = document.getElementById('readings-count');
        if (readingsCount) readingsCount.textContent = '';
    }

    // Initialize calendar with today's date
    async function loadChurchToday() {
        currentNavDate = new Date();
        currentCalendarDate = new Date(currentNavDate);
        await loadCalendarDate(currentNavDate);
        if (typeof renderCalendar === 'function') {
            renderCalendar(currentCalendarDate);
        }
    }

    // Navigation handlers
    const prevDateBtn = document.getElementById('prev-date-btn');
    const nextDateBtn = document.getElementById('next-date-btn');
    const dateDisplayBtn = document.getElementById('date-display-btn');
    const calendarModal = document.getElementById('date-picker-modal');
    const calPrevMonthBtn = document.getElementById('date-picker-prev-month');
    const calNextMonthBtn = document.getElementById('date-picker-next-month');
    const calTodayBtn = document.getElementById('date-picker-today-btn');
    const calCloseBtn = document.getElementById('date-picker-close-btn');

    let currentCalendarDate = new Date();
    const liturgicalCache = {};

    function fetchMonthData(year, month) {
        const key = `${year}-${month}`;
        if (liturgicalCache[key]) return;

        liturgicalCache[key] = { status: 'loading', days: {} };
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let fetched = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = getDateString(date);

            fetch(`https://azbyka.ru/days/api/day/${dateStr}.json`)
                .then(res => res.json())
                .then(data => {
                    const fastingType = data.fasting?.type || data.fasting?.fasting || '';
                    const NON_FAST = ['no_fast', 'not_fasting', 'unknown', ''];
                    const isFast = !NON_FAST.includes(fastingType);

                    const roundWeek = (data.fasting?.round_week || '').replace(/<[^>]*>/g, '');
                    const fastingWeeks = (data.fasting?.weeks || '').replace(/<[^>]*>/g, '');
                    const isBrightWeek = roundWeek.includes('Светл') && !roundWeek.includes('Воскресение');
                    const isMemorial = /родительская|Радоница|поминовение/i.test(roundWeek + ' ' + fastingWeeks);

                    liturgicalCache[key].days[d] = {
                        isFast: isFast,
                        isHoliday: (data.holidays && data.holidays.length > 0),
                        isBrightWeek: isBrightWeek,
                        isMemorial: isMemorial
                    };
                })
                .catch(() => { })
                .finally(() => {
                    fetched++;
                    if (fetched === daysInMonth) {
                        liturgicalCache[key].status = 'done';
                        if (currentCalendarDate.getMonth() === month && currentCalendarDate.getFullYear() === year) {
                            renderCalendar(currentCalendarDate);
                        }
                    }
                });
        }
    }

    function openCalendarModal() {
        if (!calendarModal) return;
        currentCalendarDate = new Date(currentNavDate);
        renderCalendar(currentCalendarDate);
        calendarModal.classList.remove('hidden');
    }

    function closeCalendarModal() {
        if (calendarModal) {
            calendarModal.classList.add('hidden');
        }
    }

    function renderCalendar(viewDate) {
        const calGrid = document.getElementById('date-picker-days');
        const calMonthYear = document.getElementById('date-picker-month-year');
        if (!calGrid || !calMonthYear) return;

        const monthName = viewDate.toLocaleDateString('ru-RU', { month: 'long' });
        calMonthYear.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + viewDate.getFullYear();

        calGrid.innerHTML = '';

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        let firstDayOfWeek = firstDay.getDay();
        if (firstDayOfWeek === 0) firstDayOfWeek = 7;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Prev month padding
        for (let i = firstDayOfWeek - 1; i > 0; i--) {
            const day = prevMonthLastDay - i + 1;
            const cell = document.createElement('div');
            cell.className = 'calendar-day other-month';
            const span = document.createElement('span');
            span.textContent = day;
            cell.appendChild(span);
            calGrid.appendChild(cell);
        }

        const today = new Date();
        const cacheKey = `${year}-${month}`;

        // Trigger background fetch for this month
        fetchMonthData(year, month);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === currentNavDate.toDateString();

            const cell = document.createElement('div');
            const isCellSunday = date.getDay() === 0;
            cell.className = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isCellSunday ? 'is-sunday' : ''}`;

            // Дни особого поминовения усопших 2026 (month - 0-based)
            const MEMORIAL_2026 = [
                [1, 14],  // 14 фев — Мясопустная родительская суббота
                [2,  7],  // 7 мар — 2-я Великопостная
                [2, 14],  // 14 мар — 3-я Великопостная
                [2, 21],  // 21 мар — 4-я Великопостная
                [3, 21],  // 21 апр — Радоница
                [4, 30],  // 30 мая — Троицкая родительская суббота
                [10, 7],  // 7 ноя — Димитриевская родительская суббота
            ];

            // 1. Try to use API data from Cache
            if (liturgicalCache[cacheKey] && liturgicalCache[cacheKey].days[day]) {
                const api = liturgicalCache[cacheKey].days[day];
                if (api.isFast) cell.classList.add('has-fast');
                if (api.isHoliday) cell.classList.add('has-holiday');
                if (api.isBrightWeek) cell.classList.add('bright-week');
                if (api.isMemorial) cell.classList.add('has-memorial');
            } else {
                // 2. Fallback: Simulation for 2026 (until API data loads)
                if (year === 2026) {
                    if (month === 3 && day === 12) {
                        cell.classList.add('important');
                        cell.classList.add('has-holiday');
                    }
                    if (month === 3 && day >= 13 && day <= 18) {
                        cell.classList.add('bright-week');
                    }
                    if (MEMORIAL_2026.some(([m, d2]) => m === month && d2 === day)) {
                        cell.classList.add('has-memorial');
                    }
                    if (((month === 2) || (month === 1 && day >= 23) || (month === 3 && day <= 11))) {
                        cell.classList.add('has-fast');
                    } else if (!(month === 3 && day >= 13 && day <= 19) && [3, 5].includes(date.getDay())) {
                        cell.classList.add('has-fast');
                    }
                } else if ([3, 5].includes(date.getDay())) {
                    cell.classList.add('has-fast');
                }
            }

            const span = document.createElement('span');
            span.textContent = day;
            cell.appendChild(span);

            cell.addEventListener('click', () => {
                currentNavDate = new Date(year, month, day);
                localStorage.setItem('selectedDate', currentNavDate.toISOString());
                loadCalendarDate(currentNavDate);
                closeCalendarModal();
            });

            calGrid.appendChild(cell);
        }
    }

    // Modal Interaction Listeners
    if (calPrevMonthBtn) {
        calPrevMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
            renderCalendar(currentCalendarDate);
        });
    }

    if (calNextMonthBtn) {
        calNextMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
            renderCalendar(currentCalendarDate);
        });
    }

    if (calTodayBtn) {
        calTodayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentNavDate = new Date();
            currentCalendarDate = new Date();
            localStorage.setItem('selectedDate', currentNavDate.toISOString());
            loadCalendarDate(currentNavDate);
            closeCalendarModal();
        });
    }

    if (calCloseBtn) {
        calCloseBtn.addEventListener('click', closeCalendarModal);
    }

    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) closeCalendarModal();
        });
    }

    if (dateDisplayBtn) {
        dateDisplayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCalendarModal();
        });
    }

    if (prevDateBtn) {
        prevDateBtn.addEventListener('click', () => {
            currentNavDate.setDate(currentNavDate.getDate() - 1);
            localStorage.setItem('selectedDate', currentNavDate.toISOString());
            loadCalendarDate(currentNavDate);
            // Sync calendar view if needed
            if (currentCalendarDate.getMonth() !== currentNavDate.getMonth()) {
                currentCalendarDate = new Date(currentNavDate);
                renderCalendar(currentCalendarDate);
            } else {
                renderCalendar(currentCalendarDate);
            }
            // Обновляем дату в заголовке
            updateHeaderDate();
        });
    }

    if (nextDateBtn) {
        nextDateBtn.addEventListener('click', () => {
            currentNavDate.setDate(currentNavDate.getDate() + 1);
            localStorage.setItem('selectedDate', currentNavDate.toISOString());
            loadCalendarDate(currentNavDate);
            if (currentCalendarDate.getMonth() !== currentNavDate.getMonth()) {
                currentCalendarDate = new Date(currentNavDate);
                renderCalendar(currentCalendarDate);
            } else {
                renderCalendar(currentCalendarDate);
            }
            // Обновляем дату в заголовке
            updateHeaderDate();
        });
    }

    // Re-initialize when language changes
    const originalUpdateAppLanguage = updateAppLanguage;
    updateAppLanguage = function () {
        originalUpdateAppLanguage.call(this);
    };

    // === Profile Buttons ===
    const profileButtons = document.querySelectorAll('.profile-btn');
    profileButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const profile = btn.dataset.profile;
            setProfile(profile);

            // Update UI
            profileButtons.forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-white/5', 'text-slate-300');
            });
            btn.classList.remove('bg-white/5', 'text-slate-300');
            btn.classList.add('bg-primary', 'text-white');

            // Refresh catalog if visible
            if (activeTab === 'church-today') {
                renderCatalog();
            }

            console.log('[Profile] Switched to:', profile);
        });
    });

    // Set initial profile button state
    const currentProfile = getProfile();
    profileButtons.forEach(btn => {
        if (btn.dataset.profile === currentProfile) {
            btn.classList.remove('bg-white/5', 'text-slate-300');
            btn.classList.add('bg-primary', 'text-white');
        }
    });

    // --- Pre-cache Psalm 50 audio for offline use ---
    function precachePsalm50() {
        const url = 'https://azbyka.ru/audio/audio1/molitvoslov/psalmy/psalom-50.mp3';
        if (!('caches' in window)) return;
        caches.open('azbyka-audio-cache').then(cache => {
            cache.match(url).then(cached => {
                if (!cached) {
                    fetch(url, { mode: 'no-cors' }).then(response => {
                        cache.put(url, response);
                    }).catch(() => {});
                }
            });
        });
    }
    precachePsalm50();

    // --- Pre-cache Prayer audio for offline use ---
    function precachePrayerAudio() {
        if (!('caches' in window)) return;
        const urls = [
            ['azbyka-audio-cache',       'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/01-bulchuk_kanon_pokayannyy_ko_gospodu_iisusu_hristu.mp3'],
            ['pravoslavie-audio-cache',  'https://pravoslavie-audio.com/wp-content/uploads/2020/12/kanon-molebnyj-ko-presvyatoj-bogoroditse.mp3'],
            ['azbyka-audio-cache',       'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/02-bulchuk_kanon_molebnyy_ko_presvyatoy_bogorodice.mp3'],
            ['azbyka-audio-cache',       'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/03-bulchuk_kanon_angelu_hranitelyu.mp3'],
            ['azbyka-audio-cache',       'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/32_ermakov-posledovanie-ko-svjatomu-prichashheniju.mp3'],
        ];
        urls.forEach(([cacheName, url]) => {
            caches.open(cacheName).then(cache => {
                cache.match(url).then(cached => {
                    if (!cached) {
                        fetch(url, { mode: 'no-cors' }).then(response => {
                            cache.put(url, response);
                        }).catch(() => {});
                    }
                });
            });
        });
    }
    precachePrayerAudio();

    // --- Initialization ---
    initPsalm50Audio(); // Настройка аудио Псалма 50
    applyTheme();
    updateAppLanguage();
    applyLanguageFont();
    updateLanguageUI();
    updateHeaderSpacing(); // Вычисляем высоту шапки
    loadChurchToday(); // Load calendar data
    renderRandomQuote(); // Load random quote on startup
    switchTab('church-empty'); // Start on Church Today tab

    // Обновляем отступ после загрузки шрифтов и при изменении размера шапки
    if (document.fonts) {
        document.fonts.ready.then(() => {
            updateHeaderSpacing();
        });
    }

    // Добавляем ResizeObserver для автоматического обновления при изменении контента шапки
    if (window.ResizeObserver) {
        const header = document.querySelector('.main-header');
        if (header) {
            const ro = new ResizeObserver(() => {
                updateHeaderSpacing();
            });
            ro.observe(header);
            console.log('[Header Spacing] ResizeObserver attached to header.');
        }
    }
});

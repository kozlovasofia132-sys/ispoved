import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getSinsData, setProfile, getProfile } from './data/sins.js';
import { translations } from './data/translations.js';
import { preparationData, communionPrep } from './data/preparation.js';
import { quotes } from './data/quotes.js';
import { prayersData } from './data/prayers.js';


document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        'church-empty': document.getElementById('tab-church-empty'),
        'church-today': document.getElementById('tab-church-today'),
        settings: document.getElementById('tab-settings'),
    };

    // --- Global Speech Function ---
    window.toggleSpeech = (text, iconId, audioIndex) => {
        console.log('[Speech] Toggling speech:', iconId, audioIndex);
        
        const icon = document.getElementById(iconId);
        
        // Если уже играет это аудио
        if (window.currentAudio && window.currentAudio._preparationIndex === audioIndex) {
            if (window.currentAudio.paused) {
                window.currentAudio.play();
                if (icon) icon.textContent = 'pause';
            } else {
                window.currentAudio.pause();
                if (icon) icon.textContent = 'volume_up';
            }
            return;
        }
        
        // Останавливаем предыдущее аудио
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        
        // Сбрасываем только иконки динамиков (не стрелки!)
        document.querySelectorAll('#preparation-intro-container button .material-symbols-outlined, #communion-prep-container button .material-symbols-outlined').forEach(i => {
            i.textContent = 'volume_up';
        });

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
    const customAmountContainer = document.getElementById('custom-amount-container');
    const customAmountInput = document.getElementById('custom-amount-input');
    const donateSubmitBtn = document.getElementById('donate-submit-btn');

    // Reading Mode Modal
    const readingModeModal = document.getElementById('reading-mode-modal');
    const openReadModeBtn = document.getElementById('open-read-mode-btn');
    const closeReadModeBtn = document.getElementById('close-read-mode-btn');
    const readModeContainer = document.getElementById('read-mode-container');
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
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let currentLanguage = localStorage.getItem('language') || 'ru';
    let personalNotes = localStorage.getItem('personalReflections') || '';
    let isDetailedView = localStorage.getItem('viewMode') !== 'simple';
    let wakeLock = null;
    let isAllExpanded = false;

    // --- New Features State ---

    let isDigitalMentorEnabled = localStorage.getItem('digitalMentor') === 'true';


    // --- Teleprompter State ---
    let isAutoscrolling = false;
    let autoscrollSpeed = 30; // pixels per second
    let autoscrollRequestId = null;
    let lastAutoscrollTimestamp = 0;

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
        applyViewMode();
        updateLanguageUI();
        applyLanguageFont();

        document.title = t('appName');
    }



    function applyLanguageFont() {
        document.body.classList.toggle('font-cs', currentLanguage === 'cs');
    }

    function updateHeader() {
        if (!headerTitle) return;
        
        let headerKey = '';
        switch (activeTab) {
            case 'church-empty': headerKey = 'churchTitle'; break;
            case 'church-today': headerKey = 'catalog'; break;
            case 'settings': headerKey = 'settings'; break;
            default: headerKey = 'appName';
        }
        headerTitle.textContent = headerKey ? t(headerKey) : '';
    }

    // --- Random Quote Function ---
    function renderRandomQuote() {
        if (!quoteTextEl || !quoteAuthorEl || quotes.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        
        quoteTextEl.textContent = `«${quote.text}»`;
        quoteAuthorEl.textContent = quote.author;
        
        console.log('Цитата обновлена:', quote);
    }


    // --- Tab Navigation ---
    async function switchTab(tabId) {
        if (!tabContents[tabId]) return;

        // Protection for "My Confession" tab — запрашиваем ПИН только если есть грехи в списке
        if (tabId === 'church-today' && isPinEnabled && selectedSins.length > 0) {
            // Если уже разблокировано в этой сессии, не запрашиваем ПИН снова
            if (!isUnlocked) {
                if (hashedPin) {
                    pendingTabAfterAuth = 'church-today';
                    openPinPad(false);
                    return;
                }
            }
        }

        activeTab = tabId;
        pendingTabAfterAuth = null; // Clear if we got here naturally or via bio success

        Object.keys(tabContents).forEach(id => {
            if (tabContents[id]) {
                tabContents[id].classList.toggle('hidden', id !== tabId);
            }
        });

        navButtons.forEach(btn => {
            const isTarget = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('active', isTarget);
        });

        updateHeader();
        if (tabId === 'church-today' && typeof window.autoResizeNotes === 'function') {
            window.autoResizeNotes();
        }
        if (tabId === 'church-today') {
            renderPreparation();
            renderCatalog();
        }
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
                if (e.target.checked) {
                    if (!selectedSins.some(s => s.id === id)) {
                        selectedSins.push({ id: id, type: 'predefined', note: '' });
                    }
                } else {
                    selectedSins = selectedSins.filter(s => s.id !== id);
                }
                localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
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

            resultHtml += `
            <details name="accordion-group" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 mb-4
                           bg-gradient-to-br from-[#1a1914] via-[#1f1d1a] to-[#151412]
                           shadow-[inset_0_0_20px_rgba(225,193,110,0.03),0_4px_20px_rgba(0,0,0,0.4)]
                           hover:shadow-[inset_0_0_30px_rgba(225,193,110,0.06),0_8px_30px_rgba(225,193,110,0.1)]
                           group-open:shadow-[inset_0_0_25px_rgba(225,193,110,0.05),0_0_40px_rgba(225,193,110,0.15)]
                           border border-[#E1C16E]/10 hover:border-[#E1C16E]/20">
                <summary class="cursor-pointer flex items-center gap-4 p-5 select-none list-none [&::-webkit-details-marker]:hidden outline-none
                              hover:bg-[#E1C16E]/5 transition-all duration-300">
                    <span class="flex-1 text-lg font-bold text-[#E1C16E] tracking-tight drop-shadow-[0_0_8px_rgba(225,193,110,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(225,193,110,0.7)] transition-all duration-300">${title}</span>
                    <button class="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-[#E1C16E] transition-all active:scale-90"
                            onclick="event.preventDefault(); event.stopPropagation(); window.toggleSpeech(\`${fullSpeechText.replace(/"/g, '&quot;').replace(/'/g, "\\'")}\`, 'tts-icon-${card.id}', ${index + 1})">
                        <span id="tts-icon-${card.id}" class="material-symbols-outlined text-xl drop-shadow-[0_0_5px_currentColor]">volume_up</span>
                    </button>
                    <span class="material-symbols-outlined text-[#E1C16E]/40 group-open:rotate-180 transition-transform duration-300 text-xl drop-shadow-[0_0_5px_rgba(225,193,110,0.3)]">expand_more</span>
                </summary>
                <div class="px-5 pb-5 pt-1 bg-gradient-to-b from-transparent via-[#E1C16E]/[0.02] to-transparent">
                    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#E1C16E]/20 to-transparent mb-4 shadow-[0_0_10px_rgba(225,193,110,0.2)]"></div>
                    <p class="text-base text-slate-200/90 leading-relaxed mb-4 text-shadow-subtle">${body}</p>
                    ${scripture && card.id !== 'prayer_fasting' ? `<p class="${quoteClass}">${scripture}</p>` : ''}
                    ${scripture && card.id === 'prayer_fasting' ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${scripture}</p>` : ''}
                    ${scripture2 && card.id === 'reconciliation' ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${scripture2}</p>` : ''}
                    ${scripture2 && card.id === 'prayer_fasting' ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${scripture2}</p>` : ''}
                    ${scripture2 && card.id === 'confession_day' ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${scripture2}</p>` : ''}
                    ${scripture2 && card.id !== 'reconciliation' && card.id !== 'prayer_fasting' && card.id !== 'confession_day' ? `<p class="${quoteClass}">${scripture2}</p>` : ''}
                    ${card.id === 'awareness' && saints ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${saints}</p>` : ''}
                    ${card.id === 'prayer_fasting' && saints ? `<p class="${quoteClass}">${saints}</p>` : ''}
                    ${card.id !== 'awareness' && card.id !== 'reconciliation' && card.id !== 'prayer_fasting' && card.id !== 'confession_day' && saints ? `<p class="${quoteClass}">${saints}</p>` : ''}
                    ${card.id === 'prayer_fasting' && advice ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${advice}</p>` : ''}
                    ${card.id === 'confession_day' && advice ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${advice}</p>` : ''}
                    ${card.id !== 'prayer_fasting' && card.id !== 'confession_day' && advice ? `<p class="text-sm font-bold text-[#E1C16E]/80 mb-2 drop-shadow-[0_0_5px_rgba(225,193,110,0.3)]">${advice}</p>` : ''}
                    ${setup ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${setup}</p>` : ''}
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

        container.innerHTML = `
        <details name="communion-accordion" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 mb-4
                       bg-gradient-to-br from-[#1a1914] via-[#1f1d1a] to-[#151412]
                       shadow-[inset_0_0_20px_rgba(225,193,110,0.03),0_4px_20px_rgba(0,0,0,0.4)]
                       hover:shadow-[inset_0_0_30px_rgba(225,193,110,0.06),0_8px_30px_rgba(225,193,110,0.1)]
                       group-open:shadow-[inset_0_0_25px_rgba(225,193,110,0.05),0_0_40px_rgba(225,193,110,0.15)]
                       border border-[#E1C16E]/10 hover:border-[#E1C16E]/20">
            <summary class="cursor-pointer flex items-center gap-4 p-5 select-none list-none [&::-webkit-details-marker]:hidden outline-none
                          hover:bg-[#E1C16E]/5 transition-all duration-300">
                <span class="flex-1 text-lg font-bold text-[#E1C16E] tracking-tight drop-shadow-[0_0_8px_rgba(225,193,110,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(225,193,110,0.7)] transition-all duration-300">${title}</span>
                <button class="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-[#E1C16E] transition-all active:scale-90"
                        onclick="event.preventDefault(); event.stopPropagation(); window.toggleSpeech(\`${fullSpeechText.replace(/"/g, '&quot;').replace(/'/g, "\\'")}\`, 'tts-icon-${card.id}', 5)">
                    <span id="tts-icon-${card.id}" class="material-symbols-outlined text-xl drop-shadow-[0_0_5px_currentColor]">volume_up</span>
                </button>
                <span class="material-symbols-outlined text-[#E1C16E]/40 group-open:rotate-180 transition-transform duration-300 text-xl drop-shadow-[0_0_5px_rgba(225,193,110,0.3)]">expand_more</span>
            </summary>
            <div class="px-5 pb-5 pt-1 bg-gradient-to-b from-transparent via-[#E1C16E]/[0.02] to-transparent">
                <div class="w-full h-px bg-gradient-to-r from-transparent via-[#E1C16E]/20 to-transparent mb-4 shadow-[0_0_10px_rgba(225,193,110,0.2)]"></div>
                <p class="text-base text-slate-200/90 leading-relaxed mb-4 text-shadow-subtle">${body}</p>
                ${scripture ? `<p class="${quoteClass}">${scripture}</p>` : ''}
                ${scripture2 ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${scripture2}</p>` : ''}
                ${setup ? `<p class="text-base text-slate-200/90 leading-relaxed text-shadow-subtle">${setup}</p>` : ''}
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
            return;
        }

        if (emptyState) emptyState.classList.replace('flex', 'hidden');
        if (readModeContainer) readModeContainer.classList.remove('hidden');
        if (toggleAllBtn) toggleAllBtn.classList.remove('hidden');
        if (formulaContainer) formulaContainer.classList.remove('hidden');

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
            readingModeModal.classList.remove('hidden');
            const teleControls = document.getElementById('teleprompter-controls');
            if (teleControls) {
                teleControls.classList.remove('hidden');
                teleControls.style.display = 'flex';
                teleControls.style.opacity = '1';
                setPanelState(false); // Initially collapsed
            }
            const modalScrollArea = readingModeModal.querySelector('.overflow-y-auto');
            if (modalScrollArea) modalScrollArea.scrollTop = 0;
            requestWakeLock();
        });
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
    setupModal(contactDevBtn, contactModal, closeContactBtn);

    // --- Donation Modal Logic ---
    let selectedAmount = null;

    // Open donate modal
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            if (donateModal) {
                donateModal.classList.remove('hidden');
                selectedAmount = null;
                donateAmountBtns.forEach(btn => {
                    btn.classList.remove('bg-[#7f19e6]', 'text-white');
                    btn.classList.add('border-[#7f19e6]/50');
                });
                if (customAmountContainer) customAmountContainer.classList.add('hidden');
                if (customAmountInput) customAmountInput.value = '';
            }
        });
    }

    // Close donate modal
    if (closeDonateBtn) {
        closeDonateBtn.addEventListener('click', () => {
            if (donateModal) donateModal.classList.add('hidden');
        });
    }

    // Amount selection
    donateAmountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            selectedAmount = amount;
            
            donateAmountBtns.forEach(b => {
                b.classList.remove('bg-[#7f19e6]', 'text-white');
                b.classList.add('border-[#7f19e6]/50');
            });
            
            btn.classList.remove('border-[#7f19e6]/50');
            btn.classList.add('bg-[#7f19e6]', 'text-white');
            
            if (amount === 'custom' && customAmountContainer) {
                customAmountContainer.classList.remove('hidden');
            } else if (customAmountContainer) {
                customAmountContainer.classList.add('hidden');
            }
        });
    });

    // Submit donation
    if (donateSubmitBtn) {
        donateSubmitBtn.addEventListener('click', () => {
            let finalAmount = selectedAmount;
            
            if (selectedAmount === 'custom' && customAmountInput) {
                finalAmount = customAmountInput.value;
            }
            
            if (!finalAmount || finalAmount === 'custom') {
                alert(t('donationSuccess') || 'Функция оплаты временно недоступна. Спасибо за вашу поддержку!');
                return;
            }
            
            // Show success message (temporary stub)
            alert(t('donationSuccess') || 'Функция оплаты временно недоступна. Спасибо за вашу поддержку!');
            
            // Close modal after action
            if (donateModal) donateModal.classList.add('hidden');
        });
    }

    // Close on backdrop click
    if (donateModal) {
        donateModal.addEventListener('click', (e) => {
            if (e.target === donateModal) {
                donateModal.classList.add('hidden');
            }
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
    }

    // --- Appearance Settings ---
    function applyTheme() {
        const isDark = currentTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
        if (themeToggle) themeToggle.checked = isDark;
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
            const isTarget = (btn.dataset.view === 'detailed' && isDetailedView) ||
                (btn.dataset.view === 'simple' && !isDetailedView);
            btn.classList.toggle('bg-primary', isTarget);
            btn.classList.toggle('text-white', isTarget);
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
                if (hashedPin && !pinPadModal.classList.contains('setup-mode')) {
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
                        pinPadStatus.textContent = t('incorrectPin');
                        pinPadStatus.classList.add('text-red-400');
                        pinCells.forEach(cell => cell.classList.add('border-red-500', 'text-red-500'));
                        shakePinPad();
                        setTimeout(resetPinInput, 500); // Small delay to show red cells
                    }
                }
                // Mode 2: PIN Setup (режим установки нового ПИН-кода)
                else if (setupStep === 0) {
                    tempSetupPin = hashedInput;
                    setupStep = 1;
                    pinPadStatus.textContent = t('pinConfirmNewTitle');
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
                        pinPadStatus.textContent = t('pinMismatch');
                        pinPadStatus.classList.add('text-red-400');
                        pinCells.forEach(cell => cell.classList.add('border-red-500', 'text-red-500'));
                        shakePinPad();
                        setupStep = 0;
                        setTimeout(() => {
                            pinPadStatus.textContent = t('pinSetupNewTitle');
                            pinPadStatus.classList.remove('text-red-400');
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
        pinPadModal.querySelector('div').classList.add('animate-shake');
        setTimeout(() => pinPadModal.querySelector('div').classList.remove('animate-shake'), 500);
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

        // Принудительная установка inline-стилей
        pinPadModal.style.display = 'flex';
        pinPadModal.style.setProperty('display', 'flex', 'important');
        pinPadModal.style.visibility = 'visible';
        pinPadModal.style.setProperty('visibility', 'visible', 'important');
        pinPadModal.style.opacity = '1';
        pinPadModal.style.setProperty('opacity', '1', 'important');
        pinPadModal.style.zIndex = '99999';
        pinPadModal.style.setProperty('z-index', '99999', 'important');

        console.log('[PIN] Modal classes after show:', pinPadModal.classList.toString());
        console.log('[PIN] Modal display style:', pinPadModal.style.display);
        console.log('[PIN] Modal visibility style:', pinPadModal.style.visibility);
        console.log('[PIN] Modal opacity style:', pinPadModal.style.opacity);
        console.log('[PIN] Modal zIndex style:', pinPadModal.style.zIndex);
        console.log('[PIN] Modal computed display:', window.getComputedStyle(pinPadModal).display);
        console.log('[PIN] Modal computed visibility:', window.getComputedStyle(pinPadModal).visibility);
        console.log('[PIN] Modal computed opacity:', window.getComputedStyle(pinPadModal).opacity);
        console.log('[PIN] Modal computed zIndex:', window.getComputedStyle(pinPadModal).zIndex);
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
        const wasSetup = pinPadModal.classList.contains('setup-mode');

        // Жесткое скрытие модального окна
        pinPadModal.classList.add('hidden');
        pinPadModal.classList.remove('flex');
        pinPadModal.style.display = 'none';
        pinPadModal.style.visibility = 'hidden';
        pinPadModal.style.opacity = '0';

        // Скрываем кнопку закрытия
        if (pinPadCloseBtn) {
            pinPadCloseBtn.classList.add('hidden');
            pinPadCloseBtn.style.display = 'none';
        }

        // Сбрасываем стили после закрытия
        setTimeout(() => {
            pinPadModal.style.zIndex = '';
        }, 500);

        resetPinInput();

        // Переключаем вкладку только если это не процесс изменения ПИН
        if (!wasSetup && pendingTabAfterAuth && !isChangingPin) {
            switchTab(pendingTabAfterAuth);
            pendingTabAfterAuth = null;
        }
    }

    pinBtns.forEach(btn => {
        btn.addEventListener('click', () => handlePinInput(btn.dataset.val));
    });

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
        shareSheetBtn.addEventListener('click', generatePDF);
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
        if (!prayersReadingModal || !prayerContentArea) return;

        // Reset audio player state when opening new prayer
        if (currentGlobalAudio) {
            currentGlobalAudio.pause();
            currentGlobalAudio.src = '';
            currentGlobalAudio.dataset.loadedId = '';
        }
        currentPrayerIdInPlayer = null;
        isAudioPlaying = false;

        const prayer = prayersData[prayerId];
        if (!prayer) return;

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
            prayersReadingModal.classList.remove('hidden');
            const teleControls = document.getElementById('teleprompter-controls');
            if (teleControls) {
                teleControls.classList.remove('hidden');
                teleControls.style.display = 'flex';
                teleControls.style.opacity = '1';
            }

            prayerScrollArea.scrollTop = 0;
            updatePrayerProgress();
            requestWakeLock();

            // Show audio player bar (don't autoplay)
            showAudioPlayerBar(prayerId);
        }
    }

    function closePrayersModal() {
        if (prayersReadingModal) {
            stopAutoscroll(); // Ensure autoscroll stops
            prayersReadingModal.classList.add('hidden');
            const teleControls = document.getElementById('teleprompter-controls');
            if (teleControls) teleControls.classList.add('hidden');
            releaseWakeLock();
            hideAudioPlayerBar();
        }
    }

    prayerMenuItems.forEach(btn => {
        console.log('[Prayer Menu] Found button:', btn.dataset.prayerId);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const prayerId = btn.dataset.prayerId;
            console.log('[Prayer Menu] Opening:', prayerId);
            openPrayersModal(prayerId);
        });
    });

    if (closePrayersModalBtn) closePrayersModalBtn.addEventListener('click', closePrayersModal);

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
                    console.error('[Audio Debug] Audio error event:', e);
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

                    // Fallback to alternative URLs
                    if (currentPrayerIdInPlayer === 'repentanceCanon' && !currentGlobalAudio.src.includes('04-kanon-pokayanny.mp3')) {
                        showToast("Пробую локально...");
                        currentGlobalAudio.src = '/04-kanon-pokayanny.mp3';
                        currentGlobalAudio.play();
                    } else if (currentPrayerIdInPlayer === 'theotokosCanon') {
                        // Try alternative URL for Theotokos Canon
                        if (currentGlobalAudio.src.includes('pravoslavie-audio.com')) {
                            showToast("Пробую azbyka.ru...");
                            currentGlobalAudio.src = 'https://azbyka.ru/audio/audio1/Molitvy-i-bogosluzhenija/ko_svyatomy_prichacheniyu/prichastie/02-bulchuk_kanon_molebnyy_ko_presvyatoy_bogorodice.mp3';
                            currentGlobalAudio.play();
                        }
                    }
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

    function startAudioProgress() {
        // Now handled by timeupdate event for more accuracy
    }

    function stopAudioProgress() {
        if (audioIntervalId) {
            clearInterval(audioIntervalId);
            audioIntervalId = null;
        }
    }

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
        if (timeEl) timeEl.textContent = '00:00';
    }

    // Show audio player bar when prayers modal is opened
    function showAudioPlayerBar(prayerId) {
        console.log('[Audio Debug] showAudioPlayerBar called for:', prayerId);
        currentPrayerIdInPlayer = prayerId;
        if (audioPlayerBar) {
            audioPlayerBar.classList.remove('hidden');
        } else {
            console.warn('[Audio Debug] Cannot show player bar - element missing');
        }
    }

    // Hide audio player bar when prayers modal is closed
    function hideAudioPlayerBar() {
        if (audioPlayerBar) {
            audioPlayerBar.classList.add('hidden');
        }
        resetAudioPlayer();
    }

    // Add click listener to play/pause button
    if (audioPlayPauseBtn) {
        audioPlayPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAudioPlayPause();
        });
    }

    // Add click listener to speaker icon button
    const audioSpeakerBtn = document.getElementById('audio-speaker-btn');
    if (audioSpeakerBtn) {
        audioSpeakerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showToast(t('audioPlaybackNotAvailable'));
        });
    }

    // --- Teleprompter / Auto-scroll Logic (Pull-out Panel) ---
    const teleControls = document.getElementById('teleprompter-controls');
    const toggleAutoscrollBtn = document.getElementById('toggle-autoscroll-btn');
    const autoscrollSpeedInput = document.getElementById('autoscroll-speed');
    const autoscrollIcon = document.getElementById('autoscroll-icon');
    const speedUpBtn = document.getElementById('speed-up-btn');
    const speedDownBtn = document.getElementById('speed-down-btn');
    const pullHandle = document.getElementById('tele-pull-handle');

    let isExpandedValue = false;
    let startX = 0;
    let currentTranslateX = 0;

    function setPanelState(expanded) {
        if (!teleControls) return;
        isExpandedValue = expanded;
        if (expanded) {
            teleControls.classList.add('expanded');
        } else {
            teleControls.classList.remove('expanded');
        }
    }

    // Toggle on click/tap
    if (teleControls) {
        teleControls.addEventListener('click', (e) => {
            // Don't collapse if clicking buttons inside
            if (e.target.closest('.drawer-content')) return;
            setPanelState(!isExpandedValue);
        });
    }

    // Swipe Logic (Touch)
    if (teleControls) {
        teleControls.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            teleControls.style.transition = 'none';
        }, { passive: true });

        teleControls.addEventListener('touchmove', (e) => {
            if (!isExpandedValue) return; // Simple pull logic

            const touchX = e.touches[0].clientX;
            const deltaX = startX - touchX;

            if (isExpandedValue && deltaX < 0) {
                // Pushing in
                const translate = Math.max(deltaX, -80);
                teleControls.style.transform = `translateY(-50%) translateX(${-translate}px)`;
            }
        }, { passive: true });

        teleControls.addEventListener('touchend', (e) => {
            teleControls.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            teleControls.style.transform = ''; // Return to CSS defined transforms

            const endX = e.changedTouches[0].clientX;
            const totalDelta = startX - endX;

            if (totalDelta > 40) setPanelState(true);
            else if (totalDelta < -40) setPanelState(false);
        });
    }

    function getActiveScrollContainer() {
        if (!prayersReadingModal.classList.contains('hidden')) return prayerScrollArea;
        if (!readingModeModal.classList.contains('hidden')) return readingModeModal.querySelector('.overflow-y-auto');
        return null;
    }

    function smoothAutoscroll(timestamp) {
        if (!isAutoscrolling) return;

        if (!lastAutoscrollTimestamp) lastAutoscrollTimestamp = timestamp;
        const deltaTime = (timestamp - lastAutoscrollTimestamp) / 1000;
        lastAutoscrollTimestamp = timestamp;

        const container = getActiveScrollContainer();
        if (container) {
            container.scrollTop += autoscrollSpeed * deltaTime;

            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
                stopAutoscroll();
            }
        }
        autoscrollRequestId = requestAnimationFrame(smoothAutoscroll);
    }

    function startAutoscroll() {
        if (isAutoscrolling) return;
        const container = getActiveScrollContainer();
        if (!container) return;

        isAutoscrolling = true;
        lastAutoscrollTimestamp = 0;
        if (autoscrollIcon) autoscrollIcon.textContent = 'pause';
        autoscrollRequestId = requestAnimationFrame(smoothAutoscroll);
    }

    function stopAutoscroll() {
        isAutoscrolling = false;
        if (autoscrollRequestId) cancelAnimationFrame(autoscrollRequestId);
        autoscrollRequestId = null;
        if (autoscrollIcon) autoscrollIcon.textContent = 'play_arrow';
    }

    if (toggleAutoscrollBtn) {
        toggleAutoscrollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isAutoscrolling) stopAutoscroll();
            else startAutoscroll();
        });
    }

    function updateSpeed() {
        const val = parseInt(autoscrollSpeedInput.value);
        // Map 0-100 to 0-300 speed for better control
        autoscrollSpeed = (val / 100) * 300;
    }

    if (autoscrollSpeedInput) {
        autoscrollSpeedInput.addEventListener('input', updateSpeed);
        updateSpeed();
    }

    if (speedUpBtn) {
        speedUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            autoscrollSpeedInput.value = Math.min(100, parseInt(autoscrollSpeedInput.value) + 5);
            updateSpeed();
        });
    }

    if (speedDownBtn) {
        speedDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            autoscrollSpeedInput.value = Math.max(0, parseInt(autoscrollSpeedInput.value) - 5);
            updateSpeed();
        });
    }

    // Auto-pause only for the active scrollable elements
    const setupAutoPause = (container) => {
        if (!container) return;
        ['mousedown', 'touchstart', 'wheel'].forEach(evt => {
            container.addEventListener(evt, () => {
                if (isAutoscrolling) stopAutoscroll();
            }, { passive: true });
        });
    };

    // Initialize auto-pause for prayer modal
    setupAutoPause(prayerScrollArea);
    // Initialize auto-pause for reading mode modal
    setupAutoPause(readingModeModal.querySelector('.overflow-y-auto'));

    // === Church Tab - Orthodox Calendar (Azbyka.ru API) ===
    let currentDate = new Date();
    let currentNavDate = new Date();

    // Format date for display (e.g., "19 марта")
    function formatDateShort(date) {
        const day = date.getDate();
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
        return `${day} ${monthGenitive}`;
    }

    // Get Old Style (Julian) date - Julian calendar is 13 days behind Gregorian in 20th-21st centuries
    function getOldStyleDate(date) {
        const oldStyleDate = new Date(date);
        oldStyleDate.setDate(date.getDate() - 13);
        return formatDateShort(oldStyleDate);
    }

    // Format full date (e.g., "Среда, 14 августа 2024 г.")
    function formatDateFull(date) {
        const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleDateString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        // Capitalize first letter
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} ${month} ${year} г.`;
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

        if (!container) return;

        // Если нет икон святых, скрываем блок
        if (!saintsIcons || saintsIcons.length === 0) {
            if (iconBlock) iconBlock.style.display = 'none';
            return;
        }

        // Показываем блок
        if (iconBlock) {
            iconBlock.style.display = 'block';
            iconBlock.classList.remove('hidden');
        }

        // Рендерим иконы святых (первые 6-8)
        let saintsIconsHtml = '';
        if (saintsIcons && saintsIcons.length > 0) {
            const iconsToShow = saintsIcons.slice(0, 8);
            saintsIconsHtml = `
                <div class="overflow-x-auto w-full pb-2 no-scrollbar" id="icons-scroll-container">
                    <div class="flex gap-4 md:gap-6 justify-start flex-shrink-0">
                        ${iconsToShow.map((icon, index) => `
                            <img src="${icon}" alt="Икона святого ${index + 1}"
                                 class="w-40 h-40 md:w-56 md:h-56 object-contain border border-white/10 shadow-lg hover:scale-110 transition-transform flex-shrink-0"
                                 loading="lazy" />
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Показываем стрелочки только если икон больше одной
        const navigationArrows = saintsIcons.length > 1 ? `
            <button id="prev-icon-btn" class="absolute -left-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1a1914] rounded-xl border border-[#E1C16E]/20 text-[#E1C16E] flex items-center justify-center hover:bg-[#E1C16E]/10 active:scale-95 active:opacity-100 transition-all shadow-lg shadow-black/40">
                <span class="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
            <button id="next-icon-btn" class="absolute -right-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1a1914] rounded-xl border border-[#E1C16E]/20 text-[#E1C16E] flex items-center justify-center hover:bg-[#E1C16E]/10 active:scale-95 active:opacity-100 transition-all shadow-lg shadow-black/40">
                <span class="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
        ` : '';

        container.innerHTML = `
            <div class="relative flex flex-col items-center py-4 px-2 group w-full">
                ${navigationArrows}
                <div class="w-full flex items-center justify-center">
                    ${saintsIconsHtml}
                </div>
            </div>
        `;

        // Добавляем обработчики для стрелочек
        setTimeout(() => {
            const prevBtn = document.getElementById('prev-icon-btn');
            const nextBtn = document.getElementById('next-icon-btn');
            const scrollContainer = document.getElementById('icons-scroll-container');

            if (prevBtn && nextBtn && scrollContainer) {
                const scrollAmount = 200; // Ширина иконки + отступ

                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                });

                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                });
            }
        }, 100);
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

        // Разбиваем по "). " или по ". " перед "На" или перед заглавной буквой
        // Пример: "На 6-м часе: Ис.37:33–38:6 (зач. 151). На веч.: Быт.13:12–18. Притч.14:27–15:4 (зач. 70)."
        const parts = cleanText.split(/\)\.\s*/);
        
        console.log('[parseReadingsText] Parts:', parts);

        let currentServiceType = '';

        for (let part of parts) {
            part = part.trim();
            if (!part) continue;

            // Дополнительно разбиваем часть по ". " если есть несколько чтений
            const subParts = part.split(/\.\s+(?=[А-Я])/);
            
            for (let subPart of subParts) {
                subPart = subPart.trim();
                if (!subPart) continue;
                
                // Проверяем, есть ли тип службы в начале части
                for (const [abbrev, fullName] of Object.entries(serviceTypes)) {
                    const regex = new RegExp(`^${abbrev.replace('.', '\\.')}\\s*[:–-]\\s*`, 'i');
                    if (regex.test(subPart)) {
                        currentServiceType = fullName;
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
                    let type = currentServiceType || 'Апостол';
                    const bookLower = book.toLowerCase();

                    // Если тип службы не установлен, определяем по книге
                    if (!currentServiceType) {
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
                    for (const [abbrev, fullName] of Object.entries(bookNames)) {
                        if (book === abbrev || book === abbrev.replace('.', '')) {
                            fullBookName = fullName;
                            break;
                        }
                    }

                    // Форматируем текст: Полное название, глава, стихи (зачало опционально)
                    const formattedText = zachalo
                        ? `${fullBookName}, ${zachalo} зач., глава ${parseInt(chapter)}, стихи ${startVerse}–${endVerseFinal}`
                        : `${fullBookName}, глава ${parseInt(chapter)}, стихи ${startVerse}–${endVerseFinal}`;

                    readings.push({
                        type: type,
                        text: formattedText,
                        link_mp3: null,
                        audio: null,
                        mp3_remote: null
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
            
            // Если уже играет этот псалом
            if (window.currentAudio && window.currentAudio._isPsalm50) {
                if (window.currentAudio.paused) {
                    window.currentAudio.play();
                    playBtn.querySelector('span').textContent = 'pause';
                } else {
                    window.currentAudio.pause();
                    playBtn.querySelector('span').textContent = 'play_arrow';
                }
                return;
            }

            // Останавливаем всё остальное
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
            resetAllMediaUI();

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
    function renderReadings(readings, texts) {
        const container = document.getElementById('readings-container');
        if (!container) return;

        // Если readings пустой, пробуем распарсить texts
        if ((!readings || readings.length === 0) && texts && texts.length > 0) {
            const textData = texts[0].text;
            const parsedReadings = parseReadingsText(textData);
            if (parsedReadings.length > 0) {
                readings = parsedReadings;
                
                // Привязываем MP3 ссылки из refs, если количество совпадает
                if (texts[0].refs && texts[0].refs.length === readings.length) {
                    readings.forEach((r, i) => {
                        const ref = texts[0].refs[i];
                        const bookPart = ref.split('.')[0];
                        // Формируем ссылку по шаблону Азбуки: https://azbyka.ru/audio/audio1/zachala/Book/Book.Chapter:Verse-Verse.mp3
                        r.link_mp3 = `https://azbyka.ru/audio/audio1/zachala/${bookPart}/${ref}.mp3`;
                    });
                }
            }
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
            // Пример: "VI, 9–12" → ", глава VI, стихи 9–12"
            const chapterVerseMatch = formatted.match(/,\s*([IVX]+),\s*(\d+)\s*[–-]\s*(\d+)/);
            if (chapterVerseMatch) {
                const [, chapter, startVerse, endVerse] = chapterVerseMatch;
                formatted = formatted.replace(
                    /,\s*[IVX]+,\s*\d+\s*[–-]\s*\d+/,
                    `, глава ${chapter}, стихи ${startVerse}–${endVerse}`
                );
            }

            return formatted;
        }

        // Показываем все чтения в исходном порядке
        container.innerHTML = '';

        if (!readings || readings.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-text-muted opacity-60">
                    <span class="material-symbols-outlined text-4xl mb-3 block">auto_stories</span>
                    <p class="text-sm font-serif italic">${t('noReadings') || 'Чтений на этот день не запланировано'}</p>
                </div>
            `;
            return;
        }

        readings.forEach((reading, index) => {
            const row = document.createElement('div');
            row.className = "reading-row p-4 hover:bg-white/5 transition-colors cursor-pointer group";
            
            const audioUrl = reading.link_mp3 || reading.audio || reading.mp3_remote;
            row.dataset.hasAudio = audioUrl ? 'true' : 'false';
            
            // Полная расшифровка книг
            const formattedText = formatReadingText(reading.text || reading);

            row.innerHTML = `
                <div class="flex items-start gap-4">
                    <button class="play-btn size-8 rounded-full border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/10 active:scale-90 transition-all flex-shrink-0">
                        <span class="material-symbols-outlined text-lg">${audioUrl ? 'play_arrow' : 'volume_up'}</span>
                    </button>
                    <div class="flex-1 min-w-0">
                        <p class="font-serif text-lg text-text-main leading-snug">
                            <span class="text-[#E1C16E] font-bold">${reading.type}:</span> ${formattedText}
                        </p>
                        ${audioUrl ? `
                        <div class="audio-progress h-1 bg-white/10 rounded-full mt-2 overflow-hidden opacity-0 transition-opacity">
                            <div class="progress-bar h-full bg-red-500 transition-all duration-300" style="width: 0%"></div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            

            row.addEventListener('click', (e) => {
                const icon = row.querySelector('.play-btn span');
                const progressBox = row.querySelector('.audio-progress');
                const progressBar = row.querySelector('.progress-bar');
                
                // 1. Проверяем, играет ли уже ЭТО аудио (МП3 файл)
                if (window.currentAudio && window.currentAudio._row === row) {
                    if (window.currentAudio.paused) {
                        window.currentAudio.play();
                        icon.textContent = 'pause';
                    } else {
                        window.currentAudio.pause();
                        icon.textContent = 'play_arrow';
                    }
                    return;
                }
                
                // 2. Проверяем, говорит ли сейчас синтезатор для ЭТОГО чтения
                if (window._currentSynthRow === row && 'speechSynthesis' in window && speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    window._currentSynthRow = null;
                resetAllMediaUI();
                    return;
                }
                
                // 3. Если нажали на новое чтение — останавливаем всё остальное
                if (window.currentAudio) {
                    window.currentAudio.pause();
                    window.currentAudio = null;
                }
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }

                resetAllMediaUI();

                if (audioUrl) {
                    icon.textContent = 'pause';
                    if (progressBox) progressBox.classList.remove('opacity-0');
                    window._currentSynthRow = row;

                    // Озвучиваем заголовок И текст через синтезатор
                    let speechType = reading.type;
                    if (reading.type === 'Утреня') speechType = 'на утрени';
                    else if (reading.type === 'Литургия') speechType = 'на Литургии';
                    else if (reading.type === 'На 6-м часе') speechType = 'на шестом часе';
                    else if (reading.type === 'На вечерне') speechType = 'на вечерне';
                    
                    // Формируем полный текст для синтеза (Тип + Текст)
                    const fullIntroText = speechType ? `${speechType}: ${formattedText}` : formattedText;
                    
                    if ('speechSynthesis' in window) {
                        const introUtterance = new SpeechSynthesisUtterance(fullIntroText);
                        introUtterance.lang = 'ru-RU';
                        introUtterance.rate = 0.9;
                        
                        introUtterance.onend = () => {
                            // Если за время синтеза мы не переключились на другое чтение
                            if (window._currentSynthRow === row) {
                                // Запускаем аудиофайл
                                const audio = new Audio(audioUrl);
                                audio._row = row;
                                window.currentAudio = audio;
                                audio.play().catch(err => console.error("Audio play error:", err));
                                
                                audio.addEventListener('timeupdate', () => {
                                    const percent = (audio.currentTime / audio.duration) * 100;
                                    if (progressBar) progressBar.style.width = `${percent}%`;
                                });
                                
                                audio.addEventListener('ended', () => {
                                resetAllMediaUI();
                                    window.currentAudio = null;
                                    window._currentSynthRow = null;
                                    
                                    // Пытаемся запустить следующее чтение автоматически
                                    const nextRow = row.nextElementSibling;
                                    if (nextRow && nextRow.classList.contains('reading-row')) {
                                        nextRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        nextRow.click();
                                    }
                                });
                                
                                audio.addEventListener('play', () => { icon.textContent = 'pause'; });
                                audio.addEventListener('pause', () => { icon.textContent = 'play_arrow'; });
                            }
                        };
                        speechSynthesis.speak(introUtterance);
                    } else {
                        // Если нет синтезатора, сразу аудио
                        const audio = new Audio(audioUrl);
                        audio._row = row;
                        window.currentAudio = audio;
                        audio.addEventListener('ended', () => {
                        resetAllMediaUI();
                            window.currentAudio = null;
                            const nextRow = row.nextElementSibling;
                            if (nextRow && nextRow.classList.contains('reading-row')) {
                                nextRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                nextRow.click();
                            }
                        });
                        audio.play();
                    }
                } else {
                    // Обычный синтез всей строки (если нет аудофайла)
                    icon.textContent = 'pause';
                    window._currentSynthRow = row;
                    
                    let speechType = reading.type;
                    if (reading.type === 'Утреня') speechType = 'на утрени';
                    else if (reading.type === 'Литургия') speechType = 'на Литургии';
                    else if (reading.type === 'На 6-м часе') speechType = 'на шестом часе';
                    else if (reading.type === 'На вечерне') speechType = 'на вечерне';
                    
                    const text = speechType ? `${speechType}: ${formattedText}` : formattedText;
                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = 'ru-RU';
                        utterance.rate = 0.9;
                        utterance.onend = () => {
                        resetAllMediaUI();
                            window._currentSynthRow = null;
                            
                            // Пытаемся запустить следующее чтение автоматически
                            const nextRow = row.nextElementSibling;
                            if (nextRow && nextRow.classList.contains('reading-row')) {
                                nextRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                nextRow.click();
                            }
                        };
                        speechSynthesis.speak(utterance);
                    }
                }
            });
            
            container.appendChild(row);
        });
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
            'равноап.': 'равноапостольный'
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

    // Load calendar data for specific date
    async function loadCalendarDate(date) {
        const dateStr = getDateString(date);
        
        try {
            const response = await fetch(`https://azbyka.ru/days/api/day/${dateStr}.json`);
            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            // Update Card Date Display
            const cardDateText = document.getElementById('card-date-text');
            if (cardDateText) cardDateText.textContent = formatDateShort(date);

            // Update Day of Week
            const dayOfWeek = document.getElementById('day-of-week');
            if (dayOfWeek) {
                const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
                const dayName = days[date.getDay()];
                dayOfWeek.textContent = dayName;
            }

            // Update Old Style Date
            const oldStyleDate = document.getElementById('old-style-date');
            if (oldStyleDate) oldStyleDate.textContent = getOldStyleDate(date);

            // Update Sedmitsa & Fasting Info
            const sedmitsaText = document.getElementById('sedmitsa-text');
            const fastingToneText = document.getElementById('fasting-tone-text');
            if (sedmitsaText) {
                const sedmitsa = data.fasting?.round_week || '';
                // Remove HTML tags
                const plainText = sedmitsa.replace(/<[^>]*>/g, '');
                sedmitsaText.textContent = plainText || 'Седмица 4-я Великого поста, Крестопоклонная';
            }
            if (fastingToneText) {
                const fastingInfo = [];
                const fastingType = data.fasting?.type || data.fasting?.fasting || '';
                const voice = data.fasting?.voice || null;
                
                if (fastingType && fastingType !== 'no_fast' && fastingType !== 'unknown') {
                    fastingInfo.push('Постный день');
                }
                if (voice) {
                    fastingInfo.push(`Глас ${voice}`);
                }
                fastingToneText.textContent = fastingInfo.length > 0 ? fastingInfo.join('. ') : 'Постный день. Глас 7-й';
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
                const desc = data.fastingDescription || '';
                if (desc.length > 0) {
                    fastingPillText.textContent = desc.split(',')[0].toUpperCase();
                } else {
                    fastingPillText.textContent = data.fasting === 1 ? 'МЯСОЕД' : 'ПОСТ';
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

            renderReadings(data.readings || [], data.texts || []);

        } catch (error) {
            console.error('[Calendar] Error:', error);
            renderDateSlider(date);
        }
    }

    // Initialize calendar with today's date or saved date
    async function loadChurchToday() {
        const savedDate = localStorage.getItem('selectedDate');
        if (savedDate) {
            currentNavDate = new Date(savedDate);
        } else {
            currentNavDate = new Date();
        }
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
                    const fastingType = data.fasting;
                    const fastingDescription = data.fastingDescription || data.description || '';
                    const isFast = (fastingType && fastingType !== 'no_fast' && fastingType !== 'unknown') || 
                                 fastingDescription.toLowerCase().includes('пост');
                    
                    liturgicalCache[key].days[d] = {
                        isFast: isFast,
                        isHoliday: (data.priority && data.priority > 3) || (data.holy_day && data.holy_day.length > 0)
                    };
                })
                .catch(() => {})
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
            cell.className = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
            
            // 1. Try to use API data from Cache
            if (liturgicalCache[cacheKey] && liturgicalCache[cacheKey].days[day]) {
                const api = liturgicalCache[cacheKey].days[day];
                if (api.isFast) cell.classList.add('has-fast');
                if (api.isHoliday) cell.classList.add('has-holiday');
            } else {
                // 2. Fallback: Simulation for 2026 (until API data loads)
                if (year === 2026) {
                    if (month === 3 && day === 12) {
                        cell.classList.add('important');
                        cell.classList.add('has-holiday');
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
        });
    }

    // Re-initialize when language changes
    const originalUpdateAppLanguage = updateAppLanguage;
    updateAppLanguage = function() {
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

    // --- Initialization ---
    initPsalm50Audio(); // Настройка аудио Псалма 50
    applyTheme();
    updateAppLanguage();
    applyLanguageFont();
    updateLanguageUI();
    loadChurchToday(); // Load calendar data
    renderRandomQuote(); // Load random quote on startup
    switchTab('church-empty'); // Start on Church Today tab
});

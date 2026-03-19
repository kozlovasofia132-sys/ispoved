import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getSinsData, setProfile, getProfile } from './data/sins.js';
import { translations } from './data/translations.js';
import { preparationData } from './data/preparation.js';
import { quotes } from './data/quotes.js';
import { prayersData } from './data/prayers.js';
import { getTodayInfo, getFastingIcon, getFastingColor } from './services/calendarService.js';


document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        'church-empty': document.getElementById('tab-church-empty'),
        'church-today': document.getElementById('tab-church-today'),
        settings: document.getElementById('tab-settings'),
    };

    const headerTitle = document.getElementById('header-title');
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

    // --- Biometric Protection State ---
    let isBiometricEnabled = localStorage.getItem('biometricEnabled') === 'true';

    // --- Teleprompter State ---
    let isAutoscrolling = false;
    let autoscrollSpeed = 30; // pixels per second
    let autoscrollRequestId = null;
    let lastAutoscrollTimestamp = 0;

    // --- Audio Player State ---
    let isAudioPlaying = false;
    let audioProgressValue = 0;
    let audioIntervalId = null;

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
            case 'church-empty': headerKey = 'churchToday'; break;
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
        if (tabId === 'list' && isPinEnabled && selectedSins.length > 0) {
            let authenticated = false;

            if (isBiometricEnabled) {
                authenticated = await verifyBiometric();
            }

            // Если уже разблокировано в этой сессии, не запрашиваем ПИН снова
            if (!isUnlocked) {
                if (!authenticated && hashedPin) {
                    pendingTabAfterAuth = 'list';
                    openPinPad(false);
                    return;
                } else if (!authenticated) {
                    return; // Access denied or cancelled bio without PIN
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
        if (tabId === 'list' && typeof window.autoResizeNotes === 'function') {
            window.autoResizeNotes();
        }
        if (tabId === 'church-today') {
            renderPreparation();
        }
    }

    async function verifyBiometric() {
        if (!window.PublicKeyCredential) {
            alert(t('biometricNotSupported'));
            return false;
        }

        try {
            // Standard WebAuthn check for local identity verify. 
            // Note: In real app, you'd store a credential, but for simple local 
            // 'is it you' on mobile, some WebViews support simpler 'get'.
            // Here we use a dummy request to trigger the native prompt if possible.
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // This is a minimal WebAuthn call that often triggers biometric prompt on Android
            const options = {
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    allowCredentials: [], // Forces it to use platform authenticator if user is registered, 
                    // or just generic device auth if configured.
                    userVerification: "required"
                }
            };

            // Note: Actual WebAuthn requires a registered credential.
            // As a "lightweight" alternative for this specific task, 
            // we'll assume the user might not have a credential registered yet 
            // or simply simulate the interaction if WebAuthn is unavailable/mocked.
            // If the user wants "REAL" biometric without a server, WebAuthn is tricky 
            // without a prior 'create'.

            // Simplified approach for the task: 
            // Since we can't use NPM packages, we attempt a generic platform verification.
            // If it fails, we fall back to PIN.

            // Attempting a 'get' with an empty list often prompts for device screen lock/bio
            // on modern Android/Chrome if 'userVerification' is required.
            const credential = await navigator.credentials.get(options);
            return !!credential;
        } catch (err) {
            console.error('Biometric error:', err);
            return false;
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
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

        const accentColors = {
            indigo: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/20', icon: 'text-indigo-400' },
            amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: 'text-amber-400' },
            rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/20', icon: 'text-rose-400' },
            emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
            sky: { bg: 'bg-sky-500/15', border: 'border-sky-500/20', icon: 'text-sky-400' },
        };

        let resultHtml = '';

        // 2. Loop through ALL data
        preparationData.forEach((card, index) => {
            console.log(`Rendering card ${index + 1}: ${card.id}`);
            
            const title = t(card.titleKey);
            const body = t(card.bodyKey);
            const c = accentColors[card.color] || accentColors.indigo;

            const scripture = card.scriptureKey ? t(card.scriptureKey) : '';
            const scripture2 = card.scriptureKey2 ? t(card.scriptureKey2) : '';
            const saints = card.saintsKey ? t(card.saintsKey) : '';
            const advice = card.adviceKey ? t(card.adviceKey) : '';
            const setup = card.setupKey ? t(card.setupKey) : '';

            const speechParts = [body, scripture, scripture2, saints, advice, setup].filter(p => p && p.trim().length > 0);
            const fullSpeechText = speechParts.join('. ');
            const quoteClass = "italic text-slate-300 border-l-4 border-primary pl-4 my-4 leading-relaxed text-sm";

            resultHtml += `
            <details name="accordion-group" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500 mb-4">
                <summary class="cursor-pointer flex items-center gap-4 p-5 select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                    <div class="w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined ${c.icon} text-xl">${card.icon}</span>
                    </div>
                    <span class="flex-1 text-lg font-bold text-white tracking-tight">${title}</span>
                    <button class="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-primary transition-all active:scale-90" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.toggleSpeech(\`${fullSpeechText.replace(/"/g, '&quot;').replace(/'/g, "\\'")}\`, 'tts-icon-${card.id}')">
                        <span id="tts-icon-${card.id}" class="material-symbols-outlined text-xl">volume_up</span>
                    </button>
                    <span class="material-symbols-outlined text-white/30 group-open:rotate-180 transition-transform duration-300 text-xl">expand_more</span>
                </summary>
                <div class="px-5 pb-5 pt-1">
                    <div class="w-full h-px bg-white/5 mb-4"></div>
                    ${scripture ? `<p class="${quoteClass}">${scripture}</p>` : ''}
                    <p class="text-base text-slate-200 leading-relaxed mb-4">${body}</p>
                    ${saints ? `<p class="${quoteClass}">${saints}</p>` : ''}
                    ${advice ? `<p class="text-sm font-bold text-amber-200/80 mb-2">${advice}</p>` : ''}
                    ${setup ? `<p class="text-sm font-medium text-slate-300 mb-4">${setup}</p>` : ''}
                    ${scripture2 ? `<p class="${quoteClass}">${scripture2}</p>` : ''}
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
            
            // Переключаемся на каталог
            switchTab('catalog');
            
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
            pendingTabAfterAuth = 'list';
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

                        updateBiometricUIState(); // Enable biometric toggle now that PIN is set
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
                isBiometricEnabled = false;
                selectedSins = [];
                personalNotes = '';
                isUnlocked = false;

                // Обновляем UI биометрии
                if (biometricToggle) {
                    biometricToggle.checked = false;
                    biometricToggle.disabled = true;
                }
                updateBiometricUIState();

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
            localStorage.setItem('biometricEnabled', 'false');
            isPinEnabled = false;
            isBiometricEnabled = false;
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
                    updateBiometricUIState();
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
                        updateBiometricUIState();
                        console.log('[PIN] PIN setup success - toggle activated');
                    });
                }
            } else {
                // Пользователь хочет ВЫКЛЮЧИТЬ функцию ПИН-кода
                console.log('[PIN] Disabling PIN function');
                isPinEnabled = false;
                localStorage.setItem('pinEnabled', 'false');

                // Также отключаем биометрию
                isBiometricEnabled = false;
                localStorage.setItem('biometricEnabled', 'false');
                if (biometricToggle) {
                    biometricToggle.checked = false;
                    biometricToggle.disabled = true;
                }
                updateBiometricUIState();

                showToast(t('pinDisabled'));
            }
        });
    } else {
        console.error('[PIN] pin-toggle element NOT FOUND in DOM!');
    }

    const biometricToggle = document.getElementById('biometric-toggle');
    const biometricToggleText = document.getElementById('biometric-toggle-text');
    const changePinContainer = document.getElementById('change-pin-container');
    const changePinBtn = document.getElementById('change-pin-btn');

    function updateBiometricUIState() {
        if (!biometricToggle) return;
        const pinActive = isPinEnabled && hashedPin;
        
        // Показываем/скрываем кнопку "Изменить ПИН-код"
        if (changePinContainer) {
            changePinContainer.classList.toggle('hidden', !pinActive);
        }
        
        biometricToggle.disabled = !pinActive;
        if (biometricToggleText) {
            biometricToggleText.classList.toggle('opacity-50', !pinActive);
        }
        const parentLabel = biometricToggle.nextElementSibling;
        if (parentLabel && parentLabel.classList.contains('peer-focus:outline-none')) {
            // the div with transitions
            parentLabel.classList.toggle('opacity-50', !pinActive);
        }
    }

    if (biometricToggle) {
        biometricToggle.checked = isBiometricEnabled;
        updateBiometricUIState();

        biometricToggle.addEventListener('change', (e) => {
            isBiometricEnabled = e.target.checked;
            localStorage.setItem('biometricEnabled', isBiometricEnabled);
        });
    }

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

            if (prayersModalHeaderText) {
                // Determine title from prayerId or data-t
                const titleKey = prayerId === 'canons' ? 'threeCanons' :
                    prayerId === 'theotokosCanon' ? 'theotokosCanon' :
                        prayerId === 'guardianAngelCanon' ? 'guardianAngelCanon' :
                            prayerId === 'repentanceCanon' ? 'repentanceCanon' :
                                (prayerId === 'beforeCommunion' ? 'beforeCommunion' : 'afterCommunion');
                prayersModalHeaderText.textContent = t(titleKey);
            }
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
            showAudioPlayerBar();
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
        btn.addEventListener('click', () => {
            const prayerId = btn.dataset.prayerId;
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
        if (!audioPlayerBar) return;

        // Show stub notification instead of playing audio
        showToast(t('audioPlaybackNotAvailable'));

        // Reset button state to play icon
        if (audioPlayIcon) audioPlayIcon.textContent = 'play_arrow';
    }

    function startAudioProgress() {
        if (audioIntervalId) return;

        audioIntervalId = setInterval(() => {
            audioProgressValue += 0.5;
            if (audioProgressValue >= 100) {
                audioProgressValue = 0;
                toggleAudioPlayPause(); // Stop when complete
            }
            if (audioProgress) {
                audioProgress.style.width = `${audioProgressValue}%`;
            }
        }, 100);
    }

    function stopAudioProgress() {
        if (audioIntervalId) {
            clearInterval(audioIntervalId);
            audioIntervalId = null;
        }
    }

    function resetAudioPlayer() {
        isAudioPlaying = false;
        audioProgressValue = 0;
        stopAudioProgress();
        if (audioPlayIcon) audioPlayIcon.textContent = 'play_arrow';
        if (audioProgress) audioProgress.style.width = '0%';
    }

    // Show audio player bar when prayers modal is opened
    function showAudioPlayerBar() {
        if (audioPlayerBar) {
            audioPlayerBar.classList.remove('hidden');
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

    // === Church Today Tab - Calendar & Prayers ===
    async function loadChurchToday() {
        // Load calendar data
        const todayInfo = await getTodayInfo();
        if (todayInfo.success) {
            const dateEl = document.getElementById('church-today-date');
            const fastingEl = document.getElementById('church-today-fasting');
            const fastingIconEl = document.getElementById('church-today-fasting-icon');
            const memoryEl = document.getElementById('church-today-memory');
            
            if (dateEl) dateEl.textContent = todayInfo.data.date;
            if (fastingEl) fastingEl.textContent = todayInfo.data.fastingDescription;
            if (fastingIconEl) {
                const iconSpan = fastingIconEl.querySelector('span');
                if (iconSpan) iconSpan.textContent = getFastingIcon(todayInfo.data.fasting);
                fastingIconEl.className = `w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${getFastingColor(todayInfo.data.fasting)}`;
            }
            if (memoryEl) {
                const memoryText = Array.isArray(todayInfo.data.memory) 
                    ? todayInfo.data.memory.slice(0, 2).join('. ') 
                    : todayInfo.data.memory;
                memoryEl.textContent = memoryText || '';
            }
        }
        
        // Load prayers quick access
        const prayersContainer = document.getElementById('church-today-prayers');
        if (prayersContainer) {
            const prayersList = [
                { id: 'repentanceCanon', icon: 'local_fire_department', color: 'text-red-400', bg: 'bg-red-500/20', key: 'repentanceCanon' },
                { id: 'theotokosCanon', icon: 'stars', color: 'text-amber-400', bg: 'bg-amber-500/20', key: 'theotokosCanon' },
                { id: 'guardianAngelCanon', icon: 'flare', color: 'text-cyan-400', bg: 'bg-cyan-500/20', key: 'guardianAngelCanon' },
                { id: 'beforeCommunion', icon: 'menu_book', color: 'text-indigo-400', bg: 'bg-indigo-500/20', key: 'beforeCommunion' },
                { id: 'afterCommunion', icon: 'celebration', color: 'text-emerald-400', bg: 'bg-emerald-500/20', key: 'afterCommunion' }
            ];
            
            let prayersHtml = '';
            prayersList.forEach(prayer => {
                prayersHtml += `
                <button data-prayer-id="${prayer.id}"
                    class="prayer-menu-item w-full p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left">
                    <div class="w-10 h-10 rounded-full ${prayer.bg} flex items-center justify-center ${prayer.color}">
                        <span class="material-symbols-outlined">${prayer.icon}</span>
                    </div>
                    <span class="font-bold text-white/90" data-t="${prayer.key}"></span>
                    <span class="material-symbols-outlined ml-auto text-white/20">chevron_right</span>
                </button>`;
            });
            prayersContainer.innerHTML = prayersHtml;
            
            // Add click handlers for prayers
            prayersContainer.querySelectorAll('.prayer-menu-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const prayerId = btn.getAttribute('data-prayer-id');
                    openPrayerModal(prayerId);
                });
            });
        }
    }

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
            if (activeTab === 'catalog') {
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
    applyTheme();
    updateAppLanguage();
    applyLanguageFont();
    updateLanguageUI();
    loadChurchToday(); // Load calendar data
    renderRandomQuote(); // Load random quote on startup
    switchTab('church-empty'); // Start on Church Today tab
});

import './style.css';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { getSinsData } from './data/sins.js';
import { translations } from './data/translations.js';
import { preparationData } from './data/preparation.js';
import { quotes } from './data/quotes.js';


document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        catalog: document.getElementById('tab-catalog'),
        list: document.getElementById('tab-list'),
        preparation: document.getElementById('tab-preparation'),
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

    // My List Controls
    const toggleAllBtn = document.getElementById('toggle-all-btn');
    const formulaContainer = document.getElementById('formula-container');



    // --- State ---
    let activeTab = 'catalog';
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
            case 'catalog': headerKey = 'catalogHeader'; break;
            case 'list': headerKey = 'notesTitle'; break;
            case 'preparation': headerKey = ''; break; // header hidden for prep (hero image used)
            case 'settings': headerKey = 'settings'; break;
            default: headerKey = 'appName';
        }
        headerTitle.textContent = headerKey ? t(headerKey) : '';
    }


    // --- Tab Navigation ---
    function switchTab(tabId) {
        if (!tabContents[tabId]) return;
        activeTab = tabId;

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
        if (tabId === 'preparation') {
            renderPreparation();
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
                god: 'from-[#1a237e]/40 via-[#121212]/30 to-transparent',
                neighbors: 'from-[#2e7d32]/40 via-[#121212]/30 to-transparent',
                self: 'from-[#4e342e]/40 via-[#121212]/30 to-transparent'
            };

            const accentColor = category.id === 'god' ? 'text-primary' : (category.id === 'neighbors' ? 'text-blue-400' : 'text-emerald-400');
            const bgGradient = gradients[category.id] || 'from-slate-800/30 to-transparent';

            catalogHtml += `
            <details name="accordion-group" class="group glass-panel rounded-[28px] overflow-hidden transition-all duration-500 hover:shadow-primary/10">
                <summary class="cursor-pointer relative min-h-[170px] flex flex-col justify-end p-7 select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                    <div class="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 group-open:opacity-30 transition-all duration-700 scale-105 group-hover:scale-110 brightness-110 saturate-[1.25]" style="background-image: url('${category.image}')"></div>
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
                const hasExplanation = sin.explanation && (sin.explanation[currentLanguage] || sin.explanation.ru);
                const isSerious = sin.severity === 'serious';
                
                catalogHtml += `
                <div class="relative p-0.5 mb-2 rounded-2xl transition-all ${isSerious ? 'bg-gradient-to-r from-amber-500/30 to-transparent' : ''}">
                    <label class="flex items-start gap-4 p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/item ${isSerious ? 'border-l-4 border-amber-500 pl-3' : ''}">
                            <input class="sin-checkbox mt-0.5 transition-all cursor-pointer" type="checkbox" value="${sin.id}" ${isSelected ? 'checked' : ''}/>
                            <div class="flex-1">
                                <p class="text-sm text-slate-900 dark:text-slate-200 font-bold group-hover/item:text-black dark:group-hover/item:text-white transition-colors leading-[1.4]">${sinText}</p>
                                ${hasExplanation ? `
                                <div id="expl-${sin.id}" class="hidden mt-2 p-3 bg-white/50 dark:bg-black/30 rounded-lg text-xs italic text-slate-600 dark:text-slate-400 border border-black/5 dark:border-white/5">
                                    ${sin.explanation[currentLanguage] || sin.explanation.ru}
                                </div>
                                ` : ''}
                            </div>
                            ${hasExplanation ? `
                            <button type="button" class="explanation-toggle w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all" data-sin-id="${sin.id}">
                                <span class="material-symbols-outlined text-xl">help</span>
                            </button>
                            ` : ''}
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

        catalogContainer.querySelectorAll('.explanation-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sinId = btn.getAttribute('data-sin-id');
                const explDiv = document.getElementById(`expl-${sinId}`);
                if (explDiv) {
                    explDiv.classList.toggle('hidden');
                }
            });
        });
    }

    // --- Render Preparation ---
    function renderPreparation() {
        const container = document.getElementById('preparation-container');
        if (!container) return;

        const accentColors = {
            indigo: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/20', icon: 'text-indigo-400' },
            amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: 'text-amber-400' },
            rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/20', icon: 'text-rose-400' },
            emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
            sky: { bg: 'bg-sky-500/15', border: 'border-sky-500/20', icon: 'text-sky-400' },
        };

        let html = '';

        // Add Dynamic Wisdom Block
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        html += `
        <div class="mb-8 animate-fade-in-up">
            <p class="text-[11px] font-bold tracking-[0.2em] text-primary uppercase mb-4 text-center" data-t="wisdomTitle">${t('wisdomTitle')}</p>
            <div class="quote-card">
                <span class="quote-icon quote-icon-start">“</span>
                <p class="quote-text">${randomQuote.text}</p>
                <span class="quote-icon quote-icon-end">”</span>
                <span class="quote-author author-font">— ${randomQuote.author}</span>
            </div>
            <button id="refresh-quote-btn" class="refresh-quote-btn">
                <span class="material-symbols-outlined">refresh</span>
                <span data-t="refreshQuote">${t('refreshQuote')}</span>
            </button>
        </div>
        `;

        preparationData.forEach(card => {
            const title = t(card.titleKey);
            const body = t(card.bodyKey);
            const c = accentColors[card.color] || accentColors.indigo;

            // Extra pieces of content
            const scripture = card.scriptureKey ? t(card.scriptureKey) : '';
            const scripture2 = card.scriptureKey2 ? t(card.scriptureKey2) : '';
            const saints = card.saintsKey ? t(card.saintsKey) : '';
            const advice = card.adviceKey ? t(card.adviceKey) : '';
            const setup = card.setupKey ? t(card.setupKey) : '';

            let speechParts = [body, scripture, scripture2, saints, advice, setup].filter(p => p && p.trim().length > 0);
            let fullSpeechText = speechParts.join('. ');

            const quoteClass = "italic text-slate-300 border-l-4 border-primary pl-4 my-4 leading-relaxed text-sm";

            html += `
            <details name="accordion-group" class="group glass-panel rounded-2xl overflow-hidden transition-all duration-500">
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

        container.innerHTML = html;

        // Auto-scroll logic for Preparation
        container.querySelectorAll('details').forEach(details => {
            details.ontoggle = () => {
                if (details.open) {
                    setTimeout(() => {
                        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            };
        });

        const footerTitle = t('prep_footer_title');
        const footerBody = t('prep_footer_body');
        html += `
        <div class="glass-panel rounded-2xl p-6 border-t-2 border-t-primary/30 mt-4 overflow-hidden relative">
            <div class="absolute -right-4 -bottom-4 opacity-10">
                <span class="material-symbols-outlined text-8xl text-white">menu_book</span>
            </div>
            <div class="flex items-start justify-between mb-2">
                <h3 class="text-xl font-bold text-white">${footerTitle}</h3>
                <button class="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-primary transition-all active:scale-90"
                        onclick="window.toggleSpeech(\`${(footerBody).replace(/"/g, '&quot;').replace(/'/g, "\\'")}\`, 'tts-icon-footer')">
                    <span id="tts-icon-footer" class="material-symbols-outlined text-xl">volume_up</span>
                </button>
            </div>
            <p class="text-base text-slate-300 leading-relaxed relative z-10">${footerBody}</p>
        </div>
        `;

        html += `
        <div class="pt-6 pb-2">
            <button id="prep-ready-btn" class="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base tracking-wide shadow-lg shadow-primary/25 active:scale-95 transition-all hover:bg-primary/90 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-xl">verified</span>
                <span>${t('readyBtn')}</span>
            </button>
        </div>
        `;

        container.innerHTML = html;

        // Refresh quote logic
        const refreshBtn = document.getElementById('refresh-quote-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const icon = refreshBtn.querySelector('.material-symbols-outlined');
                if (icon) icon.style.transform = (icon.style.transform === 'rotate(360deg)') ? 'rotate(0deg)' : 'rotate(360deg)';
                renderPreparation();
            });
        }

        const readyBtn = document.getElementById('prep-ready-btn');
        const readyModal = document.getElementById('prep-ready-modal');
        const readyCloseBtn = document.getElementById('prep-ready-close-btn');

        if (readyBtn && readyModal) {
            readyBtn.addEventListener('click', () => readyModal.classList.remove('hidden'));
        }

        if (readyCloseBtn && readyModal) {
            readyCloseBtn.addEventListener('click', () => readyModal.classList.add('hidden'));
        }

        if (readyModal) {
            readyModal.addEventListener('click', (e) => {
                if (e.target === readyModal) {
                    readyModal.classList.add('hidden');
                }
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
    const readingModeFooter = document.getElementById('reading-mode-footer');
    const completeConfessionBtn = document.getElementById('complete-confession-btn');

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
            requestWakeLock();
        });
    }

    if (closeReadModeBtn && readingModeModal) {
        closeReadModeBtn.addEventListener('click', () => {
            readingModeModal.classList.add('hidden');
            releaseWakeLock();
        });
    }

    if (completeConfessionBtn) {
        completeConfessionBtn.addEventListener('click', () => {
            readingModeModal.classList.add('hidden');
            releaseWakeLock();
            if (prayerModal) {
                prayerModal.classList.remove('hidden');
            }
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
    const openClearModal = () => { if (clearModal) clearModal.classList.remove('hidden'); };
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
            btn.classList.toggle('bg-primary', isActive);
            btn.classList.toggle('text-white', isActive);
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
            updateMyList();
        });
    });

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



    // --- Initialization ---
    applyTheme();
    updateAppLanguage();
    applyLanguageFont();
    updateLanguageUI();
    switchTab('catalog');

    // --- Text-to-Speech Logic ---
    let speakingButtonId = null;

    async function stopSpeaking() {
        try {
            await TextToSpeech.stop();
        } catch (e) {
            console.error('Error stopping speech:', e);
        }
        
        if (speakingButtonId) {
            const btn = document.getElementById(speakingButtonId);
            if (btn) btn.classList.remove('pulse-tts');
        }
        speakingButtonId = null;
    }

    window.toggleSpeech = async function (text, buttonId) {
        if (speakingButtonId === buttonId) {
            await stopSpeaking();
            return;
        }

        await stopSpeaking();

        try {
            const langMap = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
            const targetLang = langMap[currentLanguage] || 'ru-RU';

            speakingButtonId = buttonId;
            const btn = document.getElementById(buttonId);
            if (btn) btn.classList.add('pulse-tts');

            await TextToSpeech.speak({
                text: text,
                lang: targetLang,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                category: 'ambient'
            });

            // If we reach here, speech finished normally
            if (speakingButtonId === buttonId) {
                await stopSpeaking();
            }
        } catch (e) {
            console.error('Speech error:', e);
            await stopSpeaking();
        }
    };

    // --- Tab Switching Update ---
    const originalSwitchTab = switchTab;
    window.switchTab = function (tabId) {
        stopSpeaking();
        originalSwitchTab(tabId);
    };

    // --- Language Update ---
    const originalUpdateAppLanguage = updateAppLanguage;
    window.updateAppLanguage = function () {
        stopSpeaking();
        originalUpdateAppLanguage();
    };
});

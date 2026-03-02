import './style.css';
import { getSinsData } from './data/sins.js';
import { translations } from './data/translations.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        catalog: document.getElementById('tab-catalog'),
        list: document.getElementById('tab-list'),
        settings: document.getElementById('tab-settings'),
    };

    const headerTitle = document.getElementById('header-title');
    const catalogContainer = document.getElementById('sins-container');
    const myListContainer = document.getElementById('my-list-container');
    const emptyState = document.getElementById('empty-state');
    const personalNotesArea = document.getElementById('personal-notes');
    const selectedCountValue = document.getElementById('selected-count-value');

    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeButtons = document.querySelectorAll('.font-size-btn');
    const langButtons = document.querySelectorAll('.lang-btn');


    const clearModal = document.getElementById('clear-modal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // Modals
    const aboutAppBtn = document.getElementById('about-app-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');
    const contactDevBtn = document.getElementById('contact-dev-btn');
    const contactModal = document.getElementById('contact-modal');
    const closeContactBtn = document.getElementById('close-contact-btn');

    // --- State ---
    let activeTab = 'catalog';
    let selectedSins = JSON.parse(localStorage.getItem('selectedSins')) || [];
    let isLargeFont = localStorage.getItem('isLargeFont') === 'true';
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let currentLanguage = localStorage.getItem('language') || 'ru';
    let personalNotes = localStorage.getItem('personalReflections') || '';

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
        updateMyList();
        applyFontSize();
        updateLanguageUI();
        document.title = t('appName');
    }

    function updateHeader() {
        if (!headerTitle) return;
        let headerKey = '';
        switch (activeTab) {
            case 'catalog': headerKey = 'catalogHeader'; break;
            case 'list': headerKey = 'notesHeader'; break;
            case 'settings': headerKey = 'settings'; break;
            default: headerKey = 'appName';
        }
        headerTitle.textContent = t(headerKey);

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
            const accentColor = category.id === 'god' ? 'text-primary' : (category.id === 'neighbors' ? 'text-blue-400' : 'text-emerald-400');

            catalogHtml += `
            <details class="group glass-panel rounded-[32px] overflow-hidden transition-all duration-300">
                <summary class="cursor-pointer relative min-h-[180px] flex flex-col justify-end p-7 select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                    <div class="absolute inset-0 z-0 bg-black">
                        <img src="${category.image}" class="w-full h-full object-cover opacity-60 group-open:opacity-30 transition-opacity duration-300" alt="">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                    </div>
                    <div class="relative z-10 flex items-end justify-between">
                        <div class="space-y-0.5">
                            <span class="text-[10px] font-bold tracking-[0.15em] uppercase ${accentColor} block opacity-90">${subtitle}</span>
                            <h3 class="text-2xl font-bold text-white tracking-tight">${title}</h3>
                        </div>
                        <span class="material-symbols-outlined text-white/50 group-open:rotate-180 transition-transform duration-300 text-[32px]">expand_more</span>
                    </div>
                </summary>
                <div class="px-5 pb-5 space-y-1 bg-background-dark/30 backdrop-blur-md">
            `;

            category.sins.forEach((sin) => {
                const sinText = sin.text[currentLanguage] || sin.text.ru;
                const isSelected = selectedSins.some(s => s.id === sin.id);
                catalogHtml += `
                    <label class="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/item">
                        <input class="sin-checkbox mt-1 transition-all cursor-pointer" type="checkbox" value="${sin.id}" ${isSelected ? 'checked' : ''}/>
                        <div class="flex-1">
                            <p class="text-sm text-slate-200 font-medium group-hover/item:text-white transition-colors">${sinText}</p>
                        </div>
                    </label>
                `;
            });
            catalogHtml += '</div></details>';
        });

        catalogContainer.innerHTML = catalogHtml;
        catalogContainer.querySelectorAll('.sin-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.value;
                if (e.target.checked) {
                    if (!selectedSins.some(s => s.id === id)) selectedSins.push({ id: id, type: 'predefined' });
                } else {
                    selectedSins = selectedSins.filter(s => s.id !== id);
                }
                localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                updateMyList();
            });
        });
    }

    // --- Render My List ---
    function updateMyList() {
        if (!myListContainer) return;

        if (selectedCountValue) selectedCountValue.textContent = selectedSins.length;

        if (selectedSins.length === 0) {
            myListContainer.innerHTML = '';
            if (emptyState) emptyState.classList.replace('hidden', 'flex');
            return;
        }

        if (emptyState) emptyState.classList.replace('flex', 'hidden');

        let listHtml = '<div class="space-y-1.5 pl-2">';
        const data = getSinsData();

        selectedSins.forEach((item) => {
            let sinText = '';
            if (item.type === 'predefined') {
                const category = data.find(cat => cat.sins.some(s => s.id === item.id));
                const sin = category ? category.sins.find(s => s.id === item.id) : null;
                sinText = sin ? (sin.text[currentLanguage] || sin.text.ru) : item.id;
            } else {
                sinText = item.text;
            }

            listHtml += `
            <div class="relative flex items-start gap-2.5 group animate-fade-in-up">
                <span class="text-primary mt-1 text-[10px] select-none">•</span>
                <p class="text-[15px] text-slate-100 font-medium leading-[1.4] flex-1">
                    ${sinText}
                </p>
                <button value="${item.id}" class="list-sin-remove opacity-30 group-hover:opacity-100 p-0.5 rounded-md hover:bg-white/5 text-[#ab9db8]/40 hover:text-red-400 transition-all shrink-0">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
            `;
        });

        listHtml += '</div>';
        myListContainer.innerHTML = listHtml;

        myListContainer.querySelectorAll('.list-sin-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.value;
                selectedSins = selectedSins.filter(s => s.id !== id);
                localStorage.setItem('selectedSins', JSON.stringify(selectedSins));
                renderCatalog();
                updateMyList();
            });
        });
    }

    // --- Personal Notes ---
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

        // Initial resize
        setTimeout(window.autoResizeNotes, 0);
    }

    // --- Actions ---
    function openClearModal() { if (clearModal) clearModal.classList.remove('hidden'); }
    function closeClearModal() { if (clearModal) clearModal.classList.add('hidden'); }

    if (clearAllBtn) clearAllBtn.addEventListener('click', openClearModal);
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
            btn.classList.toggle('bg-white/5', !isActive);
            btn.classList.toggle('text-[#ab9db8]', !isActive);
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
            btn.classList.toggle('text-white/40', !isTarget);
        });
    }

    fontSizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            isLargeFont = btn.dataset.font === 'large';
            localStorage.setItem('isLargeFont', isLargeFont);
            applyFontSize();
        });
    });

    // --- Initialization ---
    applyTheme();
    updateAppLanguage();
    updateLanguageUI();
    switchTab('catalog');
});

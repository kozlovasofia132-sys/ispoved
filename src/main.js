import './style.css';
import { getSinsData } from './data/sins.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const tabsContainer = document.getElementById('bottom-nav');
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = {
        catalog: document.getElementById('tab-catalog'),
        list: document.getElementById('tab-list'),
        settings: document.getElementById('tab-settings'),
    };
    const pageTitle = document.getElementById('page-title');

    const catalogContainer = document.getElementById('sins-container');
    const myListContainer = document.getElementById('my-list-container');
    const emptyState = document.getElementById('empty-state');
    const clearListBtn = document.getElementById('clear-list-btn');

    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeContainer = document.getElementById('font-size-container');
    const fontSizeLabel = document.getElementById('font-size-label');

    // --- State ---
    let activeTab = 'settings';
    let selectedSins = new Set();
    let isLargeFont = localStorage.getItem('isLargeFont') === 'true';

    // Apply initial font size
    applyFontSize();

    // --- Tab Navigation ---
    const titles = {
        catalog: 'Исповедь',
        list: 'Заметки',
        settings: 'Настройки'
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tempTab = btn.getAttribute('data-tab');
            switchTab(tempTab);
        });
    });

    function switchTab(tabId) {
        activeTab = tabId;

        // Update Header
        pageTitle.textContent = titles[tabId];

        // Update Content Visibility
        Object.keys(tabContents).forEach(id => {
            if (id === tabId) {
                tabContents[id].classList.remove('hidden');
            } else {
                tabContents[id].classList.add('hidden');
            }
        });

        // Update Nav Styling
        navButtons.forEach(btn => {
            const icon = btn.querySelector('.nav-icon');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('text-[#0a84ff]');
                btn.classList.remove('text-[#8e8e93]');
                if (icon) icon.classList.add('font-variation-settings-fill');
            } else {
                btn.classList.remove('text-[#0a84ff]');
                btn.classList.add('text-[#8e8e93]');
                if (icon) icon.classList.remove('font-variation-settings-fill');
            }
        });
    }

    // --- Render Catalog ---
    const data = getSinsData();
    let catalogHtml = '';

    data.forEach((category, index) => {
        const isOpen = index === 0 ? 'open' : '';
        catalogHtml += `
        <details class="group rounded-2xl bg-[#1c1c1e] overflow-hidden transition-all duration-300 shadow-sm" ${isOpen}>
            <summary class="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-[#2c2c2e] transition-colors list-none [&::-webkit-details-marker]:hidden">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-[#2c2c2e] flex items-center justify-center text-[#0a84ff]">
                        <span class="material-symbols-outlined text-[20px]">${category.icon}</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-white text-[17px] leading-tight mb-0.5">${category.title}</h3>
                        <p class="text-[13px] text-[#8e8e93] font-normal">${category.subtitle}</p>
                    </div>
                </div>
                <div class="w-7 h-7 rounded-full bg-[#2c2c2e] flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                    <span class="material-symbols-outlined text-[#8e8e93] text-[18px]">expand_more</span>
                </div>
            </summary>
            <div class="flex flex-col border-t border-[#38383a]">
        `;

        category.sins.forEach((sin, i) => {
            const isLast = i === category.sins.length - 1;
            const borderClass = isLast ? '' : 'border-b border-[#38383a] ml-12';
            const paddingClass = isLast ? 'pb-3' : '';

            catalogHtml += `
                <label class="flex items-center gap-3 py-3 pr-4 cursor-pointer group/item hover:bg-[#2c2c2e] transition-colors pl-4 ${paddingClass}">
                    <input class="sin-checkbox ios-checkbox flex-shrink-0 transition-all cursor-pointer" type="checkbox" value="${sin}"/>
                    <span class="text-[#f2f2f7] text-[17px] font-normal leading-snug flex-1">${sin}</span>
                </label>
                ${!isLast ? `<div class="${borderClass}"></div>` : ''}
            `;
        });

        catalogHtml += `
            </div>
        </details>
        `;
    });

    if (catalogContainer) {
        catalogContainer.innerHTML = catalogHtml;

        // Attach Event Listeners to Checkboxes
        const checkboxes = catalogContainer.querySelectorAll('.sin-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedSins.add(e.target.value);
                } else {
                    selectedSins.delete(e.target.value);
                }
                updateMyList();
            });
        });
    }

    // --- Render My List ---
    function updateMyList() {
        if (selectedSins.size === 0) {
            myListContainer.innerHTML = '';
            myListContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            clearListBtn.parentElement.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        clearListBtn.parentElement.classList.remove('hidden');
        myListContainer.classList.remove('hidden');

        let listHtml = '';
        const sinsArray = Array.from(selectedSins);

        sinsArray.forEach((sin, index) => {
            const isLast = index === sinsArray.length - 1;
            const borderClass = isLast ? '' : 'border-b border-[#38383a] ml-12';

            listHtml += `
            <label class="group flex cursor-pointer items-center gap-3 py-3 pr-4 transition-colors hover:bg-[#2c2c2e] pl-4">
                <input checked class="list-sin-checkbox ios-checkbox flex-shrink-0 transition-all cursor-pointer" type="checkbox" value="${sin}"/>
                <span class="flex-1 text-[17px] font-normal text-[#f2f2f7] leading-snug">${sin}</span>
            </label>
            ${!isLast ? `<div class="${borderClass}"></div>` : ''}
            `;
        });

        myListContainer.innerHTML = listHtml;

        // Allow unchecking from my list
        const listCheckboxes = myListContainer.querySelectorAll('.list-sin-checkbox');
        listCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    selectedSins.delete(e.target.value);
                    // Update catalog checkbox to match
                    const catalogCheckbox = Array.from(catalogContainer.querySelectorAll('.sin-checkbox'))
                        .find(catCb => catCb.value === e.target.value);
                    if (catalogCheckbox) catalogCheckbox.checked = false;

                    updateMyList();
                }
            });
        });
    }

    if (clearListBtn) {
        clearListBtn.addEventListener('click', () => {
            selectedSins.clear();
            const checkboxes = catalogContainer.querySelectorAll('.sin-checkbox');
            checkboxes.forEach(cb => cb.checked = false);
            updateMyList();
        });
    }

    // --- Settings ---
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });

        // Init theme state based on current html class
        themeToggle.checked = document.documentElement.classList.contains('dark');
    }

    function applyFontSize() {
        if (isLargeFont) {
            document.documentElement.style.fontSize = '21px'; // Even larger
            if (fontSizeLabel) fontSizeLabel.textContent = 'Крупный';
        } else {
            document.documentElement.style.fontSize = '17px'; // iOS standard body size roughly 17px default
            if (fontSizeLabel) fontSizeLabel.textContent = 'Обычный';
        }
    }

    if (fontSizeContainer) {
        fontSizeContainer.addEventListener('click', () => {
            isLargeFont = !isLargeFont;
            localStorage.setItem('isLargeFont', isLargeFont);
            applyFontSize();
        });
    }

    // Initial render
    switchTab('settings');
    updateMyList();
});

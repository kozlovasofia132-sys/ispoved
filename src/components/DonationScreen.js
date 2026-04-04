// Donation Screen Component - "Благая лепта"

export function createDonationScreen() {
    const container = document.createElement('div');
    container.id = 'donation-screen-overlay';
    container.className = 'fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-6';

    container.innerHTML = `
        <div class="bg-bg w-full max-w-[420px] rounded-[36px] overflow-hidden shadow-2xl border border-border animate-fade-in-up flex flex-col">
            <!-- Header -->
            <div class="shrink-0 p-6 border-b border-border">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary-gold/10 flex items-center justify-center border border-primary-gold/20">
                            <span class="material-symbols-outlined text-primary-gold text-2xl">favorite</span>
                        </div>
                        <h2 class="text-2xl font-serif font-bold text-text-main">Принести лепту</h2>
                    </div>
                    <button id="close-donation-btn" class="w-10 h-10 rounded-full hover:bg-surface-alt flex items-center justify-center text-text-muted transition-all active:scale-90">
                        <span class="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>
                <p class="text-sm text-text-muted leading-relaxed">
                    Ваше пожертвование помогает развитию приложения «Исповедь»
                </p>
            </div>

            <!-- Content -->
            <div class="p-6 flex flex-col gap-5">
                <!-- Bible Quote -->
                <div class="p-4 rounded-xl bg-primary-gold/5 border border-primary-gold/10">
                    <p class="text-sm font-serif italic text-primary-gold leading-relaxed">
                        «Благая лепта вдовицы не оскудеет, но умножится»
                    </p>
                    <p class="text-[10px] text-text-muted mt-2">— Евангелие от Луки, 21:1-4</p>
                </div>

                <!-- Card number -->
                <div class="flex flex-col gap-2">
                    <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Перевод по номеру карты</p>
                    <div class="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border">
                        <div>
                            <p class="text-xl font-bold text-text-main tracking-wide font-mono">2200 7004 2585 7306</p>
                            <p class="text-xs text-text-muted mt-1">Т-Банк · Карта МИР</p>
                        </div>
                        <button id="copy-card-btn" class="shrink-0 w-12 h-12 rounded-xl bg-primary-gold/10 border border-primary-gold/20
                               hover:bg-primary-gold/20 active:scale-90 transition-all flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary-gold text-2xl">content_copy</span>
                        </button>
                    </div>
                    <p id="copy-card-success" class="text-xs text-center text-green-600 dark:text-green-400 hidden">
                        ✓ Номер карты скопирован
                    </p>
                </div>

                <!-- Sber card -->
                <div class="flex flex-col gap-2">
                    <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Или на карту Сбербанк</p>
                    <div class="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border">
                        <div>
                            <p class="text-xl font-bold text-text-main tracking-wide font-mono">2202 2088 8035 5541</p>
                            <p class="text-xs text-text-muted mt-1">Сбербанк · Карта МИР</p>
                        </div>
                        <button id="copy-sber-btn" class="shrink-0 w-12 h-12 rounded-xl bg-primary-gold/10 border border-primary-gold/20
                               hover:bg-primary-gold/20 active:scale-90 transition-all flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary-gold text-2xl">content_copy</span>
                        </button>
                    </div>
                    <p id="copy-sber-success" class="text-xs text-center text-green-600 dark:text-green-400 hidden">
                        ✓ Номер карты скопирован
                    </p>
                </div>

                <!-- How to pay -->
                <div class="p-4 rounded-2xl bg-surface-container-highest border border-border">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-text-muted text-xl mt-0.5">info</span>
                        <p class="text-sm text-text-muted leading-relaxed">
                            Откройте приложение вашего банка → «Перевод по номеру карты» → вставьте номер карты
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 pb-6 text-center">
                <p class="text-sm font-serif italic text-text-muted">
                    Спаси Господи за вашу поддержку!
                </p>
            </div>
        </div>
    `;

    return container;
}

export function initDonationScreen() {
    const closeDonationBtn = document.getElementById('close-donation-btn');
    const copyCardBtn = document.getElementById('copy-card-btn');
    const copyCardSuccess = document.getElementById('copy-card-success');
    const copySberBtn = document.getElementById('copy-sber-btn');
    const copySberSuccess = document.getElementById('copy-sber-success');
    const overlay = document.getElementById('donation-screen-overlay');

    if (closeDonationBtn) {
        closeDonationBtn.addEventListener('click', closeDonationScreen);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeDonationScreen();
        });
    }

    if (copyCardBtn) {
        copyCardBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText('2200700425857306');
            } catch {
                const el = document.createElement('input');
                el.value = '2200700425857306';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }

            copyCardSuccess.classList.remove('hidden');
            setTimeout(() => copyCardSuccess.classList.add('hidden'), 2500);
        });
    }

    if (copySberBtn) {
        copySberBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText('2202208880355541');
            } catch {
                const el = document.createElement('input');
                el.value = '2202208880355541';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }

            copySberSuccess.classList.remove('hidden');
            setTimeout(() => copySberSuccess.classList.add('hidden'), 2500);
        });
    }
}

export function openDonationScreen() {
    const overlay = document.getElementById('donation-screen-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
}

export function closeDonationScreen() {
    const overlay = document.getElementById('donation-screen-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

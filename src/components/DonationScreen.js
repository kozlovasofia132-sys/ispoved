// Donation Screen Component - "Благая лепта"
// Экран пожертвований в стиле "The Sacred Digital Archive"

export function createDonationScreen() {
    const container = document.createElement('div');
    container.id = 'donation-screen-overlay';
    container.className = 'fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-6';
    
    container.innerHTML = `
        <div class="bg-bg w-full max-w-[420px] max-h-[85vh] rounded-[36px] overflow-hidden shadow-2xl border border-border animate-fade-in-up flex flex-col">
            <!-- Header -->
            <div class="shrink-0 p-6 border-b border-border">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary-gold/10 flex items-center justify-center border border-primary-gold/20">
                            <span class="material-symbols-outlined text-primary-gold text-2xl">favorite</span>
                        </div>
                        <h2 class="text-2xl font-serif font-bold text-text-main">Благая лепта</h2>
                    </div>
                    <button id="close-donation-btn" class="w-10 h-10 rounded-full hover:bg-surface-alt flex items-center justify-center text-text-muted transition-all active:scale-90">
                        <span class="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>
                
                <p class="text-sm text-text-muted leading-relaxed">
                    Ваша поддержка помогает развивать приложение и делать его доступным для всех верующих.
                </p>
            </div>
            
            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-6 no-scrollbar">
                <!-- Bible Quote -->
                <div class="p-4 rounded-xl bg-primary-gold/5 border border-primary-gold/10 mb-6">
                    <p class="text-sm font-serif italic text-primary-gold leading-relaxed">
                        «Благая лепта вдовицы не оскудеет, но умножится»
                    </p>
                    <p class="text-[10px] text-text-muted mt-2">— Евангелие от Луки, 21:1-4</p>
                </div>
                
                <!-- Donation Amount -->
                <div class="mb-6">
                    <h3 class="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Выберите сумму</h3>
                    
                    <div class="grid grid-cols-3 gap-3">
                        <button class="donation-amount-btn py-4 rounded-2xl border-2 border-border font-bold text-text-main hover:bg-surface-alt hover:border-primary-gold/30 transition-all focus:border-primary-gold active:scale-95" data-amount="100">
                            100 ₽
                        </button>
                        <button class="donation-amount-btn py-4 rounded-2xl border-2 border-border font-bold text-text-main hover:bg-surface-alt hover:border-primary-gold/30 transition-all focus:border-primary-gold active:scale-95" data-amount="300">
                            300 ₽
                        </button>
                        <button class="donation-amount-btn py-4 rounded-2xl border-2 border-border font-bold text-text-main hover:bg-surface-alt hover:border-primary-gold/30 transition-all focus:border-primary-gold active:scale-95" data-amount="500">
                            500 ₽
                        </button>
                    </div>
                    
                    <button class="donation-amount-btn w-full mt-3 py-4 rounded-2xl border-2 border-border font-bold text-text-main hover:bg-surface-alt hover:border-primary-gold/30 transition-all focus:border-primary-gold active:scale-95" data-amount="custom">
                        Другая сумма
                    </button>
                </div>
                
                <!-- Donation Methods -->
                <div class="mb-6">
                    <h3 class="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Способ пожертвования</h3>
                    
                    <div class="space-y-3">
                        <!-- SBP Button -->
                        <button id="donate-sbp-btn" class="w-full p-4 rounded-2xl bg-surface border border-border hover:border-primary-gold/30 transition-all active:scale-[0.98] text-left">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-[#0057B8]/10 flex items-center justify-center shrink-0">
                                    <span class="material-symbols-outlined text-[#0057B8] text-2xl">qr_code</span>
                                </div>
                                <div class="flex-1">
                                    <span class="text-base font-bold text-text-main block">СБП</span>
                                    <span class="text-[11px] text-text-muted">Система быстрых платежей</span>
                                </div>
                                <span class="material-symbols-outlined text-text-muted opacity-40">chevron_right</span>
                            </div>
                        </button>
                        
                        <!-- Card Button -->
                        <button id="donate-card-btn" class="w-full p-4 rounded-2xl bg-surface border border-border hover:border-primary-gold/30 transition-all active:scale-[0.98] text-left">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-primary-gold/10 flex items-center justify-center shrink-0">
                                    <span class="material-symbols-outlined text-primary-gold text-2xl">credit_card</span>
                                </div>
                                <div class="flex-1">
                                    <span class="text-base font-bold text-text-main block">Банковская карта</span>
                                    <span class="text-[11px] text-text-muted">Visa, Mastercard, Мир</span>
                                </div>
                                <span class="material-symbols-outlined text-text-muted opacity-40">chevron_right</span>
                            </div>
                        </button>
                    </div>
                </div>
                
                <!-- Info Box -->
                <div class="p-4 rounded-2xl bg-surface-container-highest border border-border">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-text-muted text-xl mt-0.5">info</span>
                        <div class="flex-1">
                            <p class="text-sm text-text-muted leading-relaxed">
                                Все пожертвования идут на развитие приложения: оплату серверов, обновление контента и техническую поддержку.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="shrink-0 p-6 border-t border-border text-center">
                <p class="text-sm font-serif italic text-text-muted">
                    Спаси Господи за вашу поддержку!
                </p>
            </div>
        </div>
    `;
    
    return container;
}

// Initialize donation screen handlers
export function initDonationScreen() {
    const closeDonationBtn = document.getElementById('close-donation-btn');
    const donateSbpBtn = document.getElementById('donate-sbp-btn');
    const donateCardBtn = document.getElementById('donate-card-btn');
    const donationAmountBtns = document.querySelectorAll('.donation-amount-btn');
    
    // Donation URL (CloudTips)
    const DONATION_URL = 'https://pay.cloudtips.ru/p/07c2c144';
    
    // Handle close button
    if (closeDonationBtn) {
        closeDonationBtn.addEventListener('click', () => {
            closeDonationScreen();
        });
    }
    
    // Handle backdrop click
    const overlay = document.getElementById('donation-screen-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDonationScreen();
            }
        });
    }
    
    // Handle amount selection
    donationAmountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state from all buttons
            donationAmountBtns.forEach(b => {
                b.classList.remove('border-primary-gold', 'bg-primary-gold/10');
                b.classList.add('border-border');
            });
            
            // Add active state to selected button
            btn.classList.remove('border-border');
            btn.classList.add('border-primary-gold', 'bg-primary-gold/10');
        });
    });
    
    // Handle SBP donation
    if (donateSbpBtn) {
        donateSbpBtn.addEventListener('click', async () => {
            await handleDonation(DONATION_URL);
        });
    }
    
    // Handle Card donation
    if (donateCardBtn) {
        donateCardBtn.addEventListener('click', async () => {
            await handleDonation(DONATION_URL);
        });
    }
}

// Open donation screen
export function openDonationScreen() {
    const overlay = document.getElementById('donation-screen-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
}

// Close donation screen
export function closeDonationScreen() {
    const overlay = document.getElementById('donation-screen-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

// Handle donation redirect
async function handleDonation(url) {
    try {
        // Check if running in Capacitor
        const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
        
        if (isCapacitor) {
            // Use Capacitor Browser for in-app browser
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url });
        } else {
            // Open in new tab for web
            window.open(url, '_blank');
        }
    } catch (error) {
        console.error('[Donation] Error:', error);
        // Fallback: open in same window
        window.location.href = url;
    }
}

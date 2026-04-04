/**
 * Calendar Service - Integration with Azbyka.ru API
 * Provides Orthodox calendar information: dates, fasting, saints' memory
 */

const API_BASE_URL = 'https://azbyka.ru/days/api/day';

// Fasting types translation
const fastingTranslations = {
    ru: {
        'no_fast': 'Мясоед',
        'not_fasting': 'Мясоед',
        'strict_fast': 'Строгий пост',
        'fast': 'Постный день',
        'fish_fast': 'Рыба разрешена',
        'milk_fast': 'Молочная пища разрешена',
        'full_fast': 'Полный пост',
        'unknown': 'Нет данных'
    },
    uk: {
        'no_fast': 'М\'ясоїд',
        'not_fasting': 'М\'ясоїд',
        'strict_fast': 'Суворий піст',
        'fast': 'Пісний день',
        'fish_fast': 'Риба дозволена',
        'milk_fast': 'Молочна їжа дозволена',
        'full_fast': 'Повний піст',
        'unknown': 'Немає даних'
    },
    en: {
        'no_fast': 'Fast-free',
        'not_fasting': 'Fast-free',
        'strict_fast': 'Strict Fast',
        'fast': 'Fast Day',
        'fish_fast': 'Fish Allowed',
        'milk_fast': 'Dairy Allowed',
        'full_fast': 'Full Fast',
        'unknown': 'No Data'
    },
    cs: {
        'no_fast': 'Мясояденіе',
        'not_fasting': 'Мясояденіе',
        'strict_fast': 'Строгій постъ',
        'fast': 'Постный день',
        'fish_fast': 'Рыба разрешена',
        'milk_fast': 'Молочная пища разрешена',
        'full_fast': 'Полный постъ',
        'unknown': 'Нѣтъ данныхъ'
    }
};

const CACHE_PREFIX = 'calendar_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

function getCached(key) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return data;
    } catch {
        return null;
    }
}

function setCache(key, data) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // ignore quota errors
    }
}

function parseApiData(data) {
    const fastingType = data.fasting?.type || data.fasting?.fasting || 'unknown';
    return {
        date: data.date || null,
        day: data.day || null,
        fasting: fastingType,
        fastingDescription: getFastingDescription(fastingType),
        memory: data.saints || data.memory || [],
        icon: data.icon || null,
        description: data.fasting?.round_week || data.description || ''
    };
}

/**
 * Get today's Orthodox calendar information
 * @returns {Promise<Object>} Today's calendar data
 */
export async function getTodayInfo() {
    const today = new Date().toISOString().slice(0, 10);
    const cached = getCached(today);

    try {
        const response = await fetch(`${API_BASE_URL}/today.json`).catch(() => ({ ok: false }));

        if (!response.ok) {
            return { success: !!cached, data: cached || getFallbackData() };
        }

        const data = await response.json();
        const parsed = parseApiData(data);
        setCache(today, parsed);
        return { success: true, data: parsed };
    } catch (error) {
        console.error('[Calendar] Error fetching today info:', error);
        return { success: false, error: error.message, data: cached || getFallbackData() };
    }
}

/**
 * Get calendar info for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Calendar data for the specified date
 */
export async function getDateInfo(date) {
    const cached = getCached(date);

    try {
        const response = await fetch(`${API_BASE_URL}/${date}.json`).catch(() => ({ ok: false }));

        if (!response.ok) {
            return { success: !!cached, data: cached || getFallbackData() };
        }

        const data = await response.json();
        const parsed = parseApiData(data);
        setCache(date, parsed);
        return { success: true, data: parsed };
    } catch (error) {
        console.error('[Calendar] Error fetching date info:', error);
        return { success: false, error: error.message, data: cached || getFallbackData() };
    }
}

/**
 * Get fasting description based on current language
 * @param {string} fastingType - Fasting type from API
 * @returns {string} Translated fasting description
 */
export function getFastingDescription(fastingType) {
    const currentLang = localStorage.getItem('language') || 'ru';
    const translations = fastingTranslations[currentLang] || fastingTranslations.ru;
    return translations[fastingType] || translations.unknown;
}

/**
 * Get fasting icon based on type
 * @param {string} fastingType - Fasting type from API
 * @returns {string} Material icon name
 */
export function getFastingIcon(fastingType) {
    const icons = {
        'no_fast': 'restaurant',
        'strict_fast': 'water_drop',
        'fast': 'local_dining',
        'fish_fast': 'set_meal',
        'milk_fast': 'local_drink',
        'full_fast': 'block',
        'unknown': 'help_outline'
    };
    return icons[fastingType] || icons.unknown;
}

/**
 * Get fasting color based on type
 * @param {string} fastingType - Fasting type from API
 * @returns {string} CSS color class
 */
export function getFastingColor(fastingType) {
    const colors = {
        'no_fast': 'text-emerald-400',
        'strict_fast': 'text-red-400',
        'fast': 'text-amber-400',
        'fish_fast': 'text-blue-400',
        'milk_fast': 'text-cyan-400',
        'full_fast': 'text-purple-400',
        'unknown': 'text-slate-400'
    };
    return colors[fastingType] || colors.unknown;
}

/**
 * Get fallback data when API is unavailable
 * @returns {Object} Fallback calendar data
 */
function getFallbackData() {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    
    return {
        date: today.toLocaleDateString('ru-RU', options),
        day: today.toLocaleDateString('ru-RU', { weekday: 'long' }),
        fasting: 'unknown',
        fastingDescription: getFastingDescription('unknown'),
        memory: [],
        icon: null,
        description: ''
    };
}

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @param {string} lang - Language code
 * @returns {string} Formatted date
 */
export function formatDate(dateStr, lang = 'ru') {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString(lang === 'uk' ? 'uk-UA' : lang === 'en' ? 'en-US' : 'ru-RU', options);
}

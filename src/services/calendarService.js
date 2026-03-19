/**
 * Calendar Service - Integration with Azbyka.ru API
 * Provides Orthodox calendar information: dates, fasting, saints' memory
 */

const API_BASE_URL = 'https://azbyka.ru/days/api/day';

// Fasting types translation
const fastingTranslations = {
    ru: {
        'no_fast': 'Мясоед',
        'strict_fast': 'Строгий пост',
        'fast': 'Постный день',
        'fish_fast': 'Рыба разрешена',
        'milk_fast': 'Молочная пища разрешена',
        'full_fast': 'Полный пост',
        'unknown': 'Нет данных'
    },
    uk: {
        'no_fast': 'М\'ясоїд',
        'strict_fast': 'Суворий піст',
        'fast': 'Пісний день',
        'fish_fast': 'Риба дозволена',
        'milk_fast': 'Молочна їжа дозволена',
        'full_fast': 'Повний піст',
        'unknown': 'Немає даних'
    },
    en: {
        'no_fast': 'Fast-free',
        'strict_fast': 'Strict Fast',
        'fast': 'Fast Day',
        'fish_fast': 'Fish Allowed',
        'milk_fast': 'Dairy Allowed',
        'full_fast': 'Full Fast',
        'unknown': 'No Data'
    },
    cs: {
        'no_fast': 'Мясояденіе',
        'strict_fast': 'Строгій постъ',
        'fast': 'Постный день',
        'fish_fast': 'Рыба разрешена',
        'milk_fast': 'Молочная пища разрешена',
        'full_fast': 'Полный постъ',
        'unknown': 'Нѣтъ данныхъ'
    }
};

/**
 * Get today's Orthodox calendar information
 * @returns {Promise<Object>} Today's calendar data
 */
export async function getTodayInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/today.json`).catch(() => ({ ok: false }));
        
        if (!response.ok) {
            return getFallbackData();
        }
        
        const data = await response.json();
        
        return {
            success: true,
            data: {
                date: data.date || null,
                day: data.day || null,
                fasting: data.fasting || 'unknown',
                fastingDescription: getFastingDescription(data.fasting),
                memory: data.memory || [],
                icon: data.icon || null,
                description: data.description || ''
            }
        };
    } catch (error) {
        console.error('[Calendar] Error fetching today info:', error);
        return {
            success: false,
            error: error.message,
            data: getFallbackData()
        };
    }
}

/**
 * Get calendar info for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Calendar data for the specified date
 */
export async function getDateInfo(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/${date}.json`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            data: {
                date: data.date || null,
                day: data.day || null,
                fasting: data.fasting || 'unknown',
                fastingDescription: getFastingDescription(data.fasting),
                memory: data.memory || [],
                icon: data.icon || null,
                description: data.description || ''
            }
        };
    } catch (error) {
        console.error('[Calendar] Error fetching date info:', error);
        return {
            success: false,
            error: error.message,
            data: getFallbackData()
        };
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

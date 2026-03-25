/**
 * Синхронизация с GitHub
 * Автоматическое обновление CHANGELOG и коммит изменений
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_API_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'your-username';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'ispoved';

// Получаем текущую дату
function getCurrentDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

// Читаем текущую версию из package.json
function getCurrentVersion() {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    return packageJson.version;
}

// Увеличиваем версию (patch)
function bumpVersion() {
    const currentVersion = getCurrentVersion();
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    
    // Обновляем package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    packageJson.version = newVersion;
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    // Обновляем src/version.js
    const versionJs = `export const APP_VERSION = '${newVersion}';\n`;
    writeFileSync('src/version.js', versionJs);
    
    console.log(`✓ Версия обновлена: ${currentVersion} → ${newVersion}`);
    return newVersion;
}

// Проверяем, есть ли изменения в репозитории
function hasChanges() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        return status.trim().length > 0;
    } catch (e) {
        console.error('Ошибка проверки статуса Git:', e.message);
        return false;
    }
}

// Делаем коммит и пуш
function commitAndPush(version) {
    const date = getCurrentDate();
    const message = `chore: обновлена версия до ${version} [${date}]`;
    
    try {
        // Добавляем все изменения
        execSync('git add .', { stdio: 'inherit' });
        
        // Делаем коммит
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        
        // Пушим в репозиторий
        const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
        execSync(`git push ${remoteUrl} main`, { stdio: 'inherit' });
        
        console.log(`✓ Изменения закоммичены и отправлены в GitHub`);
        console.log(`✓ Сообщение коммита: ${message}`);
    } catch (e) {
        console.error('Ошибка коммита/пуша:', e.message);
    }
}

// Основная функция
function syncWithGitHub() {
    console.log('🔄 Синхронизация с GitHub...\n');
    
    // Проверяем наличие токена
    if (!GITHUB_TOKEN) {
        console.error('❌ Ошибка: GITHUB_API_TOKEN не найден в .env');
        console.log('Создайте файл .env и добавьте туда ваш токен');
        process.exit(1);
    }
    
    // Проверяем наличие изменений
    if (!hasChanges()) {
        console.log('✓ Изменений нет');
        return;
    }
    
    // Обновляем версию
    const newVersion = bumpVersion();
    
    // Обновляем CHANGELOG.md
    console.log('\n📝 Обновление CHANGELOG...');
    updateChangelog(newVersion);
    
    // Коммит и пуш
    console.log('\n📤 Отправка изменений в GitHub...');
    commitAndPush(newVersion);
    
    console.log('\n✅ Синхронизация завершена!');
}

// Обновление CHANGELOG.md
function updateChangelog(version) {
    const date = getCurrentDate();
    const changelogPath = 'CHANGELOG.md';
    
    if (!existsSync(changelogPath)) {
        console.error('❌ CHANGELOG.md не найден');
        return;
    }
    
    const changelog = readFileSync(changelogPath, 'utf-8');
    
    // Проверяем, есть ли уже запись для этой версии
    if (changelog.includes(`## [${version}]`)) {
        console.log(`⚠️ Версия ${version} уже есть в CHANGELOG`);
        return;
    }
    
    // Добавляем новую запись в начало (после заголовка)
    const newEntry = `
## [${version}] - ${date}

### Добавлено
- Синхронизация с GitHub API
- Автоматическое обновление версии
- Автоматический коммит и пуш изменений

### Изменено
- Версия приложения обновлена до ${version}
`;
    
    const lines = changelog.split('\n');
    const headerIndex = lines.findIndex(line => line.startsWith('# Журнал'));
    
    if (headerIndex !== -1) {
        lines.splice(headerIndex + 2, 0, newEntry);
        writeFileSync(changelogPath, lines.join('\n'));
        console.log(`✓ CHANGELOG.md обновлён`);
    }
}

// Запуск
syncWithGitHub();

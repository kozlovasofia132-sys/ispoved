/**
 * Автоматическое обновление версии и выгрузка на GitHub
 * Использование: node release.js [major|minor|patch]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_API_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'your-username';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'ispoved';

// Получаем текущую дату
function getCurrentDate() {
    const date = new Date();
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

// Читаем текущую версию из package.json
function getCurrentVersion() {
    const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
    return packageJson.version;
}

// Увеличиваем версию
function bumpVersion(type = 'patch') {
    const currentVersion = getCurrentVersion();
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let newVersion;
    if (type === 'major') {
        newVersion = `${major + 1}.0.0`;
    } else if (type === 'minor') {
        newVersion = `${major}.${minor + 1}.0`;
    } else {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    // Обновляем package.json
    const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
    packageJson.version = newVersion;
    writeFileSync(join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

    // Обновляем src/version.js
    const versionJs = `// Версия приложения автоматически обновляется через sync-version.js\nexport const APP_VERSION = '${newVersion}';\n`;
    writeFileSync(join(__dirname, 'src', 'version.js'), versionJs, 'utf-8');

    // Обновляем android/app/build.gradle
    const versionCode = major * 10000 + minor * 100 + (patch + 1);
    const buildGradlePath = join(__dirname, 'android', 'app', 'build.gradle');
    let buildGradle = readFileSync(buildGradlePath, 'utf-8');
    buildGradle = buildGradle.replace(/versionName\s+"[^"]*"/, `versionName "${newVersion}"`);
    buildGradle = buildGradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
    writeFileSync(buildGradlePath, buildGradle, 'utf-8');

    console.log(`✓ Версия обновлена: ${currentVersion} → ${newVersion}`);
    console.log(`✓ Android versionCode: ${versionCode}`);
    return newVersion;
}

// Собираем проект
function buildProject() {
    console.log('\n🔨 Сборка проекта...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✓ Сборка завершена успешно');
    } catch (e) {
        console.error('❌ Ошибка сборки:', e.message);
        process.exit(1);
    }
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
function commitAndPush(version, changes) {
    const date = getCurrentDate();
    const message = `release: версия ${version} [${date}]`;

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
        process.exit(1);
    }
}

// Обновление CHANGELOG.md
function updateChangelog(version) {
    const date = getCurrentDate();
    const changelogPath = join(__dirname, 'CHANGELOG.md');

    if (!existsSync(changelogPath)) {
        // Создаём новый CHANGELOG
        const newChangelog = `# Журнал изменений

## [${version}] - ${date}

### Изменения
- Обновлена версия приложения до ${version}
`;
        writeFileSync(changelogPath, newChangelog, 'utf-8');
        console.log('✓ CHANGELOG.md создан');
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

### Изменения
- Обновлена версия приложения до ${version}
`;

    const lines = changelog.split('\n');
    const headerIndex = lines.findIndex(line => line.startsWith('# Журнал') || line.startsWith('# Changelog'));

    if (headerIndex !== -1) {
        lines.splice(headerIndex + 2, 0, newEntry);
        writeFileSync(changelogPath, lines.join('\n'));
        console.log('✓ CHANGELOG.md обновлён');
    } else {
        // Если заголовок не найден, добавляем в начало
        writeFileSync(changelogPath, `# Журнал изменений\n${newEntry}` + changelog);
        console.log('✓ CHANGELOG.md обновлён');
    }
}

// Основная функция
function release() {
    console.log('🚀 Автоматическая выгрузка новой версии...\n');

    // Проверяем наличие токена
    if (!GITHUB_TOKEN) {
        console.error('❌ Ошибка: GITHUB_API_TOKEN не найден в .env');
        console.log('Создайте файл .env и добавьте туда ваш токен');
        console.log('\nПример .env:');
        console.log('GITHUB_API_TOKEN=ghp_...');
        console.log('GITHUB_REPO_OWNER=your-username');
        console.log('GITHUB_REPO_NAME=ispoved');
        process.exit(1);
    }

    // Определяем тип обновления
    const type = process.argv[2] || 'patch';
    if (!['major', 'minor', 'patch'].includes(type)) {
        console.error('❌ Ошибка: используйте major, minor или patch');
        process.exit(1);
    }

    console.log(`📦 Тип обновления: ${type}`);
    
    // Обновляем версию
    const newVersion = bumpVersion(type);

    // Собираем проект
    buildProject();

    // Проверяем наличие изменений
    if (!hasChanges()) {
        console.log('\n⚠️ Изменений нет');
        return;
    }

    // Обновляем CHANGELOG
    console.log('\n📝 Обновление CHANGELOG...');
    updateChangelog(newVersion);

    // Коммит и пуш
    console.log('\n📤 Отправка изменений в GitHub...');
    commitAndPush(newVersion);

    console.log('\n✅ Выгрузка завершена!');
    console.log(`🎉 Версия ${newVersion} опубликована в GitHub`);
}

// Запуск
release();

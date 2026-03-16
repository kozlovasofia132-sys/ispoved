import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем версию из package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const version = packageJson.version;

// Разбиваем версию на части для versionCode
const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + (patch || 0);

// Обновляем build.gradle (:app)
const buildGradlePath = join(__dirname, 'android', 'app', 'build.gradle');
let buildGradle = readFileSync(buildGradlePath, 'utf-8');

// Обновляем versionName
buildGradle = buildGradle.replace(
  /versionName\s+"[^"]*"/,
  `versionName "${version}"`
);

// Обновляем versionCode
buildGradle = buildGradle.replace(
  /versionCode\s+\d+/,
  `versionCode ${versionCode}`
);

writeFileSync(buildGradlePath, buildGradle, 'utf-8');
console.log(`✓ Android build.gradle обновлен: versionName="${version}", versionCode=${versionCode}`);

// Обновляем src/version.js
const versionJsPath = join(__dirname, 'src', 'version.js');
const versionJsContent = `// Версия приложения автоматически обновляется через sync-version.js
export const APP_VERSION = '${version}';
`;
writeFileSync(versionJsPath, versionJsContent, 'utf-8');
console.log(`✓ src/version.js обновлен: APP_VERSION="${version}"`);

console.log('\n✓ Синхронизация версии завершена!');

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const resDir = 'D:\\Ispoved\\android\\app\\src\\main\\res';
const mobileImg  = 'D:\\Ispoved\\public\\mobile_app.jpg';   // для телефонов (портрет)
const tabletImg  = 'D:\\Ispoved\\public\\tablet_app.jpg';   // для планшетов

// Телефоны — портретные папки
const phoneSizes = [
    { folder: 'drawable',              width: 720,  height: 1280 },
    { folder: 'drawable-xhdpi',        width: 720,  height: 1280 },
    { folder: 'drawable-xxhdpi',       width: 1080, height: 1920 },
    { folder: 'drawable-xxxhdpi',      width: 1440, height: 2560 },
    { folder: 'drawable-port-xhdpi',   width: 720,  height: 1280 },
    { folder: 'drawable-port-xxhdpi',  width: 1080, height: 1920 },
    { folder: 'drawable-port-xxxhdpi', width: 1440, height: 2560 },
];


// Планшеты
const tabletSizes = [
    { folder: 'drawable-sw600dp',  width: 1280, height: 800  },
    { folder: 'drawable-sw720dp',  width: 1920, height: 1200 },
];

// Цвета фона телефонов: сверху #120A07, снизу #0E0A07
const PHONE_COLOR_TOP    = '#120A07';
const PHONE_COLOR_BOTTOM = '#0E0A07';

// Цвет фона планшетов (слева и справа): #0E0905
const TABLET_BG = '#0E0905';

function makeSvgGradient(width, height) {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="${PHONE_COLOR_TOP}"/>
                    <stop offset="100%" stop-color="${PHONE_COLOR_BOTTOM}"/>
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
        </svg>`
    );
}

function makeSvgSolid(width, height, color) {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="${color}"/>
        </svg>`
    );
}

async function generate(inputPath, sizes, bgType = 'gradient') {
    for (const size of sizes) {
        const outFolder = path.join(resDir, size.folder);
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder, { recursive: true });
        }
        const outPath = path.join(outFolder, 'splash.png');
        console.log(`Генерирую ${size.folder}/splash.png (${size.width}x${size.height})...`);

        // Вписываем картинку с прозрачным фоном
        const resized = await sharp(inputPath)
            .resize({
                width: size.width,
                height: size.height,
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        // Фон: градиент для телефонов, сплошной для планшетов
        const bg = bgType === 'solid'
            ? makeSvgSolid(size.width, size.height, TABLET_BG)
            : makeSvgGradient(size.width, size.height);

        await sharp(bg)
            .composite([{ input: resized, gravity: 'centre' }])
            .png()
            .toFile(outPath);

        console.log(`✓ ${size.folder}/splash.png`);
    }
}

async function main() {
    console.log('\n📱 Телефоны (портрет)...');
    await generate(mobileImg, phoneSizes);

    console.log('\n🖥️ Планшеты...');
    await generate(tabletImg, tabletSizes, 'solid');

    console.log('\n✅ Все заставки сгенерированы!');
}

main().catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
});

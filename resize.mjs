import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const resDir = 'D:\\Ispoved\\android\\app\\src\\main\\res';
const mobileImg  = 'D:\\Ispoved\\public\\mobile_app.jpg';   // для телефонов (портрет)
const tabletImg  = 'D:\\Ispoved\\public\\tablet_app.jpg';   // для планшетов (альбом)

// Телефоны — портретные папки
const phoneSizes = [
    { folder: 'drawable',              width: 320,  height: 480  },
    { folder: 'drawable-port-mdpi',    width: 320,  height: 480  },
    { folder: 'drawable-port-hdpi',    width: 480,  height: 800  },
    { folder: 'drawable-port-xhdpi',   width: 720,  height: 1280 },
    { folder: 'drawable-port-xxhdpi',  width: 1080, height: 1920 },
    { folder: 'drawable-port-xxxhdpi', width: 1440, height: 2560 },
];

// Телефоны — альбомные папки
const phoneLandSizes = [
    { folder: 'drawable-land-mdpi',    width: 480,  height: 320  },
    { folder: 'drawable-land-hdpi',    width: 800,  height: 480  },
    { folder: 'drawable-land-xhdpi',   width: 1280, height: 720  },
    { folder: 'drawable-land-xxhdpi',  width: 1920, height: 1080 },
    { folder: 'drawable-land-xxxhdpi', width: 2560, height: 1440 },
];

// Планшеты — smallest width (sw) — работают для обеих ориентаций
const tabletSizes = [
    { folder: 'drawable-sw600dp',  width: 1280, height: 800  }, // 7" планшеты
    { folder: 'drawable-sw720dp',  width: 1920, height: 1200 }, // 10" планшеты
];

async function generate(inputPath, sizes, fit = 'cover') {
    for (const size of sizes) {
        const outFolder = path.join(resDir, size.folder);
        if (!fs.existsSync(outFolder)) {
            fs.mkdirSync(outFolder, { recursive: true });
        }
        const outPath = path.join(outFolder, 'splash.png');
        console.log(`Генерирую ${size.folder}/splash.png (${size.width}x${size.height})...`);
        await sharp(inputPath)
            .resize({
                width: size.width,
                height: size.height,
                fit: fit,
                position: 'centre',
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            })
            .png()
            .toFile(outPath);
        console.log(`✓ ${size.folder}/splash.png`);
    }
}

async function main() {
    console.log('\n📱 Телефоны (портрет)...');
    await generate(mobileImg, phoneSizes, 'cover');

    console.log('\n📱 Телефоны (альбом)...');
    await generate(mobileImg, phoneLandSizes, 'cover');

    console.log('\n🖥️ Планшеты...');
    await generate(mobileImg, tabletSizes, 'cover');

    console.log('\n✅ Все заставки сгенерированы!');
}

main().catch(err => {
    console.error('Ошибка:', err);
    process.exit(1);
});

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputImagePath = 'D:\\Ispoved\\public\\mobile_app.jpg';
const resDir = 'D:\\Ispoved\\android\\app\\src\\main\\res';

const sizes = [
    { folder: 'drawable-land-mdpi', width: 480, height: 320 },
    { folder: 'drawable-land-hdpi', width: 800, height: 480 },
    { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
    { folder: 'drawable-land-xxhdpi', width: 1920, height: 1080 },
    { folder: 'drawable-land-xxxhdpi', width: 2560, height: 1440 },
];

async function resizeImages() {
    try {
        for (const size of sizes) {
            const outFolder = path.join(resDir, size.folder);
            if (!fs.existsSync(outFolder)) {
                fs.mkdirSync(outFolder, { recursive: true });
            }
            
            const outPath = path.join(outFolder, 'splash.png');
            
            console.log(`Generating ${outPath} (${size.width}x${size.height})...`);
            
            await sharp(inputImagePath)
                .resize({
                    width: size.width,
                    height: size.height,
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Прозрачный фон
                })
                .png()
                .toFile(outPath);
                
            console.log(`Successfully generated ${size.folder}/splash.png`);
        }
        console.log('All images generated successfully!');
    } catch (err) {
        console.error('Error generating images:', err);
    }
}

resizeImages();

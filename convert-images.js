import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagesDir = path.join(process.cwd(), 'src', 'images');
const publicDir = path.join(process.cwd(), 'public');

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`✓ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    
    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    console.log(`  Size: ${(originalSize / 1024).toFixed(2)} KB → ${(newSize / 1024).toFixed(2)} KB (${savings}% reduction)`);
  } catch (error) {
    console.error(`✗ Error converting ${inputPath}:`, error.message);
  }
}

async function main() {
  console.log('Converting PNG images to WebP format...\n');
  
  // Convert images in src/images
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const inputPath = path.join(imagesDir, file);
        const outputPath = path.join(imagesDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
        await convertToWebP(inputPath, outputPath);
      }
    }
  }
  
  // Convert images in public
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const inputPath = path.join(publicDir, file);
        const outputPath = path.join(publicDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
        await convertToWebP(inputPath, outputPath);
      }
    }
  }
  
  console.log('\n✓ Image conversion complete!');
}

main().catch(console.error);

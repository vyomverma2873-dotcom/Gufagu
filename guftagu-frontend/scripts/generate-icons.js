/**
 * Script to generate PNG icons from SVG for iOS Safari and PWA support
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not provide instructions
try {
  const sharp = require('sharp');
  
  const svgPath = path.join(__dirname, '../public/apple-icon.svg');
  const publicDir = path.join(__dirname, '../public');
  
  const sizes = [
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];
  
  async function generateIcons() {
    const svgBuffer = fs.readFileSync(svgPath);
    
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }
    
    console.log('\n✅ All icons generated successfully!');
  }
  
  generateIcons().catch(console.error);
  
} catch (e) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    PNG Icon Generation                          ║
╚════════════════════════════════════════════════════════════════╝

Sharp module not found. To generate PNG icons:

Option 1: Install sharp and run this script
  npm install sharp --save-dev
  node scripts/generate-icons.js

Option 2: Use online converter
  1. Go to https://cloudconvert.com/svg-to-png
  2. Upload public/apple-icon.svg
  3. Generate these sizes:
     - 180x180 → save as public/apple-touch-icon.png
     - 192x192 → save as public/icon-192.png  
     - 512x512 → save as public/icon-512.png

Option 3: Use macOS Preview
  1. Open public/apple-icon.svg in Preview
  2. File > Export > PNG, set size for each:
     - 180x180 → apple-touch-icon.png
     - 192x192 → icon-192.png
     - 512x512 → icon-512.png
`);
}

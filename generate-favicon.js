const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const FAVICON_DIR = path.join(__dirname, 'assets', 'favicon');

// Ensure favicon directory exists
if (!fs.existsSync(FAVICON_DIR)) {
  fs.mkdirSync(FAVICON_DIR, { recursive: true });
}

// Define the base SVG for HistoQuiz (a simple "HQ" logo)
const svgString = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e63946;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d3557;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="240" font-weight="bold" text-anchor="middle" fill="white">HQ</text>
  <text x="50%" y="85%" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="white">Lịch Sử</text>
</svg>
`;

// Save the SVG file
fs.writeFileSync(path.join(FAVICON_DIR, 'favicon.svg'), svgString);

// Create favicon.ico (multiple sizes in one file)
const sizes = [16, 32, 48, 64, 128, 256];

// Generate PNG files of various sizes
async function generateFavicons() {
  try {
    // Create Buffer from SVG
    const svgBuffer = Buffer.from(svgString);

    // Create various PNG sizes
    const sizePromises = sizes.map(size => {
      return sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(FAVICON_DIR, `favicon-${size}x${size}.png`));
    });

    // Generate specific named files for different platforms
    const namedSizes = [
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
      { name: 'mstile-150x150.png', size: 150 }
    ];

    const namedPromises = namedSizes.map(({ name, size }) => {
      return sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(FAVICON_DIR, name));
    });

    // Wait for all operations to complete
    await Promise.all([...sizePromises, ...namedPromises]);

    // Create favicon.ico
    const favicon16 = await fs.promises.readFile(path.join(FAVICON_DIR, 'favicon-16x16.png'));
    const favicon32 = await fs.promises.readFile(path.join(FAVICON_DIR, 'favicon-32x32.png'));
    const favicon48 = await fs.promises.readFile(path.join(FAVICON_DIR, 'favicon-48x48.png'));
    
    const icoBuffer = await toIco([favicon16, favicon32, favicon48]);
    await fs.promises.writeFile(path.join(FAVICON_DIR, 'favicon.ico'), icoBuffer);

    console.log('All favicon files generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// Run the function
generateFavicons(); 
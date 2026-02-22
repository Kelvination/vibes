const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ASSETS = [
  { type: 'banner', file: 'banner.png', width: 960, height: 540 },
  { type: 'cover', file: 'cover.png', width: 630, height: 500 },
  { type: 'icon', file: 'icon.png', width: 256, height: 256 },
];

const rendererPath = path.resolve(__dirname, 'banner-renderer.html');
const outputDir = path.resolve(__dirname, '..', 'assets');

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--no-sandbox', '--disable-gpu-sandbox']
  });

  for (const asset of ASSETS) {
    const page = await browser.newPage({ viewport: { width: asset.width, height: asset.height } });
    const url = `file://${rendererPath}?type=${asset.type}`;
    await page.goto(url);
    await page.waitForFunction(() => document.title === 'RENDERED' || document.title === 'SHADER_ERROR', { timeout: 10000 });
    const title = await page.title();
    if (title !== 'RENDERED') {
      console.error(`FAIL: ${asset.type} - ${title}`);
      await page.close();
      continue;
    }
    const outputPath = path.join(outputDir, asset.file);
    await page.screenshot({ path: outputPath });
    console.log(`OK: ${asset.type} -> ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log('Marketing assets generated!');
}

main().catch(console.error);

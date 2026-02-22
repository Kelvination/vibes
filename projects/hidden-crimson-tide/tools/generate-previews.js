const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SHADERS = [
  { name: 'toon', label: 'Toon Shading' },
  { name: 'dissolve', label: 'Dissolve Effect' },
  { name: 'hologram', label: 'Hologram' },
  { name: 'water', label: 'Water Surface' },
  { name: 'forcefield', label: 'Force Field' },
  { name: 'pixelate', label: 'Pixelation' },
  { name: 'outline', label: 'Outline Stroke' },
  { name: 'frosted_glass', label: 'Frosted Glass' },
  { name: 'lava', label: 'Lava Flow' },
  { name: 'energy_beam', label: 'Energy Beam' },
  { name: 'triplanar', label: 'Triplanar Blend' },
  { name: 'wind', label: 'Wind Sway' },
];

const SIZE = 512;
const rendererPath = path.resolve(__dirname, 'preview-renderer.html');
const outputDir = path.resolve(__dirname, '..', 'previews');

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--no-sandbox', '--disable-gpu-sandbox']
  });

  console.log('Browser launched, generating previews...');
  let success = 0;
  let failed = 0;

  for (const shader of SHADERS) {
    try {
      const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
      const url = `file://${rendererPath}?shader=${shader.name}&size=${SIZE}`;
      await page.goto(url);
      await page.waitForFunction(() =>
        document.title === 'RENDERED' ||
        document.title.startsWith('SHADER_ERROR') ||
        document.title === 'UNKNOWN_SHADER',
        { timeout: 10000 }
      );

      const title = await page.title();
      if (title !== 'RENDERED') {
        console.error(`  FAIL: ${shader.name} - ${title}`);
        failed++;
        await page.close();
        continue;
      }

      const outputPath = path.join(outputDir, `${shader.name}.png`);
      await page.screenshot({ path: outputPath });
      console.log(`  OK: ${shader.label} -> ${outputPath}`);
      success++;
      await page.close();
    } catch (err) {
      console.error(`  FAIL: ${shader.name} - ${err.message}`);
      failed++;
    }
  }

  await browser.close();
  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
}

main().catch(console.error);

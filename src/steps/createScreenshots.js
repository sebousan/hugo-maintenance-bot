// scripts/steps/createScreenshots.js
import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { createStaticServer } from '../utils/staticServer.js';

const resolutions = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1366, height: 768 }
};

export async function createScreenshots(site, type, date, publicPath = null) {
  const browser = await chromium.launch({ headless: true });
  let serverInstance = null;
  let port = 0;
  let baseUrl = site.website.url;
  let server = null;

  try {
    if (publicPath) {
      port = 3000 + Math.floor(Math.random() * 1000);
      baseUrl = `http://localhost:${port}`;
      server = createStaticServer(publicPath);
      serverInstance = await server.start(port);
    }

    // Loop for each page and each device
    for (const pageUrl of site.website.pages) {
      for (const [device, resolution] of Object.entries(resolutions)) {
        if (site.screenshots.includes(device)) {
          try {
            const fullUrl = publicPath ? `${baseUrl}${pageUrl}` : `${site.website.url}${pageUrl}`;
            const page = await browser.newPage();
            await page.setViewportSize(resolution);

            // Disable animations/hover
            await page.addStyleTag({
              content: `
                [data-anim], * {
                  opacity: 1 !important;
                  transform: none !important;
                  transition: none !important;
                  animation: none !important;
                }
                a, button, [role="button"] { pointer-events: none !important; }
              `
            });

            await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 60000 });

            // Scroll and return to top
            await page.evaluate(async () => {
              document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                img.setAttribute('loading', 'eager');
              });
              await new Promise(resolve => {
                const timer = setInterval(() => {
                  window.scrollBy(0, 100);
                  if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    window.scrollTo(0, 0);
                    resolve();
                  }
                }, 100);
              });
            });

            await page.waitForTimeout(1000);

            // Screenshot
            const basePath = path.join('static', 'images', 'screenshots', site.name, date, type);
            if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });
            const pageFileName = pageUrl.replace(/\//g, '') || 'home';
            const screenshotPath = path.join(basePath, `${pageFileName}_${device}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.success(`✅ Screenshot saved: ${screenshotPath}`);
            await page.close();
          } catch (err) {
            logger.error(`❌ Failed to capture ${pageUrl} (${device}): ${err.message}`);
          }
        }
      }
    }

  } finally {
    if (serverInstance) {
      await server.stop(serverInstance);
    }
    await browser.close();
  }
}

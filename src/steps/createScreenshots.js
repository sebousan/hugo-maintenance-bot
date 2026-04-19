// steps/createScreenshots.js
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

/**
 * Creates screenshots of website pages at different resolutions
 * @param {Object} site - Site configuration object
 * @param {string} type - Screenshot type ('before' or 'after')
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string|null} publicPath - Path to public directory for local server (null for online)
 * @returns {Promise<void>}
 */
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
            const context = await browser.newContext({ viewport: resolution });
            const page = await context.newPage();

            // Block media downloads — visually hidden via CSS anyway
            await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,avif,mp4,webm,ogg}', route => route.abort());

            await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(500);

            // Neutralize animations and media to avoid false positives in comparison
            await page.addStyleTag({
              content: `
                * {
                  transition: none !important;
                  animation: none !important;
                }
                [data-anim] {
                  opacity: 1 !important;
                  transform: none !important;
                }
                a, button, [role="button"] { pointer-events: none !important; }
                img, video, iframe, canvas {
                  visibility: hidden !important;
                }
              `
            });

            // Screenshot
            const basePath = path.join('static', 'images', 'screenshots', site.name, date, type);
            if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });
            const pageFileName = pageUrl.replace(/\//g, '') || 'home';
            const screenshotPath = path.join(basePath, `${pageFileName}_${device}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.success(`✅ Screenshot saved: ${screenshotPath}`);
            await context.close();
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

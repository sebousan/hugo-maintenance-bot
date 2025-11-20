import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

const CONFIG = {
  DIFF_THRESHOLD_PERCENT: 0.5,
  PIXEL_THRESHOLD: 0.1,
};

export async function compareScreenshots(site, date) {
  const diffPages = new Set();
  let status = "OK";
  const pages = site.website.pages;
  const resolutions = site.screenshots || ["mobile", "tablet", "laptop"];

  const compareDir = path.join("static", "images", "screenshots", site.name, date, "compare");
  if (!fs.existsSync(compareDir)) {
    fs.mkdirSync(compareDir, { recursive: true });
  }

  const detailedResults = {};

  for (const page of pages) {
    const pageFileName = page.replace(/\//g, "") || "home";
    detailedResults[page] = {};

    for (const device of resolutions) {
      try {
        const beforePath = path.join("static", "images", "screenshots", site.name, date, "before", `${pageFileName}_${device}.png`);
        const afterPath = path.join("static", "images", "screenshots", site.name, date, "after", `${pageFileName}_${device}.png`);

        if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
          logger.warn(`⚠️ Missing screenshot for ${page} (${device})`);
          continue;
        }

        // Charge les images
        const beforeImg = PNG.sync.read(fs.readFileSync(beforePath));
        const afterImg = PNG.sync.read(fs.readFileSync(afterPath));

        // Vérifie que les tailles sont identiques
        if (beforeImg.width !== afterImg.width || beforeImg.height !== afterImg.height) {
          logger.warn(`⚠️ Different sizes for ${page} (${device}): ${beforeImg.width}x${beforeImg.height} vs ${afterImg.width}x${afterImg.height}`);
          continue;
        }

        const { width, height } = beforeImg;
        const totalPixels = width * height;

        // Compare les pixels
        const diff = new PNG({ width, height });
        const numDiffPixels = pixelmatch(
          beforeImg.data,
          afterImg.data,
          diff.data,
          width,
          height,
          { threshold: CONFIG.PIXEL_THRESHOLD }
        );

        const diffPercent = (numDiffPixels / totalPixels) * 100;
        const hasProblem = diffPercent > CONFIG.DIFF_THRESHOLD_PERCENT;

        detailedResults[page][device] = {
          diffPercent: parseFloat(diffPercent.toFixed(2)),
          numDiffPixels,
          hasProblem
        };

        if (hasProblem) {
          status = "Fail";
          diffPages.add(page);

          // Enregistre l'image de différence
          const diffPath = path.join(compareDir, `${pageFileName}_${device}_diff.png`);
          fs.writeFileSync(diffPath, PNG.sync.write(diff));
          logger.info(`🖼️ Diff saved (${diffPercent.toFixed(2)}% different): ${diffPath}`);
        } else {
          logger.info(`✅ ${page} (${device}): ${diffPercent.toFixed(2)}% different`);
        }

      } catch (err) {
        logger.error(`❌ Failed to compare ${page} (${device}): ${err.message}`);
        detailedResults[page][device] = { error: err.message };
      }
    }
  }

  const result = {
    status,
    diffPages: Array.from(diffPages),
    timestamp: new Date().toISOString(),
    details: detailedResults
  };

  const resultPath = path.join(compareDir, "result.json");
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  logger.success(`📊 Comparison result saved: ${resultPath}`);

  return result;
}
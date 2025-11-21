// scripts/steps/createContent.js
import { writeFile } from "../utils/file.js";
import { logger } from "../utils/logger.js";
import { generateFullReport } from "../utils/markownGenerator.js";

export async function createContent(site, date, status, diffPages, updatedModules, prUrl) {
  const contentDir = `content/websites/${site.name}`;

  try {
    // Create the site index page if it doesn't exist
    const indexContent = `---\ntitle: ${site.title}\n---\n`;
    await writeFile(`${contentDir}/_index.md`, indexContent);

    // Report content
    const utcDate = new Date().toISOString();
    const dateFormatted = new Date(date).toLocaleDateString('en-US');
    const pages = site.website.pages;
    const siteName = site.name;

    let postContent = `---
title: Module update (${dateFormatted})
date: ${utcDate}
status: ${status}
---\n`

    postContent += generateFullReport({
      date,
      status,
      diffPages,
      updatedModules,
      prUrl,
      pages,
      siteName
    });

    // Write the final file
    const filePath = `${contentDir}/${date}.md`;
    await writeFile(filePath, postContent);

    logger.success(`Content created: ${filePath}`);
    return {
      status: "success",
      contentPath: filePath,
      contentFiles: [filePath]
    };
  } catch (err) {
    logger.error(`❌ Failed to create content: ${err.message}`);
    return { status: "error" };
  }
}

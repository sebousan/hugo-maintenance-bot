// utils/markdownGenerator.js

/**
 * Generates the date section
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted Markdown section
 */
export function generateDateSection(date, locale = 'en-US') {
  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `## Date\n${dateFormatted}\n`;
}

/**
 * Generates the status section
 * @param {string} status - Status
 * @param {Array<string>} diffPages - Problematic pages
 * @returns {string} Formatted Markdown section
 */
export function generateStatusSection(status, diffPages = [], date, siteName) {
  let section = "## Status\n";
  if (status === "Fail") {
    section += "❌ Failed\n";
    if (diffPages.length > 0) {
      section += "## Problematic pages\n";
      diffPages.forEach((page) => {
        let pageFileName = page.replace(/\//g, "") || "home";
        let diffPath = getScreenshotPath("compare", pageFileName, "mobile", date, siteName);
        section += `- ${page}\n\n`;
        section += `![Diff](${diffPath})\n`;
      });
    }
  } else {
    section += "✅ Success\n";
  }
  return section;
}

/**
 * Generates the updated modules section
 * @param {Array} updatedModules - Modules with their diffs
 * @returns {string} Formatted Markdown section
 */
export function generateModulesSection(updatedModules = []) {
  let section = "## Updated modules\n";
  if (updatedModules.length > 0) {
    updatedModules.forEach(module => {
      section += `### ${module.file}\n\n`;
      section += "```diff\n" + module.changes.join('\n') + "\n```\n\n";
    });
  } else {
    section += "No modules updated.\n";
  }
  return section;
}

/**
 * Generates the Pull Request section
 * @param {string} prUrl - PR URL or false
 * @returns {string} Formatted Markdown section
 */
export function generatePrSection(prUrl) {
  let section = "";

  if (prUrl) {
    section += "## Pull request\n";
    section += `${prUrl}\n`;
  }

  return section;
}

/**
 * Generates a section for a specific page with its screenshots
 * @param {string} page - Page path
 * @param {string} date - Date
 * @param {string} siteName - Site name
 * @returns {string} Markdown section
 */
export function generatePageScreenshotsSection(page, date, siteName) {
  const pageFileName = page.replace(/\//g, "") || "home";
  const resolutions = ["mobile", "tablet", "laptop"];
  let section = `\n## Page ${page || "/"}\n`;

  for (const device of resolutions) {
    section += generateScreenshotRow(pageFileName, device, date, siteName);
  }

  return section;
}

/**
 * Generates a table row for a resolution
 * @param {string} pageFileName - Page file name
 * @param {string} device - Resolution
 * @param {string} date - Date
 * @param {string} siteName - Site name
 * @returns {string} Markdown table row
 */
export function generateScreenshotRow(pageFileName, device, date, siteName) {
  const beforePath = getScreenshotPath("before", pageFileName, device, date, siteName);
  const afterPath = getScreenshotPath("after", pageFileName, device, date, siteName);

  return `
### ${device.charAt(0).toUpperCase() + device.slice(1)}

| Before | After |
|--------|-------|
| ![Before](${beforePath} "Before - ${device}") | ![After](${afterPath} "After - ${device}") |
`;
}

/**
 * Generates the path for a screenshot image
 * @param {string} type - Screenshot type
 * @param {string} pageFileName - File name
 * @param {string} device - Resolution
 * @param {string} date - Date
 * @param {string} siteName - Site name
 * @returns {string} Full path
 */
export function getScreenshotPath(type, pageFileName, device, date, siteName) {
  return `/images/screenshots/${siteName}/${date}/${type}/${pageFileName}_${device}.png`;
}

/**
 * Generates the screenshots section for all pages
 * @param {Array<string>} pages - Pages
 * @param {string} date - Date
 * @param {string} siteName - Site name
 * @returns {string} Markdown section
 */
export function generateScreenshotsSection(pages, date, siteName) {
  let section = "";
  for (const page of pages) {
    section += generatePageScreenshotsSection(page, date, siteName);
  }
  return section;
}


/**
 * Generates the full report
 * @param {Object} params - Parameters
 * @returns {string} Full Markdown content
 */

export function generateFullReport({
  date,
  status,
  diffPages = [],
  updatedModules = [],
  prUrl,
  pages = [],
  siteName
}) {

  let content = `
${generateDateSection(date)}
${generateStatusSection(status, diffPages, date, siteName)}
${generateModulesSection(updatedModules)}
`;

  if (prUrl) {
    content += generatePrSection(prUrl);
    content += generateScreenshotsSection(pages, date, siteName);
  }

  return content;
}
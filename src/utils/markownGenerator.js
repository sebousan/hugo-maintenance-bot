// utils/markdownGenerator.js

/**
 * Génère la section de date
 * @param {string|Date} date - Date à formater
 * @param {string} locale - Locale pour le formatage
 * @returns {string} Section Markdown formatée
 */
export function generateDateSection(date, locale = 'fr-FR') {
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
 * Génère la section de statut
 * @param {string} status - Statut
 * @param {Array<string>} diffPages - Pages problématiques
 * @returns {string} Section Markdown formatée
 */
export function generateStatusSection(status, diffPages = [], date, siteName) {
  let section = "## Statut\n";
  if (status === "Fail") {
    section += "❌ Échec\n";
    if (diffPages.length > 0) {
      section += "## Pages problématiques\n";
      diffPages.forEach((page) => {
        let pageFileName = page.replace(/\//g, "") || "home";
        let diffPath = getScreenshotPath("compare", pageFileName, "mobile", date, siteName);
        section += `- ${page}\n\n`;
        section += `![Diff](${diffPath})\n`;
      });
    }
  } else {
    section += "✅ Succès\n";
  }
  return section;
}

/**
 * Génère la section des modules mis à jour
 * @param {Array} updatedModules - Modules avec leurs diffs
 * @returns {string} Section Markdown formatée
 */
export function generateModulesSection(updatedModules = []) {
  let section = "## Modules mis à jour\n";
  if (updatedModules.length > 0) {
    updatedModules.forEach(module => {
      section += `### ${module.file}\n\n`;
      section += "```diff\n" + module.changes.join('\n') + "\n```\n\n";
    });
  } else {
    section += "Aucun module mis à jour.\n";
  }
  return section;
}

/**
 * Génère la section de la Pull Request
 * @param {string} prUrl - URL de la PR or false
 * @returns {string} Section Markdown formatée
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
 * Génère une section pour une page spécifique avec ses captures
 * @param {string} page - Chemin de la page
 * @param {string} date - Date
 * @param {string} siteName - Nom du site
 * @returns {string} Section Markdown
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
 * Génère une ligne de tableau pour une résolution
 * @param {string} pageFileName - Nom du fichier de la page
 * @param {string} device - Résolution
 * @param {string} date - Date
 * @param {string} siteName - Nom du site
 * @returns {string} Ligne de tableau Markdown
 */
export function generateScreenshotRow(pageFileName, device, date, siteName) {
  const beforePath = getScreenshotPath("before", pageFileName, device, date, siteName);
  const afterPath = getScreenshotPath("after", pageFileName, device, date, siteName);

  return `
### ${device.charAt(0).toUpperCase() + device.slice(1)}

| Avant | Après |
|-------|-------|
| ![Avant](${beforePath} "Avant - ${device}") | ![Après](${afterPath} "Après - ${device}") |
`;
}

/**
 * Génère le chemin d'une image de capture
 * @param {string} type - Type de capture
 * @param {string} pageFileName - Nom du fichier
 * @param {string} device - Résolution
 * @param {string} date - Date
 * @param {string} siteName - Nom du site
 * @returns {string} Chemin complet
 */
export function getScreenshotPath(type, pageFileName, device, date, siteName) {
  return `/images/screenshots/${siteName}/${date}/${type}/${pageFileName}_${device}.png`;
}

/**
 * Génère la section des captures pour toutes les pages
 * @param {Array<string>} pages - Pages
 * @param {string} date - Date
 * @param {string} siteName - Nom du site
 * @returns {string} Section Markdown
 */
export function generateScreenshotsSection(pages, date, siteName) {
  let section = "";
  for (const page of pages) {
    section += generatePageScreenshotsSection(page, date, siteName);
  }
  return section;
}


/**
 * Génère le rapport complet
 * @param {Object} params - Paramètres
 * @returns {string} Contenu Markdown complet
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
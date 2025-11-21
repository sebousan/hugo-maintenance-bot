// utils/websites.js
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { logger } from "./logger.js";

const DATAS_DIR = "./datas";

/**
 * Load sites from a specific directory
 * @param {string} dir - Directory path to load from
 * @returns {Array} Array of site configurations
 */
function loadSitesFromDir(dir) {
  if (!fs.existsSync(dir)) {
    logger.warn(`Directory not found: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));

  return files.map(file => {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const site = YAML.parse(content);
      logger.info(`✅ Loaded: ${site.name} from ${dir}/${file}`);
      return site;
    } catch (err) {
      logger.error(`❌ Failed to load ${file}: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Load all sites (default behavior)
 * @returns {Array} Array of all site configurations
 */
function loadAllSites() {
  logger.info(`🔍 Loading all sites from ${DATAS_DIR}...`);

  if (!fs.existsSync(DATAS_DIR)) {
    logger.error(`Data directory not found: ${DATAS_DIR}`);
    return [];
  }

  const dirs = fs.readdirSync(DATAS_DIR).filter(f => {
    const fullPath = path.join(DATAS_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  let allSites = [];
  dirs.forEach(dir => {
    const sites = loadSitesFromDir(path.join(DATAS_DIR, dir));
    allSites = [...allSites, ...sites];
  });

  logger.success(`📦 Found ${allSites.length} site(s)`);
  return allSites;
}

/**
 * Load sites from a specific folder
 * @param {string} folderName - Folder name (e.g., 'subscribers')
 * @returns {Array} Array of site configurations
 */
function loadSitesFromFolder(folderName) {
  logger.info(`🔍 Loading sites from folder: ${folderName}...`);
  const folderPath = path.join(DATAS_DIR, folderName);
  return loadSitesFromDir(folderPath);
}

/**
 * Load a specific site by name (searches all folders)
 * @param {string} siteName - Site name (e.g., 'miriamlasserre')
 * @returns {Object|null} Site configuration or null
 */
function loadSiteByName(siteName) {
  logger.info(`🔍 Searching for site: ${siteName}...`);

  if (!fs.existsSync(DATAS_DIR)) {
    logger.error(`Data directory not found: ${DATAS_DIR}`);
    return null;
  }

  const dirs = fs.readdirSync(DATAS_DIR).filter(f => {
    const fullPath = path.join(DATAS_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const dir of dirs) {
    const sites = loadSitesFromDir(path.join(DATAS_DIR, dir));
    const found = sites.find(s => s.name === siteName);
    if (found) {
      logger.success(`✅ Found site: ${siteName} in folder: ${dir}`);
      return found;
    }
  }

  logger.error(`❌ Site not found: ${siteName}`);
  return null;
}

/**
 * Main function to load sites based on arguments
 * @param {string|null} arg - Command argument (null = all, 'folder' = by folder, 'site' = by name)
 * @returns {Array} Array of site configurations
 */
export function loadSites(arg = null) {
  if (!arg) {
    // yarn start → load all sites
    return loadAllSites();
  }

  // Check if it's a folder or a site name
  const folderPath = path.join(DATAS_DIR, arg);
  const isFolder = fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();

  if (isFolder) {
    // yarn start [folder] → load sites from folder
    const sites = loadSitesFromFolder(arg);
    return sites.length > 0 ? sites : [];
  }

  // yarn start [site] → load specific site
  const site = loadSiteByName(arg);
  return site ? [site] : [];
}
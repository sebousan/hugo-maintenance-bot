// scripts/utils/file.js
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { logger } from "./logger.js";

/**
 * Lit un fichier YAML et le parse en objet JS
 */
export function readYAML(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return YAML.parse(data);
  } catch (err) {
    logger.error(`Failed to read YAML file ${filePath}: ${err.message}`);
    throw err;
  }
}

/**
 * Écrit un objet JS en YAML
 */
export function writeYAML(filePath, data) {
  try {
    fs.writeFileSync(filePath, YAML.stringify(data));
    logger.success(`Wrote YAML: ${filePath}`);
  } catch (err) {
    logger.error(`Failed to write YAML: ${err.message}`);
  }
}

/**
 * Écrit un fichier texte/JSON
 */
export function writeFile(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    logger.success(`Saved file: ${filePath}`);
  } catch (err) {
    logger.error(`Failed to save file: ${filePath} → ${err.message}`);
  }
}

/**
 * Vérifie si un fichier existe
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

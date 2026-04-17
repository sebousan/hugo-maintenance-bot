// utils/notifiers/message.js

/**
 * Builds a normalized notification payload from maintenance result data.
 * Each notifier (Discord, Slack, email...) consumes this common structure
 * and maps it to its own format.
 *
 * @param {Object} params
 * @param {string} params.siteName - Site name
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.status - Status of the update ('OK' / 'Fail')
 * @param {string|null} params.prUrl - Pull request URL
 * @param {string|null} params.siteUrl - Site URL
 * @param {Array<string>} params.diffPages - Pages with visual differences
 * @param {Array<Object>} params.updatedModules - Updated Hugo modules
 * @returns {{
 *   title: string,
 *   isFail: boolean,
 *   fields: Array<{ name: string, value: string }>
 * }}
 */
export function buildNotificationPayload({ siteName, date, status, prUrl, siteUrl, diffPages, updatedModules }) {
  const isFail = status === "Fail";
  const fields = [];

  // Updated modules list
  if (updatedModules?.length > 0) {
    const moduleNames = updatedModules.map(m => m.file).join(", ");
    fields.push({ name: "Updated modules", value: moduleNames });
  }

  // Diff pages if any
  if (isFail && diffPages?.length > 0) {
    fields.push({
      name: "Pages with visual differences",
      value: diffPages.map(p => p || "/").join("\n")
    });
  }

  // Pull request link
  if (prUrl) {
    fields.push({ name: "Pull request", value: prUrl });
  }

  // Site URL (only when PR is OK — merged automatically)
  if (!isFail && siteUrl) {
    fields.push({ name: "Website", value: siteUrl });
  }

  return {
    title: `${isFail ? "❌" : "✅"} ${siteName} — Hugo modules update`,
    isFail,
    fields
  };
}

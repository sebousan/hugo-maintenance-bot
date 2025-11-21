// utils/github.js
import { Octokit } from "@octokit/rest";

/**
 * Creates and returns an authenticated Octokit instance
 * @returns {Octokit} Authenticated Octokit GitHub API client
 */
export const getOctokit = () => {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error("❌ Missing GH_TOKEN in environment");
  return new Octokit({ auth: token });
};

import { Octokit } from "@octokit/rest";

export const getOctokit = () => {
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error("❌ Missing GH_TOKEN in environment");
  return new Octokit({ auth: token });
};

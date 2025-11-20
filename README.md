# Hugo Maintenance Bot

An automated maintenance bot for Hugo websites. It handles:
- Updating Hugo modules
- Taking screenshots (before/after)
- Comparing screenshots
- Creating Pull Requests with visual diffs

## Installation

```bash
npm install hugo-maintenance-bot
# or
yarn add hugo-maintenance-bot
```

## Usage

```bash
# Process all sites in the datas directory
npx hugo-maintenance

# Process all sites in a specific folder : datas/folder
npx hugo-maintenance folder

# Process a specific site : datas/folder/website.yaml
npx hugo-maintenance website
```

## Configuration

The bot expects a `datas/` directory in the current working directory containing site configurations in YAML format.

Example site config (`datas/folder/website.yaml`):
```yaml
title: My Site
name: mysite
repository:
  branch: main
  provider: github
  repo: username/repo
website:
  url: https://www.mysite.com
  pages:
    - /
    - /contact/
screenshots:
  - mobile
  - tablet
  - laptop
```

## Environment Variables

- `GH_TOKEN`: GitHub Personal Access Token (required for PR creation and cross-repo operations)

## GitHub Actions

You can automate the maintenance using GitHub Actions. An example workflow is provided in [examples/github-action.yml](examples/github-action.yml).

This workflow:
1. Runs on a schedule (e.g., every 2 months)
2. Sets up Node.js and Hugo
3. Installs dependencies and Playwright browsers
4. Runs the maintenance script for your websites

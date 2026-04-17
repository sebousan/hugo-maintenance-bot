<img width="1280" height="640" alt="Hugo Maintenance Bot" src="https://github.com/user-attachments/assets/869bcfde-5005-4347-82cd-ace81bf2700b" />

# Hugo Maintenance Bot

[![npm version](https://badge.fury.io/js/@sebousan%2Fhugo-maintenance-bot.svg)](https://www.npmjs.com/package/@sebousan/hugo-maintenance-bot)


An automated maintenance bot for Hugo websites.

It handles:

- Updating Hugo modules
- Taking screenshots (before/after)
- Comparing screenshots
- Creating Pull Requests with visual diffs
- Merging automatically if there are no visual differences
- Creating content markdown page (for your maintenance report website)
- Sending notifications (Discord, Slack, email...)

## Installation

```bash
npm install @sebousan/hugo-maintenance-bot
# or
yarn add @sebousan/hugo-maintenance-bot
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

| Variable | Required | Description |
| --- | --- | --- |
| `GH_TOKEN` | ✅ | GitHub Personal Access Token (PR creation, branch management) |
| `GIT_USER_EMAIL` | ✅ | Git user email for commits |
| `GIT_USER_NAME` | ✅ | Git user name for commits |
| `DISCORD_WEBHOOK_URL` | — | Discord webhook URL to enable Discord notifications |

## Notifications

Notifications are sent at the end of each site processing. A channel is automatically activated when its environment variable is set — no configuration needed.

| Channel | Environment variable | Status |
| --- | --- | --- |
| Discord | `DISCORD_WEBHOOK_URL` | ✅ Available |
| Slack | `SLACK_WEBHOOK_URL` | Coming soon |
| Email | `SMTP_HOST` | Coming soon |

To get a Discord webhook URL: go to your Discord server settings → Integrations → Webhooks → New Webhook.

## GitHub Actions

You can automate the maintenance using GitHub Actions. An example workflow is provided in [examples/github-action.yml](examples/github-action.yml).

This workflow:

1. Runs on a schedule (e.g., every 2 months)
2. Sets up Node.js and Hugo
3. Installs dependencies and Playwright browsers
4. Runs the maintenance script for your websites

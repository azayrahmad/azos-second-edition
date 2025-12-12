const { simpleGit } = require('simple-git');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// This script requires a GitHub Personal Access Token with 'repo' scope.
// It should be stored in an environment variable named GITHUB_TOKEN.
if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable not set.');
  process.exit(1);
}

const git = simpleGit();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function generateChangelog() {
  try {
    console.log('Starting changelog generation...');

    // 1. Get repository details from package.json
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const { version, repository } = packageJson;
    const repoUrlMatch = repository.url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!repoUrlMatch) {
      throw new Error('Could not parse repository URL from package.json');
    }
    const owner = repoUrlMatch[1];
    const repo = repoUrlMatch[2];

    console.log(`Repository: ${owner}/${repo}`);
    console.log(`New version: ${version}`);

    // 2. Get the latest Git tag
    const tags = await git.tags(['--sort=-creatordate']);
    const latestTag = tags.latest;
    if (!latestTag) {
      throw new Error('No Git tags found. Cannot determine the range for the changelog.');
    }
    console.log(`Latest tag found: ${latestTag}`);

    // 3. Get the date of the latest tag
    const tagDate = await git.show(['-s', '--format=%cI', latestTag]);
    const sinceDate = new Date(tagDate.trim()).toISOString();
    console.log(`Fetching merged PRs since: ${sinceDate}`);

    // 4. Fetch merged pull requests from GitHub
    const allClosedPulls = await octokit.paginate(octokit.pulls.list, {
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
    });

    const mergedPrsSinceLastTag = allClosedPulls.filter(pr =>
      pr.merged_at && new Date(pr.merged_at) > new Date(sinceDate)
    );

    if (mergedPrsSinceLastTag.length === 0) {
      console.log('No new merged pull requests found since the last tag.');
      return;
    }

    console.log(`Found ${mergedPrsSinceLastTag.length} merged PRs.`);

    // 5. Format the changelog content
    const today = new Date().toISOString().split('T')[0];
    let changelogContent = `v${version} (${today})\n`;
    changelogContent += '==================\n';

    mergedPrsSinceLastTag.forEach(pr => {
      changelogContent += `- ${pr.title}\n`;
    });

    // 6. Prepend to the existing changelog or create a new one
    const changelogPath = path.resolve(process.cwd(), 'public/CHANGELOG.TXT');
    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, 'utf8');
    }

    const newContent = `${changelogContent}\n${existingContent}`;
    fs.writeFileSync(changelogPath, newContent, 'utf8');

    console.log(`Changelog successfully generated at ${changelogPath}`);

  } catch (error) {
    console.error('Failed to generate changelog:', error);
    process.exit(1);
  }
}

generateChangelog();

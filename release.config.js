// On the dev branch semantic-release creates a GitHub prerelease but does NOT
// commit package.json or CHANGELOG.md back to the repo, which prevents merge
// conflicts when dev is merged into main.
const isDev = (process.env.GITHUB_REF_NAME || '').startsWith('dev');

module.exports = {
  branches: [
    'main',
    { name: 'dev', prerelease: 'dev' },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',

    // Only update package.json version on main
    ...(!isDev ? [
      ['@semantic-release/npm', { npmPublish: false }],
    ] : []),

    // Only write CHANGELOG on main
    ...(!isDev ? [
      ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ] : []),

    // Only commit files back on main (this is the root cause of dev→main conflicts)
    ...(!isDev ? [
      ['@semantic-release/git', {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      }],
    ] : []),

    '@semantic-release/github',
  ],
};

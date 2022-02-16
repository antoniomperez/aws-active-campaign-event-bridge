#!/usr/bin/env node
/* eslint-disable no-console */

const standardVersion = require('standard-version');
const ver = require('./resolve-version');

async function main() {
  const releaseAs = process.argv[2] || 'minor';
  if (releaseAs !== 'major' && releaseAs !== 'minor' && releaseAs !== 'patch') {
    throw new Error(
      `invalid bump type "${releaseAs}". Only "minor" (the default), "major", "minor", "patch" are allowed.`
    );
  }

  console.log(`Starting ${releaseAs} version bump`);
  console.log(
    'Current version information:',
    JSON.stringify(ver, undefined, 2)
  );

  const opts = {
    releaseAs,
    skip: { tag: true },
    packageFiles: [{ filename: ver.versionFile, type: 'json' }],
    bumpFiles: [{ filename: ver.versionFile, type: 'json' }],
    infile: ver.changelogFile,
    prerelease: ver.prerelease,
  };

  await standardVersion(opts);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  process.exit(1);
});

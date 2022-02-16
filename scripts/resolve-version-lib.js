#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

function resolveVersion(rootDir) {
  const ALLOWED_RELEASE_TYPES = ['stable', 'rc', 'beta', 'alpha'];

  const releaseFile = path.join(rootDir, 'release.json');

  const releaseConfig = require(releaseFile);
  const { releaseType } = releaseConfig;

  if (!releaseType) {
    throw new Error(`"releaseType" must be defined in ${releaseFile}`);
  }
  if (!ALLOWED_RELEASE_TYPES.includes(releaseType)) {
    throw new Error(
      `releaseType=${releaseType} is not allowed. Allowed values: ${ALLOWED_RELEASE_TYPES.join(
        ','
      )}`
    );
  }

  //
  // resolve and check that we have a version file
  //

  const versionFile = 'package.json';
  const versionFilePath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(versionFilePath)) {
    throw new Error(`unable to find version file ${versionFile}`);
  }

  //
  // validate that current version matches the requirements
  //
  const versions = require(versionFilePath);
  const currentVersion = versions.version;

  return {
    version: currentVersion,
    versionFile,
    changelogFile: 'CHANGELOG.md',
    prerelease: releaseType !== 'stable' ? releaseType : undefined,
  };
}

module.exports = resolveVersion;

#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const validLevels = new Set(["patch", "minor", "major"]);
const args = process.argv.slice(2);
const level = args.find((arg) => validLevels.has(arg));
const dryRun = args.includes("--dry-run");

if (!level) {
  console.error("Usage: node skills/new-release/scripts/new-release.mjs <patch|minor|major> [--dry-run]");
  exit(1);
}

const root = cwd();
const packageJsonPath = join(root, "package.json");
const changelogPath = join(root, "CHANGELOG.md");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const currentVersion = parseVersion(packageJson.version);
const nextVersion = bumpVersion(currentVersion, level);
const today = formatLocalDate(new Date());
const changelog = readFileSync(changelogPath, "utf8");
const nextHeading = "## Next Release - TBD";
const releaseHeading = `## [v${nextVersion}] - ${today}`;
const tagName = `v${nextVersion}`;

if (!dryRun) {
  assertMainBranch();
  assertCleanWorktree();
}

if (!changelog.includes(nextHeading)) {
  console.error(`CHANGELOG.md must contain "${nextHeading}".`);
  exit(1);
}

const headingIndex = changelog.indexOf(nextHeading);
const afterHeading = changelog.slice(headingIndex + nextHeading.length);
const nextReleaseBody = afterHeading.split(/\n## \[?v?\d+\.\d+\.\d+\]? - /)[0] ?? "";

if (!nextReleaseBody.trim()) {
  console.error(`CHANGELOG.md "${nextHeading}" section is empty; add release notes before bumping.`);
  exit(1);
}

const updatedChangelog = changelog.replace(
  nextHeading,
  `${nextHeading}\n\n${releaseHeading}`,
);

if (dryRun) {
  console.log(`Would bump ${packageJson.version} -> ${nextVersion} (${level})`);
  console.log(`Would rewrite "${nextHeading}" to "${releaseHeading}" and add a fresh placeholder.`);
  console.log(`Would run: npm version ${level} --no-git-tag-version`);
  console.log(`Would run: git commit -m "chore: release ${tagName}"`);
  console.log(`Would run: git tag ${tagName}`);
  console.log("Would run: git push origin main --follow-tags");
  exit(0);
}

writeFileSync(changelogPath, updatedChangelog);
run("npm", ["version", level, "--no-git-tag-version"]);
assertPackageVersion(nextVersion);
const filesToCommit = ["CHANGELOG.md", "package.json"];

if (existsSync(join(root, "package-lock.json"))) {
  filesToCommit.push("package-lock.json");
}

run("git", ["add", ...filesToCommit]);
run("git", ["commit", "-m", `chore: release ${tagName}`]);
run("git", ["tag", tagName]);
run("git", ["push", "origin", "main", "--follow-tags"]);

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    console.error(`package.json version must be semver X.Y.Z, got "${version}".`);
    exit(1);
  }

  return match.slice(1).map(Number);
}

function bumpVersion([major, minor, patch], releaseLevel) {
  if (releaseLevel === "major") {
    return `${major + 1}.0.0`;
  }

  if (releaseLevel === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function run(command, commandArgs) {
  execFileSync(command, commandArgs, { stdio: "inherit" });
}

function output(command, commandArgs) {
  return execFileSync(command, commandArgs, { encoding: "utf8" }).trim();
}

function assertMainBranch() {
  const branch = output("git", ["branch", "--show-current"]);

  if (branch !== "main") {
    console.error(`Release must run from main; current branch is "${branch}".`);
    exit(1);
  }
}

function assertCleanWorktree() {
  const status = output("git", ["status", "--porcelain"]);

  if (status) {
    console.error("Release requires a clean git worktree before bumping.");
    console.error(status);
    exit(1);
  }
}

function assertPackageVersion(expectedVersion) {
  const updatedPackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (updatedPackageJson.version !== expectedVersion) {
    console.error(`npm version produced ${updatedPackageJson.version}, expected ${expectedVersion}.`);
    exit(1);
  }
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";
import select from "@inquirer/select";

/**
 * CONFIG
 */
const REPO_SSH = "git@github.com:tuyenpham2502/react-base.git";
const REPO_HTTPS = "https://github.com/tuyenpham2502/react-base.git";

function run(bin, args, opts = {}) {
  const r = spawnSync(bin, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`${bin} ${args.join(" ")} failed`);
}

function ensureNodeVersion() {
  const [major] = process.versions.node.split(".").map(Number);
  if (major < 18) {
    console.error("❌ Requires Node.js >= 18. Please upgrade Node.");
    process.exit(1);
  }
}

function ensureGitAvailable() {
  try {
    execSync("git --version", { stdio: "ignore" });
  } catch {
    console.error("❌ Git is not installed or not in PATH. Please install Git first.");
    process.exit(1);
  }
}

function hasCmd(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureDirNotExists(dir) {
  if (fs.existsSync(dir)) {
    console.error(`❌ Folder already exists: ${dir}`);
    process.exit(1);
  }
}

function removeGitFolder(projectDir) {
  const gitDir = path.join(projectDir, ".git");
  if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true });
}

function updatePackageName(projectDir, projectName) {
  const pkgPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function detectPmFromTemplate(projectDir) {
  if (fs.existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectDir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectDir, "package-lock.json"))) return "npm";
  return null;
}

function ensureCorepack(pm) {
  if (pm === "yarn" || pm === "pnpm") {
    try {
      execSync("corepack enable", { stdio: "ignore" });
      // Activate latest stable for best chance user machine works out of the box
      if (pm === "pnpm") execSync("corepack prepare pnpm@latest --activate", { stdio: "ignore" });
      if (pm === "yarn") execSync("corepack prepare yarn@stable --activate", { stdio: "ignore" });
    } catch {
      // ignore
    }
  }
}

async function choosePackageManager(projectDir) {
  const detected = detectPmFromTemplate(projectDir);

  // No TTY => pick detected or npm
  if (!process.stdin.isTTY) {
    const pm = detected || "npm";
    console.log(`⚠️ No interactive terminal detected. Using ${pm}.`);
    return pm;
  }

  return await select({
    message: "Choose a package manager:",
    choices: [
      { name: "npm", value: "npm" },
      { name: "yarn", value: "yarn" },
      { name: "pnpm", value: "pnpm" },
    ],
    default: detected || "npm",
  });
}

function installDependencies(pm, cwd) {
  if (pm === "pnpm") run("pnpm", ["install"], { cwd });
  else if (pm === "yarn") run("yarn", [], { cwd });
  else run("npm", ["install"], { cwd });
}

function initNewGitRepo(cwd) {
  try {
    run("git", ["init"], { cwd });
    run("git", ["add", "."], { cwd });
    run("git", ["commit", "-m", "chore: init from template"], { cwd });
  } catch {
    // not critical; user might not have git identity set
  }
}

function printAuthHelp() {
  console.error(`
❌ Cannot clone template repository.

Common fixes:
1) SSH (recommended):
   - Add SSH key to GitHub, then test: ssh -T git@github.com

2) GitHub CLI:
   - Install gh, login: gh auth login

3) HTTPS:
   - Ensure your git credential manager can access GitHub
`);
}

function tryClone(repoUrl, projectName) {
  // no branch hardcode: clone default branch
  run("git", ["clone", "--depth", "1", "--filter=blob:none", repoUrl, projectName]);
}

async function main() {
  ensureNodeVersion();
  ensureGitAvailable();

  const projectName = process.argv[2];
  if (!projectName) {
    console.error("Usage: npx create-nobi-react-app <project-name>");
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  ensureDirNotExists(targetDir);

  console.log(`🚀 Creating React app: ${projectName}`);

  // 1) Clone template (SSH -> gh -> HTTPS)
  try {
    tryClone(REPO_SSH, projectName);
  } catch {
    try {
      if (hasCmd("gh")) {
        // gh repo clone owner/repo <dir>
        run("gh", ["repo", "clone", "tuyenpham2502/react-base", projectName, "--", "--depth=1"], {
          cwd: process.cwd(),
        });
      } else {
        throw new Error("gh not available");
      }
    } catch {
      try {
        tryClone(REPO_HTTPS, projectName);
      } catch {
        printAuthHelp();
        process.exit(1);
      }
    }
  }

  // 2) Remove git history
  removeGitFolder(targetDir);

  // 3) Rename package.json
  updatePackageName(targetDir, projectName);

  // 4) Choose PM
  const pm = await choosePackageManager(targetDir);
  ensureCorepack(pm);

  // 5) Install deps
  console.log(`📦 Installing dependencies using ${pm}...`);
  installDependencies(pm, targetDir);

  // 6) New git repo (optional but nice)
  initNewGitRepo(targetDir);

  console.log(`
✅ Success!

Next steps:
  cd ${projectName}
  ${pm} run dev
`);
}

main();

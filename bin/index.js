#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import select from "@inquirer/select";

/**
 * CONFIG
 */
const REPO_SSH = "https://github.com/tuyenpham2502/react-base.git"; // 👈 sửa
const DEFAULT_REF = "main";

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
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
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

function ensureCorepack(pm) {
  if (pm === "yarn" || pm === "pnpm") {
    try {
      execSync("corepack enable", { stdio: "ignore" });
    } catch {}
  }
}

async function choosePackageManager() {
  // Nếu không có TTY thì không thể hiện menu -> fallback
  if (!process.stdin.isTTY) {
    console.log("⚠️ No interactive terminal detected. Defaulting to npm.");
    return "npm";
  }

  return await select({
    message: "Choose a package manager:",
    choices: [
      { name: "npm (recommended)", value: "npm" },
      { name: "yarn", value: "yarn" },
      { name: "pnpm (fast & lightweight)", value: "pnpm" },
    ],
    default: "npm",
  });
}

function installDependencies(pm, cwd) {
  const cmd =
    pm === "pnpm" ? "pnpm install" :
    pm === "yarn" ? "yarn" :
    "npm install";

  run(cmd, { cwd });
}

function printAuthHelp() {
  console.error(`
❌ Cannot clone template repository (maybe private).

Please ensure SSH is set up and you have access:
  ssh -T git@github.com
`);
}

async function main() {
  const projectName = process.argv[2];
  if (!projectName) {
    console.error("Usage: npx create-my-react-app <project-name>");
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  ensureDirNotExists(targetDir);

  console.log(`🚀 Creating React app: ${projectName}`);

  // 1) Clone template
  try {
    run(`git clone --depth 1 --branch ${DEFAULT_REF} ${REPO_SSH} ${projectName}`);
  } catch {
    printAuthHelp();
    process.exit(1);
  }

  // 2) Remove git history
  removeGitFolder(targetDir);

  // 3) Rename package.json
  updatePackageName(targetDir, projectName);

  // 4) Choose PM (menu)
  const pm = await choosePackageManager();
  ensureCorepack(pm);

  // 5) Install deps
  console.log(`📦 Installing dependencies using ${pm}...`);
  installDependencies(pm, targetDir);

  console.log(`
✅ Success!

Next steps:
  cd ${projectName}
  ${pm} run dev
`);
}

main();

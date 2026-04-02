## create-nobi-react-app

A simple CLI to bootstrap a React application from the `tuyenpham2502/react-base` template.

### Install

You can use it directly with `npx` (recommended), or install globally.

```bash
npx create-nobi-react-app <project-name>
```

or:

```bash
npm install -g create-nobi-react-app
create-nobi-react-app <project-name>
```

### Usage

```bash
npx create-nobi-react-app my-app
```

What happens:

1. **Environment checks**
   - Verifies **Node.js >= 18**
   - Verifies **Git** is installed

2. **Clone template**
   - Prompts you for your **GitHub token**
   - Uses that token to clone the private template repository over **HTTPS**
   - In non-interactive environments, reads the token from `NOBI_GITHUB_TOKEN` or `GITHUB_TOKEN`

3. **Project setup**
   - Removes the original `.git` folder
   - Updates `package.json` `name` field to `<project-name>`
   - Detects the template's package manager lockfile (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`)
   - Asks you which package manager to use (`npm`, `yarn`, `pnpm`)  
     - In non-interactive environments, it automatically picks the detected one or falls back to `npm`

4. **Install dependencies**
   - Runs the appropriate install command:
     - `pnpm install` or
     - `yarn` or
     - `npm install`
   - Uses **Corepack** for `pnpm` / `yarn` if available (prepares latest stable versions)

5. **Initialize a new Git repository**
   - Runs:
     - `git init`
     - `git add .`
     - `git commit -m "chore: init from template"`
   - If Git identity is not configured, this step may fail silently; you can initialize Git manually.

### After creation

Inside the newly created project:

```bash
cd <project-name>
npm run dev        # or yarn dev / pnpm dev, depending on what you chose
```

### Requirements

- **Node.js**: >= 18
- **Git** installed and available in `PATH`
- Access to the GitHub repository `tuyenpham2502/react-base`  
  - If you cannot clone the repository, the CLI will show an error and ask you to contact support.

### Using a private template repository

When you run the CLI locally, it will ask for your GitHub token:

```bash
npx create-nobi-react-app my-app
```

If you need to run in CI or another non-interactive environment, export a GitHub token before running the CLI:

```bash
export NOBI_GITHUB_TOKEN=ghp_xxx
npx create-nobi-react-app my-app
```

You can also use `GITHUB_TOKEN` if that is already part of your environment.

Recommended GitHub token permissions:

- Fine-grained token
- Repository access: only the private template repository
- Permission: `Contents: Read-only`

### Troubleshooting & Support

If cloning the template repository fails or you need access:

- Please contact: **tuyenpham250203@gmail.com** to get access or further support.

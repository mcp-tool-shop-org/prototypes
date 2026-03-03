# Setup Guide

This guide will help you set up the websketch-demo project for local development.

## Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 20 or higher
  - Check: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
- **npm**: Usually comes with Node.js
  - Check: `npm --version`
- **Git**: For version control
  - Check: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo
```

Or if you forked it:

```bash
git clone https://github.com/YOUR_USERNAME/websketch-demo.git
cd websketch-demo
```

### 2. Install Dependencies

```bash
npm ci
```

> **Note**: Use `npm ci` instead of `npm install` for a clean, reproducible install based on `package-lock.json`.

### 3. Verify Installation

Run the following commands to ensure everything is set up correctly:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test -- --run

# Build
npm run build
```

All commands should complete without errors.

### 4. Start Development Server

```bash
npm run dev
```

The application will open in your default browser at `http://localhost:3000`.

## Development Workflow

### Daily Development

```bash
# Start dev server (hot reload enabled)
npm run dev
```

### Before Committing

```bash
# Run all checks
npm run typecheck    # Type checking
npm run lint         # Code linting
npm run format       # Code formatting
npm test -- --run    # Run tests
npm run build        # Verify build works
```

Or run them all at once:

```bash
npm run typecheck && npm run lint && npm test -- --run && npm run build
```

## Editor Setup

### Visual Studio Code (Recommended)

1. Install recommended extensions when prompted (or manually):
   - ESLint (`dbaeumer.vscode-eslint`)
   - Prettier (`esbenp.prettier-vscode`)

2. Settings are pre-configured in `.vscode/settings.json`:
   - Format on save enabled
   - ESLint auto-fix enabled

### Other Editors

- **WebStorm/IntelliJ**: ESLint and Prettier should work out of the box
- **Vim/Neovim**: Use appropriate plugins for ESLint and Prettier
- **Sublime Text**: Install ESLint and Prettier packages

## Project Structure

```
websketch-demo/
├── src/                      # Source code
│   ├── __tests__/           # Test files
│   ├── main.ts              # Application entry
│   └── styles.css           # Styles
├── .github/                  # GitHub configuration
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── .vscode/                  # VS Code settings
├── dist/                     # Build output (gitignored)
├── node_modules/            # Dependencies (gitignored)
├── index.html               # HTML entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── vitest.config.ts         # Vitest config
├── .eslintrc.cjs            # ESLint config
├── .prettierrc              # Prettier config
├── .gitignore               # Git ignore rules
├── LICENSE                  # MIT License
├── README.md                # Main documentation
├── CONTRIBUTING.md          # Contribution guide
├── CODE_OF_CONDUCT.md       # Code of conduct
└── CHANGELOG.md             # Version history
```

## Common Issues & Solutions

### Port 3000 Already in Use

```bash
# Kill process using port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Build Failures

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Type Errors

```bash
# Ensure TypeScript is up to date
npm install typescript@latest --save-dev

# Restart your editor's TypeScript server
# VS Code: Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### Test Failures

```bash
# Run tests in watch mode to debug
npm test

# Run with coverage to see what's missing
npm run test:coverage
```

## Deployment

### GitHub Pages (Automated)

Pushing to `master` or `main` branch automatically triggers deployment via GitHub Actions.

### Manual Deployment

```bash
# Build for production
npm run build

# Preview the build locally
npm run preview

# Deploy the `dist/` folder to your hosting provider
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## Getting Help

- **Documentation**: Check [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: Search [existing issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)
- **New Issue**: [Create an issue](https://github.com/mcp-tool-shop-org/websketch-demo/issues/new/choose)

## Next Steps

1. Read the [CONTRIBUTING.md](CONTRIBUTING.md) guide
2. Check the [open issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)
3. Make your first contribution!

Happy coding! 🚀

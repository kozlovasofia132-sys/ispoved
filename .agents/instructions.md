# Development Instructions

This file contains specific environment instructions for the AI assistant.

## Environment Details
- **OS**: Windows
- **Shell**: PowerShell (pwsh)
- **Native Tools**: `grep` is NOT available. Use `findstr` for basic searches, or `ripgrep` (`rg`) if installed.
- **Workflow**: For Capacitor projects, `npm run build && npx cap copy` is the standard deployment flow.

## Project Structure
- **Design System**: Stitch Digital Archive (parchment, gold accents).
- **Styling**: Tailwind CSS + Vanilla CSS.
- **Key Files**:
  - `index.html`: Main UI template.
  - `src/main.js`: Application logic.
  - `src/version.js`: Version source of truth.
  - `package.json`: Project metadata and build scripts.

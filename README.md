
# ☘️ Tobacco Scout - 4LEAF, INC.

A high-performance barcode scanning application designed for tobacco product compliance verification. This tool allows inspectors and retail compliance officers to instantly verify UPC codes against an approved registry.

## 🚀 Features

- **Real-time Scanning**: High-speed barcode detection optimized for mobile devices.
- **Offline Readiness**: Once loaded, it can function as a standalone audit tool.
- **Branded Experience**: Tailored interface for 4LEAF, INC. compliance workflows.
- **Registry Audit**: Direct comparison against `constants.ts` tobacco product list.
- **History Tracking**: Keeps a local log of recent scans for audit purposes.

## 📦 Project Structure

- `index.html`: The web entry point with Tailwind CSS and Scanner script.
- `index.tsx`: React mounting logic.
- `App.tsx`: Main application state, scanning interface, and results logic.
- `constants.ts`: The approved product list (CSV) and lookup engine.
- `types.ts`: TypeScript definitions for clean code.
- `metadata.json`: PWA-style metadata and hardware permission requests.

## 🛠️ Usage

1. Deploy to any static host (GitHub Pages, Netlify, Vercel).
2. Ensure you are using **HTTPS** (mandatory for camera access).
3. Update the CSV data in `constants.ts` to refresh the product registry.
4. Place your logo as `logo.png` in the root directory.

---
© 4LEAF, INC. 

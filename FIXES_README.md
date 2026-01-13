# 🔧 Tobacco Scout - Fixes Applied

## Issues Found

### 1. **Duplicate Entry Points** ❌
Your `index.html` had TWO script tags loading different files:
```html
<script type="module" src="index.js"></script>
<script type="module" src="/index.tsx"></script>
```
This caused conflicts and a blank screen.

### 2. **Wrong File Structure** ❌
- Files were in the root directory instead of `src/`
- Vite expects: `index.html` in root, source files in `src/`

### 3. **Missing index.css** ❌
- The index.tsx imports `'./index.css'` but the file didn't exist

### 4. **Incorrect vite.config.ts filename** ⚠️
- File was named `vite_config.ts` instead of `vite.config.ts`

## Fixes Applied ✅

### Fixed Project Structure:
```
tobacco-scout/
├── index.html              (fixed - single entry point)
├── package.json
├── tsconfig.json
├── vite.config.ts          (renamed from vite_config.ts)
├── .gitignore
└── src/
    ├── index.tsx           (entry point)
    ├── index.css           (created)
    ├── App.tsx
    ├── constants.ts
    └── types.ts
```

### Changes Made:

**1. index.html** - Now loads only ONE entry point:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tobacco Scout | 4LEAF INC.</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

**2. Moved all source files to `src/` directory**

**3. Created `src/index.css`** for the missing import

**4. Renamed `vite_config.ts` to `vite.config.ts`**

## How to Deploy to GitHub Pages

### Step 1: Update vite.config.ts

Replace the base path with your repo name:

```typescript
export default defineConfig({
  base: '/your-repo-name/',  // ⚠️ IMPORTANT: Replace this!
  // ... rest of config
});
```

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### Step 3: Enable GitHub Pages

1. Go to your repo → Settings → Pages
2. Source: **GitHub Actions**
3. Push your changes

## Testing Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Checklist

- [ ] Fix file structure (src/ directory) ✅
- [ ] Update vite.config.ts base path
- [ ] Create GitHub Actions workflow
- [ ] Enable GitHub Pages in repo settings
- [ ] Push to GitHub

## Notes

⚠️ Camera requires HTTPS (GitHub Pages provides this)
📱 Test on real mobile device
🔐 Grant camera permissions when prompted

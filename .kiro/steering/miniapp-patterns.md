---
inclusion: fileMatch
fileMatch: "miniapp/**"
---

# Mini App Development Patterns

These patterns apply when working in the `miniapp/` package (Vite + React + Tailwind + Supabase + Playwright).

## Stack

- **Bundler**: Vite
- **UI**: React 18, React Router
- **Styling**: Tailwind CSS (config: `miniapp/tailwind.config.js`)
- **Forms**: React Hook Form
- **Backend**: Supabase client (`miniapp/src/lib/`)
- **Icons**: Lucide React
- **Testing**: Playwright e2e (`miniapp/tests/`)

## File Organization

```
miniapp/src/
  App.jsx           — Router, providers, lazy-loaded routes
  pages/            — One file per route/page
  components/       — Reusable, domain-agnostic components
  components/ui/    — Primitive UI components (Button, Card, etc.)
  context/          — React Context providers for app-wide state
  lib/              — Supabase client, utilities, service catalog
  providers/        — Feature-specific data/state providers
  index.jsx         — Entry point
```

## Routing

Routes are defined in `App.jsx`. Add new pages by:
1. Creating `miniapp/src/pages/NewPage.jsx`
2. Adding a lazy import and `<Route>` in `App.jsx`
3. Adding navigation entry if it should appear in the nav bar

Use `React.lazy` + `<Suspense>` for all route-level components (already established pattern).

## Styling

Apply Tailwind classes directly. The design system uses:
- Responsive-first: start with mobile layout
- Color tokens: defined in `tailwind.config.js`
- Custom component classes: defined in `miniapp/src/index.css`

No inline `style` props for layout — use Tailwind. Inline styles only for dynamic values (e.g., computed widths/colors).

## State Management

- App-wide state: React Context (`miniapp/src/context/`)
- Form state: React Hook Form
- Server state: Supabase queries inside components or custom hooks
- No Redux or Zustand — use Context + hooks

## Accessibility

Target WCAG 2.1 AA:
- All interactive elements must be keyboard-navigable
- Images need `alt` text; decorative images use `alt=""`
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<h1>`–`<h6>`)
- Color contrast ≥ 4.5:1 for text

## Telegram Mini App Integration

The app runs inside Telegram's WebView. Key constraints:
- Verify `initData` HMAC on the API side before trusting user identity
- `VITE_TELEGRAM_BOT_USERNAME` env var used for deep links
- Use `window.Telegram.WebApp` APIs for back button, main button, theme params
- Test on real Telegram on mobile — desktop devtools do not replicate the environment

## Playwright Tests

- Config: `miniapp/playwright.config.js`
- Tests: `miniapp/tests/`
- Run: `npm run test:e2e --prefix miniapp`
- List without running: `npm run test:e2e:list --prefix miniapp`
- Provider route smoke: `node miniapp/scripts/providerRouteSmoke.mjs`

## Bundle Budget

Keep the production bundle within budget. Check with:
```bash
npm run check:miniapp:bundle
```

The CI workflow `miniapp-bundle-check.yml` enforces this on every PR.

## Build & Lint

```bash
npm run build --prefix miniapp    # Must pass before any PR
npm run lint --prefix miniapp     # (if eslintrc.cjs rules apply)
```

ESLint config: `miniapp/.eslintrc.cjs`.

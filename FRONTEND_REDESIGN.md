# Frontend redesign notes

## What changed

This update revises the React/Vite frontend while retaining its existing API endpoints, protected routes, authentication flow, food listing/claim workflow and donor, NGO, admin and profile pages.

- **Visual identity:** A restrained forest-green, warm-ivory and terracotta palette replaces much of the bright gradient styling. DM Sans is used for practical UI, and DM Serif Display for editorial headings.
- **Homepage:** New split hero, photographic community image with a local SVG fallback, purposeful calls to action, a live-impact strip, three-step explanation, recent listings preview, interactive impact estimate and final registration invitation.
- **Navigation:** Cleaner responsive header, active-link styling, profile entry, desktop controls and an accessible mobile menu that closes on route changes and Escape.
- **Authentication:** Consistent split-layout sign-in and registration screens with a mission-focused companion panel.
- **Functional screens:** Unified page titles, cards, form focus states, spacing, buttons, alerts, table styling and mobile layouts throughout the feed and role-based dashboards.
- **Data clarity:** Impact statistics use returned API data rather than fabricated numeric fallbacks. When the backend is reachable but returns an empty list, the feed and dashboards show their empty states rather than dummy entries. If the server is unreachable, existing sample-data fallback is shown with an explicit preview-mode notice.
- **Accessibility:** More obvious keyboard focus states, accessible mobile menu labels, reduced-motion styles, colour contrast improvements, and constrained modal height on small screens.

## Run the project

From `frontend/`:

```bash
npm install
cp .env.example .env
npm run dev
```

Build for production with `npm run build`. Run the Express/MongoDB backend separately (see the main README); API-dependent actions need it online.

This ZIP intentionally omits `node_modules`, build output, `.git` history and private `.env` files. Install dependencies on your own operating system before building.

## Image and offline behaviour

The home hero loads a photograph by Joel Muniz from Unsplash (https://unsplash.com/photos/people-packing-food-in-plastic-bags-qvzjG2pF4bE), available under the Unsplash License. When the photograph cannot load, a bundled local SVG illustration is used instead.

## Validation

All React source files were parsed successfully with Babel's JSX parser. Tailwind CSS compiled successfully from `src/index.css`. A full Vite build could not be run in the authoring environment because the uploaded `node_modules` contained Windows-specific native Rollup/esbuild binaries; run `npm install` on your machine before building.

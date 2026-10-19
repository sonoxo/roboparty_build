# GPT-Doug / GPT-Chaos — Zero-Cost Development Policy

Scope: this vehicle-hangar application and all future edits within this directory.

- Use only free and open-source tooling, packages, libraries, models, and publishing routes. Prefer native code, public documentation, GitHub, GitHub Pages, and Three.js.
- Do not introduce paid AI builders, hosted inference APIs, billing accounts, subscriptions, license paywalls, or usage-metered dependencies.
- Do not authorize charges or purchases. Any unavoidable paid dependency requires the owner's explicit approval **before** it is used.
- Keep the viewer runnable as static HTML without API keys, backend services, paid models, or an npm build.
- Keep model geometry and interactions in readable source code rather than remote black-box services.
- Maintain the three independent `THREE.Group` models, mobile support, orbit navigation, error fallback, and accessible controls.
- Run free validation before modifying deployment: `node --test vehicle-hangar/tests/smoke.test.mjs` from the repository root.
- Do not modify the unrelated Armbian Linux build system.

## Free deployment

A GitHub Pages workflow already exists at `.github/workflows/deploy-vehicle-hangar-pages.yml`. GitHub Pages is available free for public GitHub repositories. First-time activation requires a repository administrator to open **Settings → Pages → Build and deployment → Source: GitHub Actions**. The existing workflow will then publish `vehicle-hangar/index.html` as the site entry point on pushes to `main`.

No third-party AI site builder or paid deployment service is required.

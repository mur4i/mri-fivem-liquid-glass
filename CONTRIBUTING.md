# Contributing

Thanks for helping. Issues and pull requests in English or Portuguese are both fine.

## Before you open an issue

- Search the existing issues first.
- For bugs seen in game, include: FiveM or RedM, game build, GPU, what the screen shows, and the
  client log lines that mention `[liquid-glass]` (`FiveM.app/logs/CitizenFX_log_*.log`).
- A short video or screenshot helps more than a long description.

## Development

```bash
npm install
npm run build      # dist/: ESM + types + single-file IIFE
npm run dev        # demo on http://127.0.0.1:5180 (uses dist/, rebuild after changes)
npm test           # headless Chrome visual test (needs Google Chrome)
npm run typecheck
```

Outside the game there is no game frame: the demo uses a game screenshot (`site/scene.webp`) through
`fallbackImage`. You can drop a real GTA screenshot on the demo page.

**The browser is not the game.** Anything touching the hook, timing, black frames or
performance must also be tested in FiveM. Say in the pull request what you checked where.

## Code rules

- The target is the FiveM browser: **Chromium 103** and WebGL2. No newer browser APIs.
- No runtime dependencies.
- Keep the hook call order in `gameTexture()` exactly as it is: the order is what the hook
  matches.
- Comments in English, one line, only when they explain why.
- Never copy code from closed or paid resources.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `test:`, `ci:`, `chore:`). Releases and the
changelog are generated from them, so the type matters: `fix:` makes a patch release, `feat:` a
minor release, `feat!:` or a `BREAKING CHANGE:` footer a major release.

One topic per pull request. CI (typecheck, build, visual test) must pass.

## Maintainers: first npm release

Trusted publishing can only be set up on a package that already exists:

1. Make the repository public. The Release workflow creates the first version and tag.
2. `git pull`, `npm login`, `npm run build`, `npm publish` once by hand.
3. On npmjs.com, package Settings, Trusted publisher: GitHub Actions, repository
   `mur4i/mri-fivem-liquid-glass`, workflow `publish.yml`.

From then on every release publishes itself with provenance.

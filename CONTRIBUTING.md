# Contributing

Thanks for helping. Issues and pull requests in English or Portuguese are both fine.

## Before you open an issue

- Search the existing issues first.
- For bugs seen in game, include: FiveM or RedM, game build, GPU, what the screen shows, and the
  client log lines that mention `[liquid-glass]` (`FiveM.app/logs/CitizenFX_log_*.log`).
- A short video or screenshot helps more than a long description.

## Development

```bash
npm ci
npm run typecheck
npm run build        # dist/: ESM, types, single-file IIFE
npm run validate     # community registry
npm run docs:dev     # site with the playground on http://localhost:5173/mri-fivem-liquid-glass/
npm run docs:build   # build + JSON API + site
npm test             # headless Chrome visual test of the built playground (needs Google Chrome)
```

Outside the game there is no game frame: the playground uses a game screenshot
(`docs/public/scene.webp`) through `fallbackImage`, and you can drop your own screenshot on it.

**The browser is not the game.** Anything touching the hook, timing, black frames or
performance must also be tested in FiveM. Say in the pull request what you checked where.

AI agents: read [AGENTS.md](AGENTS.md).

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

## Maintainers

- Releases: every `fix:` or `feat:` on `main` creates a tag and a GitHub release (no commit back
  to `main`), then `publish.yml` publishes that tag to npm through trusted publishing.
- Merging: CI must pass. Pull requests that only touch `docs/`, `registry/`, `examples/` or root
  Markdown merge by themselves (`automerge.yml`); everything else needs a review from @mur4i
  (`CODEOWNERS`).

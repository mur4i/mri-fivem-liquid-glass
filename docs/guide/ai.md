# For AI agents

This project is built to be used and improved by AI coding agents as much as by people.

## Using the library from an agent

- **Agent skill**: the npm package ships `skills/mri-fivem-liquid-glass/SKILL.md`, a ready skill in
  the Claude Code / Agent Skills format. Copy it into your agent's skills folder, or point the
  agent at `node_modules/mri-fivem-liquid-glass/skills/mri-fivem-liquid-glass/SKILL.md`.
- **[`/llms.txt`](/llms.txt)**: a short map of the docs and the API for language models;
  [`/llms-full.txt`](/llms-full.txt) has every guide page in one file.
- **[JSON API](/api)**: options, attributes and presets as data, always generated from the source.

## Improved it? Send it back

If your agent fixed a bug, tuned a shader or added a feature while using this library in a
project, **open a pull request upstream** instead of keeping a private patch. Everyone gets the
improvement and your project keeps getting updates without conflicts.

1. Read [`AGENTS.md`](https://github.com/mur4i/mri-fivem-liquid-glass/blob/main/AGENTS.md) in the
   repository: how to build, test and what reviewers expect.
2. Keep the change focused and explain what was seen in game versus in the browser.
3. Open the pull request at
   [github.com/mur4i/mri-fivem-liquid-glass](https://github.com/mur4i/mri-fivem-liquid-glass/pulls).

Changes to docs, examples and the community registry merge automatically when the checks pass.
Changes to the library code get a quick review from a maintainer.

## Ground rules for agents

- Target the FiveM browser: Chromium 103 and WebGL2. No newer browser APIs.
- Never copy code from closed or paid resources.
- Do not claim it was tested in game unless it was.

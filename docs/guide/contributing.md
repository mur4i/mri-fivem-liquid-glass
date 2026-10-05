# Contributing

Thanks for helping. Issues and pull requests in English or Portuguese are both welcome.

## Fastest ways to help

- **Share your project** in the [Showcase](/showcase): add one JSON file, it merges by itself.
- **Share a preset** in [Presets](/presets): same thing.
- **Report numbers**: FPS and `resmon` on your hardware, as an issue.
- **Improve the docs**: every page has an "Edit this page" link at the bottom.

## Registry pull requests

Add one file per entry. The CI validates it against the schema and merges it when green.

::: code-group

```json [registry/showcase/my-server.json]
{
  "id": "my-server",
  "name": "My Server HUD",
  "author": "your-github-user",
  "description": "Inventory and phone with liquid glass.",
  "url": "https://example.com",
  "repo": "https://github.com/you/your-resource",
  "image": "my-server.webp",
  "tags": ["hud", "inventory"]
}
```

```json [registry/presets/my-preset.json]
{
  "id": "my-preset",
  "name": "My preset",
  "author": "your-github-user",
  "description": "What it looks like and where it fits.",
  "options": { "blur": 16 },
  "attributes": { "data-glass": "liquid", "data-glass-bezel": "20" }
}
```

:::

Showcase images go in `registry/showcase/images/`, WebP, at most 300 KB.

Not comfortable with pull requests? Use the issue forms
["Add my project to the showcase"](https://github.com/mur4i/mri-fivem-liquid-glass/issues/new?template=showcase.yml)
and ["Share a preset"](https://github.com/mur4i/mri-fivem-liquid-glass/issues/new?template=preset.yml).

## Code

Read [CONTRIBUTING.md](https://github.com/mur4i/mri-fivem-liquid-glass/blob/main/CONTRIBUTING.md)
for the development setup, code rules and commit format.

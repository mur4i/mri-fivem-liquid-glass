# Example resource

A minimal FiveM resource with one frosted panel and one liquid button, in plain HTML.

1. Copy this folder into your server `resources/` as `liquid-glass-example`.
2. `ensure liquid-glass-example` in `server.cfg` (or `ensure` it from the console).
3. In game, type `/glassdemo`. `Esc` or the button closes it.

The page loads the library from jsDelivr. To work offline, copy
`dist/mri-liquid-glass.iife.min.js` next to `html/index.html`, point the `<script>` to it and add
it to `files` in `fxmanifest.lua`.

# Troubleshooting

## The glass is a flat, solid box

A `backdrop-filter` is still on the element or on a parent. Remove it.

## Nothing shows, not even the tint

- The UI root is under the glass canvas: give it `position: relative; z-index: 1`.
- `html`, `body` or the root have a background color: make them transparent.

## It works in game but not in the browser

Expected: outside FiveM there is no game frame. Pass `fallbackImage` with a screenshot while you
develop.

## Black or frozen glass for the first second

The game frame hook binds a moment after the page loads. The library keeps the last good frame
and re-binds by itself if the frame stays black for 2.5 s. If it never recovers, check the client
log (`FiveM.app/logs/CitizenFX_log_*.log`) for lines with `[liquid-glass]` and open an issue.

## The corners are wrong

The radius comes from `border-top-left-radius`. Different radii per corner are not supported yet.
If you changed it with inline `style`, call `refresh()`.

## Glass over another panel shows the game, not the panel

By design: the glass canvas sits under the whole UI and only knows the game frame. Glass over
glass works; glass over an opaque NUI panel shows the game behind both.

## A rotated element looks off

Rotation is not supported: the glass uses the element's bounding box. Scale and translate work.

## Still stuck

Open an [issue](https://github.com/mur4i/mri-fivem-liquid-glass/issues/new/choose) with a screenshot
or a short video, the library version and the log lines.

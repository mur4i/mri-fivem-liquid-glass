# FiveM resource

Patterns that matter once the glass lives in a real resource. The full working version is
[`examples/showcase-resource`](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/examples/showcase-resource)
(`/liquidglass` in game).

## Manifest

```lua
fx_version 'cerulean'
game 'gta5'

ui_page 'html/index.html'
files {
    'html/index.html',
    'html/mri-liquid-glass.iife.min.js', -- only if you ship the file instead of the CDN
}
```

## Start once, render on demand

Start the glass when the page loads. Open and close screens by adding and removing their markup:
with no `[data-glass]` left in the DOM, the render loop stops by itself. Hiding with
`display: none` also stops drawing, but keeps a cheap check running every frame.

```js
MriLiquidGlass.startGameGlass()

window.addEventListener('message', (e) => {
  if (e.data.action === 'open') root.innerHTML = template()
  if (e.data.action === 'close') root.innerHTML = ''
})
```

## Focus

```lua
SetNuiFocus(true, true)  -- cursor and keyboard go to the page
SetNuiFocus(false, false) -- back to the game
```

## Looking around while a screen is open

A nice touch: drag on empty space to turn the camera, release to get the cursor back. Do not drop
the focus on mouse down: the game never sees that press and the drag ends immediately. Keep the
focus and pass the input through instead, so the page still receives the release:

```lua
local blocked = { 24, 25, 140, 141, 142, 257, 263 } -- attack and melee while dragging

RegisterNUICallback('lookStart', function(_, cb)
    cb('ok')
    looking = true
    SetNuiFocusKeepInput(true)
    CreateThread(function()
        while looking do
            for i = 1, #blocked do DisableControlAction(0, blocked[i], true) end
            Wait(0)
        end
    end)
end)

RegisterNUICallback('lookEnd', function(_, cb)
    looking = false
    SetNuiFocusKeepInput(false)
    cb('ok')
end)
```

```js
root.addEventListener('pointerdown', (e) => {
  if (e.target.closest('[data-glass]')) return // buttons and panels keep working
  post('lookStart')
})
window.addEventListener('pointerup', () => post('lookEnd'))
window.addEventListener('blur', () => post('lookEnd'))
```

## Several resources with glass

Each NUI page runs its own glass. Two pages open at the same time cost twice; keep glass on the
screens the player looks at, not on always-on HUD pieces.

## DUI and iframes

DUI pages (`?mode=dui`) are skipped on purpose. Pages inside iframes are not tested yet: if you
try, tell us in an issue.

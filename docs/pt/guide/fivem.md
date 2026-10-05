# Resource FiveM

Padrões que importam quando o vidro vive num resource de verdade. A versão completa e funcionando
é o [`examples/showcase-resource`](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/examples/showcase-resource)
(`/liquidglass` no jogo).

## Manifest

```lua
fx_version 'cerulean'
game 'gta5'

ui_page 'html/index.html'
files {
    'html/index.html',
    'html/mri-liquid-glass.iife.min.js', -- só se você levar o arquivo em vez do CDN
}
```

## Iniciar uma vez, desenhar quando precisa

Inicie o vidro quando a página carrega. Abra e feche telas colocando e tirando o HTML delas: sem
nenhum `[data-glass]` no DOM, o loop para sozinho. Esconder com `display: none` também para de
desenhar, mas deixa uma checagem leve rodando a cada frame.

```js
MriLiquidGlass.startGameGlass()

window.addEventListener('message', (e) => {
  if (e.data.action === 'open') root.innerHTML = template()
  if (e.data.action === 'close') root.innerHTML = ''
})
```

## Girar a câmera com a tela aberta

Arrastar num lugar vazio gira a câmera; soltar devolve o cursor. Não tire o foco no clique: o
jogo não vê aquele aperto e o arraste acaba na hora. Mantenha o foco e repasse o mouse, assim a
página continua recebendo o soltar:

```lua
local blocked = { 24, 25, 140, 141, 142, 257, 263 } -- ataque e soco durante o arraste

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
  if (e.target.closest('[data-glass]')) return // botões e painéis continuam funcionando
  post('lookStart')
})
window.addEventListener('pointerup', () => post('lookEnd'))
window.addEventListener('blur', () => post('lookEnd'))
```

## Vários resources com vidro

Cada página NUI roda o seu vidro. Duas páginas abertas ao mesmo tempo custam o dobro; use vidro
nas telas que o jogador abre, não em pedaço de HUD sempre aberto.

## DUI e iframe

Páginas DUI (`?mode=dui`) são ignoradas de propósito. Dentro de iframe ainda não foi testado: se
tentar, conta numa issue.

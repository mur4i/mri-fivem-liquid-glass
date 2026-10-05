# Formatos e lentes

## Diamante

```html
<div class="gem" data-glass="liquid" data-glass-shape="diamond"></div>
```

```css
.gem {
  width: 160px;
  height: 160px;
  border: 0;
  box-shadow: none;
  /* a sua tinta e borda também seguem o diamante */
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}
```

O elemento continua uma caixa no layout; o vidro é desenhado como diamante dentro dela. O
`border-radius` arredonda as pontas.

## Gema

Uma mesa plana no meio amplia a cena; em volta, a coroa é dividida em facetas, cada uma
entortando o fundo pra um lado, com linhas de lapidação e separação de cor forte.

```html
<div data-glass="liquid" data-glass-shape="diamond" data-glass-lens="gem" data-glass-facets="8"></div>
```

## Caleidoscópio

O fundo atrás do elemento espelhado em fatias em volta do centro. Mover o elemento (ou a câmera)
muda o desenho.

```html
<div data-glass="liquid" data-glass-lens="kaleidoscope" data-glass-facets="8"></div>
```

## Morph

Largura, altura e `border-radius` podem animar com transition do CSS. Durante a animação, o vidro
precisa reler o formato a cada frame:

```ts
function followMorph(el: HTMLElement, glass: { refresh(): void }) {
  let running = true
  const tick = () => { if (running) { glass.refresh(); requestAnimationFrame(tick) } }
  el.addEventListener('transitionend', () => { running = false; glass.refresh() }, { once: true })
  requestAnimationFrame(tick)
}
```

Teste todas as combinações no [Playground](/playground).

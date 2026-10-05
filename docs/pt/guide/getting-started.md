# Começo rápido

## 1. Instalar

::: code-group

```bash [npm]
npm i mri-fivem-liquid-glass
```

```bash [pnpm]
pnpm add mri-fivem-liquid-glass
```

```html [Sem bundler]
<!-- Expõe window.MriLiquidGlass. Fixe a versão em produção. -->
<script src="https://cdn.jsdelivr.net/npm/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js"></script>
```

:::

Sem internet ou com versão fixa: copie
`node_modules/mri-fivem-liquid-glass/dist/mri-liquid-glass.iife.min.js` pro lado do seu
`index.html` e liste nos `files` do `fxmanifest.lua`.

## 2. Iniciar uma vez

```ts
import { startGameGlass } from 'mri-fivem-liquid-glass'

startGameGlass()
```

Com a tag de script: `MriLiquidGlass.startGameGlass()`.

Retorna `{ refresh, stop }`. Chame uma vez quando a NUI sobe, não a cada tela que abre.

## 3. Marcar as superfícies

```html
<div class="panel" data-glass>Painel fosco</div>
<button class="pill" data-glass="liquid">Botão liquid</button>
```

## 4. Três regras de CSS

```css
/* A página precisa ficar transparente pro jogo aparecer. */
html, body, #root { background: transparent; }

/* A biblioteca desenha num canvas em z-index 0; a sua UI vai acima. */
#root { position: relative; z-index: 1; }

[data-glass] {
  background: rgba(255, 255, 255, 0.06); /* tinta por cima do blur: mantenha baixa */
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 16px 36px rgba(0, 0, 0, 0.3);
}

/* Troca a cor do texto sobre cena clara. */
[data-glass-backdrop='bright'] { color: #111; }
```

::: danger Nada de backdrop-filter
Tire todo `backdrop-filter` dos elementos de vidro. No CEF ele compõe contra a página, não contra
o jogo, e pinta uma camada sólida por cima do vidro de verdade.
:::

## 5. Desenvolver fora do jogo

No navegador comum não existe frame do jogo, então a biblioteca fica desligada. Passe um print
pra ver o visual real enquanto desenha:

```ts
startGameGlass({ fallbackImage: import.meta.env.DEV ? '/dev-bg.jpg' : null })
```

`fallbackImage` aceita URL, `<img>` ou `<canvas>`.

## Próximos

- Ajuste o visual no [Playground](/playground) e copie o código.
- Leia os padrões de [Resource FiveM](./fivem) (foco, girar a câmera, fechar tela).

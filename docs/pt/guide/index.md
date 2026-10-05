# Introdução

O FiveM desenha a sua página NUI por cima do jogo com o Chromium Embedded Framework (CEF). A
página é transparente, e o jogo é composto por baixo dela depois. Por isso o
`backdrop-filter: blur()` do CSS vira uma caixa lisa e opaca: do ponto de vista da página, não
existe nada atrás do seu painel pra desfocar.

O **mri-fivem-liquid-glass** traz o frame do jogo pra dentro da página pelo hook de visão do jogo
da NUI da Cfx.re, desfoca na GPU e desenha atrás de cada elemento marcado, no formato exato do
elemento. Além disso, pode entortar a imagem nítida numa borda em bisel (liquid glass), lapidar
em facetas (gema) ou espelhar em fatias (caleidoscópio).

![No jogo: liquid glass, um diamante lapidado e um caleidoscópio](/hero.webp)

## O que vem junto

- **Vidro fosco** atrás de qualquer elemento, seguindo `border-radius`, a opacidade dos pais e o
  corte por `overflow`.
- **Liquid glass**: borda em bisel, refração, separação de cor, brilho especular.
- **Formatos e lentes**: contorno de diamante, gema lapidada, caleidoscópio.
- **Texto legível**: `data-glass-backdrop="bright|dark"` em cada elemento.
- **À prova de jogo**: aguenta loading, frame preto e hook perdido; nunca trava a GPU pra ler
  pixel.
- **Sem dependências**, uns 18 KB minificado, com qualquer framework ou HTML puro.

## Próximos passos

- [Começo rápido](./getting-started) pra ter vidro na tela em poucos minutos.
- [Playground](/playground) pra ajustar o visual e copiar o código.
- [Resource FiveM](./fivem) pros padrões de foco, câmera e ciclo de vida.
- [Como funciona](/guide/how-it-works) (em inglês) pros detalhes.

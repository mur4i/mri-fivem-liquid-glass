# Desempenho

## Medido no jogo

Com o [showcase](https://github.com/mur4i/mri-fivem-liquid-glass/tree/main/examples/showcase-resource)
inteiro aberto (21 elementos de vidro, incluindo um caleidoscópio grande), numa RTX 4060 Laptop
com i7-13650HX em 1080p:

- **`resmon`: 0,00 ms e 0,00%** no resource: nada roda no Lua, o trabalho é na GPU, dentro da
  NUI.
- **Sem queda de FPS mensurável**: com a tela fechada a cena oscila entre 89 e 98 fps; com tudo
  aberto fica em torno de 90.

![resmon em 0,00 ms com o showcase aberto](/perf-resmon.webp)

Tem números de outra máquina? Manda numa
[issue](https://github.com/mur4i/mri-fivem-liquid-glass/issues): ajuda todo mundo.

## Por que é leve

- O blur roda numa cópia do jogo em 1/4 da tela; a cópia nítida da refração, em 1/2.
- O desenho final só pinta os pixels dentro dos elementos de vidro.
- A leitura de pixel (frame preto e tom do texto) usa uma miniatura 32x18 lida de forma
  assíncrona, então a GPU nunca espera.
- Sem elemento de vidro no DOM: o loop para. Elemento escondido: nada é desenhado.

## Dicas

- Prefira poucas superfícies grandes a muitas minúsculas.
- Deixe o vidro fora de HUD sempre aberto; ele brilha nas telas que o jogador abre.
- Em GPU fraca, baixe `scale` (ex.: `0.2`) e suba `blur` pra compensar.
- Tire do DOM a tela fechada em vez de esconder.

<script setup>
import { ATTRIBUTES } from '../../../src/reference'
</script>

# Marcação

Tudo é controlado por atributos `data-*` nos seus elementos, e as mudanças são percebidas
sozinhas: adicione, tire ou mude um atributo e o vidro acompanha no frame seguinte.

## Atributos

A tabela vem direto do código da biblioteca (descrições em inglês).

<table>
  <thead><tr><th>Atributo</th><th>Valores</th><th>Quem define</th><th>Efeito</th></tr></thead>
  <tbody>
    <tr v-for="a in ATTRIBUTES" :key="a.name">
      <td><code>{{ a.name }}</code></td>
      <td>{{ a.values }}</td>
      <td>{{ a.setBy === 'you' ? 'você' : 'a biblioteca' }}</td>
      <td>{{ a.description }}</td>
    </tr>
  </tbody>
</table>

Qualquer atributo de ajuste fino (ou uma lente) também liga o bisel num `data-glass` comum.

## Fosco ou liquid?

Use **fosco** (`data-glass`) em painel grande com conteúdo: lista, formulário, chat. O bisel ali
disputa com o texto. Use **liquid** (`data-glass="liquid"`) em peça pequena e destacada: botão,
pílula, orb, dock, widget de HUD.

## O formato segue o seu CSS

- `border-radius` (pelo `border-top-left-radius`) arredonda o vidro, inclusive `50%` e `999px`;
- a opacidade do elemento **e de todos os pais** esmaece o vidro, então fade em CSS funciona;
- o primeiro pai com `overflow` diferente de `visible` corta o vidro;
- `scale()` e `translate()` funcionam; rotação usa o retângulo do elemento.

Mudou o raio por `style` inline: chame `refresh()`. Mudança de classe e de `data-glass*` é
detectada sozinha.

## Cor do texto

```css
[data-glass-backdrop='bright'] { color: #111; }
[data-glass-backdrop='dark'] { color: #fff; }
```

<script setup>
import { OPTIONS } from '../../../src/reference'
const show = (v) => (v === null ? 'null' : JSON.stringify(v))
</script>

# Opções

```ts
import { startGameGlass, GLASS_DEFAULTS } from 'mri-fivem-liquid-glass'

const glass = startGameGlass({ blur: 18, saturation: 1.2 })
// glass.refresh() relê raio, corte e atributos depois de mudar style inline
// glass.stop() tira o canvas e para tudo
```

A tabela vem do código da biblioteca, então está sempre atual (descrições em inglês).

<table>
  <thead><tr><th>Opção</th><th>Tipo</th><th>Padrão</th><th>Significado</th></tr></thead>
  <tbody>
    <tr v-for="o in OPTIONS" :key="o.name">
      <td><code>{{ o.name }}</code></td>
      <td><code>{{ o.type }}</code></td>
      <td><code>{{ show(o.default) }}</code></td>
      <td>{{ o.description }}</td>
    </tr>
  </tbody>
</table>

## Mudar opção com a tela aberta

As opções são lidas ao iniciar. Pra mudar `blur` ou `saturation` ao vivo, pare e inicie de novo,
que é barato:

```ts
let glass = startGameGlass({ blur: 14 })

function setBlur(value: number) {
  glass.stop()
  glass = startGameGlass({ blur: value })
}
```

O visual por elemento (bisel, refração, dispersão, lentes) é atributo e muda ao vivo sem
reiniciar. Veja [Marcação](./markup).

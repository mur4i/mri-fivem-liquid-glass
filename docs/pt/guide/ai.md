# Para agentes de IA

Este projeto foi feito pra ser usado e melhorado por agentes de IA tanto quanto por pessoas. Três
passos e o seu agente conhece a biblioteca inteira:

<ClientOnly><AiOnboarding lang="pt" /></ClientOnly>

O `setup-ai` escreve a skill da biblioteca onde cada agente procura (`.claude/skills/`,
`AGENTS.md`, `.cursor/rules/`, `.github/copilot-instructions.md`). Rodar de novo atualiza o mesmo
bloco, sem duplicar. Sem `--agent`, ele detecta os agentes que o projeto já usa.

## Usando a biblioteca com um agente

- **Skill pronta**: o pacote no npm traz `skills/mri-fivem-liquid-glass/SKILL.md`, no formato de
  skill do Claude Code / Agent Skills. Copie pra pasta de skills do seu agente, ou aponte pra
  `node_modules/mri-fivem-liquid-glass/skills/mri-fivem-liquid-glass/SKILL.md`.
- **[`/llms.txt`](/llms.txt)**: um mapa curto das docs e da API pra modelos de linguagem;
  [`/llms-full.txt`](/llms-full.txt) tem todas as páginas do guia num arquivo só.
- **[API em JSON](/api)**: opções, atributos e presets como dados, sempre gerados do código.

## Melhorou? Manda de volta

Se o seu agente corrigiu um bug, ajustou um shader ou criou um recurso usando esta biblioteca
num projeto, **abra um pull request aqui** em vez de guardar um patch só seu. Todo mundo ganha a
melhoria e o seu projeto continua recebendo atualização sem conflito.

1. Leia o [`AGENTS.md`](https://github.com/mur4i/mri-fivem-liquid-glass/blob/main/AGENTS.md) do
   repositório: como buildar, testar e o que a revisão espera.
2. Mudança focada, dizendo o que foi visto no jogo e o que foi visto no navegador.
3. Abra o PR em
   [github.com/mur4i/mri-fivem-liquid-glass](https://github.com/mur4i/mri-fivem-liquid-glass/pulls).

Mudança em docs, exemplos e no registro da comunidade entra sozinha quando o CI passa. Mudança no
código da biblioteca ganha uma revisão rápida de um mantenedor.

# Produção em Remotion (template muri-video)

## Criar o projeto

- **No Orca (padrão):** crie um workspace novo no projeto Muri Video. Ele nasce da `main` do repositório do template
  (`MURI_VIDEO_REPO`, padrão `~/videos/projetos/muri-video`); rode `pnpm install --frozen-lockfile` (o setup do Orca já faz) e troque `projeto` em `src/plano.json`.
- **Fora do Orca:** `node <pasta-da-skill>/scripts/novo-projeto.mjs <pasta> NomeDoProjeto` exporta a mesma `main`
  (via `git archive`), ajusta o `plano.json` e instala. Remotion 4.0.545 (desde 21/11/2026; ver `versoes.md`), React 19.

## Arquivos (o que cada um decide)

| Arquivo | Papel |
|---|---|
| `producao/` | `brief.md`, `storyboard.md`, `estado.json` (aprovações com evidência), `tarefa.md` (contrato de delegação) |
| `src/roteiro.json` | texto falado por cena (a ordem das chaves é a ordem das cenas), modelo e voz do TTS |
| `src/plano.json` | id do projeto, marca (nome, logo em `public/`), selo padrão, `acabamento` (vazamento, vinheta, grão, desfoque), textos da divulgação, respiros, capítulo e título por cena |
| `src/tema.ts` | tokens do produto (`T`, `FUNDO_APP`) e curvas `saida`/`vai`/`meio`, `t01`, `mix`, `acaso`, `intensidade` |
| `src/kit/camera.tsx` | `Palco` (2.5D), `Camada` (paralaxe), `Cursor` + `cliques` (ver motion.md) |
| `src/kit/movimento.tsx` | `entra` (texto sobe com wipe), `tremor` (batida), `Varredura` (faixa de luz do corte) |
| `src/kit/efeito.tsx` · `src/kit/textos.tsx` | `efeito(quadro, som, vol)` com o pico no quadro · `Marca`, `Legenda`, `Selo`, `Titulo` (cabe na largura), `LegendaPalavras` |
| `src/kit/efeitos.tsx` | acabamento (motion.md §10): `Vazamento`, `Acabamento`, `Brilho`, `Profundidade`, `TelaReal`, `Grifo`, `useBatida`, `Desfoque` |
| `src/kit/planos/` | biblioteca de planos (motion.md §11): `PLANOS` (registro: componente, schema zod, padrão, duração), `Catalogo`, um arquivo por plano exportando `Plano<X>` (o plano pronto) e as peças (`Numeradora`, `Placar`, `MapaVivo`, `Series`, `transicao()`…) |
| `src/narracao.tsx` | contrato de tempo: `duracaoCena`, `inicioCena`, `marca(cena, trecho)`, legendas (`SIGLAS`, `PARA_TELA`) |
| `src/cenas/index.tsx` | `CENAS_SITE`: cada cena com `Site` (visual no formato nativo) e `Som` (efeitos); `Previa` para QA |
| `src/cenas/Divulgacao.tsx` | stills de story e feed (ver divulgacao.md) |
| `src/Filme.tsx` · `src/som.tsx` | sequência das cenas com corte de luz, voz e efeitos fora do corte · trilha com ducking |
| `scripts/quadros.mjs` | `node scripts/quadros.mjs <comp> <quadros…>`, que grava em `out/quadros/*.png` |
| `scripts/narrar.mjs` (Gemini) · `narrar-local.mjs` (Kokoro) · `alinhar.mjs` (whisper, grava `src/palavras.json`) | ver narracao.md |
| `scripts/sons.mjs` (grava `src/picos.json`) | ver som.md |
| `scripts/entregar.mjs` · `render.mjs` · `montar.mjs` · `legendas.mjs` | ver render.md |

Composições: `<projeto>-16x9`, `<projeto>-9x16`, `<cena>-16x9`/`<cena>-9x16` (prévia com voz e efeitos), as stills
`divulgacao-story`/`divulgacao-feed`, e a pasta "Planos": `Planos-catalogo-16x9`/`-9x16` e cada plano como `plano-<id>-16x9`/`-9x16` (props no painel).

## Como fazer uma cena

0. Existe plano na biblioteca (motion.md §11)? Use-o: `import { PlanoPlacar, padraoPlacar } from "../kit/planos/Placar"`
   e `<PlanoPlacar {...padraoPlacar} titulo="…" a={…} inicio={marca(cena, "trecho")} />`. Para compor com câmera/cursor,
   use a peça (ex.: `Placar` com `frame` e `k`) dentro do `Palco`. Ajuste as props no Studio (pasta "Planos") e copie
   os valores para a cena. Plano com duração por lista (`transicoes`, `morph`, `baloes`) tem `duracaoDe`: o Root usa
   `calculateMetadata`, então a composição cresce sozinha ao editar a lista.
1. Senão, leia o cartão da galeria (`~/.agents/skills/video-shotcraft/references/shots/<categoria>/<plano>.md`; índice em `gallery/api/library.json`) e a demo-fonte; copie
   para `src/demos/` só o que usar. Adapte os tempos-chave, curvas e paradas, não o visual (o visual é o do produto). Siga motion.md: formato nativo, câmera, cursor, continuidade, som por ação.
2. Âncoras de tempo SEMPRE por `marca(cena, "trecho")` (+/− poucos quadros). Quadro fixo só no começo da cena.
   **fps livre (30/60/120):** todo número de quadro é "quadro de 30" (`src/kit/tempo.ts`). Na cena use `useQuadro()`
   (nunca `useCurrentFrame()`), `useDuracao()` no lugar de `useVideoConfig().durationInFrames`, `spring({ fps: BASE })`, e
   passe por `q()` todo `from`/`durationInFrames`/timing entregue ao Remotion. `quadros.mjs` recebe quadros REAIS (× fps/30).
3. Telas reais: capture o app em 2× (`ferramentas/capturar.mjs`) com dados fictícios; meça coordenadas na imagem;
   para nitidez em zoom use CSS `zoom` (não `scale`) — regra Q2 da video-shotcraft.
4. QA: 4–6 quadros em pontos de virada → `python3 <pasta-da-skill>/ferramentas/prancha.py p.jpg a.png b.png …`
   (2 colunas) → olhe a prancha. Corrija antes de ir para a próxima cena.

## Checklist por cena (o que a revisão final pegou)

- [ ] `Selo` em toda tela: "Simulação · dados fictícios" no simulado, "Fonte: …" no real; números fictícios longe dos reais.
- [ ] Texto de apoio ≥ 32 px (16:9) e ≥ 34 px (9:16); nada importante sob a legenda (16:9 abaixo de y ≈ 960; 9:16 abaixo de y ≈ 1730).
- [ ] Os dois formatos conferidos na mesma prancha; nada colado ou sobreposto.
- [ ] Rótulo na tela não repete a legenda palavra por palavra (complementa).
- [ ] O que a fala cita aparece (a fala diz "com mapa" → o mapa precisa estar na tela).
- [ ] Contadores escondidos até rolar (nada de "0.000" por segundos); dígitos parciais não formam outro número.
- [ ] Anotações sobre conteúdo com fundo opaco (nada translúcido deixando o texto de trás aparecer).
- [ ] Ícones semânticos certos (☂ só na noite de chuva).
- [ ] Marca parada ≥ 1 s; pilhas e grades param ≥ 0,5 s depois de assentar.

## Armadilhas do Remotion neste ambiente

- `npx remotion render` (CLI) falha aqui ("Target closed", icudtl.dat) → sempre `scripts/render.mjs` (API +
  `openBrowser("chrome")`). O Studio (`npm run dev`) funciona.
- `<Audio>` do `@remotion/media` estoura timeout em render longo → use `Html5Audio`.
- `durationInFrames` vem da narração: depois de regravar a voz, todas as `marca()` se movem sozinhas (é o objetivo).
- Fontes via `@remotion/google-fonts` (Manrope + Faustina por padrão). Troque em `src/fontes.ts` pelas do produto; se não estiverem no Google Fonts, use woff2 locais em `public/fontes` com `@font-face` + `delayRender`.
- Efeitos WebGL (`@remotion/effects`) precisam de `GL=angle`: é o padrão de `render.mjs`, `quadros.mjs` e do `remotion.config.ts`.
- `HtmlInCanvas` (`Brilho`, `Profundidade`, `Desfoque`) só aparece no Studio com `chrome://flags/#canvas-draw-element`
  ligado no Chrome; sem a flag a prévia mostra o conteúdo puro. O Chrome do render (headless shell 158) já suporta e aninha.
  QA desses efeitos é sempre pelos quadros (`quadros.mjs`), nunca pelo Studio.
- `pnpm add` de versão com menos de 1 dia grava `minimumReleaseAgeExclude` no `pnpm-workspace.yaml` (política de idade
  mínima). Só para pacote oficial `@remotion/*`; confira o diff.
- `filmBurn` (`@remotion/transitions`, html-in-canvas) NÃO desenha no `renderStill`/render headless do 4.0.540: só aparece
  a tela nova. Por isso a `queima` da biblioteca é CSS própria; não troque pela da lib sem conferir nos quadros.
- `interpolatePath` (`@remotion/paths`) exige a MESMA sequência de comandos SVG nos dois paths (erro "mismatch"):
  repita um ponto para igualar (`M L L M L`).
- No zsh, `$F` com vários arquivos não divide em palavras (`prancha.py p.jpg $F` passa um argumento só): use array.
- `tsc --noEmit` antes de cada QA; erros em `src/demos` copiadas podem ser ignorados se não forem usadas.

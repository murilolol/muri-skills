---
name: muri-video
description: Pipeline completo do Muri para vídeo de apresentação narrado e "absurdo de profissional" (institucional, produto, resultados, portfólio) — briefing no estilo /grill-me, roteiro e narração por TTS, styleframes, storyboard, cenas em Remotion (ou HyperFrames), trilha + efeitos, render 16:9 e 9:16 (até 4K) com e sem trilha, peças de divulgação (story/feed) com legendas por rede, revisão final por subagente. Padrão de motion validado em produção. Ative quando o usuário disser "muri video", "muri-video", "/muri-video", ou pedir para fazer/refazer um vídeo de apresentação, motion graphics, vídeo narrado, vídeo para redes ou vídeo de um projeto/app — mesmo sem citar a skill.
---

# muri-video (2.2)

**Padrão atual: o vídeo-referência** (painel de dados públicos, 90 s, 16:9 e 9:16 em 4K), que o autor
chamou de "absurdo de perfeito" e pediu como nível mínimo de **todo** vídeo, de qualquer projeto: identidade do próprio
produto, câmera 2.5D, cursor, continuidade entre cenas, luz nos dados e som em cada ação. Leia `references/motion.md`
antes de propor a direção visual e de escrever qualquer cena.

Base anterior (vídeo-base institucional e story em HyperFrames): `references/historico.md`. Os números e as
armadilhas daqui são medidos, não teóricos. Versões testadas e ambiente: `references/versoes.md`.

Esta skill **orquestra** outras — carregue cada uma quando a etapa chegar, não antes:

| Skill | Para quê |
|---|---|
| `video-shotcraft` | galeria de planos (receitas de movimento), demos-fonte, biblioteca de áudio Mixkit, regras estéticas R/Q/S/C/P, `final-review.md` |
| `remotion-best-practices` | API do Remotion quando surgir dúvida pontual (oficial `remotion-dev/skills`; versão em `references/versoes.md`) |
| `dataviz` | qualquer gráfico/contador/painel de números (paleta validada, marcas finas) |
| `grill-me` | o jeito de perguntar: rodadas densas no `AskUserQuestion`, recomendada primeiro |
| HyperFrames (`npx hyperframes`) | motor alternativo em HTML/GSAP — ver `references/hyperframes.md` |
| FigCraft (`figcraft-cli`) | styleframes e tokens editáveis (opcional) — ver `references/figcraft.md` |

## Fluxo (cada ✋ é um ponto de aprovação do usuário — não avance sem ele)

0. **Contexto frio**: memória primeiro (ai-memory ou notas do projeto, se houver); leia os tokens do produto (CSS/tema), as telas e de onde vêm
   os dados. Consulta em banco de produção só com ok explícito e somente leitura.
1. **Briefing** ✋ — `references/briefing.md` (rodadas prontas com as opções que funcionaram).
2. **Roteiro e narração** ✋ — texto por cena em `src/roteiro.json`; regras de escrita para TTS em
   `references/narracao.md`. Aprovar o TEXTO antes de gastar cota de TTS.
3. **Direção visual** ✋ — 3 styleframes (HTML estático → PNG) lado a lado; o usuário escolhe uma.
4. **Storyboard** ✋ — tabela parte · tempo · o que aparece · plano · som. Plano = primeiro a biblioteca do template
   (`src/kit/planos/`, "quando usar cada um" em motion.md §11; mostre o catálogo do Studio se o usuário quiser ver),
   depois a galeria da video-shotcraft. Depois de aprovado,
   qualquer troca de plano (ex.: gráfico virou cartões) é **registrada e confirmada** — a revisão reprova (B4).
5. **Produção** — `references/remotion.md` + `references/motion.md`. Pastas: todo vídeo mora em
   `~/videos/muri-video/<cliente>/<video>/vN` (ex.: `acme/lancamento/v1`; raiz em `MURI_ORCA_RAIZ`). Antes de criar, veja
   em que cliente/vídeo o usuário está (pasta atual). Vídeo novo: `muri novo <cliente> <video>`; "faz um v2"/refazer:
   `muri versao` dentro do vídeo — cria a próxima `vN` a partir do último commit da anterior e **nunca sobrescreve**.
   `muri status` lista todos os vídeos (etapa e próxima ação) e sincroniza nome e status no Orca; `muri retomar`
   mostra estado, aprovação pendente e handoffs abertos do vídeo. Nada de pasta solta na raiz nem worktree pelo botão do Orca (cria um nível só).
   Primeiro **2 pilotos** ✋ (uma cena de painel + um par com continuidade), quadros de QA nos dois formatos e o clipe já em 1080p (nunca prévia 0,5×: gasta tempo e cota, o usuário analisa o render real);
   só depois de aprovados, as outras cenas, uma por vez, cada uma com QA de quadros 16:9 + 9:16.
6. **Som** depois do visual travado — `references/som.md`.
7. **Render e entrega** ✋ — `references/render.md`: `node scripts/entregar.mjs` (`ESCALA=2` para 4K) faz os formatos
   em paralelo, o áudio, o VTT e os 4 MP4. Divulgação (story + feed + legendas por rede) quando pedida — `references/divulgacao.md`.
8. **Revisão final por subagente** (pedir autorização no briefing) — `references/revisao.md`; corrigir as
   obrigatórias, renderizar de novo, e só então entregar.

## Motor: Remotion (padrão) ou HyperFrames

- **Remotion** (template desta skill): vídeo longo dirigido pela narração, muitos dados, cenas React com lógica,
  pipeline de som/QA já provado. É o padrão.
- **HyperFrames** (HeyGen, Apache-2.0, testado v0.9.77): composição em HTML/CSS + GSAP, sem build; bom para
  peças curtas (promo 15–45 s, vinheta, slideshow), captura de site (`hyperframes capture`), legenda em vídeo de
  pessoa falando. Detalhes, comandos e armadilhas: `references/hyperframes.md`.
- **Skills oficiais da HeyGen = sob demanda, só no projeto.** Quando o motor escolhido for HyperFrames (ou um
  workflow dele for útil), rode `bash <pasta-da-skill>/scripts/hyperframes-ativar.sh <pasta-do-projeto> <workflow>`
  — instala em `<projeto>/.claude/skills/` (nunca no global; o script confere), e então LEIA
  `<projeto>/.claude/skills/hyperframes/SKILL.md` + o do workflow (a sessão só as carrega sozinha se estiver rodando
  dentro da pasta). Ao fim do projeto: `… hyperframes-ativar.sh <projeto> --remover`.
- Os utilitários do HyperFrames servem também ao Remotion, sem ativar skill nenhuma: `narrar-local.mjs` (voz Kokoro,
  sem cota), `alinhar.mjs` (whisper: instante real de cada palavra) e `hyperframes audio` (onde cada som cai).

## Ambiente

Versões, `doctor` e instalação: `references/versoes.md`. Render headless
do HyperFrames SEMPRE com `PUPPETEER_EXECUTABLE_PATH="$(which chrome-headless-shell)"` (sem isso ele abre o
`Google Chrome.app`, que vaza processo a cada render).

## Regras de ouro (cada uma custou retrabalho num vídeo real)

1. **A narração manda no tempo**: duração da cena = respiro de entrada + voz + respiro de saída (`src/plano.json`);
   sincronize destaques com `marca(cena, "trecho falado")` — nunca com quadro fixo. Depois de gravar a voz, rode
   `node scripts/alinhar.mjs`: com o tempo real de cada palavra, `marca()` e a legenda ficam exatas (a estimativa
   errava até ~10 quadros).
2. **Números**: a voz fala por extenso, evitando concordância de gênero ("quatrocentas"); a tela mostra algarismos
   (`PARA_TELA`). Sigla com ponto ("R.A.") quebra a legenda — já tratada em `SIGLAS`.
3. **Identidade = o produto**: tokens do CSS do site/app em `src/tema.ts`, componentes do produto redesenhados em
   escala de vídeo, fontes do site. Nunca vídeo só de cartões, objetos 3D de brinquedo ou mundo inventado (todos
   reprovados). Marca parada ≥ 1 s na abertura e no fim; encerramento no pico de energia (riser → impacto → brilho).
4. **Dados**: real quando público, com selo "Fonte: …"; simulado com selo "Simulação · dados fictícios" (`Selo`).
   Sem dado pessoal; segurança/antifraude só com fatos e totais. Havendo lados, neutralidade de tempo e tratamento.
5. **Formato nativo e legibilidade**: cada cena se monta para 16:9 e para 9:16 (`V = H > W`), nunca encolhida numa
   moldura. Texto de apoio ≥ 32 px; nada colado ou sobreposto; nada importante sob a legenda; story com 270 px livres
   em cima e embaixo. Confira sempre os dois formatos na mesma prancha.
6. **Nada de estado intermediário enganoso**: contador mostrando "0.000" por segundos, dígito parcial que se lê
   como outro número ("96" passando por "55"), painel fictício com números quase iguais aos reais.
7. **Som** (`som.md`): pico do arquivo no quadro-alvo; trilha ~11 dB abaixo da voz; sempre uma versão sem trilha.
8. **Render** (`render.md`): `scripts/entregar.mjs` do projeto; −16 LUFS, ≤ −1,5 dBTP; renders em `out/render/`,
   finais em `out/final/` (o disco do Mac não diferencia maiúsculas — já destruiu um render).
9. **QA por cena** com pranchas de quadros antes de seguir; no filme montado, confira legenda × conteúdo. Antes de
    entregar: `node <pasta-da-skill>/ferramentas/qa.mjs <projeto>` (LUFS/TP, duração com × sem trilha, pranchas dos dois formatos; exit 1 = não entregue). Área segura e tamanho de texto só a olho nas pranchas.
10. **Motion** (`motion.md`): câmera 2.5D que endireita para ler, cursor com consequência e som, continuidade
    entre cenas, dados que acendem, estado visual novo a cada 1,5–3 s (sem isso: "sem animação, repetitivo").
    Acabamento em §10, biblioteca de planos `src/kit/planos/` em §11 — use antes de animar do zero. Sem
    `Math.random()`/`Date.now()` nas cenas (render tem de ser determinístico; use `random(seed)` do Remotion).
11. **Aprovação**: toda pergunta e aprovação no `AskUserQuestion`; evidência (frase do usuário) em
    `producao/estado.json`. Enquanto espera o usuário, `etapa` começa com `aguardando_aprovacao_` (o Orca mostra
    in-review); a cada aprovação, handoff no ai-memory com o nome `<cliente> <video> vN (<etapa>)`. Ajuste recusado não volta; ajuste num formato não se aplica sozinho ao outro.
12. **Revisão independente**: subagente `batedor` (só leitura) nos quadros; confira cada sugestão contra o dado e a
    sincronia antes de aplicar.
13. **Contexto**: vídeo de 4 min é sessão longa — QA visual gasta muito contexto. Corte em pontos naturais
    (após storyboard; após metade das cenas) com handoff no ai-memory.

## Ferramentas desta skill

- Template Remotion = branch `main` de um repositório próprio (`MURI_VIDEO_REPO`, padrão `~/videos/projetos/muri-video`;
  base dos workspaces do Orca; ver `references/remotion.md`). Melhorias que valem para todo vídeo entram lá, por commit local na `main` feito num
  worktree temporário (o checkout principal costuma estar ocupado com outro vídeo). `template/hyperframes/index.html` — composição
  base no tema claro (story 9:16 na batida: receita em `references/hyperframes.md`).
- `cli/muri.mjs` (no PATH como `muri`) — `novo`, `versao`, `status`, `entregar`, `arquivar`, `retomar`; `--sem-deps` pula o
  `pnpm install`. Testes: `node --test` em `cli/` (repo temporário + Orca e ai-memory falsos; nunca toca vídeo real).
- `scripts/novo-projeto.sh` — exporta a `main` do template para uma pasta qualquer fora do Orca (sem git).
- Projetos encerrados: `~/videos/_arquivo/muri-video/<cliente>/<video>/vN` (via `muri arquivar`; branches no git).
- `references/historico.md` — lições dos vídeos anteriores e o que reaproveitar.
- `scripts/hyperframes-ativar.sh` — ativa/remove as skills oficiais do HyperFrames só no projeto.
- Scripts `scripts/*.mjs` citados acima (`entregar`, `sons`, `alinhar`, `narrar`, `quadros`) moram no **projeto** (vêm do template), não nesta pasta.
- `ferramentas/qa.mjs <projeto> [--sem-prancha] [--cenas a:0,b:5.2]` — QA da entrega: −16 LUFS ±1, ≤ −1,5 dBTP, mesma duração com/sem trilha (±1 quadro), pranchas em `out/qa/`.
- `ferramentas/analisar_batida.py` (`python3 -E`, precisa de librosa) — grade de batidas com correção de andamento/fase; `--verificar <mp4> --cortes cortes.json` mede cada corte ao acento mais forte (≤ 3 quadros). `muri doctor` confere o ambiente.
- `ferramentas/prancha.py` (pranchas de QA), `ferramentas/analisar_audio.py` (sincronia e níveis no render),
  `ferramentas/capturar.mjs` (captura páginas do app em 2× pelo DevTools, para telas reais).

## Entrega (mensagem final ao usuário)

Caminhos dos 4 MP4 (+ VTT; 4K quando pedido), duração, loudness medido, peças de divulgação e legendas por rede
(quando pedidas), o que mudou em relação ao aprovado (textos alterados, suposições de dados),
resultado da revisão final, e os itens da video-shotcraft (workbench opcional; menção de autoria/vitrine e
exportação para o CapCut/Jianying uma vez cada). Na aprovação final: `muri entregar` (copia `out/final` para
`~/videos/_entregas/<cliente>/<video>/vN` e marca `entregue`), commit do `estado.json`, e então
**perguntar no AskUserQuestion** se arquiva; sim → `muri arquivar` (copia final + produção + roteiro para `_arquivo`,
confere, remove o worktree e mantém o branch). Fechar com o comando de retomada (handoff) para a próxima sessão.

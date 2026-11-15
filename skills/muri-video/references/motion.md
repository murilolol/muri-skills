# Padrão de motion (vídeo-referência)

Base: o vídeo-referência, de um painel de dados públicos. Tem 90 s, 10 cenas e saiu em 16:9 e 9:16 4K. O autor chamou de
"absurdo de perfeito" e pediu este nível em todo vídeo, de qualquer projeto. Antes dele vieram três versões reprovadas:

- v1: cartões e objetos 3D. O usuário disse "não tem animações, repetitivo, não tá responsivo".
- v2: "papel de segurança", um mundo visual inventado.
- v3: a identidade do site, aprovada, mas ainda estática demais.

A v4 é este documento. O kit
genérico está no template, em `src/kit/` e `src/tema.ts`.

## 1. A identidade é a do produto

- Leia o CSS/tema do produto e copie os tokens para `src/tema.ts`: fundo, superfícies, bordas, texto e as cores de destaque.
- Redesenhe os **componentes do próprio produto** em escala de vídeo, em vez de cartões genéricos. No vídeo-referência foram:
  - o placar de dois lados;
  - o painel de perfil com os números principais;
  - o gráfico de assentos de uma casa legislativa;
  - o mapa por município;
  - a busca com ⌘K;
  - as abas de seções.
- Fontes do site, de preferência locais: woff2 em `public/fontes`, carregadas com `@font-face` e `delayRender` em `src/fontes.ts`.
- Use dado real quando ele for público, com o selo "Fonte: <órgão> …". Número simulado leva o selo "Simulação · dados fictícios"
  (`Selo` em `kit/textos.tsx`). Fotos reais vão em `public/fotos`, com anel na cor do lado.
- Quando há lados (política, concorrentes), seja neutro: mesmo tempo, mesmo tratamento, mesma ordem de destaque. Cada aba
  mostra o dado real daquela aba; nada de repetir a foto de um item principal numa aba que fala de outro.

## 2. Cada formato com layout próprio

- Cada cena lê `useVideoConfig()` e faz `const V = H > W`. O layout é próprio de cada formato, com posições e escala `k`
  (1,15–1,6 no 9:16). Nunca encolha o 16:9 a 0,51× dentro de uma moldura: isso foi reprovado.
- Legenda (`Legenda` do kit):
  - 16:9: `bottom: 40`, `padding: 0 300px`, 40 px;
  - 9:16: `top: 1745`, `padding: 0 70px`, 42 px.
- Nenhum texto colado ou sobreposto. Confira nas pranchas dos dois formatos, no quadro de cada virada.
- Um ajuste pedido para um formato não vale para o outro. Proposta recusada não volta.

## 3. Câmera 2.5D moderada (`Palco`, `Camada`)

- `Palco giro inclina zoom foco perto` (perspectiva 2600). A interface **entra inclinada e endireita para a leitura**.
- Valores aprovados:

  | Formato | `giro` | `inclina` |
  |---|---|---|
  | 16:9 | −9 → −3,5 → 0 | 6 → 2,5 → 0 |
  | 9:16 | 4 → 1,5 → 0 | 10 → 3 → 0 |

- Tempo: abre em `t01(frame, 0, 60)` e endireita nos 24 quadros antes do momento de leitura.
- Teto de ~12°. Nunca gire enquanto o texto principal é lido.
- `Camada z` dá paralaxe entre fundo, painel e destaque. `foco` + `zoom` + `perto` viajam até o detalhe citado.

## 4. Cursor e toque (`Cursor`, `cliques`)

- Use a seta no 16:9 e o círculo de toque no 9:16 (`toque={V}`).
- Passos `{ f, x, y, clique? }`. O cursor chega com `meio` e um arco leve, aperta no clique, faz uma onda de 18 quadros e
  some 12–20 quadros depois do último passo.
- Meça as coordenadas no quadro renderizado (`scripts/quadros.mjs`), uma vez para cada formato. No vídeo-referência, um clique a 23 px
  do alvo caiu no município vizinho de nome parecido em vez do citado.
- Todo clique acerta um alvo real (botão, pílula, item de lista). O quadro seguinte mostra a consequência: acende, abre ou
  seleciona.
- Som: `switch-tap` em `cliques(passos)`, volume 0,14–0,2.

## 5. Continuidade de interface entre cenas

- A cena seguinte começa no ponto onde a anterior terminou. Exemplo: a cena Mapa termina clicando "Buscar"; a cena Cidade
  abre a busca nesse mesmo ponto, e o cursor nasce em `BOTAO_BUSCA`.
- Exporte a geometria compartilhada como `const` da cena A e importe na cena B, para as duas pontas baterem no pixel.
- Use o corte com luz (`Corte` + `Varredura`, 15 quadros, em `Filme.tsx`). O elemento que continua fica na mesma posição dos
  dois lados do corte.

## 6. Revelações com luz e dados vivos

- A cor de cada item é misturada ao fundo por intensidade (`intensidade(hex, t)`) e acende em onda. Raios brancos caem nos
  pontos que a fala cita (altura 420·força). Cada item pisca em branco por 10 quadros quando acende.
- Séries entram uma a uma, com passo de 1,5–5 quadros (assentos, linhas, pílulas). A barra cresce depois do nome, e o selo
  de resultado ("1º lugar", "Meta batida") entra por último.
- Números usam `tabular-nums` e rodas tipo odômetro. Nada de "0.000" parado nem de dígito parcial que se lê como outro número.
- `entra(frame, de, dur)` faz o texto subir 26 px com wipe. Varie a entrada (wipe, mola, acender, desenhar); nunca tudo igual,
  nunca tudo de uma vez.

## 7. A fala comanda o tempo

- No topo da cena: `const F = { chave: marca(C, "trecho falado") }`. Todo destaque fica a ± poucos quadros de `F`. Depois da
  voz final, rode `alinhar.mjs`.
- Mude o estado visual a cada 1,5–3 s. Nenhum plano fica parado mais de 3 s sem micro-movimento (deriva de câmera, brilho ou
  cursor).

## 8. Som por ação (`efeito` do kit)

Cada cena exporta `Som` com `efeito(quadro, som, volume)`, e o pico do arquivo cai no quadro.

| Momento | Som | Volume |
|---|---|---|
| Entrada da cena | `transition-soft` | 0,16 |
| Cliques e itens | `switch-tap` | — |
| Destaque | `sparkle-touch` | — |
| Séries | `whoosh-electric` + `pop-electric` | 0,1, a cada 8 itens (não em todos) |
| Fechamento do bloco | `chime-crystal` | — |
| Viagem de câmera | `air-woosh-quick` | — |

A trilha fica ~11 dB abaixo da voz e sobe nas pausas (`som.tsx`).

## 9. Processo

1. No storyboard, registre por cena: câmera, interação (cursor), continuidade com a próxima e selo.
2. Faça **2 pilotos** antes do resto: uma cena de painel e um par de cenas com continuidade. Entregue quadros e o clipe já em
   1080p (nunca prévia 0,5×), peça aprovação no AskUserQuestion e só então estenda.
3. Peça revisão ao Gemini/AGY, só leitura, nos quadros. Confira cada sugestão contra o dado e a sincronia. No vídeo-referência ele
   errou o selo de um dado que era real e propôs tirar uma busca que quebraria a fala.
4. Monte pranchas 16:9 + 9:16 dos quadros de virada com o `ffmpeg` do PATH (`hstack`/`xstack`). O ffmpeg do Remotion não
   tem esses filtros.

## 10. Acabamento de cinema (`src/kit/efeitos.tsx`, Remotion 4.0.540)

Fonte: skills oficiais `remotion-dev/skills` (03/11/2026). Piloto: trecho Mapa → Cidade do vídeo-referência re-renderizado com o kit e
comparado com o final aprovado. Render: 15 s levaram 18 s sem efeitos e 49 s com motion blur (~2,7×).

| Recurso | Onde usar | Regra |
|---|---|---|
| `Vazamento` (lightLeak) | já sobreposto em todo `Corte` do `Filme.tsx` (2× TRANSICAO, não encurta a linha do tempo) | força em `plano.json` → `acabamento.vazamento`; cor = `T.destaque`. **Havendo lados** (política, concorrentes), luz neutra ou 0: luz na cor de um lado quebra a neutralidade |
| `Acabamento` | já no `Filme` e na `Previa`: vinheta 0,32 + grão 0,045 | fica fora do blur; 0 desliga |
| `Brilho` (glow) | "dados que acendem": envolva só o bloco que acende, `forca` animada 0 → 1 → 0,3 | limiar 0,5: só o claro brilha |
| `Profundidade` | junto do `foco` do `Palco` em viagem de câmera | `forca` ≤ 8 px; zere antes da leitura |
| `TelaReal` | toda tela capturada (`capturar.mjs`) | grade leve de contraste e curva em S para casar com o tema |
| `Grifo` | o que a fala cita: `de = marca(cena, "trecho")` | `marca`, `circulo`, `sublinha`, `caixa`; 1 passada, cor do produto; no máximo 1 por bloco de fala |
| `Titulo` | todo título de cena | passe a largura real de cada formato; `linhas` 1–3; cabe por construção |
| `LegendaPalavras` | 9:16, story e divulgação | precisa de `alinhar.mjs`; número falado mostra os algarismos (`PARA_TELA`) sem destaque por palavra. No 16:9, `Legenda` por frase |
| `useBatida(TRILHA, inicioCena(c) + frame)` | marca no fecho e pico de energia: `scale` 1 + 0,03·batida | nunca em texto que está sendo lido |
| `mola` / `zoomEntre` (`tema.ts`) | `mola` no que assenta (painel, selo, pílula); `zoomEntre` em todo zoom do `Palco` | `saida` continua no texto |
| `Desfoque` (motion blur) | **desligado por padrão** (`acabamento.desfoque.obturador: 0`) | reprovado no piloto: com 6 amostras o odômetro "4.469" virou fantasma legível como "4.460" (regra 6). Só ligue em projeto sem contadores, com 12+ amostras, e confira os quadros dos números |

Studio editável: quando o usuário for ajustar sozinho no Studio, deixe o `interpolate()` direto no `style` da cena
(com `scale`/`translate`/`rotate` separados) em vez de esconder o valor em `entra()`/`t01`. Helpers do kit para o
estrutural; inline para o que é ajuste fino.

## 11. Biblioteca de planos (`src/kit/planos/`, muri-video 2.2)

As animações aprovadas do vídeo-referência viraram componentes genéricos: dados por props, cor e fonte do `tema.ts`, schema zod
editável no painel do Studio e padrões que reproduzem o vídeo-referência. No storyboard, a coluna "plano" cita **primeiro** um
plano desta tabela; a galeria da video-shotcraft fica para o que não está aqui. Catálogo para mostrar ao usuário: composições
`Planos-catalogo-16x9`/`-9x16` no Studio (19 planos, 1 min 52 s; fase C aprovada em 2026-11-03).

**Cena pronta** (`src/kit/planos/Cena.tsx`, fase C): `CenaPronta` embrulha um plano já no padrão de motion, com fundo
do app (`FUNDO_APP`, nunca o quadro tingido), `Palco` 2.5D com `orbita`, `Cursor` com `passos`, moldura com capítulo,
`Acabamento` e som por ação. A prop `frente` fica por cima da câmera, reta (ex.: barra que voa e vira legenda). A luz no
corte fica a cargo do `Filme`; no plano solto ela virava lavada. Peças: `Pilula`, `Feixe` (raio no vencedor), `Acende`.
Padrão dos planos C3/C4: wrapper absoluto 1920×1080 / 1080×1920 com `transform: scale(k)` e `foco`/`passos` × k;
geometria `G = { h, v }`; `padrao` fictício com selo "Simulação · dados fictícios"; `duracaoX(p)` + `duracaoDe` no registro.
Plano novo entra no FIM de `PLANOS` para não mexer nos offsets do catálogo.

| Plano (`PLANOS.<id>`) | Use quando a fala… | Não use | Peças reaproveitáveis |
|---|---|---|---|
| Odômetro (`odometro`) | cita UM número grande que chega ao valor final (total, faturamento, alunos) | número pequeno (< 2 dígitos) ou vários ao mesmo tempo: vira cartão | `Numeradora` (rodas, máscara `###.###`, `posicoes` para parar roda a roda) |
| Placar (`placar`) | compara 2 lados disputando a mesma soma (cabo de guerra, A × B, antes × depois) | 3+ lados (use pizza ou séries); havendo lados reais, tempo e cor neutros (regra 4) | `Placar` com `boletins` (borda acende a cada atualização) |
| Hemiciclo (`hemiciclo`) | mostra composição de um todo contável em grupos (cadeiras, vagas, turmas) | percentuais sem unidade contável (use pizza) | `Hemiciclo` |
| Mapa vivo (`mapa`) | fala de cobertura ou resultado por estado, com a onda saindo de uma UF | dado que não é por região | `MapaVivo` + `BRASIL_UFS`, `vista` para zoom sem engrossar divisa |
| Busca ⌘K (`busca`) | mostra que o produto acha qualquer coisa rápido (consultas que digitam e respondem) | produto sem busca: identidade é a do produto (regra 3) | `BotaoBusca`, `PainelBusca` |
| Abas com cursor (`abas`) | percorre seções do produto com clique real e consequência | menos de 2 telas diferentes de verdade | painel troca por `cliques` |
| Séries em onda (`series`) | evolução no tempo de 1–4 grandezas, com o pico marcado | um valor só (odômetro) ou categorias sem ordem (pizza) | `Series` com `defasagem` e `pico` |
| Linha que se desenha (`linha`) | UMA curva crescendo com o número seguindo a ponta | várias séries (use `series`) | `@remotion/paths` (`evolvePath`) |
| Morph de ícone (`morph`) | troca de estado/conceito em sequência (antes → depois → resultado) | ícones com comandos SVG diferentes (ver armadilhas em remotion.md) | `interpolatePath` |
| Pizza (`pizza`) | parte de um todo em % com 2–5 fatias; o centro diz a % da 1ª | mais de 5 fatias, ou valores quase iguais | anel por `espessura` 0–1 |
| Setas (`setas`) | explica um fluxo/processo entre 2–6 etapas | arquitetura com muitos nós (vira diagrama ilegível em vídeo) | no 9:16 x/y trocam sozinhos (fluxo de cima para baixo) |
| Balões (`baloes`) | conversa, atendimento, mensagem recebida (WhatsApp, chat do app) | texto longo: cada balão ≤ 2 linhas | duração segue o nº de mensagens |
| Mapa 5 modos + voo (`mapaModos`) | resultado por município alternando 5 modos (mapa, picos, 3D, bolhas, estados), com voo e mergulho até uma região; substitui o antigo `sobrevoo` | dado só por UF (use `mapa`) | duração por `duracao` nas props |
| Replay da série (`replay`) | conta uma série no tempo: play clicado, relógio que pula de virada em virada, curva e lista no fim | série sem trocas de liderança (use `linha`) | escala da curva tirada dos dados; raio e pílula em cada troca |
| Fechamento por estado (`estados`) | mostra quem fechou onde: tabela metade/fim, mini-mapa que acende, 100% no fim | menos de ~5 regiões (use `placar`) | `Rotulo` exportado de `Estados.tsx` |
| Resultado (`resultado`) | anuncia o resultado em destaque: % e totais que acendem, raio e pílula no lado 0, diferença na numeradora, barra que voa e vira legenda do mapa | empate técnico sem vencedor | `Feixe`, `Acende`, `Numeradora` com máscara derivada do valor; voo via `frente` |
| Comparações (`comparacoes`) | antes × depois com toggle clicado, regiões em barras divergentes, barras que trocam de lugar no cruzamento | séries sem cruzamento esperando troca (sem cruzamento não troca nem mostra pílula) | `cruzamento(turnos)` |
| Dispersão (`dispersao`) | relaciona uma métrica a um indicador: pílulas trocadas pelo cursor, frase automática, 5 quintis com barra dupla e marca de 50%, nuvem que desliza no x, reta e correlação | leitura individual (são médias por região: a frase diz isso) | reta e correlação calculadas da própria nuvem (`acaso`) |
| Transições (`transicoes`) | troca de capítulo/assunto: `transicao(tipo, W, H)` em qualquer `TransitionSeries` | entre cenas com continuidade de interface (§5): lá o corte é a própria interface; no máximo 1 tipo "forte" (queima, estilhaço) por vídeo | `iris`, `radial`, `pixels`, `queima`, `estilhaco` |

Regras: um plano não é a cena inteira, é a peça central dela; câmera, cursor, `Selo`, som por ação e continuidade
(§3–§8) continuam valendo. Âncoras por `marca()` passadas como `inicio`/`abre`/`quadro` do plano. Padrões do vídeo-referência são
ponto de partida: troque cores pelas do produto. Plano novo que se repita em 2 vídeos entra na biblioteca (com schema e
no `PLANOS`) pela `main` do template.

## Reprovado (não repita)

- Vídeo só de cartões ou blocos.
- Objetos 3D de brinquedo (xadrez, moedas, engrenagem).
- Mundo visual inventado ("papel de segurança").
- Moldura vertical com a cena encolhida.
- Textos colados.
- Foto repetida fora do contexto.
- Motion sem som.
- Motion blur em contador/odômetro (fantasma de dígito; piloto de 03/11/2026).

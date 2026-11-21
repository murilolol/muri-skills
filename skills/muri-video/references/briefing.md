# Briefing — rodadas de perguntas (estilo /grill-me)

Sempre pelo `AskUserQuestion`, uma chamada por rodada com todas as perguntas da fronteira, a opção recomendada
primeiro com "(Recommended)", `multiSelect` quando couber. Fatos (tokens, telas, números) você descobre sozinho;
decisões são do usuário. As recomendações abaixo são as escolhas que deram certo nos vídeos já entregues.

## Rodada 1 — escopo

| Pergunta | Opções (recomendada primeiro) | Multi |
|---|---|---|
| Motor? | Remotion (template muri-video) · HyperFrames (HTML/GSAP) · ver os dois num teste curto | não |
| Formatos? | 16:9 e 9:16, cada um com layout próprio · só 16:9 · só 9:16 | não |
| Quadros por segundo? **Sempre pergunte, nunca assuma** | 30 fps (padrão, render mais rápido) · 60 fps (movimento mais liso; ~2× o tempo de render) · 120 fps (telas de 120 Hz; ~4× o render, arquivo maior) — o usuário também pode digitar outro valor ("Other"); grave em `src/plano.json` → `fps` e em `producao/estado.json` | não |
| Resolução e extras? | 4K (Instagram, X e YouTube) + story/feed de divulgação com legenda por rede · 1080p só o vídeo | sim |
| Para quem / onde? | coordenação/donos/clientes · estágio/portfólio · redes sociais · evento ao vivo | sim |
| Som? | narração + efeitos + trilha baixa (+ versão sem trilha) · só música · narração sem música | não |
| Modo de criação (video-shotcraft)? | cocriação (aprova roteiro, visual e storyboard) · autônomo · template pronto | não |
| Revisão final por subagente? | sim, revisão independente antes de entregar · não | não |

## Rodada 2 — conteúdo e forma (depende da 1)

| Pergunta | Opções | Multi |
|---|---|---|
| Duração? | ~4 min (completo, com dados) · ~2–2:30 · ~60 s (redes) | não |
| Blocos de conteúdo? | como funciona em detalhe · números e participação · bastidores (evolução, antifraude, ritmo) · proposta/próximos passos | sim |
| Direção visual? (mostrar 3 styleframes) | Padrão de motion (Recommended): paleta, fontes e componentes do próprio produto em 2,5D, com cursor, continuidade e luz nos dados (references/motion.md) · editorial tipográfico · documental com fotos | não |
| Legenda? | limpa, sem caixa, com halo do fundo (`Legenda` do kit) · grande estilo redes (palavra a palavra) · sem legenda | não |
| Dados? | reais e públicos com "Fonte: …" + simulação rotulada · tudo fictício · reais com nomes (exige autorização escrita) | não |
| Voz? | Gemini TTS (Achird, natural) · Kokoro local via HyperFrames (sem cota, menos natural) · sem narração | não |

## Rodada 3 — aprovação do roteiro

Mostre o texto por cena (com contagem de palavras e duração estimada a ~2,6 palavras/s) e pergunte: aprovado ·
ajustar tom · cortar/encurtar · acrescentar dado. Só então gere a narração.

## Rodada 4 — aprovação de visual e storyboard

Mostre os quadros-chave e a tabela do storyboard; pergunte: aprovados, pode produzir · trocar direção · ajustar
partes. Se a pergunta expirar sem resposta, NÃO assuma aprovação: pergunte de novo.

## Regras de dados que entram no briefing (não pergunte se já estão nas instruções do projeto/memória)

- Nenhum nome ou RA real de aluno/cliente; créditos só dos autores, com o consentimento deles.
- Segurança/antifraude: só fatos e totais públicos, nunca o critério de detecção.
- Toda tela de app com dados fictícios leva o selo; números do painel fictício bem diferentes dos reais.
- Regras de recorte dos dados (ex.: "torcida exclui a abertura e as finais") aparecem na tela como nota.

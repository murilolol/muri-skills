# Revisão final por subagente

Regra da video-shotcraft (`references/final-review.md`): revisor em contexto limpo, sem as justificativas de quem
produziu. Rode depois da montagem dos 4 finais, em segundo plano (`Agent`, general-purpose, `run_in_background`).
No vídeo-base levou ~15 min e 86 chamadas de ferramenta, e achou 7 correções obrigatórias que a produção não viu.

## Prompt (preencha os <>)

```text
Você é o revisor independente de um vídeo já renderizado. Faça a revisão final seguindo à risca
<pasta-da-video-shotcraft>/references/final-review.md junto com references/aesthetic-rules.md (leia os dois
inteiros antes). Responda em português do Brasil. SOMENTE LEITURA: não altere arquivos do projeto; extraia quadros e
áudio só em <pasta de rascunho>/revisao/.

Arquivos finais: <projeto>/out/final/ (<lista dos 4 mp4>), 30 fps, <N> quadros.
Ferramentas: ffmpeg/ffprobe no PATH; python3 com numpy; veja imagens com Read em pranchas (6 quadros por imagem).
Quadro inicial de cada cena: <tabela cena → quadro>; fusão de 15 quadros entre cenas.

Modo: <cocriação/…>. Pedido do usuário: <literal resumido>. Conteúdo obrigatório: <blocos>.
Storyboard aprovado: <caminho do STORYBOARD.md>; narração: <src/roteiro.json>; direção visual aprovada:
<styleframes + tokens + fontes>; proibido: <ex.: tema escuro, neon, estética de jogo>.
Cartões da galeria por cena: coluna "Plano" do storyboard; índice <pasta-da-video-shotcraft>/gallery/api/library.json;
implementação em <src/cenas/*.tsx>; efeitos em <src/som.tsx> (um comentário por efeito).
Regras de dados: <fonte dos números (dados.json)>; <quem pode ser nomeado>; telas fictícias rotuladas; <restrições>.

Entregue: relatório no formato de final-review.md (P, F, V, S, B, D, A, Q com ✓/✗ e quadro); depois as listas
"Correções obrigatórias" (quadro, arquivo, correção em 1 linha), "Melhorias sugeridas" e "Não verificável".
Para o áudio, meça nos MP4: cada efeito audível; trilha abaixo da voz; versões com/sem trilha idênticas na imagem.
Seja rigoroso: nada aprovado sem evidência. Até ~80 linhas.
```

## O que a revisão do vídeo-base pegou (confira antes, para ela achar menos)

| Código | Problema | Correção que funcionou |
|---|---|---|
| B2 | legenda "R." / "A." / ", nome…" (sigla com pontos quebrou a frase) | `SIGLAS` troca antes de `quebrar` |
| D1 | telas do app sem selo "dados fictícios" numa cena | `Selo` em toda cena com tela |
| A6 | 14 de 106 efeitos encobertos pela voz (contador com pico −16,7 dBFS, cliques, cartas) | `--ganho` / volume 0,5–0,6 |
| A2 | trava da mira 24 f antes da mordida | âncora no quadro da ação, não da fala |
| Q11 | créditos 24 px, aviso 20 px, nota 22 px; 9:16 com texto a 10–16 px | ≥ 32 px; créditos repetidos na moldura vertical |
| F3 | "0.000" por 3–8 s antes do contador rolar | opacidade 0 até o rolo começar |
| S4 | "96" lido como "55" no meio da montagem dos segmentos | ordem de segmentos que não forme outro dígito |
| P3 | painel fictício com 6.721/1.680, quase os reais 6.771/1.781 | fictícios bem diferentes |
| B4 | três trocas de plano sem registro (gráfico → cartões etc.) | registrar e confirmar com o usuário |
| F2 | rótulo repetindo a legenda | rótulo complementa, não repete |

Depois das correções: re-render (imagem + áudio + montagem) e confira as sondas e os quadros afetados.

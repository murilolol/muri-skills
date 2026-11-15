# Divulgação: story, feed e legendas prontas

Peça que acompanha o vídeo quando o briefing pede divulgação. Foi validada no vídeo-referência (painel de dados públicos).

## Imagens

- Stills no template (`src/cenas/Divulgacao.tsx`): `divulgacao-story` (1080×1920) e `divulgacao-feed` (1080×1350, 4:5).
  Os textos ficam em `src/plano.json` → `divulgacao`.
- O centro (`palco`) recebe o **visual-assinatura do filme**, parado no melhor quadro. No vídeo-referência foi o mapa com os 5.570
  municípios em luz neutra, com raios curtos em 4 capitais e sem cor de lado.
- Renderize em 2× e faça uma cópia em 1080:
  ```bash
  npx remotion still src/index.ts divulgacao-story out/final/divulgacao-story.png --scale=2
  npx remotion still src/index.ts divulgacao-feed out/final/divulgacao-feed.png --scale=2
  ffmpeg -i out/final/divulgacao-story.png -vf scale=1080:-1 out/final/divulgacao-story-1080.png
  ```
- Story:
  - 270 px livres em cima e embaixo, por causa da interface do Instagram;
  - título com no máximo 2 linhas;
  - URL grande;
  - data ou chamada para ação.
- Feed: marca, título e subtítulo no alto; o visual no meio; selos, URL e data embaixo, sobre um véu escuro.
- Margem de 80 px. Raios e efeitos não cruzam o título nem encostam na borda. Confira a imagem antes de entregar.
- Neutralidade e selos valem aqui também.

## Legendas prontas (entregue no chat, prontas para colar)

- **Instagram:**
  - gancho de 1 linha;
  - 3–4 linhas curtas do que dá para fazer;
  - chamada "link na bio";
  - 3–5 hashtags.
- **X:** até 280 caracteres, com o link direto.
- **YouTube:**
  - título de até 70 caracteres;
  - descrição com capítulos por cena (`inicioCena(c) / 30`, no formato `0:00`) e o link.
- Use os tempos reais das cenas para os capítulos. Não invente números: use os que estão na tela.

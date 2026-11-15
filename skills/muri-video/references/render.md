# Render e entrega

## Pipeline (imagem e áudio separados; refazer o som custa minutos, não meia hora)

Um comando faz tudo: a imagem de cada formato num processo próprio, **em paralelo**; o áudio com e sem trilha num terceiro
(o mesmo áudio serve aos dois formatos); depois o VTT e a montagem dos 4 MP4 com loudness em 2 passadas.

```bash
node scripts/entregar.mjs                 # 1080p → out/final/<p>-{16x9,9x16}{,-sem-trilha}.mp4 + <p>.vtt
ESCALA=2 node scripts/entregar.mjs        # 4K → out/final/<p>-<formato>-4k{,-sem-trilha}.mp4
```

Medidas no vídeo-referência (90 s, Mac de 10 núcleos e 16 GB):
- 4K com `CONCORRENCIA=4` por formato: ~15 min para os dois formatos em paralelo.
- Tamanho: ~74 MB por MP4 4K.
- Loudness: −16,0 LUFS, pico −1,6 dBTP.

Não renderize vídeo em 0,5× para revisão: piloto e entrega já saem em 1080p ou 4K.

Rode em segundo plano (`run_in_background`) e espere a notificação; não fique consultando o progresso. Etapas soltas
continuam disponíveis:
- `MUDO=1 ESCALA=2 node scripts/render.mjs <id>`
- `SO_AUDIO=1 [SEM_TRILHA=1] node scripts/render.mjs <id>`
- `node scripts/montar.mjs <video> <wav> <saida>`
- `node scripts/legendas.mjs`

O alvo do `montar.mjs` é `TP=-2`: o AAC passa uns décimos do pico do loudnorm, e o entregável precisa ficar ≤ −1,5 dBTP.
Com `TP=-1,5` saiu a −1,1. Áudio todo em silêncio, sem voz gravada, para com um erro claro.

Diagnóstico de um trecho: `QUADROS=1100-1110 LOG=verbose node scripts/render.mjs <id>`.

## Armadilhas

- **Maiúsculas**: o disco do Mac não diferencia `Video.mp4` de `video.mp4`. Montar `out/Projeto.mp4` a partir de
  `out/projeto.mp4` destruiu a imagem renderizada (ffmpeg leu e escreveu o mesmo arquivo). Por isso: renders em
  `out/render/`, finais em `out/final/`, e o `montar.mjs` recusa saída igual à entrada.
- **ffmpeg**: o do Homebrew (`brew install ffmpeg`) está no PATH desde 17/10/2026. O do Remotion
  (`node_modules/@remotion/compositor-darwin-arm64/ffmpeg`) precisa de `DYLD_LIBRARY_PATH` apontando para essa pasta.
- "partial file" / "Invalid NAL unit size" ao ler um mp4 = arquivo truncado: confira `nb_read_frames` antes de seguir.
- Volume não-linear: se o `loudnorm` não couber no pico, ele cai no modo dinâmico; a revisão notou ganho variando
  4–10% no filme. Aceitável; se incomodar, aplique um limitador antes do loudnorm.

## Verificação antes de entregar

```bash
for f in out/final/*.mp4; do ffprobe -v error -count_frames -show_entries stream=codec_type,width,height,nb_read_frames:format=duration -of csv=p=0 "$f"; done
ffmpeg -hide_banner -i out/final/<p>-16x9.mp4 -vn -af loudnorm=print_format=json -f null - 2>&1 | grep -E '"input_(i|tp)"'
```

Os 4 arquivos com o mesmo número de quadros; −16 LUFS ±0,5; pico ≤ −1,5 dBTP; sondas de sincronia com resíduo ≤ 0,5 f.

## Entrega

`out/final/`: `<p>-16x9.mp4`, `<p>-16x9-sem-trilha.mp4`, `<p>-9x16.mp4`, `<p>-9x16-sem-trilha.mp4`, `<p>.vtt`.
Referência de tamanho: 3 min 40 s em 1080p → ~42 MB (16:9) e ~28 MB (9:16); 90 s em 4K → ~74 MB por arquivo. Assista ao 4K inteiro uma vez antes de entregar. Nada disso vai para o git (`out/` no .gitignore).

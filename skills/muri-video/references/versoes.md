# Versões testadas e ambiente (fonte única — atualize SÓ aqui)

Conferido em 21/11/2026 neste Mac (M5, macOS 26, Node 24.21).

| Ferramenta | Versão em uso | Última vista | Notas |
|---|---|---|---|
| HyperFrames | 0.9.77 (`npx hyperframes@0.9.77`) | 0.9.77 | `doctor`, `tts` (pf_dora pt-br), `transcribe` (whisper small) ok. Docker ✗ (opcional, só render em contêiner). |
| Remotion (template `main`) | 4.0.545 (21/11, commits `daffd6c`/`1626f00`) | 4.0.545 | Vídeos antigos seguem na versão do próprio lock (ex.: 4.0.536). `motionBlur` nativo: prop opt-in `motionBlur` do plano `Transicoes` (desligada por padrão — fantasma no odômetro); só `iris` e `radial`, e exige cena ≥ ~2× a transição. Skills oficiais: `npx remotion skills add`. |
| FFmpeg | 9.0.2 (Homebrew) | — | O `doctor` do HyperFrames avisa: números de loudness só comparáveis com o 8.0.1 — meça sempre com o mesmo ffmpeg. |
| FigCraft | 0.18.1 (app `/Applications/FigCraft.app` + `figcraft-cli` em `~/.local/bin`) | 0.18.1 | alpha, release a cada 2–3 dias; ver `figcraft.md`. |
| whisper-cpp | Homebrew (`whisper-cli`) | — | modelo `small` multilíngue baixado. |
| Python | 3.11: kokoro-onnx, soundfile, torch (MPS), transformers (MusicGen) | — | |

## Chrome headless

HyperFrames usa o `Google Chrome.app` por padrão — cada Chrome completo morto vaza um `code_sign_clone`. Sempre:
`export PUPPETEER_EXECUTABLE_PATH="$(which chrome-headless-shell)"` antes de `render`/`snapshot`/`capture`
(`CHROME_PATH` NÃO funciona; conferido no `doctor`).

## Conferir / instalar em outra máquina

```bash
npx hyperframes@0.9.77 doctor
brew install ffmpeg whisper-cpp && brew install --cask figcraft
pip3 install kokoro-onnx soundfile transformers torch numpy librosa
```

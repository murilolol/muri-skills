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

HyperFrames usa o Chrome completo do sistema por padrão (no macOS, cada um morto vaza um `code_sign_clone`). Sempre
aponte `PUPPETEER_EXECUTABLE_PATH` pro `chrome-headless-shell` antes de `render`/`snapshot`/`capture`
(`CHROME_PATH` NÃO funciona; conferido no `doctor`):

- macOS/Linux: `export PUPPETEER_EXECUTABLE_PATH="$(command -v chrome-headless-shell)"`
- Windows (PowerShell): `$env:PUPPETEER_EXECUTABLE_PATH = (Get-Command chrome-headless-shell).Source`

## Instalar (macOS, Linux, Windows)

Tudo da skill é Node ≥ 22 (`node …/*.mjs`) ou Python 3. Onde a doc diz `python3`, no Windows use `py -3` (ou
`python`); os scripts Node já escolhem sozinhos. Conferir: `muri doctor` e `npx hyperframes@0.9.77 doctor`.

| | macOS | Linux (Debian/Ubuntu) | Windows |
|---|---|---|---|
| FFmpeg | `brew install ffmpeg` | `sudo apt install ffmpeg` | `winget install Gyan.FFmpeg` |
| whisper-cpp (`whisper-cli`) | `brew install whisper-cpp` | compilar `ggml-org/whisper.cpp` (`cmake -B build && cmake --build build`) e pôr `build/bin` no PATH | `whisper-bin-x64.zip` das releases de `ggml-org/whisper.cpp`, pasta no PATH |
| chrome-headless-shell | `npx @puppeteer/browsers install chrome-headless-shell@stable` e pôr no PATH | idem | idem |
| FigCraft (opcional) | `brew install --cask figcraft` + `figcraft-cli-*-macos-universal.zip` | `.deb`/`.rpm`/AppImage das releases | `.msi` das releases |
| Python | `pip3 install kokoro-onnx soundfile transformers torch numpy librosa` | idem | `py -3 -m pip install …` (mesma lista) |

`figcraft-cli` separado só sai para macOS; em Linux/Windows compile com `cargo build --release -p figcraft-cli`
(repo `storytold/figcraft`). O Orca (`muri novo/versao/status`) é opcional: fora do macOS a CLI procura `orca` no
PATH e, se não achar, só avisa.

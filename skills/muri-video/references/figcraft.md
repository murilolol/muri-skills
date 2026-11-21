# FigCraft — styleframes e tokens (opcional, etapa 3)

App de design open-source (Rust, alpha 0.18.1): https://github.com/storytold/figcraft · docs em `docs/cli.md` e
`docs/mcp.md` do repo. Use quando o usuário quiser **editar os styleframes à mão** ou já tiver o design em
Figma/Penpot/Sketch. Sem isso, os styleframes em HTML estático (fluxo padrão) bastam.

## Fluxo

1. Um `.figcraft` por vídeo em `<video>/vN/design/`: um frame por cena (1920×1080 e 1080×1920), variáveis de cor e
   tipografia com os tokens do produto (os mesmos de `src/tema.ts`).
2. Agente cria/edita pelo MCP (`claude --mcp-config <seu-mcp.json>`, servidor `figcraft`, confinado a
   `~/videos/`) ou por `figcraft-cli run script.json --out design/video.figcraft`
   (`figcraft-cli commands --json` lista os comandos). Para ver ao vivo: abrir o app com `--control <porta>` e o MCP
   com `--attach <porta>`.
3. Pranchas para aprovação ✋: `figcraft-cli export design/video.figcraft -o out/styleframes --format png --scale 1`.
4. Assets vetoriais para as cenas: `--format svg --node <nome>`.
5. Tokens: `figcraft-cli info design/video.figcraft --json` (ou `design_context` no MCP) → copie os valores para
   `src/tema.ts`. Sem conversor automático: o JSON de variáveis ainda muda entre versões.

## Limites (honestos)

- Não gera cena: sem export de React/HTML pela CLI. A cena continua escrita em Remotion/HyperFrames.
- Import de `.fig` e colar do Figma são "best effort" — trabalhe numa cópia.
- Render por CPU: glass/noise podem diferir do browser; a referência final é sempre o quadro do Remotion.
- `--no-system-fonts` dá render igual em qualquer máquina, mas sem as fontes do produto — use só para teste.

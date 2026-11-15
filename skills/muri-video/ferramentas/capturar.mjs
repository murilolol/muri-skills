// Captura uma página em fatias pelo DevTools Protocol (Chrome headless do Remotion).
// Uso: node capturar.mjs <url> <largura> <pasta-saida> [altura-fatia] [acao-js]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [url, larguraTxt, saida, alturaTxt = "1100", acao = ""] = process.argv.slice(2);
const largura = Number(larguraTxt);
const altura = Number(alturaTxt);
const movel = largura < 600;
mkdirSync(saida, { recursive: true });

// Chrome headless do Remotion (rode de dentro do projeto) ou o caminho em CHROME.
const baseChrome = path.join(process.cwd(), "node_modules/.remotion/chrome-headless-shell");
const chrome =
  process.env.CHROME ??
  (existsSync(baseChrome)
    ? readdirSync(baseChrome, { recursive: true }).map((p) => path.join(baseChrome, String(p))).find((p) => p.endsWith("/chrome-headless-shell"))
    : undefined);
if (!chrome) throw new Error("Chrome headless não encontrado: rode dentro de um projeto Remotion já renderizado uma vez, ou defina CHROME");
const porta = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [`--remote-debugging-port=${porta}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

let alvo;
for (let i = 0; i < 50 && !alvo; i++) {
  await esperar(200);
  try {
    const lista = await (await fetch(`http://127.0.0.1:${porta}/json`)).json();
    alvo = lista.find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pendentes = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendentes.has(m.id)) {
    pendentes.get(m.id)(m);
    pendentes.delete(m.id);
  }
});
const cdp = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pendentes.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await cdp("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: movel ? 2 : 1, mobile: movel });
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Page.navigate", { url });
await esperar(2500);
if (acao) {
  await cdp("Runtime.evaluate", { expression: acao, awaitPromise: true });
  await esperar(900);
}
const medida = await cdp("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true });
const total = medida.result.result.value;
const erros = await cdp("Runtime.evaluate", { expression: "window.__erros ? JSON.stringify(window.__erros) : ''", returnByValue: true });
let n = 0;
const inicio = process.env.DESDE
  ? (await cdp("Runtime.evaluate", { expression: `Math.round(document.querySelector('${process.env.DESDE}').getBoundingClientRect().top + scrollY - 60)`, returnByValue: true })).result.result.value
  : 0;
const fim = process.env.FATIAS ? inicio + Number(process.env.FATIAS) * altura : process.env.UMA ? 1 : total;
for (let y = inicio; y < fim; y += altura) {
  await cdp("Runtime.evaluate", { expression: `window.scrollTo({ top: ${y}, behavior: "instant" })` });
  await esperar(350);
  const shot = await cdp("Page.captureScreenshot", { format: "jpeg", quality: 70 });
  const arquivo = path.join(saida, `${String(n++).padStart(2, "0")}.jpg`);
  writeFileSync(arquivo, Buffer.from(shot.result.data, "base64"));
}
console.log(`${n} fatias de ${largura}x${altura}, página com ${total}px`, erros.result?.result?.value ?? "");
ws.close();
proc.kill();

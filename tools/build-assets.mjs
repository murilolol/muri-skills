#!/usr/bin/env node
// Gera o banner, o gráfico de uso e o pipeline da muri-video (claro e escuro, pt e en) a partir de
// assets/readme/dados.json, e reescreve os blocos <!-- gerado:nome --> do README.md e do README.en.md.
// Os números do README só existem em dados.json. Uso: node tools/build-assets.mjs
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const raiz = new URL('../', import.meta.url);
const dados = JSON.parse(await fs.readFile(new URL('assets/readme/dados.json', raiz), 'utf8'));

const SANS = `Inter, 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif`;
const MONO = `'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
// Mesma paleta do muri-saver: escuro quente, laranja do Claude e o roxo do Pavio.
const TEMAS = {
  claro: { fundo: '#faf8f5', cartao: '#f3efe9', texto: '#1c1a17', apoio: '#6b655c', grade: '#e2dcd2',
    neutro: '#8c8478', destaque: '#a8452e', brilho: 0.1, faisca: '#a78bfa' },
  escuro: { fundo: '#100f0e', cartao: '#161513', texto: '#faf9f7', apoio: '#a8a49d', grade: '#2a2724',
    neutro: '#6e675e', destaque: '#d97757', brilho: 0.24, faisca: '#f0f6fc' },
};

const comClaude = [...dados.autorais.map(s => ({ ...s, autoral: true })), ...dados.stack]
  .filter(s => s.claude).sort((a, b) => b.claude[0] - a.claude[0]);
const totalInvocacoes = comClaude.reduce((s, x) => s + x.claude[0], 0);
const aprovacoes = dados.pipeline.filter(p => p.aprovacao).length;
const dataBR = dados.medido_em.split('-').reverse().join('/');

const T = {
  pt: {
    kicker: 'CLAUDE CODE · CODEX · ANTIGRAVITY',
    lema: ['As skills que eu uso todo dia com agentes de código,', 'medidas em uso real.'],
    numeros: ['skills autorais', 'da comunidade', 'invocações (Claude Code)', 'transcripts lidos'],
    usoTitulo: 'O que eu chamo de verdade',
    usoSub: `Invocações da ferramenta Skill no Claude Code · ${dados.transcripts} transcripts, ${dados.projetos} projetos, até ${dataBR}`,
    autoral: 'autoral', comunidade: 'comunidade', sessoes: n => `${n} ${n === 1 ? 'sessão' : 'sessões'}`,
    usoRodape: 'Sessões = transcripts com pelo menos uma invocação. Codex fica fora: o log dele conta leitura de arquivo, não chamada.',
    pipeTitulo: 'muri-video, do briefing ao MP4',
    pipeSub: `${dados.pipeline.length} etapas, ${aprovacoes} paradas para aprovação. Nenhuma etapa marcada avança sem o seu ok.`,
    pipeLegenda: 'para e espera aprovação',
    colunas: ['Skill', 'Autor', 'Licença', 'Claude Code¹', 'Codex²', 'Por que está aqui'],
    semLicenca: 'sem arquivo de licença',
    vezes: (i, s) => `${i} em ${T.pt.sessoes(s)}`,
    menc: n => `${n} menções`,
    usoAutoral: (i, s, c) => `${i} invocações em ${T.pt.sessoes(s)} no Claude Code · ${c} menções no Codex`,
    notas: ['¹ Invocações da ferramenta Skill, e em quantas sessões.', '² Menções a caminhos da skill nos logs do Codex. Infla com cada arquivo lido, então serve para ordem de grandeza, não para comparar com o Claude.'],
  },
  en: {
    kicker: 'CLAUDE CODE · CODEX · ANTIGRAVITY',
    lema: ['The skills I use every day with coding agents,', 'measured from real usage.'],
    numeros: ['own skills', 'community skills', 'Claude Code invocations', 'transcripts read'],
    usoTitulo: 'What I actually call',
    usoSub: `Skill tool invocations in Claude Code · ${dados.transcripts} transcripts, ${dados.projetos} projects, through ${dados.medido_em}`,
    autoral: 'own', comunidade: 'community', sessoes: n => `${n} ${n === 1 ? 'session' : 'sessions'}`,
    usoRodape: 'Sessions = transcripts with at least one invocation. Codex is left out: its log counts file reads, not calls.',
    pipeTitulo: 'muri-video, from brief to MP4',
    pipeSub: `${dados.pipeline.length} stages, ${aprovacoes} approval stops. No marked stage moves on without your ok.`,
    pipeLegenda: 'stops for approval',
    colunas: ['Skill', 'Author', 'License', 'Claude Code¹', 'Codex²', 'Why it is here'],
    semLicenca: 'no license file',
    vezes: (i, s) => `${i} in ${T.en.sessoes(s)}`,
    menc: n => `${n} mentions`,
    usoAutoral: (i, s, c) => `${i} invocations in ${T.en.sessoes(s)} in Claude Code · ${c} Codex mentions`,
    notas: ['¹ Skill tool invocations, and in how many sessions.', '² Mentions of the skill\'s paths in Codex logs. Every file read inflates it, so read it as an order of magnitude, not against Claude.'],
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const numero = (v, lang) => v.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');
const kpis = () => [dados.autorais.length, dados.stack.length, totalInvocacoes, dados.transcripts];

// Pixel art em retângulos, juntando pixels vizinhos da mesma cor numa linha só.
function mascote({ pixels, cores }, x0, y0, lado) {
  const rects = [];
  pixels.forEach((linha, y) => {
    for (let x = 0; x < linha.length;) {
      const c = linha[x];
      let fim = x + 1;
      while (linha[fim] === c) fim++;
      if (c !== '.') rects.push(`<rect x="${x0 + x * lado}" y="${y0 + y * lado}" width="${(fim - x) * lado}" height="${lado}" fill="${cores[c]}"/>`);
      x = fim;
    }
  });
  return `<g shape-rendering="crispEdges">${rects.join('')}</g>`;
}

function banner(t, lang) {
  const s = T[lang];
  const numeros = kpis().map((v, i) => `<text x="${72 + i * 200}" y="292" font-size="40" font-weight="800" fill="${t.texto}">${numero(v, lang)}</text>
<text x="${72 + i * 200}" y="320" font-size="16" fill="${t.apoio}">${s.numeros[i]}</text>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 360" width="1280" height="360" role="img" aria-labelledby="bt bd" font-family="${SANS}">
<title id="bt">muri-skills</title>
<desc id="bd">${esc(altBanner(lang))}</desc>
<defs><radialGradient id="brilho"><stop offset="0" stop-color="${t.destaque}" stop-opacity="${t.brilho}"/><stop offset="1" stop-color="${t.destaque}" stop-opacity="0"/></radialGradient></defs>
<rect width="1280" height="360" rx="18" fill="${t.fundo}"/>
<circle cx="1080" cy="180" r="240" fill="url(#brilho)"/>
${mascote({ ...dados.mascote, cores: { ...dados.mascote.cores, S: t.faisca } }, 960, 52, 8)}
<text x="72" y="74" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="2.4" fill="${t.destaque}">${s.kicker}</text>
<text x="66" y="160" font-size="88" font-weight="800" letter-spacing="-3" fill="${t.texto}">muri-skills<tspan fill="${t.destaque}">.</tspan></text>
<text x="72" y="202" font-size="22" fill="${t.apoio}">${esc(s.lema[0])}</text>
<text x="72" y="230" font-size="22" fill="${t.apoio}">${esc(s.lema[1])}</text>
${numeros}
</svg>
`;
}

// Barras horizontais: autorais no laranja, comunidade em neutro, valor e sessões ao lado.
function uso(t, lang) {
  const s = T[lang];
  const topo = 150, passo = 40, x0 = 300, largMax = 680;
  const escala = largMax / comClaude[0].claude[0];
  const alto = topo + comClaude.length * passo + 70;
  const grade = [0, 50, 100, 150].filter(v => v <= comClaude[0].claude[0]).map(v => {
    const x = (x0 + v * escala).toFixed(1);
    return `<line x1="${x}" y1="${topo - 14}" x2="${x}" y2="${topo + comClaude.length * passo - 10}" stroke="${t.grade}"/>
<text x="${x}" y="${topo - 22}" font-family="${MONO}" font-size="12" text-anchor="middle" fill="${t.apoio}">${v}</text>`;
  }).join('\n');
  const linhas = comClaude.map((k, i) => {
    const y = topo + i * passo, w = Math.max(3, k.claude[0] * escala), cor = k.autoral ? t.destaque : t.neutro;
    return `<text x="${x0 - 16}" y="${y + 15}" font-family="${MONO}" font-size="16" font-weight="${k.autoral ? 700 : 400}" text-anchor="end" fill="${k.autoral ? t.destaque : t.texto}">${k.nome}</text>
<rect x="${x0}" y="${y}" width="${w.toFixed(1)}" height="22" rx="4" fill="${cor}"/>
<text x="${(x0 + w + 10).toFixed(1)}" y="${y + 17}" font-size="17" font-weight="800" fill="${k.autoral ? t.destaque : t.texto}">${k.claude[0]}<tspan font-size="14" font-weight="400" fill="${t.apoio}">  ·  ${s.sessoes(k.claude[1])}</tspan></text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${alto}" width="1200" height="${alto}" role="img" aria-labelledby="ut ud" font-family="${SANS}">
<title id="ut">${s.usoTitulo}</title>
<desc id="ud">${esc(altUso(lang))}</desc>
<rect width="1200" height="${alto}" rx="16" fill="${t.cartao}"/>
<text x="48" y="60" font-size="28" font-weight="800" fill="${t.texto}">${s.usoTitulo}</text>
<text x="48" y="90" font-size="16" fill="${t.apoio}">${esc(s.usoSub)}</text>
<rect x="912" y="44" width="14" height="14" rx="3" fill="${t.destaque}"/><text x="934" y="56" font-size="14" fill="${t.apoio}">${s.autoral}</text>
<rect x="1012" y="44" width="14" height="14" rx="3" fill="${t.neutro}"/><text x="1034" y="56" font-size="14" fill="${t.apoio}">${s.comunidade}</text>
${grade}
${linhas}
<text x="48" y="${alto - 30}" font-size="13" fill="${t.apoio}">${esc(s.usoRodape)}</text>
</svg>
`;
}

// Etapas numa linha; as que exigem aprovação ganham o círculo cheio.
function pipeline(t, lang) {
  const s = T[lang], x0 = 96, x1 = 1104, y = 150, r = 20;
  const passo = (x1 - x0) / (dados.pipeline.length - 1);
  const nos = dados.pipeline.map((p, i) => {
    const cx = (x0 + i * passo).toFixed(1);
    const circulo = p.aprovacao
      ? `<circle cx="${cx}" cy="${y}" r="${r}" fill="${t.destaque}"/><text x="${cx}" y="${y + 6}" font-size="16" font-weight="800" text-anchor="middle" fill="${t.cartao}">${i}</text>`
      : `<circle cx="${cx}" cy="${y}" r="${r}" fill="${t.cartao}" stroke="${t.apoio}" stroke-width="2"/><text x="${cx}" y="${y + 6}" font-size="16" font-weight="800" text-anchor="middle" fill="${t.texto}">${i}</text>`;
    const [a, b] = p[lang];
    return `${circulo}
<text x="${cx}" y="${y + 50}" font-size="15" font-weight="600" text-anchor="middle" fill="${t.texto}">${esc(a)}</text>
<text x="${cx}" y="${y + 70}" font-size="15" font-weight="600" text-anchor="middle" fill="${t.texto}">${esc(b)}</text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 290" width="1200" height="290" role="img" aria-labelledby="pt pd" font-family="${SANS}">
<title id="pt">${esc(s.pipeTitulo)}</title>
<desc id="pd">${esc(altPipeline(lang))}</desc>
<rect width="1200" height="290" rx="16" fill="${t.cartao}"/>
<text x="48" y="60" font-size="28" font-weight="800" fill="${t.texto}">${esc(s.pipeTitulo)}</text>
<text x="48" y="90" font-size="16" fill="${t.apoio}">${esc(s.pipeSub)}</text>
<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${t.grade}" stroke-width="3"/>
${nos}
<circle cx="56" cy="262" r="7" fill="${t.destaque}"/><text x="72" y="267" font-size="13" fill="${t.apoio}">${s.pipeLegenda}</text>
</svg>
`;
}

const altBanner = lang => {
  const s = T[lang];
  return `muri-skills · ${s.lema.join(' ')} ${kpis().map((v, i) => `${numero(v, lang)} ${s.numeros[i]}`).join(', ')}.`;
};
function altUso(lang) {
  const s = T[lang];
  const itens = comClaude.map(k => `${k.nome} ${k.claude[0]} (${s.sessoes(k.claude[1])})`).join(', ');
  return `${s.usoTitulo}. ${s.usoSub}. ${itens}.`;
}
const altPipeline = lang => {
  const s = T[lang];
  return `${s.pipeTitulo}. ${s.pipeSub} ${dados.pipeline.map((p, i) => `${i} ${p[lang].join(' ').trim()}${p.aprovacao ? ' (✋)' : ''}`).join(', ')}.`;
};

function tabelaStack(lang) {
  const s = T[lang];
  const linhas = [...dados.stack]
    .sort((a, b) => (b.claude?.[0] ?? 0) - (a.claude?.[0] ?? 0) || (b.codex ?? 0) - (a.codex ?? 0))
    .map(k => `| [\`${k.nome}\`](${k.repo}) | [${k.autor}](https://github.com/${k.github}) | ${k.licenca ?? s.semLicenca} | ${k.claude ? s.vezes(k.claude[0], k.claude[1]) : '—'} | ${k.codex ? s.menc(numero(k.codex, lang)) : '—'} | ${k[lang]} |`);
  return [`| ${s.colunas.join(' | ')} |`, `|${s.colunas.map(() => '---').join('|')}|`, ...linhas, '', `<sub>${s.notas.join('<br>')}<br>${dados.fora[lang]}</sub>`].join('\n');
}

function instalar(lang) {
  const titulo = lang === 'pt' ? 'Comandos de instalação de cada skill da stack' : 'Install command for every stack skill';
  const vistos = new Set();
  const blocos = dados.stack.filter(k => !vistos.has(k.instalar) && vistos.add(k.instalar))
    .map(k => `# ${k.nome} (${k.autor}, ${k.licenca ?? T[lang].semLicenca})${k.instalar.startsWith('/') ? (lang === 'pt' ? ', dentro do Claude Code' : ', inside Claude Code') : ''}\n${k.instalar}`);
  return `<details>\n<summary>${titulo}</summary>\n\n\`\`\`bash\n${blocos.join('\n\n')}\n\`\`\`\n\n</details>`;
}

const arquivo = (nome, tema, lang) => `assets/readme/${nome}-${tema}${lang === 'en' ? '.en' : ''}.svg`;
const picture = (nome, lang, alt) => `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${arquivo(nome, 'escuro', lang)}">
  <img src="${arquivo(nome, 'claro', lang)}" width="100%" alt="${esc(alt)}">
</picture>`;

function substituirBloco(texto, nome, conteudo) {
  const inicio = `<!-- gerado:${nome} -->`, fim = `<!-- /gerado:${nome} -->`;
  const a = texto.indexOf(inicio), b = texto.indexOf(fim);
  if (a < 0 || b < a) throw new Error(`Bloco "${nome}" não encontrado.`);
  return `${texto.slice(0, a + inicio.length)}\n${conteudo}\n${texto.slice(b)}`;
}

// Conferências antes de escrever qualquer coisa.
const todas = [...dados.autorais, ...dados.stack];
assert.equal(new Set(todas.map(k => k.nome)).size, todas.length, 'skill repetida em dados.json');
for (const k of dados.stack) {
  assert.match(k.repo, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/tree\/[\w./-]+)?$/, `${k.nome}: repo inválido`);
  assert.ok(k.autor && k.github && k.instalar && k.pt && k.en, `${k.nome}: campo faltando`);
  assert.ok(k.claude || k.codex, `${k.nome}: sem número de uso`);
}
for (const k of todas.filter(k => k.claude)) assert.ok(k.claude[1] <= k.claude[0], `${k.nome}: mais sessões que invocações`);
assert.ok(!/\/Users\/|@[\w-]+\.(com|br)/.test(JSON.stringify(dados)), 'caminho local ou e-mail em dados.json');
assert.equal(dados.pipeline.length, 9);

for (const lang of ['pt', 'en']) {
  for (const [tema, t] of Object.entries(TEMAS)) {
    await fs.writeFile(new URL(arquivo('banner', tema, lang), raiz), banner(t, lang));
    await fs.writeFile(new URL(arquivo('uso', tema, lang), raiz), uso(t, lang));
    await fs.writeFile(new URL(arquivo('pipeline', tema, lang), raiz), pipeline(t, lang));
  }
  const readme = new URL(lang === 'pt' ? 'README.md' : 'README.en.md', raiz);
  let texto = await fs.readFile(readme, 'utf8');
  texto = substituirBloco(texto, 'banner', picture('banner', lang, altBanner(lang)));
  texto = substituirBloco(texto, 'uso', picture('uso', lang, altUso(lang)));
  texto = substituirBloco(texto, 'pipeline', picture('pipeline', lang, altPipeline(lang)));
  texto = substituirBloco(texto, 'stack', tabelaStack(lang));
  texto = substituirBloco(texto, 'instalar', instalar(lang));
  for (const k of dados.autorais) texto = substituirBloco(texto, `uso-${k.nome}`, `<sub>${T[lang].usoAutoral(k.claude[0], k.claude[1], numero(k.codex, lang))}</sub>`);
  await fs.writeFile(readme, texto);
}
console.log(`ok: 12 SVGs em assets/readme/, README.md e README.en.md atualizados (${totalInvocacoes} invocações, ${comClaude.length} skills no gráfico)`);

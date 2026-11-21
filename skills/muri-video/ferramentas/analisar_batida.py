"""Grade de batidas de uma música e verificação de cortes no vídeo renderizado.
Uso (com -E, não -I: o -I esconde o site do usuário, onde o pip --user instala o numpy/librosa; rodando o arquivo, o cwd não entra no sys.path):
  python3 -E analisar_batida.py <audio> [-o grade.json]
  python3 -E analisar_batida.py --verificar <video.mp4> --cortes cortes.json [--fps <fps do plano.json>]
cortes.json: lista de segundos [0, 2.1, ...] ou {"quadros": [0, 63, ...]} (usa --fps).
Método: references/music-beat-sync.md da video-shotcraft + hyperframes.md (story na batida). O beat_track do
librosa erra o andamento (metade, 2/3, 3/2, dobro): testamos esses períodos e a fase contra os acentos fortes.
shortcut: compasso 4/4 assumido nos downbeats; música com variação de andamento pede grade por trechos."""
import argparse, json, os, subprocess, sys, tempfile

try:
    import numpy as np
    import librosa
except ImportError:
    sys.exit("librosa/numpy não encontrados: pip3 install librosa (e rode com python3 -E, não -I)")

SR, HOP = 22050, 128  # 5,8 ms por quadro de análise
TOL = 0.035           # um acento "bate" na grade a até 35 ms (~1 quadro a 30 fps)


def acentos(y):
    """Picos do onset strength: (tempos em s, força normalizada pelo maior pico)."""
    env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP, n_fft=512, n_mels=40)  # janela curta: ataque sem viés de ~40 ms
    pk = librosa.util.peak_pick(env, pre_max=6, post_max=6, pre_avg=24, post_avg=24, delta=0.05 * env.max(), wait=12)
    t = librosa.frames_to_time(pk, sr=SR, hop_length=HOP)
    s = env[pk] / env[pk].max()
    return t, s


def perto(a, b):
    """Distância de cada a ao b mais próximo (b ordenado)."""
    i = np.searchsorted(b, a)
    return np.minimum(np.abs(a - b[np.clip(i - 1, 0, len(b) - 1)]), np.abs(a - b[np.clip(i, 0, len(b) - 1)]))


def pontuar(grade, t):
    """F1 entre precisão (batida da grade com acento perto) e cobertura (acento com batida perto)."""
    d, e = perto(grade, t), perto(t, grade)  # batida -> acento e acento -> batida mais perto
    p, c = (d <= TOL).mean(), (e <= TOL).mean()
    return (2 * p * c / (p + c) if p + c else 0.0), p, c, float(e[e <= TOL].mean()) if (e <= TOL).any() else 1.0


def ajustar(y, dur):
    t, s = acentos(y)
    fortes = s >= 0.5
    if fortes.sum() < 4:
        sys.exit("poucos acentos fortes na música (<4): sem como medir a grade")
    tf = t[fortes]
    tempo, _ = librosa.beat.beat_track(y=y, sr=SR, hop_length=HOP)
    T0 = 60 / float(np.atleast_1d(tempo)[0])
    melhor = None

    def tentar(T, t0, fator):
        nonlocal melhor
        f1, p, c, err = pontuar(np.arange(t0, dur, T), tf)
        if melhor is None or (f1, -err) > (melhor[0], -melhor[3]):
            melhor = (f1, p, c, err, T, t0, fator)

    for fator in (0.5, 2 / 3, 1, 1.5, 2):          # armadilha: andamento sai metade/2/3 do real
        for ajuste in np.arange(0.97, 1.0301, 0.005):  # período
            T = T0 * fator * ajuste
            for t0 in np.arange(0, T, 0.005):         # fase
                tentar(T, t0, fator)
    _, _, _, _, T1, t1, fator = melhor
    for T in T1 * np.arange(0.995, 1.0051, 0.0005):   # refino fino em volta do melhor
        for t0 in np.arange(max(t1 - 0.01, 0), t1 + 0.0101, 0.001):
            tentar(T, t0, fator)
    f1, p, c, err, T, t0, fator = melhor
    beats = np.arange(t0, dur, T)
    # downbeat: das 4 fases possíveis do compasso, a de maior força de acento somada
    soma = [sum(s[np.abs(t - b) <= TOL].sum() for b in beats[k::4]) for k in range(4)]
    k = int(np.argmax(soma))
    return {
        "bpm": round(60 / T, 2), "bpm_librosa": round(60 / T0, 2), "fator": round(fator, 3), "periodo": round(T, 5), "fase": round(t0, 4),
        "precisao": round(p, 3), "cobertura": round(c, 3), "erro_medio_ms": round(err * 1000, 1),
        "beats": [round(float(b), 3) for b in beats],
        "downbeats": [round(float(b), 3) for b in beats[k::4]],
        "acentos_fortes": [{"t": round(float(a), 3), "s": round(float(b), 2)} for a, b in zip(t[fortes], s[fortes])],
    }


def verificar(video, cortes, fps):
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "a.wav")
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vn", "-ac", "1", "-ar", str(SR), wav], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"ffmpeg falhou: {r.stderr.strip()}")
        y, _ = librosa.load(wav, sr=SR)
    t, s = acentos(y)
    dados = json.load(open(cortes))
    segs = [q / fps for q in dados["quadros"]] if isinstance(dados, dict) else dados
    ruim, desvios = 0, []
    print("corte(s)  acento(s)  distância(quadros)  força  status")
    for c in segs:
        i = np.where(np.abs(t - c) <= 0.12)[0]
        if not len(i):
            print(f"{c:8.3f}  {'-':>9}  {'-':>18}  {'-':>5}  FALHA (sem acento em ±120 ms)")
            ruim += 1
            continue
        j = i[np.argmax(s[i])]
        q = (t[j] - c) * fps
        desvios.append(q)
        st = "OK" if abs(q) <= 3 else "FALHA"
        ruim += st == "FALHA"
        print(f"{c:8.3f}  {t[j]:9.3f}  {q:+18.1f}  {s[j]:5.2f}  {st}")
    if desvios and abs(np.mean(desvios)) > 1.5:
        print(f"Aviso: desvio médio {np.mean(desvios):+.1f} quadros, sempre do mesmo lado: provável atraso do áudio (AAC) ou grade errada, não corte a corte.")
    print(f"Cortes: {len(segs)} · falhas: {ruim} (limite 3 quadros a {fps:g} fps)")
    sys.exit(1 if ruim else 0)


ap = argparse.ArgumentParser()
ap.add_argument("audio", nargs="?")
ap.add_argument("-o", "--saida")
ap.add_argument("--verificar", metavar="VIDEO")
ap.add_argument("--cortes")
ap.add_argument("--fps", type=float, default=30)
a = ap.parse_args()
if a.verificar:
    if not a.cortes:
        ap.error("--verificar precisa de --cortes cortes.json")
    verificar(a.verificar, a.cortes, a.fps)
if not a.audio:
    ap.error("informe o áudio ou --verificar")
y, _ = librosa.load(a.audio, sr=SR, mono=True)
g = ajustar(y, len(y) / SR)
print(f"BPM {g['bpm']} (librosa disse {g['bpm_librosa']}, fator {g['fator']}) · fase {g['fase']} s · precisão {g['precisao']} · cobertura {g['cobertura']} · erro médio {g['erro_medio_ms']} ms")
print(f"{len(g['beats'])} batidas · {len(g['downbeats'])} downbeats · {len(g['acentos_fortes'])} acentos fortes")
if min(g["precisao"], g["cobertura"]) < 0.8:
    print("Aviso: grade fraca (<80%): música com andamento variável ou sem acentos claros; confira o resultado de ouvido.")
if a.saida:
    json.dump(g, open(a.saida, "w"), indent=1)
    print(a.saida)

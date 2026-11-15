"""Análise do áudio renderizado: picos, nível da voz x trilha, e alinhamento de um efeito-sonda.
Uso: python3 analisar_audio.py <render.wav> <sonda.wav> <quadro_alvo_do_pico> <pico_da_sonda_em_quadros>
Os .wav devem estar em mono a 30000 Hz (mesma taxa)."""
import sys, wave
import numpy as np

def carregar(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    return a, w.getframerate()

render, sr = carregar(sys.argv[1])
sonda, sr2 = carregar(sys.argv[2])
assert sr == sr2
alvo, pico_sonda = float(sys.argv[3]), float(sys.argv[4])

db = lambda x: 20 * np.log10(max(x, 1e-9))
print(f"duração {len(render)/sr:.2f}s · pico {db(np.max(np.abs(render))):.1f} dBFS · RMS geral {db(np.sqrt(np.mean(render**2))):.1f} dBFS")

# RMS por janela de 1 s (para ver a curva de energia)
jan = sr
rms = [db(np.sqrt(np.mean(render[i:i+jan]**2))) for i in range(0, len(render) - jan, jan)]
print("RMS por 10 s:", " ".join(f"{np.mean(rms[i:i+10]):.0f}" for i in range(0, len(rms), 10)))

# Sonda: correlação normalizada numa janela de ±1 s em torno do início previsto
inicio_prev = (alvo - pico_sonda) / 30
a0 = int((inicio_prev - 1.0) * sr)
trecho = render[a0 : a0 + int(2.0 * sr) + len(sonda)]
corr = np.correlate(trecho, sonda, mode="valid")
energia = np.sqrt(np.convolve(trecho**2, np.ones(len(sonda)), mode="valid")) * np.sqrt(np.sum(sonda**2))
ncc = corr / np.maximum(energia, 1e-12)
k = int(np.argmax(ncc))
inicio_real = (a0 + k) / sr
print(f"sonda: início previsto {inicio_prev*30:.2f} f · medido {inicio_real*30:.2f} f · resíduo {(inicio_real - inicio_prev)*30:+.2f} f · ncc {ncc[k]:.2f}")

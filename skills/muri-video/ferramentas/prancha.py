# Uso: python3 prancha.py saida.jpg img1 img2 ... (grade de 2 colunas, cada uma a 960 px)
import sys
from PIL import Image, ImageDraw
saida, imgs = sys.argv[1], sys.argv[2:]
ims = [Image.open(p).convert("RGB") for p in imgs]
w = 960
ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims)
cols = 2 if len(ims) > 1 else 1
rows = (len(ims) + cols - 1) // cols
folha = Image.new("RGB", (cols * w + (cols - 1) * 16, rows * h + (rows - 1) * 16), (40, 44, 52))
d = ImageDraw.Draw(folha)
for i, im in enumerate(ims):
    x, y = (i % cols) * (w + 16), (i // cols) * (h + 16)
    folha.paste(im, (x, y))
    d.rectangle([x, y, x + 150, y + 26], fill=(0, 0, 0))
    d.text((x + 6, y + 6), imgs[i].split("/")[-1][-14:], fill=(255, 255, 255))
folha.save(saida, quality=85)

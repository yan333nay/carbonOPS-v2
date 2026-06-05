#!/usr/bin/env python3
"""
make-box-mask.py — gera máscara RGBA para cantos arredondados.
Cantos = preto opaco | Centro da caixa = transparente
Overlay desta imagem sobre o vídeo → cantos ficam pretos.
"""
import sys
from PIL import Image, ImageDraw

out = sys.argv[1] if len(sys.argv) > 1 else '/root/social-media/assets/box_mask.png'

CANVAS_W, CANVAS_H = 1080, 1920
BOX_X,  BOX_Y      = 20,   450
BOX_W,  BOX_H      = 1040, 780
RADIUS              = 22

# Tudo preto e opaco; a caixa arredondada será transparente (alpha=0)
img  = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 255))
draw = ImageDraw.Draw(img)
draw.rounded_rectangle(
    [BOX_X, BOX_Y, BOX_X + BOX_W, BOX_Y + BOX_H],
    radius=RADIUS,
    fill=(0, 0, 0, 0),   # transparente = mostra o vídeo embaixo
)
img.save(out)
print(f'Máscara RGBA gerada: {out}')

# Обработка запечённой карты света зала (blender/bake.py → .npy) для браузера: python3 bake_post.py <in.npy> <out.png> <out.json>
# 1) дыры (плоскость прошла внутри колонн, стен, здания охраны) заполняются соседями; 2) световые пятна у открытых ворот срезаются —
# ворота в браузере открываются и закрываются, их свет добавляет шейдер (uDoor); 3) размытие — рассеянный свет плавный; 4) среднее по залу = 1.
import sys, json, numpy as np
from PIL import Image
a = np.load(sys.argv[1]).astype(np.float32) / 255.0; E = a * a          # в .npy — корень освещённости
RY, RX = E.shape; W, D, OUR = 48.05, 76.05, 35.5
zs = (np.arange(RY) + 0.5) / RY * D; xs = (np.arange(RX) + 0.5) / RX * W; X, Z = np.meshgrid(xs, zs)
hall = (X > 0.6) & (X < W - 0.6) & (Z > 0.6) & (Z < D - 0.6)
med = float(np.median(E[hall]))
hole = (E < 0.45 * med) | ~hall
hole |= (X < 31.6) & (Z < 6.7)                      # здание охраны
hole |= (X > 31.4) & (X < 35.7) & (Z < 3.7)         # проходная
def blur(v, r):
    P = np.pad(v, r, mode='edge'); out = np.zeros_like(v)
    for i in range(2 * r + 1):
        for j in range(2 * r + 1): out += P[i:i + RY, j:j + RX]
    return out / (2 * r + 1) ** 2
F = E.copy(); w = (~hole).astype(np.float32); F[hole] = 0
for _ in range(40):                                   # заполнение дыр: среднее по известным соседям
    s = blur(F * w, 2); n = blur(w, 2); fill = np.where(n > 1e-4, s / np.maximum(n, 1e-4), 0)
    F = np.where(hole, fill, F); w = np.maximum(w, (n > 1e-4).astype(np.float32) * 0.999)
for gx, gz in ((0, 10.58), (0, 32.8), (W, 10.55), (W, 31.55)):            # ворота — без пятен: свет открытых ворот добавляет шейдер
    near = ((X - gx) ** 2 + (Z - gz) ** 2) < 7.0 ** 2; ring = (((X - gx) ** 2 + (Z - gz) ** 2) < 10.0 ** 2) & ~near & hall
    F[near] = np.minimum(F[near], float(np.median(F[ring])))
cap = float(np.percentile(F[hall], 96)); F = np.minimum(F, cap)
for _ in range(3): F = blur(F, 2)
our = hall & (Z < OUR)
F = F / float(F[our].mean())
lo, hi = float(F[hall].min()), float(F[hall].max())
enc = np.clip(F / hi, 0, 1)
Image.fromarray((np.sqrt(enc) * 255 + 0.5).astype(np.uint8), 'L').save(sys.argv[2], optimize=True)
json.dump({'scale': round(hi, 4), 'min': round(lo, 3), 'max': round(hi, 3), 'res': [RX, RY], 'cap': cap, 'median': med}, open(sys.argv[3], 'w'), indent=1)
print('post', json.dumps({'scale': hi, 'min': lo, 'res': [RX, RY]}))

# Запекание рассеянного света зала в Cycles → карта для браузерной модели (parts/hall.js, hallK):
# blender -b final.blend -P bake.py -- <meta.json> <out.png> <out.json> <res_x> <samples>
# Что запекается: освещённость плоскости пола (на высоте 1 м) от неба через фонари, окна и ворота, от светильников и переотражений
# от стен, кровли, колонн, здания охраны и ограждения. Солнце (прямые пятна) не входит — их рисует карта теней браузера.
# Подвижное и переставляемое (техника, люди, машины, груз, оборудование редактора) скрыто: карта годится при любой расстановке.
import bpy, json, sys, math, time
import numpy as np
a = sys.argv[sys.argv.index('--') + 1:]
META, PNG, JS, RX, SMP = a[0], a[1], a[2], int(a[3]), int(a[4])
W, D, H0 = 48.05, 76.05, 1.0
t0 = time.time(); sc = bpy.context.scene
NAMES = json.load(open(META)).get('names', {})
KEEP = {'struct', 'walls', 'roof', 'guard', 'fence', 'floorgfx'}
hid = 0
for o in bpy.data.objects:
    cat = NAMES.get(o.name.split('.')[0], [None, None])[1]
    if o.type in ('MESH', 'CURVE') and cat not in KEEP: o.hide_render = True; hid += 1
for o in bpy.data.objects:
    if o.type == 'LIGHT' and o.data.type == 'SUN': o.hide_render = True
print('hidden', hid, flush=True)
RY = int(round(RX * D / W))
img = bpy.data.images.new('HallBake', RX, RY, float_buffer=True)
bpy.ops.mesh.primitive_plane_add(size=1, location=(W / 2, -D / 2, H0)); pl = bpy.context.active_object; pl.scale = (W, D, 1)
bpy.ops.object.transform_apply(scale=True)
m = bpy.data.materials.new('BakeMat'); m.use_nodes = True; nt = m.node_tree
b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 1.0
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img; nt.nodes.active = tx; pl.data.materials.append(m)
pl.visible_shadow = False   # сама плоскость ни на что не отбрасывает тень и не отражает свет
pl.visible_glossy = False; pl.visible_diffuse = False; pl.visible_transmission = False
cy = sc.cycles; sc.render.engine = 'CYCLES'; cy.device = 'CPU'; cy.samples = SMP; cy.use_denoising = False
cy.max_bounces = 6; cy.diffuse_bounces = 4
bpy.ops.object.select_all(action='DESELECT'); pl.select_set(True); bpy.context.view_layer.objects.active = pl
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=2, use_clear=True)
px = np.array(img.pixels[:], dtype=np.float32).reshape(RY, RX, 4)[:, :, :3]
E = px @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)          # строка 0 — низ изображения = z = D (север)
# лёгкое сглаживание шума выборки (3×3 два раза)
for _ in range(2):
    P = np.pad(E, 1, mode='edge'); E = sum(P[i:i + RY, j:j + RX] for i in range(3) for j in range(3)) / 9.0
# аналитический множитель, который заменяем (hallK без ворот) — для подбора общего уровня
xs = (np.arange(RX) + 0.5) / RX * W; zs = D - (np.arange(RY) + 0.5) / RY * D
X, Z = np.meshgrid(xs, zs)
sk = sum(np.exp(-((X - c) / 3.6) ** 2) for c in (8, 20, 28, 40))
ss = lambda e0, e1, v: np.clip((v - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((v - e0) / (e1 - e0), 0, 1))
sk = sk * ss(1, 7, Z) * ss(1, 7, D - Z)
kin = 0.26 + 0.16 * np.minimum(sk, 1.2)
inner = (X > 1) & (X < W - 1) & (Z > 1) & (Z < D - 1)
emax = float(np.percentile(E[inner], 99.5))
N = np.clip(E / emax, 0, 1)
gain = float(kin[inner].mean() / N[inner].mean())
# в PNG — корень (точнее в тенях), 8 бит, строка 0 изображения = z = 0 (юг), как в браузере: v = z / D
out = (np.sqrt(N)[::-1, :] * 255 + 0.5).astype(np.uint8)
np.save(PNG + '.npy', out)   # в Python Blender нет PIL: PNG пишет обычный python3 (см. README)
info = {'W': W, 'D': D, 'res': [RX, RY], 'height': H0, 'gain': round(gain, 4), 'emax': emax, 'samples': SMP,
        'kin_mean': float(kin[inner].mean()), 'map_mean': float((N * gain)[inner].mean()), 'map_min': float((N * gain)[inner].min()), 'map_max': float((N * gain)[inner].max()),
        'sec': round(time.time() - t0)}
json.dump(info, open(JS, 'w'), indent=1); print('BAKE', json.dumps(info), flush=True)

# Кадры Cycles по точкам камеры (координаты three.js: x — восток, y — вверх, z — север):
# blender -b final.blend -P stills.py -- <meta.json> <outdir> <samples> <W> <H> <view,view,...|all>
import bpy, json, math, sys, time
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
META, OUT, SAMPLES, W, H, ONLY = a[0], a[1], int(a[2]), int(a[3]), int(a[4]), a[5]
NAMES = json.load(open(META)).get('names', {})
sc = bpy.context.scene
cv = lambda p: Vector((p[0], -p[2], p[1]))
# виды: имя, камера, цель, поле зрения (верт.), без кровли, экспозиция
VIEWS = {
  'aerial':   ([-13.0, 33.0, -11.0], [24.0, 0.0, 21.0], 42, True,  -2.3),
  'aisle':    ([5.5, 1.75, 27.6],    [40.0, 1.1, 22.0], 58, False, -0.1),
  'rows':     ([29.0, 3.4, 14.4],    [40.5, 0.6, 21.5], 56, False, -0.2),
  'loading':  ([17.5, 4.2, 15.2],    [33.5, 1.2, 10.4], 60, False, -0.2),
  'plan':     ([24.0, 70.0, 18.0],   [24.0, 0.0, 18.01], 34, True, -2.3),
  'truck':    ([-5.2, 3.1, -1.8],    [-13.0, 1.9, 12.0], 46, False, -1.2),
}
roof = [o for o in bpy.data.objects if NAMES.get(o.name.split('.')[0], [None, ''])[1] == 'roof']
print('roof objects', len(roof), flush=True)
# соседний склад за ограждением (z 35,5…76) в модели без своих светильников — общий свет под его кровлей, иначе за сеткой чёрная дыра
if not bpy.data.objects.get('NeighbourLight'):
    nl = bpy.data.lights.new('NeighbourLight', 'AREA'); nl.shape = 'RECTANGLE'; nl.size, nl.size_y = 44.0, 36.0; nl.energy = 26000; nl.color = (1.0, 0.97, 0.92)
    no = bpy.data.objects.new('NeighbourLight', nl); no.location = cv([24.0, 8.2, 56.0]); sc.collection.objects.link(no)
# бирюзовый занавес-перегородка под кровлей по границе с соседом: в браузере — шейдер с колыханием, в экспорте — плоскость
# с непонятным материалом (в Cycles чёрная). Ищем её по месту (тонкая, вертикальная, у z 35,42) и даём ткань со складками.
from mathutils import Vector as _V
cm = bpy.data.materials.get('CurtainMat')
if not cm:
    cm = bpy.data.materials.new('CurtainMat'); cm.use_nodes = True; nt = cm.node_tree; bs = nt.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (0.016, 0.36, 0.30, 1); bs.inputs['Roughness'].default_value = 0.62
    tc = nt.nodes.new('ShaderNodeTexCoord'); wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
    wv.inputs['Scale'].default_value = 0.9; wv.inputs['Distortion'].default_value = 2.0; wv.inputs['Detail'].default_value = 1.5
    bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = 0.35; bm.inputs['Distance'].default_value = 0.08
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector']); nt.links.new(wv.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], bs.inputs['Normal'])
for o in list(bpy.data.objects):
    if o.type != 'MESH' or NAMES.get(o.name.split('.')[0], [None, ''])[1] != 'roof': continue
    bb = [o.matrix_world @ _V(c) for c in o.bound_box]; ys = [v.y for v in bb]; zs = [v.z for v in bb]; xs = [v.x for v in bb]
    if max(ys) - min(ys) < 0.3 and -36.0 < min(ys) < -35.0 and max(zs) - min(zs) > 2 and max(xs) - min(xs) > 20:
        o.data.materials.clear(); o.data.materials.append(cm); print('curtain', o.name, flush=True)
cd = bpy.data.cameras.new('Still'); co = bpy.data.objects.new('Still', cd); sc.collection.objects.link(co); sc.camera = co
cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24.0; cd.clip_start = 0.05; cd.clip_end = 3000; cd.dof.use_dof = False
if sc.animation_data: sc.animation_data_clear()
r = sc.render; cy = sc.cycles
r.resolution_x, r.resolution_y = W, H; r.use_motion_blur = False
cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.02
cy.max_bounces = 6; cy.diffuse_bounces = 3; cy.glossy_bounces = 2
cy.denoising_prefilter = 'ACCURATE'; r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 92
for name, (p, t, fov, noroof, ev) in VIEWS.items():
    if ONLY != 'all' and name not in ONLY.split(','): continue
    t0 = time.time()
    for o in roof: o.hide_render = noroof
    co.location = cv(p); d = cv(t) - cv(p); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cd.lens = 12.0 / math.tan(math.radians(fov) / 2)
    sc.view_settings.exposure = ev
    r.filepath = f'{OUT}/{name}.jpg'; bpy.ops.render.render(write_still=True)
    print('VIEW', name, round(time.time() - t0), 's', flush=True)

# ---------- пролёт камеры над складом с грузом: ONLY = 'fly' (кадры OUT/f0000.jpg…, 24 к/с) ----------
if ONLY == 'fly':
    for o in roof: o.hide_render = False
    KEYS = [  # время, камера, цель (координаты three.js)
        (0.0,  [38.0, 5.2, 16.8], [24.0, 0.8, 22.5]),
        (4.0,  [30.0, 4.4, 16.2], [17.0, 1.0, 22.0]),
        (7.5,  [18.4, 3.6, 16.6], [18.4, 1.4, 30.0]),
        (10.5, [18.4, 2.7, 27.3], [5.0, 1.2, 22.5]),
        (13.0, [11.0, 2.2, 28.0], [1.5, 1.2, 21.0])]
    FPS = 24; NF = int(KEYS[-1][0] * FPS) + 1
    tg = bpy.data.objects.new('FlyTarget', None); sc.collection.objects.link(tg)
    c = co.constraints.new('TRACK_TO'); c.target = tg; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    for t, p, q in KEYS:
        f = int(round(t * FPS)); co.location = cv(p); tg.location = cv(q)
        co.keyframe_insert('location', frame=f); tg.keyframe_insert('location', frame=f)
    for ob in (co, tg):
        for fc in ob.animation_data.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'BEZIER'; k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'
    cd.lens = 12.0 / math.tan(math.radians(60) / 2); sc.view_settings.exposure = -0.15
    sc.frame_start, sc.frame_end = 0, NF - 1; r.fps = FPS
    START = int(a[6]) if len(a) > 6 else 0
    for f in range(START, NF):
        t0 = time.time(); sc.frame_set(f); r.filepath = f'{OUT}/f{f:04d}.jpg'; bpy.ops.render.render(write_still=True)
        print('FRAME', f, NF, round(time.time() - t0, 1), flush=True)

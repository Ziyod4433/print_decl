# Сборка сцены Blender/Cycles из экспорта three.js: python3 setup.py <exp_dir> <out.blend>
import bpy, json, math, sys, time
from mathutils import Vector, Quaternion, Matrix
EXP, BASE, OUT = sys.argv[-3], sys.argv[-2], sys.argv[-1]
t0 = time.time()
meta = json.load(open(EXP + '/meta.json'))
FPS, NF = meta['fps'], meta['nf']
bpy.ops.wm.open_mainfile(filepath=BASE)
sc = bpy.context.scene

# ---------- материалы по подсказкам в именах ----------
def P(mat):
    if not mat.use_nodes: return None
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED': return n
    return None
def inp(n, *names):
    for k in names:
        if k in n.inputs: return n.inputs[k]
def set_emission(mat, color, strength, keep_tex=True):
    nt = mat.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = strength
    src = None
    if keep_tex:
        for n in nt.nodes:
            if n.type == 'TEX_IMAGE': src = n; break
    if src: nt.links.new(src.outputs['Color'], em.inputs['Color'])
    else: em.inputs['Color'].default_value = (*color, 1)
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return em
def noise_rough(mat, lo, hi, scale=0.6):
    """вариация шероховатости: крупные пятна поверх текстуры"""
    nt = mat.node_tree; b = P(mat)
    if not b: return
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = lo; mr.inputs['To Max'].default_value = hi
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    r = inp(b, 'Roughness')
    for l in list(r.links): nt.links.remove(l)
    nt.links.new(mr.outputs['Result'], r)
EMIT_OK = {'M_ledW', 'M_headLight', 'M_redLight', 'M_amber', 'M_lensRed', 'M_lensAmber', 'M_reflect'}
def alpha_mix(mat, shader, fac=None):
    """прозрачность: по альфе текстуры (fac=None) или постоянная доля"""
    nt = mat.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader')
    if fac is None:
        tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
        if tex: nt.links.new(tex.outputs['Alpha'], mx.inputs['Fac'])
        else: mx.inputs['Fac'].default_value = 1.0
    else: mx.inputs['Fac'].default_value = fac
    nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(shader.outputs[0], mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs['Surface'])
cnt = {}
for mat in bpy.data.materials:
    tg = mat.name.split('#')[0]
    bb = P(mat)
    if bb and tg not in EMIT_OK and tg not in ('LAMP',):
        inp(bb, 'Emission Strength').default_value = 0.0
    if tg not in ('LAMP',) and tg not in EMIT_OK:
        try: mat.cycles.emission_sampling = 'NONE'
        except Exception: pass
    tag = mat.name.split('#')[0]
    cnt[tag] = cnt.get(tag, 0) + 1
    b = P(mat)
    if tag == 'LAMP':
        set_emission(mat, (1.0, 0.95, 0.88), 80.0, keep_tex=False)
    elif tag == 'SKYLIGHT':
        nt = mat.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        tr = nt.nodes.new('ShaderNodeBsdfTranslucent'); tr.inputs['Color'].default_value = (0.85, 0.88, 0.9, 1)
        nt.links.new(tr.outputs[0], out.inputs['Surface']); mat.blend_method = 'OPAQUE'
    elif tag == 'SCREEN' or (tag == 'BASIC' and mat.blend_method != 'BLEND'):
        set_emission(mat, (1, 1, 1), 1.6 if tag == 'SCREEN' else 1.0)          # полупрозрачные BASIC (следы шин на проездах) остаются как импортированы: с альфой
    elif tag == 'MOUNTAINS':
        alpha_mix(mat, set_emission(mat, (1, 1, 1), 2.2))
    elif tag == 'LASER':
        alpha_mix(mat, set_emission(mat, (1.0, 0.06, 0.02), 4.0, keep_tex=False), 0.04)
    elif tag == 'LASERLINE':
        set_emission(mat, (1.0, 0.05, 0.02), 14.0, keep_tex=False)
    elif tag == 'BLUESPOT':
        set_emission(mat, (0.15, 0.35, 1.0), 6.0, keep_tex=False)
    elif tag == 'FLOOR' and b:
        noise_rough(mat, 0.22, 0.5, 0.35); inp(b, 'Specular IOR Level', 'Specular').default_value = 0.5
    elif tag == 'ASPHALT' and b:
        noise_rough(mat, 0.75, 0.95, 0.2)
        bc = inp(b, 'Base Color'); nt = mat.node_tree
        if bc.is_linked:
            src = bc.links[0].from_socket; mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'
            mv = nt.nodes.new('ShaderNodeVectorMath'); mv.operation = 'SCALE'; mv.inputs['Scale'].default_value = 1.7
            nt.links.new(src, mv.inputs[0]); nt.links.new(mv.outputs[0], bc)
    elif tag == 'WALLCORR' and b:
        inp(b, 'Metallic').default_value = 0.25; inp(b, 'Roughness').default_value = 0.42
    elif tag in ('M_glass', 'M_doorGlass', 'M_cabGlass') and b:
        inp(b, 'Transmission Weight', 'Transmission').default_value = 1.0; inp(b, 'Roughness').default_value = 0.03
        a = inp(b, 'Alpha'); [mat.node_tree.links.remove(l) for l in list(a.links)]; a.default_value = 1.0; mat.blend_method = 'OPAQUE'
    elif tag == 'M_film' and b:
        inp(b, 'Transmission Weight', 'Transmission').default_value = 0.85; inp(b, 'Roughness').default_value = 0.12
    elif tag == 'HUM_skin' and b:
        inp(b, 'Subsurface Weight', 'Subsurface').default_value = 0.08
        r = inp(b, 'Subsurface Radius');  r.default_value = (0.012, 0.005, 0.003)
        inp(b, 'Roughness').default_value = 0.5
    elif tag == 'CARTON' and b:
        inp(b, 'Roughness').default_value = 0.82
print('materials', sorted(cnt.items(), key=lambda x: -x[1])[:25])

# ---------- небо и солнце ----------
w = bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
nt = w.node_tree; bg = nt.nodes['Background']
sky = nt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'NISHITA'; sky.sun_disc = False
sd = meta['sunDir']; sb = Vector((sd[0], -sd[2], sd[1])).normalized()
sky.sun_elevation = math.asin(max(0.02, sb.z)); sky.sun_rotation = math.atan2(sb.x, sb.y)
sky.altitude = 600; sky.air_density = 1.0; sky.dust_density = 0.9; sky.ozone_density = 1.0
nt.links.new(sky.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = 1.0
sun = bpy.data.lights.new('Sun', 'SUN'); sun.energy = 7.0; sun.angle = math.radians(0.6); sun.color = (1.0, 0.96, 0.9)
so = bpy.data.objects.new('Sun', sun); sc.collection.objects.link(so)
so.rotation_mode = 'QUATERNION'; so.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(sb)

# ---------- камера ----------
R = Quaternion((1, 0, 0), math.radians(90))
def cv(p): return Vector((p[0], -p[2], p[1]))
def cq(q): return R @ Quaternion((q[3], q[0], q[1], q[2]))
cd = bpy.data.cameras.new('Cam'); co = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(co); sc.camera = co
cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24.0; cd.clip_start = 0.05; cd.clip_end = 3000
co.rotation_mode = 'QUATERNION'; cd.dof.use_dof = True
def lens(fov): return 12.0 / math.tan(math.radians(fov) / 2)
prev = None
for c in meta['cam']:
    f = c['f']
    keys = [(f - 0.25, c['pa'], c['qa']), (f, c['p'], c['q']), (f + 0.25, c['pb'], c['qb'])]
    if f == 0: keys = keys[1:]
    for fr, p, q in keys:
        co.location = cv(p); qq = cq(q)
        if prev is not None and prev.dot(qq) < 0: qq.negate()
        co.rotation_quaternion = qq; prev = qq.copy()
        co.keyframe_insert('location', frame=fr); co.keyframe_insert('rotation_quaternion', frame=fr)
    cd.lens = lens(c['fov']); cd.keyframe_insert('lens', frame=f - 0.25 if f else 0)     # ключ — с начала выдержки, иначе первый кадр плана смазывается «наездом» от смены объектива
    cd.dof.focus_distance = c['focus']; cd.dof.keyframe_insert('focus_distance', frame=f)
    cd.dof.aperture_fstop = (2.8 / c['dof']) if c['dof'] > 0 else 11.0; cd.dof.keyframe_insert('aperture_fstop', frame=f)
    sc.view_settings.exposure = c['ev'] if c.get('ev') is not None else (-2.4 if c['ext'] else -0.3)
    sc.view_settings.keyframe_insert('exposure', frame=f)
for fc in (co.animation_data.action.fcurves if co.animation_data else []):
    for k in fc.keyframe_points: k.interpolation = 'LINEAR'
for ad in (cd.animation_data, sc.animation_data):
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'CONSTANT' if 'lens' in fc.data_path or 'fstop' in fc.data_path or 'exposure' in fc.data_path else 'LINEAR'

# ---------- рендер ----------
r = sc.render; cy = sc.cycles
r.engine = 'CYCLES'; cy.device = 'CPU'
cy.samples = 4; cy.use_adaptive_sampling = False
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'; cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'; cy.denoising_prefilter = 'FAST'
cy.max_bounces = 3; cy.diffuse_bounces = 2; cy.glossy_bounces = 1; cy.transmission_bounces = 3; cy.transparent_max_bounces = 4; cy.volume_bounces = 0
cy.caustics_reflective = False; cy.caustics_refractive = False; cy.sample_clamp_indirect = 4.0; cy.blur_glossy = 1.0
cy.use_light_tree = False; cy.seed = 7; cy.use_animated_seed = False
r.use_persistent_data = True; r.use_motion_blur = True; r.motion_blur_shutter = 0.5; r.motion_blur_position = 'CENTER'
r.resolution_x, r.resolution_y, r.resolution_percentage = 960, 540, 100
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e: print('look', e)
r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 94
r.use_simplify = True; r.simplify_subdivision_render = 0; cy.texture_limit_render = '2048'
# ---------- композитинг: мягкое свечение ламп и бликов ----------
sc.use_nodes = True; ct = sc.node_tree
for n in list(ct.nodes): ct.nodes.remove(n)
rl = ct.nodes.new('CompositorNodeRLayers'); gl = ct.nodes.new('CompositorNodeGlare'); co2 = ct.nodes.new('CompositorNodeComposite')
gl.glare_type = 'FOG_GLOW'; gl.quality = 'MEDIUM'; gl.threshold = 1.2; gl.mix = -0.72; gl.size = 7
ct.links.new(rl.outputs['Image'], gl.inputs['Image']); ct.links.new(gl.outputs['Image'], co2.inputs['Image'])
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=False)
print('saved', OUT, round(time.time() - t0), 's')

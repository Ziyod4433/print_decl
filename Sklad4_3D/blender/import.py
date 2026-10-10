# Импорт glTF в .blend: python3 import.py <exp_dir> <out.blend>
import bpy, json, sys, time
EXP, OUT = sys.argv[-2], sys.argv[-1]
t0=time.time(); meta=json.load(open(EXP+'/meta.json'))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.fps=meta['fps']
bpy.ops.import_scene.gltf(filepath=EXP+'/scene.glb', import_shading='NORMALS', bone_heuristic='TEMPERANCE', guess_original_bind_pose=False)
sc.frame_start, sc.frame_end = 0, meta['nf']-1
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=False)
print('imported', len(bpy.data.objects), round(time.time()-t0),'s')

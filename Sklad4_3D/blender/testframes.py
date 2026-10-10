import bpy, sys, time
a=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
sc=bpy.context.scene
for f in [int(x) for x in a[2].split(',')]:
    t=time.time(); sc.frame_set(f); sc.render.filepath=f'{a[1]}/f{f:05d}.jpg'; bpy.ops.render.render(write_still=True)
    print('FRAME',f,round(time.time()-t,1),flush=True)

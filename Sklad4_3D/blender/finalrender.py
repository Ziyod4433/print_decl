import bpy, sys, os, time
a=sys.argv[sys.argv.index('--')+1:]
BL,OUT,F0,F1=a[0],a[1],int(a[2]),int(a[3])
bpy.ops.wm.open_mainfile(filepath=BL)
sc=bpy.context.scene
for f in range(F0,F1):
    fn=f'{OUT}/f{f:05d}.jpg'
    if os.path.exists(fn) and os.path.getsize(fn)>1000: continue
    t=time.time(); sc.frame_set(f); sc.render.filepath=fn; bpy.ops.render.render(write_still=True)
    print('FRAME',f,round(time.time()-t,1),flush=True)

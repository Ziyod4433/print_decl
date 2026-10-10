# Проект Blender для передачи: из сцены рендера (final.blend) — читаемые имена, коллекции по разделам склада,
# маркеры шагов процесса и планов камеры, прореженные ключи анимации, текст README внутри файла.
# blender -b --python proj.py -- <final.blend> <meta.json> <out.blend> [readme.txt]   (или python3 с модулем bpy)
import bpy, sys, json, time, re, numpy as np
a=sys.argv[sys.argv.index('--')+1:]; IN,META,OUT=a[0],a[1],a[2]; RD=a[3] if len(a)>3 else None
t0=time.time(); bpy.ops.wm.open_mainfile(filepath=IN); sc=bpy.context.scene
meta=json.load(open(META)); NAMES=meta.get('names',{}); FPS=meta['fps']
# ---- прореживание ключей (Рамер–Дуглас–Пекер) ----
def rdp(x,y,tol):
    n=len(x); keep=np.zeros(n,bool); keep[0]=keep[-1]=True; st=[(0,n-1)]
    while st:
        i,j=st.pop()
        if j<=i+1: continue
        xs=x[i+1:j]; ys=y[i+1:j]; yl=y[i]+(y[j]-y[i])*(xs-x[i])/(x[j]-x[i]); d=np.abs(ys-yl); k=int(np.argmax(d))
        if d[k]>tol: m=i+1+k; keep[m]=True; st.append((i,m)); st.append((m,j))
    return keep
TOL={'location':0.0004,'rotation_quaternion':0.0003,'scale':0.0004,'rotation_euler':0.0003}
kb=ka=0
for act in bpy.data.actions:
    for fc in act.fcurves:
        kp=fc.keyframe_points; n=len(kp)
        if n<3 or set(k.interpolation for k in kp[:3])!={'LINEAR'}: continue
        co=np.empty(n*2,np.float32); kp.foreach_get('co',co); co=co.reshape(-1,2).astype(np.float64)
        keep=rdp(co[:,0],co[:,1],TOL.get(fc.data_path.split('.')[-1],0.0003)); m=int(keep.sum()); kb+=n; ka+=m
        if m==n: continue
        c2=co[keep].astype(np.float32).ravel(); kp.clear(); kp.add(m)
        kp.foreach_set('co',c2); kp.foreach_set('handle_left',c2); kp.foreach_set('handle_right',c2)
        for k in kp: k.interpolation='LINEAR'
        fc.update()
print('keys',kb,'->',ka,flush=True)
# ---- имена и коллекции ----
CAT={'struct':'Здание · каркас','walls':'Здание · стены и ворота','roof':'Здание · кровля','floorgfx':'Разметка пола',
     'guard':'Ограждения','fence':'Забор и площадка','equip':'Оборудование и стойки','trucks':'Машины','people':'Люди',
     'flow':'Схема потоков','film':'Процесс фильма'}
KIND={'batch':'объединённая геометрия','mesh':'деталь','grp':'узел','bone':'кость'}
root=sc.collection; cols={}
def col(name):
    if name not in cols:
        c=bpy.data.collections.new(name); root.children.link(c); cols[name]=c
    return cols[name]
ren=0
for o in list(bpy.data.objects):
    base=re.sub(r'\.\d+$','',o.name); info=NAMES.get(base)
    if o.type in ('CAMERA','LIGHT'): tgt=col('Камера и свет')
    elif info: tgt=col(CAT.get(info[1],'Прочее'))
    elif o.parent and o.parent.users_collection and o.parent.users_collection[0]!=root: tgt=None
    else: tgt=None
    if info:
        lab=info[0] or KIND.get(info[2],'узел'); suf='·'+base[1:]
        while len((lab+suf).encode('utf-8'))>62: lab=lab[:-1]
        o.name=lab.rstrip()+suf; ren+=1
    if tgt is not None:
        for c in list(o.users_collection): c.objects.unlink(o)
        tgt.objects.link(o)
# объекты без записи (кости людей, скинованные сетки) — к коллекции родителя
for o in bpy.data.objects:
    if o.users_collection and o.users_collection[0]==root and o.parent:
        p=o.parent
        while p and p.users_collection and p.users_collection[0]==root and p.parent: p=p.parent
        if p and p.users_collection and p.users_collection[0]!=root:
            c=p.users_collection[0]; root.objects.unlink(o); c.objects.link(o)
print('renamed',ren,'collections',len(cols),flush=True)
# ---- маркеры: шаги процесса и планы камеры ----
for m in list(sc.timeline_markers): sc.timeline_markers.remove(m)
for c in meta.get('caps',[]):
    no=c['no']; nm=('Шаг '+no+' · ' if no not in ('T','O') else ('Титр · ' if no=='T' else 'Итог · '))+c['a']
    sc.timeline_markers.new(nm[:60],frame=int(round(c['t0']*FPS)))
for i,s in enumerate(meta.get('shots',[])):
    f=int(round(s['t0']*FPS)); sc.timeline_markers.new(f'План {i+1:02d}'+(' · снаружи' if s.get('ext') else ''),frame=f)
if RD:
    t=bpy.data.texts.new('README'); t.from_string(open(RD,encoding='utf-8').read())
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=OUT,compress=False)
print('saved',OUT,round(time.time()-t0),'s')

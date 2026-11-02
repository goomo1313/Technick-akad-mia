"""Independent ray-cast check of all 36 orthographic SVGs; standard library only."""
import json, re, sys
from pathlib import Path
import xml.etree.ElementTree as ET
root=Path(sys.argv[1] if len(sys.argv)>1 else '.')
models=json.loads((root/'projection-models.json').read_text())
count=0
for m in models:
 g=m['profile'];ny=len(g);nx=len(g[0]);nz=max(map(max,g))
 for view in ['front','left','top']:
  w,h=(nx,nz) if view=='front' else (ny,nz) if view=='left' else (nx,ny)
  depths={}
  for u in range(w):
   for v in range(h):
    ray=range(ny) if view=='front' else range(nx) if view=='left' else range(nz-1,-1,-1)
    for t in ray:
     x,y,z=(u,t,v) if view=='front' else (t,ny-1-u,v) if view=='left' else (u,v,t)
     if g[y][x]>z:depths[u,v]=t if view!='top' else -t;break
  W=max(x for x,y in depths)+1;H=max(y for x,y in depths)+1;scale=min(190/W,150/H);ox=(250-W*scale)/2;oy=(200-H*scale)/2
  def point(v):return (round(ox+v[0]*scale,2),round(200-oy-v[1]*scale,2))
  expected=set()
  # Test every grid line separating differently visible depths or empty space.
  for x in range(W+1):
   for y in range(H):
    if depths.get((x-1,y))!=depths.get((x,y)):expected.add(tuple(sorted((point((x,y)),point((x,y+1))))))
  for y in range(H+1):
   for x in range(W):
    if depths.get((x,y-1))!=depths.get((x,y)):expected.add(tuple(sorted((point((x,y)),point((x+1,y))))))
  svg=ET.parse(root/'assets/projection'/f'{m["id"]}-{view}.svg').getroot();actual=set()
  for group in svg.findall('{http://www.w3.org/2000/svg}g'):
   for p in group:
    n=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',p.attrib['d'])];assert len(n)==4
    actual.add(tuple(sorted(((n[0],n[1]),(n[2],n[3])))))
  assert actual==expected,(m['id'],view,actual^expected)
  count+=1
assert count==36
print(f'PASS: {count} orthographic drawings match independent front, left and top ray casting.')


let state=LC.load();
const canvas=document.getElementById('scene');const overlay=document.getElementById('overlay3d');const list=document.getElementById('catalog3D');
const btnAdd=document.getElementById('addFromCatalog3D');const btnClose=document.getElementById('close3D');const btnClear=document.getElementById('clear3D');
const btnRotate=document.getElementById('rotate');const btnUp=document.getElementById('levelUp');const btnDown=document.getElementById('levelDown');const btnDelete=document.getElementById('delete');
const ctx=canvas.getContext('2d');let W=0,H=0;let scale=1, angle=Math.PI/6, elev=Math.PI/6;let camX=0,camY=0;let dragging=false, last={x:0,y:0};let selected=-1;
const grid= Math.max(5, state.gridSizeCm||10);
function cellsX(){return Math.max(1, Math.floor(state.container.lengthCm / grid));}
function cellsY(){return Math.max(1, Math.floor(state.container.widthCm / grid));}
function cellsZ(){return Math.max(1, Math.floor((state.container.heightCm||250) / grid));}
let boxes = (state.boxes3d||[]).map(b=>({...b}));
function save3D(){ state.boxes3d = boxes; LC.save(state); }
function resize(){W=canvas.clientWidth;H=canvas.clientHeight;const ratio=window.devicePixelRatio||1;canvas.width=W*ratio;canvas.height=H*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
window.addEventListener('resize',resize);resize();
function isoProject(x,y,z){const ca=Math.cos(angle),sa=Math.sin(angle),ce=Math.cos(elev),se=Math.sin(elev);
const X=(x*ca - y*ca) + camX, Y=(x*sa + y*sa)*ce - z*se + camY; return {x:W/2 + X*scale, y:H*0.65 + Y*scale};}
function drawGrid(){ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; for(let i=0;i<=cellsX();i++){const a=isoProject(i,0,0), b=isoProject(i,cellsY(),0); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();}
for(let j=0;j<=cellsY();j++){const a=isoProject(0,j,0), b=isoProject(cellsX(),j,0); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();}}
function drawBox(b){const L=b.l,Wd=b.w,Ht=b.h;const p000=isoProject(b.x, b.y, b.z);const p100=isoProject(b.x+L, b.y, b.z);const p010=isoProject(b.x, b.y+Wd, b.z);
const p110=isoProject(b.x+L, b.y+Wd, b.z);const p001=isoProject(b.x, b.y, b.z+Ht);const p101=isoProject(b.x+L, b.y, b.z+Ht);const p011=isoProject(b.x, b.y+Wd, b.z+Ht);
const p111=isoProject(b.x+L, b.y+Wd, b.z+Ht);
ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.fillStyle=b.color||'#22D3EE';
ctx.beginPath(); ctx.moveTo(p001.x,p001.y); ctx.lineTo(p101.x,p101.y); ctx.lineTo(p111.x,p111.y); ctx.lineTo(p011.x,p011.y); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle=b.shade || 'rgba(34,211,238,0.75)'; ctx.beginPath(); ctx.moveTo(p001.x,p001.y); ctx.lineTo(p011.x,p011.y); ctx.lineTo(p010.x,p010.y); ctx.lineTo(p000.x,p000.y); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle=b.shade2 || 'rgba(2,132,199,0.85)'; ctx.beginPath(); ctx.moveTo(p101.x,p101.y); ctx.lineTo(p111.x,p111.y); ctx.lineTo(p110.x,p110.y); ctx.lineTo(p100.x,p100.y); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle='#0b1220'; ctx.font='12px system-ui'; ctx.fillText(b.name||'Box', p001.x+4, p001.y-4);
if(selected===b.id){ctx.strokeStyle='#34D399'; ctx.lineWidth=2; const minx=Math.min(p000.x,p100.x,p010.x,p110.x), maxx=Math.max(p000.x,p100.x,p010.x,p110.x);
const miny=Math.min(p000.y,p100.y,p010.y,p110.y), maxy=Math.max(p000.y,p100.y,p010.y,p110.y); ctx.strokeRect(minx-2,miny-2,(maxx-minx)+4,(maxy-miny)+4);}
}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,canvas.width,canvas.height);
drawGrid(); const sorted=[...boxes].sort((a,b)=> (a.x+a.y+a.z) - (b.x+b.y+b.z)); sorted.forEach(drawBox);}
function aabbOverlap(a,b){return (a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.w && a.y + a.w > b.y && a.z < b.z + b.h && a.z + a.h > b.z);}
function collides(test, ignoreId=null){if(test.x<0||test.y<0||test.z<0) return true; if(test.x+test.l>cellsX()||test.y+test.w>cellsY()||test.z+test.h>cellsZ()) return true;
for(const b of boxes){if(ignoreId!==null && b.id===ignoreId) continue; if(aabbOverlap(test,b)) return true;} return false;}
function snap(n){return Math.max(0, Math.round(n));}
function screenToCell(sx,sy){const z = selectedBox()? selectedBox().z : 0; const ca=Math.cos(angle),sa=Math.sin(angle),ce=Math.cos(elev),se=Math.sin(elev);
const X=(sx - W/2)/scale - camX, Y=(sy - H*0.65)/scale - camY; const x = (X + (Y + z*se)/ce) / (ca + sa/ce); const y = ((Y + z*se)/ce - X) / (ca + sa/ce); return {x:snap(x), y:snap(y)};}
function selectedBox(){return boxes.find(b=>b.id===selected)||null;}
canvas.addEventListener('mousedown',e=>{dragging=true;last={x:e.clientX,y:e.clientY};});
canvas.addEventListener('mousemove',e=>{
  if(!dragging) return;
  const dx=e.clientX-last.x, dy=e.clientY-last.y;
  if(e.buttons===1){
    const b=selectedBox();
    if(b && !e.shiftKey){
      const cell=screenToCell(e.clientX,e.clientY);
      const test={...b,x:cell.x,y:cell.y};
      if(!collides(test,b.id)){ b.x=test.x; b.y=test.y; save3D(); draw(); }
    }else{ camX+=dx; camY+=dy; draw(); }
  }
  last={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('mouseup',()=>dragging=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();scale*= (e.deltaY>0?0.9:1.1);scale=Math.max(0.25,Math.min(5,scale));draw();},{passive:false});
canvas.addEventListener('click',e=>{const cell=screenToCell(e.clientX,e.clientY); let best=-1, bestD=1e9; boxes.forEach(b=>{const cx=b.x+b.l/2, cy=b.y+b.w/2; const d=(cx-cell.x)**2+(cy-cell.y)**2; if(d<bestD){bestD=d; best=b.id;}}); selected=best; draw();});
let touchCache=[]; function dist(a,b){const dx=a.clientX-b.clientX, dy=a.clientY-b.clientY; return Math.hypot(dx,dy);}
canvas.addEventListener('touchstart',e=>{touchCache=[...e.touches]; if(e.touches.length===1){dragging=true; last={x=e.touches[0].clientX,y=e.touches[0].clientY};}}, {passive:false});
canvas.addEventListener('touchmove',e=>{
  if(e.touches.length===1 && dragging){
    const b=selectedBox(); if(b){ const cell=screenToCell(e.touches[0].clientX,e.touches[0].clientY); const test={...b,x:cell.x,y:cell.y}; if(!collides(test,b.id)){ b.x=test.x; b.y=test.y; save3D(); draw(); } }
    else{ const dx=e.touches[0].clientX-last.x, dy=e.touches[0].clientY-last.y; camX+=dx; camY+=dy; draw(); }
    last={x=e.touches[0].clientX,y=e.touches[0].clientY};
  }
  if(e.touches.length===2){const d1=dist(touchCache[0],touchCache[1]); const d2=dist(e.touches[0],e.touches[1]); scale*= (d2>d1?1.05:0.95); scale=Math.max(0.25,Math.min(5,scale)); touchCache=[...e.touches]; draw(); }
},{passive:false});
canvas.addEventListener('touchend',()=>{dragging=false;touchCache=[];}, {passive:false});
function openCatalog(){list.innerHTML=''; if(!state.catalog.length){list.innerHTML='<p class="small">Catalogo vuoto.</p>';}
state.catalog.forEach(m=>{const row=document.createElement('div'); row.className='item'; row.innerHTML=`
<div style="display:flex;gap:10px;align-items:center"><span class="swatch" style="background:${m.color}"></span>
<div><div><strong>${m.name}</strong></div><div class="small">${Math.round(m.lengthCm)}×${Math.round(m.widthCm)}×${Math.round(m.heightCm)} cm</div></div></div>
<div><input type="number" min="1" value="1" style="width:70px"></div>
<div class="toolbar"><button class="btn" data-add>Aggiungi</button></div>`;
row.querySelector('[data-add]').onclick=()=>{const qty=parseInt(row.querySelector('input').value||'1',10);
const L=Math.max(1,Math.ceil(m.lengthCm/grid)), Wd=Math.max(1,Math.ceil(m.widthCm/grid)), Ht=Math.max(1,Math.ceil(m.heightCm/grid));
for(let i=0;i<qty;i++){const b={id:state.nextId++,name:m.name,color:m.color,shade:'rgba(34,211,238,0.75)',shade2:'rgba(2,132,199,0.85)',x:0,y:0,z:0,l:L,w:Wd,h:Ht};
if(!collides(b,null)){ boxes.push(b);} else { outer: for(let z=0;z<cellsZ();z++){ for(let y=0;y<cellsY();y++){ for(let x=0;x<cellsX();x++){ const t={...b,x,y,z}; if(!collides(t,null)){ boxes.push(t); break outer; }}}} } }
save3D(); draw();};
list.appendChild(row);}); overlay.style.display='flex';}
btnAdd.onclick=openCatalog; btnClose.onclick=()=>overlay.style.display='none'; btnClear.onclick=()=>{boxes=[]; save3D(); draw();};
btnDelete.onclick=()=>{ if(selected!==-1){ boxes=boxes.filter(b=>b.id!==selected); selected=-1; save3D(); draw(); } };
btnRotate.onclick=()=>{const b=selectedBox(); if(!b) return; const t={...b,l:b.w,w:b.l}; if(!collides(t,b.id)){ b.l=t.l; b.w=t.w; save3D(); draw(); } };
btnUp.onclick=()=>{const b=selectedBox(); if(!b) return; const t={...b,z:b.z+1}; if(!collides(t,b.id)){ b.z++; save3D(); draw(); } };
btnDown.onclick=()=>{const b=selectedBox(); if(!b) return; const t={...b,z:Math.max(0,b.z-1)}; if(!collides(t,b.id)){ b.z=Math.max(0,b.z-1); save3D(); draw(); } };
draw();

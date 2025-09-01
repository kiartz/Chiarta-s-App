
// Persistent state
const State = {
  load(){ try{ return JSON.parse(localStorage.getItem('lc-v5-3d')) || {
    gridSizeCm:10, container:{lengthCm:330,widthCm:175,heightCm:250},
    catalog:[{id:'m-eur',name:'Europallet',lengthCm:120,widthCm:80,heightCm:14,color:'#60A5FA'},
             {id:'m-fly',name:'Flycase 60x40',lengthCm:60,widthCm:40,heightCm:50,color:'#F59E0B'}],
    nextId:1, boxes:[] }; } catch(e){ return null } },
  save(s){ localStorage.setItem('lc-v5-3d', JSON.stringify(s)); }
};
let s = State.load();

// UI refs
const el = {
  preset:document.getElementById('preset'), grid:document.getElementById('grid'),
  len:document.getElementById('len'), wid:document.getElementById('wid'), hei:document.getElementById('hei'), apply:document.getElementById('apply'),
  catalog:document.getElementById('catalog'), addBox:document.getElementById('addBox'),
  name:document.getElementById('name'), color:document.getElementById('color'), mL:document.getElementById('mL'), mW:document.getElementById('mW'), mH:document.getElementById('mH'),
  saveMat:document.getElementById('saveMat'),
  rotate:document.getElementById('rotate'), up:document.getElementById('levelUp'), down:document.getElementById('levelDown'), del:document.getElementById('delete'), clear:document.getElementById('clear')
};

function cmToCells(cm){ return Math.max(1, Math.ceil(cm / s.gridSizeCm)); }
function cellsX(){ return Math.max(1, Math.floor(s.container.lengthCm / s.gridSizeCm)); }
function cellsY(){ return Math.max(1, Math.floor(s.container.widthCm  / s.gridSizeCm)); }
function cellsZ(){ return Math.max(1, Math.floor(s.container.heightCm / s.gridSizeCm)); }

// Canvas + camera
const canvas = document.getElementById('scene'); const ctx = canvas.getContext('2d');
let W=0,H=0; let scale=1, angle=Math.PI/6, elev=Math.PI/6; let camX=0,camY=0; let dragging=false, last={x:0,y:0}; let selected=-1;
function resize(){ W=canvas.clientWidth; H=canvas.clientHeight; const r=window.devicePixelRatio||1; canvas.width=W*r; canvas.height=H*r; ctx.setTransform(r,0,0,r,0,0); draw(); }
window.addEventListener('resize',resize); resize();

function isoProject(x,y,z){ const ca=Math.cos(angle), sa=Math.sin(angle), ce=Math.cos(elev), se=Math.sin(elev);
  const X=(x*ca - y*ca) + camX, Y=(x*sa + y*sa)*ce - z*se + camY; return {x:W/2 + X*scale, y:H*0.65 + Y*scale}; }

function drawGrid(){ ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
  for(let i=0;i<=cellsX();i++){ const a=isoProject(i,0,0), b=isoProject(i,cellsY(),0); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  for(let j=0;j<=cellsY();j++){ const a=isoProject(0,j,0), b=isoProject(cellsX(),j,0); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }

function drawBox(b){
  const L=b.l, Wd=b.w, Ht=b.h;
  const p000=isoProject(b.x, b.y, b.z), p100=isoProject(b.x+L, b.y, b.z), p010=isoProject(b.x, b.y+Wd, b.z),
        p110=isoProject(b.x+L, b.y+Wd, b.z), p001=isoProject(b.x, b.y, b.z+Ht), p101=isoProject(b.x+L, b.y, b.z+Ht),
        p011=isoProject(b.x, b.y+Wd, b.z+Ht), p111=isoProject(b.x+L, b.y+Wd, b.z+Ht);
  ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.fillStyle=b.color||'#22D3EE';
  // top
  ctx.beginPath(); ctx.moveTo(p001.x,p001.y); ctx.lineTo(p101.x,p101.y); ctx.lineTo(p111.x,p111.y); ctx.lineTo(p011.x,p011.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  // left
  ctx.fillStyle=b.shade || 'rgba(34,211,238,0.75)'; ctx.beginPath(); ctx.moveTo(p001.x,p001.y); ctx.lineTo(p011.x,p011.y); ctx.lineTo(p010.x,p010.y); ctx.lineTo(p000.x,p000.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  // right
  ctx.fillStyle=b.shade2 || 'rgba(2,132,199,0.85)'; ctx.beginPath(); ctx.moveTo(p101.x,p101.y); ctx.lineTo(p111.x,p111.y); ctx.lineTo(p110.x,p110.y); ctx.lineTo(p100.x,p100.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  // label
  ctx.fillStyle='#0b1220'; ctx.font='12px system-ui'; ctx.fillText(b.name||'Box', p001.x+4, p001.y-4);
  if(selected===b.id){ ctx.strokeStyle='#34D399'; ctx.lineWidth=2;
    const minx=Math.min(p000.x,p100.x,p010.x,p110.x), maxx=Math.max(p000.x,p100.x,p010.x,p110.x);
    const miny=Math.min(p000.y,p100.y,p010.y,p110.y), maxy=Math.max(p000.y,p100.y,p010.y,p110.y);
    ctx.strokeRect(minx-2,miny-2,(maxx-minx)+4,(maxy-miny)+4);
  }
}

function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,canvas.width,canvas.height);
  drawGrid(); const sorted=[...s.boxes].sort((a,b)=> (a.x+a.y+a.z) - (b.x+b.y+b.z)); sorted.forEach(drawBox); }

function aabbOverlap(a,b){ return (a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.w && a.y + a.w > b.y && a.z < b.z + b.h && a.z + a.h > b.z); }
function collides(test, ignoreId=null){
  if(test.x<0||test.y<0||test.z<0) return true;
  if(test.x+test.l>cellsX()||test.y+test.w>cellsY()||test.z+test.h>cellsZ()) return true;
  for(const b of s.boxes){ if(ignoreId!==null && b.id===ignoreId) continue; if(aabbOverlap(test,b)) return true; } return false;
}
function snap(n){ return Math.max(0, Math.round(n)); }

function screenToCell(sx,sy){
  const z = selectedBox()? selectedBox().z : 0;
  const ca=Math.cos(angle),sa=Math.sin(angle),ce=Math.cos(elev),se=Math.sin(elev);
  const X=(sx - W/2)/scale - camX, Y=(sy - H*0.65)/scale - camY;
  const x = (X + (Y + z*se)/ce) / (ca + sa/ce);
  const y = ((Y + z*se)/ce - X) / (ca + sa/ce);
  return {x:snap(x), y:snap(y)};
}

function selectedBox(){ return s.boxes.find(b=>b.id===selected) || null; }

// Interactions
canvas.addEventListener('mousedown',e=>{ dragging=true; last={x:e.clientX,y:e.clientY}; });
canvas.addEventListener('mousemove',e=>{
  if(!dragging) return;
  const dx=e.clientX-last.x, dy=e.clientY-last.y;
  if(e.buttons===1){
    const b=selectedBox();
    if(b && !e.shiftKey){
      const cell=screenToCell(e.clientX,e.clientY);
      const test={...b,x:cell.x,y:cell.y};
      if(!collides(test,b.id)){ b.x=test.x; b.y=test.y; State.save(s); draw(); }
    }else{ camX+=dx; camY+=dy; draw(); }
  }
  last={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('mouseup',()=>dragging=false);
canvas.addEventListener('wheel',e=>{ e.preventDefault(); scale*= (e.deltaY>0?0.9:1.1); scale=Math.max(0.25,Math.min(5,scale)); draw(); }, {passive:false});
canvas.addEventListener('click',e=>{
  const cell=screenToCell(e.clientX,e.clientY); let best=-1, bestD=1e9;
  s.boxes.forEach(b=>{ const cx=b.x+b.l/2, cy=b.y+b.w/2; const d=(cx-cell.x)**2+(cy-cell.y)**2; if(d<bestD){bestD=d; best=b.id;} });
  selected=best; draw();
});

// Touch
let touchCache=[]; function dist(a,b){ const dx=a.clientX-b.clientX, dy=a.clientY-b.clientY; return Math.hypot(dx,dy); }
canvas.addEventListener('touchstart',e=>{ touchCache=[...e.touches]; if(e.touches.length===1){ dragging=true; last={x:e.touches[0].clientX,y:e.touches[0].clientY}; } }, {passive:false});
canvas.addEventListener('touchmove',e=>{
  if(e.touches.length===1 && dragging){
    const b=selectedBox(); if(b){ const cell=screenToCell(e.touches[0].clientX,e.touches[0].clientY);
      const test={...b,x:cell.x,y:cell.y}; if(!collides(test,b.id)){ b.x=test.x; b.y=test.y; State.save(s); draw(); } }
    else{ const dx=e.touches[0].clientX-last.x, dy=e.touches[0].clientY-last.y; camX+=dx; camY+=dy; draw(); }
    last={x=e.touches[0].clientX,y=e.touches[0].clientY};
  }
  if(e.touches.length===2){ const d1=dist(touchCache[0],touchCache[1]); const d2=dist(e.touches[0],e.touches[1]); scale*= (d2>d1?1.05:0.95); scale=Math.max(0.25,Math.min(5,scale)); touchCache=[...e.touches]; draw(); }
}, {passive:false});
canvas.addEventListener('touchend',()=>{ dragging=false; touchCache=[]; }, {passive:false});

// Sidebar actions
function refreshCatalog(){
  el.catalog.innerHTML='';
  if(!s.catalog.length){ el.catalog.innerHTML='<p class="small">Catalogo vuoto.</p>'; return; }
  s.catalog.forEach(m=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<div style="display:flex;gap:8px;align-items:center">
      <span class="swatch" style="background:${m.color}"></span>
      <div><div><strong>${m.name}</strong></div>
      <div class="small">${Math.round(m.lengthCm)}×${Math.round(m.widthCm)}×${Math.round(m.heightCm)} cm</div></div></div>
      <div><input type="number" min="1" value="1" style="width:64px"></div>
      <div><button class="btn" data-add>Aggiungi</button></div>`;
    row.querySelector('[data-add]').onclick=()=>{
      const qty=parseInt(row.querySelector('input').value||'1',10);
      const L=Math.max(1, Math.ceil(m.lengthCm / s.gridSizeCm)), Wd=Math.max(1, Math.ceil(m.widthCm / s.gridSizeCm)), Ht=Math.max(1, Math.ceil(m.heightCm / s.gridSizeCm));
      for(let i=0;i<qty;i++){
        const b={id:s.nextId++, name:m.name, color:m.color, shade:'rgba(34,211,238,0.75)', shade2:'rgba(2,132,199,0.85)',
                 x:0,y:0,z:0,l:L,w:Wd,h:Ht};
        if(!collides(b,null)){ s.boxes.push(b); }
        else{
          let placed=false;
          outer: for(let z=0;z<cellsZ();z++){ for(let y=0;y<cellsY();y++){ for(let x=0;x<cellsX();x++){
            const t={...b,x,y,z}; if(!collides(t,null)){ s.boxes.push(t); placed=true; break outer; } } } }
          if(!placed){ alert('Nessuno spazio libero!'); break; }
        }
      }
      State.save(s); draw();
    };
    el.catalog.appendChild(row);
  });
}
el.saveMat.onclick=()=>{
  const name=(el.name.value||'Pezzo').trim(), color=el.color.value||'#22D3EE';
  const L=parseFloat(el.mL.value||'0'), W=parseFloat(el.mW.value||'0'), H=parseFloat(el.mH.value||'0');
  if(!(L>0 && W>0)){ alert('Lunghezza e larghezza devono essere > 0'); return; }
  s.catalog.push({id:'m-'+Math.random().toString(36).slice(2), name, color, lengthCm:L, widthCm:W, heightCm:H});
  State.save(s); refreshCatalog();
};

function applyDims(){
  s.gridSizeCm = parseInt(el.grid.value,10);
  s.container.lengthCm = parseFloat(el.len.value||'0');
  s.container.widthCm  = parseFloat(el.wid.value||'0');
  s.container.heightCm = parseFloat(el.hei.value||'0');
  State.save(s); draw();
}
el.apply.onclick=applyDims;
el.preset.onchange = (e)=>{
  const p=e.target.value;
  const map={ l3h2:{L:330,W:175,H:250}, semi:{L:1360,W:245,H:270}, c20:{L:589,W:235,H:239}, c40:{L:1203,W:235,H:239} };
  if(map[p]){ el.len.value=map[p].L; el.wid.value=map[p].W; el.hei.value=map[p].H; applyDims(); }
};

// piece actions
el.rotate.onclick=()=>{ const b=selectedBox(); if(!b) return; const t={...b,l:b.w,w:b.l}; if(!collides(t,b.id)){ b.l=t.l; b.w=t.w; State.save(s); draw(); } };
el.up.onclick=()=>{ const b=selectedBox(); if(!b) return; const t={...b,z:b.z+1}; if(!collides(t,b.id)){ b.z++; State.save(s); draw(); } };
el.down.onclick=()=>{ const b=selectedBox(); if(!b) return; const t={...b,z:Math.max(0,b.z-1)}; if(!collides(t,b.id)){ b.z=Math.max(0,b.z-1); State.save(s); draw(); } };
el.del.onclick=()=>{ if(selected!==-1){ s.boxes = s.boxes.filter(b=>b.id!==selected); selected=-1; State.save(s); draw(); } };
el.clear.onclick=()=>{ if(confirm('Svuotare la scena?')){ s.boxes=[]; State.save(s); draw(); } };

// init UI values
el.grid.value = String(s.gridSizeCm);
el.len.value = s.container.lengthCm; el.wid.value = s.container.widthCm; el.hei.value = s.container.heightCm;
refreshCatalog(); draw();

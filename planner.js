
let state=LC.load();const el={preset:document.getElementById('preset'),unit:document.getElementById('unit'),grid:document.getElementById('grid'),
len:document.getElementById('len'),wid:document.getElementById('wid'),apply:document.getElementById('apply'),clear:document.getElementById('clear'),
autopack:document.getElementById('autopack'),exportPng:document.getElementById('exportPng'),board:document.getElementById('board'),meta:document.getElementById('meta'),
addFromCatalog:document.getElementById('addFromCatalog'),overlay:document.getElementById('overlay'),catalogList:document.getElementById('catalogList'),closeOverlay:document.getElementById('closeOverlay')};
const cmToCells=cm=>Math.max(1,Math.round(cm/state.gridSizeCm));const cellPx=()=>44;const cellsToPx=c=>c*cellPx();
const cellsX=()=>Math.floor(state.container.lengthCm/state.gridSizeCm);const cellsY=()=>Math.floor(state.container.widthCm/state.gridSizeCm);
function unitOut(cm){return state.unit==='in'?round(cmToIn(cm),2):Math.round(cm);}function unitIn(v){const n=parseFloat(v||'0');return state.unit==='in'?inToCm(n):n;}
function updateUI(){el.unit.value=state.unit;el.grid.value=String(state.gridSizeCm);el.len.value=unitOut(state.container.lengthCm);el.wid.value=unitOut(state.container.widthCm);
el.meta.textContent=`${unitOut(state.container.lengthCm)} ${state.unit} × ${unitOut(state.container.widthCm)} ${state.unit} · griglia ${state.gridSizeCm} cm · ${cellsX()}×${cellsY()} celle`;}
function render(){el.board.innerHTML='';const b=el.board;b.style.backgroundSize=`${cellPx()}px ${cellPx()}px`;
for(const p of state.placed){const d=document.createElement('div');d.className='piece';d.dataset.id=p.id;
const cw=cmToCells(p.lengthCm),ch=cmToCells(p.widthCm);const w=cellsToPx(p.rotated?ch:cw),h=cellsToPx(p.rotated?cw:ch);
d.style.width=w+'px';d.style.height=h+'px';d.style.transform=`translate(${cellsToPx(p.x)}px, ${cellsToPx(p.y)}px)`;d.style.background=p.color;
const lab=document.createElement('div');lab.className='label';lab.textContent=`${p.name}`;d.appendChild(lab);makeDrag(d,p.id);b.appendChild(d);}updateUI();}
function collision(p,nx,ny,rot){const cw=cmToCells(p.lengthCm),ch=cmToCells(p.widthCm);const w=rot?ch:cw,h=rot?cw:ch;
if(nx<0||ny<0)return true;if(nx+w>cellsX()||ny+h>cellsY())return true;for(const q of state.placed){if(q.id===p.id)continue;
const qcw=cmToCells(q.lengthCm),qch=cmToCells(q.widthCm);const qw=q.rotated?qch:qcw;const qh=q.rotated?qcw:qch;
if(nx<q.x+qw&&nx+w>q.x&&ny<q.y+qh&&ny+h>q.y)return true;}return false;}
function makeDrag(div,id){const p=state.placed.find(x=>x.id===id);let drag=false,offX=0,offY=0;let lastTap=0;
const onDown=e=>{e.preventDefault();drag=true;const r=el.board.getBoundingClientRect();const pt=e.touches?e.touches[0]:e;const ex=pt.clientX-r.left,ey=pt.clientY-r.top;
offX=ex-cellsToPx(p.x);offY=ey-cellsToPx(p.y);document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
document.addEventListener('touchmove',onMove,{passive:false});document.addEventListener('touchend',onUp);};
const onMove=e=>{if(!drag)return;e.preventDefault();const r=el.board.getBoundingClientRect();const pt=e.touches?e.touches[0]:e;const ex=pt.clientX-r.left,ey=pt.clientY-r.top;
const x=Math.round((ex-offX)/cellPx()),y=Math.round((ey-offY)/cellPx());if(!collision(p,x,y,p.rotated)){p.x=x;p.y=y;LC.save(state);render();}};
const onUp=e=>{drag=false;document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);
document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onUp);
const now=Date.now();if(now-lastTap<300){const newR=!p.rotated;if(!collision(p,p.x,p.y,newR)){p.rotated=newR;LC.save(state);render();}}lastTap=now;};
div.addEventListener('mousedown',onDown);div.addEventListener('touchstart',onDown,{passive:false});}
function apply(){state.unit=el.unit.value;state.gridSizeCm=parseInt(el.grid.value,10);state.container.lengthCm=unitIn(el.len.value);state.container.widthCm=unitIn(el.wid.value);LC.save(state);render();}
function preset(key){const map={furgone:{lengthCm:330,widthCm:175},cassonato:{lengthCm:500,widthCm:240},semi:{lengthCm:1360,widthCm:245},c20:{lengthCm:589,widthCm:235},c40:{lengthCm:1203,widthCm:235}};
if(map[key]){state.container={...state.container,...map[key]};LC.save(state);render();}}
function autoPack(){const pieces=[...state.placed].sort((a,b)=>Math.max(b.lengthCm,b.widthCm)-Math.max(a.lengthCm,a.widthCm));
let grid=Array.from({length:cellsY()},()=>Array(cellsX()).fill(0));const can=(x,y,w,h)=>{if(x<0||y<0||x+w>cellsX()||y+h>cellsY())return false;for(let j=y;j<h+y;j++)for(let i=x;i<w+x;i++)if(grid[j][i])return false;return true;};
const occ=(x,y,w,h)=>{for(let j=y;j<h+y;j++)for(let i=x;i<w+x;i++)grid[j][i]=1;};for(const p of pieces){let done=false;for(const rot of [false,true]){
const w=cmToCells(rot?p.widthCm:p.lengthCm),h=cmToCells(rot?p.lengthCm:p.widthCm);for(let y=0;y<cellsY();y++){for(let x=0;x<cellsX();x++){if(can(x,y,w,h)){p.x=x;p.y=y;p.rotated=rot;occ(x,y,w,h);done=true;break;}} if(done)break;} if(done)break;}
LC.save(state);render();}
function exportPNG(){const cols=cellsX(),rows=cellsY(),scale=44;const W=cols*scale,H=rows*scale;const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
ctx.fillStyle='#0b1220';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#1f2937';ctx.lineWidth=1;for(let i=0;i<=cols;i++){ctx.beginPath();ctx.moveTo(i*scale,0);ctx.lineTo(i*scale,H);ctx.stroke();}
for(let j=0;j<=rows;j++){ctx.beginPath();ctx.moveTo(0,j*scale);ctx.lineTo(W,j*scale);ctx.stroke();}ctx.textBaseline='top';ctx.font='12px system-ui';
for(const p of state.placed){const cw=cmToCells(p.lengthCm),ch=cmToCells(p.widthCm);const w=(p.rotated?ch:cw)*scale,h=(p.rotated?cw:ch)*scale;const x=p.x*scale,y=p.y*scale;
ctx.fillStyle=p.color;ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#e5e7eb';ctx.fillText(p.name,x+6,y+h-18);}
const url=c.toDataURL('image/png');const a=document.createElement('a');a.href=url;a.download='piano-2d.png';a.click();}
function openCatalog(){el.catalogList.innerHTML='';if(!state.catalog.length){el.catalogList.innerHTML='<p class="small">Catalogo vuoto.</p>';}
state.catalog.forEach(m=>{const row=document.createElement('div');row.className='item';row.innerHTML=`
<div style="display:flex;gap:10px;align-items:center"><span class="swatch" style="background:${m.color}"></span>
<div><div><strong>${m.name}</strong></div><div class="small">${Math.round(m.lengthCm)}×${Math.round(m.widthCm)}×${Math.round(m.heightCm)} cm · ${m.weightKg} kg</div></div></div>
<div><input type="number" min="1" value="1" style="width:70px" aria-label="quantità"></div>
<div class="toolbar"><button class="btn" data-add>Aggiungi</button></div>`;
row.querySelector('[data-add]').onclick=()=>{const qty=parseInt(row.querySelector('input').value||'1',10);for(let i=0;i<qty;i++){const p={id:state.nextId++,modelId:m.id,name:m.name,lengthCm:m.lengthCm,widthCm:m.widthCm,heightCm:m.heightCm,weightKg:m.weightKg,color:m.color,x:0,y:0,rotated:false};state.placed.push(p);}LC.save(state);render();};
el.catalogList.appendChild(row);});el.overlay.style.display='flex';}
el.closeOverlay.onclick=()=>el.overlay.style.display='none';
el.addFromCatalog.onclick=openCatalog;el.apply.onclick=apply;el.clear.onclick=()=>{if(confirm('Svuotare il piano?')){state.placed=[];LC.save(state);render();}};
el.autopack.onclick=autoPack;el.exportPng.onclick=exportPNG;el.preset.onchange=e=>preset(e.target.value);render();


let state=LC.load();const el={count:document.getElementById('count'),kg:document.getElementById('kg'),occ:document.getElementById('occ'),list:document.getElementById('list'),
exportJson:document.getElementById('exportJson'),importJson:document.getElementById('importJson'),file:document.getElementById('file')};
function update(){el.count.textContent=String(state.placed.length);const kg=state.placed.reduce((a,b)=>a+(b.weightKg||0),0);el.kg.textContent=String(Math.round(kg*10)/10);
const area=state.container.lengthCm*state.container.widthCm;const occ=state.placed.reduce((a,b)=>a+(b.lengthCm*b.widthCm),0);el.occ.textContent=area>0?Math.min(100,Math.round(occ/area*100)):0;
el.list.innerHTML='';if(!state.placed.length){el.list.innerHTML='<p class="small">Nessun pezzo nel piano.</p>';return;}state.placed.forEach(p=>{const row=document.createElement('div');row.className='item';
row.innerHTML=`<div style="display:flex;gap:10px;align-items:center"><span class="swatch" style="background:${p.color}"></span>
<div><div><strong>${p.name}</strong></div><div class="small">${Math.round(p.lengthCm)}×${Math.round(p.widthCm)}×${Math.round(p.heightCm)} cm · ${p.weightKg} kg</div></div></div>
<div class="small">pos (${p.x},{p.y})${p.rotated?' · ruotato':''}</div>`;el.list.appendChild(row);});}
function exportJSON(){const data={version:4,...state};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='load-composer.json';a.click();}
function importJSON(f){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);state=d;LC.save(state);update();alert('Import completato');}catch(e){alert('File non valido');}};r.readAsText(f);}
el.exportJson.onclick=exportJSON;el.importJson.onclick=()=>el.file.click();el.file.onchange=e=>{if(e.target.files&&e.target.files[0])importJSON(e.target.files[0]);};update();

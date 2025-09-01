
let state=LC.load();const list=document.getElementById('catalog');
function dim(cm){return state.unit==='in'?`${round(cmToIn(cm),2)} in`:`${Math.round(cm)} cm`;}
function render(){list.innerHTML='';if(!state.catalog.length){const p=document.createElement('p');p.className='small';p.textContent='Nessun elemento. Aggiungi il tuo materiale.';list.appendChild(p);return;}
state.catalog.forEach(m=>{const row=document.createElement('div');row.className='item';row.innerHTML=`
<div style="display:flex;gap:10px;align-items:center"><span class="swatch" style="background:${m.color}"></span>
<div><div><strong>${m.name}</strong></div><div class="small">${dim(m.lengthCm)} × ${dim(m.widthCm)} × ${Math.round(m.heightCm)} cm · ${m.weightKg} kg</div></div></div>
<div class="toolbar"><button class="btn" data-add>+ al Piano</button><button class="btn ghost" data-del>Elimina</button></div>`;
row.querySelector('[data-add]').onclick=()=>addToBoard(m.id);row.querySelector('[data-del]').onclick=()=>delModel(m.id);list.appendChild(row);});}
function addToBoard(id){const m=state.catalog.find(x=>x.id===id);if(!m)return;
const p={id:state.nextId++,modelId:m.id,name:m.name,lengthCm:m.lengthCm,widthCm:m.widthCm,heightCm:m.heightCm,weightKg:m.weightKg,color:m.color,x:0,y:0,rotated:false};
state.placed.push(p);LC.save(state);alert('Aggiunto al Piano 2D');}
function delModel(id){if(!confirm('Eliminare dal catalogo?'))return;state.catalog=state.catalog.filter(x=>x.id!==id);LC.save(state);render();}
render();

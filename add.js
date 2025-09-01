
let state=LC.load();const el={name:document.getElementById('name'),color:document.getElementById('color'),L:document.getElementById('L'),
W:document.getElementById('W'),H:document.getElementById('H'),KG:document.getElementById('KG'),preview:document.getElementById('preview'),save:document.getElementById('save')};
function draw(){const L=Math.max(1,parseFloat(el.L.value||'0'));const W=Math.max(1,parseFloat(el.W.value||'0'));const H=Math.max(0,parseFloat(el.H.value||'0'));const color=el.color.value;
const maxW=280,maxH=180;const s=Math.min(maxW/L,maxH/W);const w=Math.max(20,Math.round(W*s));const h=Math.max(20,Math.round(L*s));
el.preview.innerHTML=`<svg width="${w+80}" height="${h+80}" viewBox="0 0 ${w+80} ${h+80}"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity=".75"/></linearGradient></defs>
<rect x="40" y="40" rx="14" ry="14" width="${w}" height="${h}" fill="url(#g)" stroke="rgba(0,0,0,.4)" stroke-width="2"/>
<g font-family="system-ui" font-size="12" fill="#e5e7eb"><text x="${40+w/2}" y="${40+h+20}" text-anchor="middle">W: ${W} cm</text>
<text x="${40+w+8}" y="${40+h/2}" transform="rotate(90, ${40+w+8}, ${40+h/2})" text-anchor="middle">L: ${L} cm</text>
<text x="${40+w/2}" y="22" text-anchor="middle">${H} cm · ${el.KG.value||0} kg</text></g></svg>`;}
['input','change'].forEach(ev=>{[el.name,el.color,el.L,el.W,el.H,el.KG].forEach(n=>n.addEventListener(ev,draw));});draw();
el.save.onclick=()=>{const L=parseFloat(el.L.value||'0'),W=parseFloat(el.W.value||'0'),H=parseFloat(el.H.value||'0'),KG=parseFloat(el.KG.value||'0');
if(!(L>0&&W>0)){alert('Lunghezza e larghezza devono essere > 0');return;}
const m={id:'m-'+Math.random().toString(36).slice(2),name:(el.name.value||'Pezzo').trim(),lengthCm:L,widthCm:W,heightCm:H,weightKg:KG,color:el.color.value};
state.catalog.push(m);LC.save(state);location.href='materials.html';};

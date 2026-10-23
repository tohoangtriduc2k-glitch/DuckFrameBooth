const $=id=>document.getElementById(id);
const state={frames:[],frame:null,frameImage:null,slots:[],photos:[],selectedSlot:0,configMode:false,drawStart:null,drawCurrent:null,dragging:false,dragPoint:null};
const canvas=$('previewCanvas'),ctx=canvas.getContext('2d',{willReadFrequently:false});
const pages=['welcome','catalog','editor','qrSection'];
function showPage(id){pages.forEach(p=>$(p).classList.toggle('active',p===id));$('headerBack').hidden=!['editor','qrSection'].includes(id);window.scrollTo({top:0,behavior:'smooth'});}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadFrames(){
 const r=await fetch('/api/frames');if(!r.ok)throw Error('Không tải được frame');state.frames=await r.json();renderCatalog(state.frames);
}
function renderCatalog(frames){
 $('frameCount').textContent=`${frames.length} frame`;
 if(!frames.length){$('frameGrid').innerHTML='<div class="loading">Chưa có frame trong thư mục public/frames.</div>';return;}
 $('frameGrid').innerHTML=frames.map(f=>`<article class="frame-card" data-id="${f.id}" tabindex="0" role="button" aria-label="Chọn ${esc(f.name)}"><div class="frame-thumb"><img loading="lazy" src="/frames/${encodeURIComponent(f.file)}" alt="${esc(f.name)}"></div><div class="frame-card-info"><b>${esc(f.name)}</b><span class="slot-badge">${f.slotCount} ô ảnh</span></div></article>`).join('');
 $('frameGrid').querySelectorAll('.frame-card').forEach(card=>{const go=()=>openFrame(Number(card.dataset.id));card.addEventListener('click',go);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
}
async function openFrame(id){
 const frame=state.frames.find(f=>f.id===id);if(!frame)return;
 state.frame=frame;state.slots=frame.slots.map(s=>s.slice());state.photos=state.slots.map(()=>({img:null,name:'',zoom:1,dx:0,dy:0}));state.selectedSlot=0;state.configMode=false;
 $('editorTitle').innerHTML=`${esc(frame.name)} <span>♡</span>`;
 $('editorSubtitle').textContent=`${frame.slotCount} ô ảnh · Chọn ảnh từ thiết bị rồi căn chỉnh từng ô.`;
 const im=new Image();im.onload=()=>{state.frameImage=im;canvas.width=frame.width;canvas.height=frame.height;drawCanvas();renderSlots();showPage('editor');};im.onerror=()=>alert('Không mở được frame: '+frame.file);im.src='/frames/'+encodeURIComponent(frame.file);
}
function photoRect(slot,p){
 const [x,y,w,h]=slot; if(!p.img)return null;
 // Cover-fit: fill the entire photo opening without stretching the source image.
 const fit=Math.max(w/p.img.width,h/p.img.height);const scale=fit*p.zoom;
 const dw=p.img.width*scale,dh=p.img.height*scale;
 return {x:x+w/2+p.dx-dw/2,y:y+h/2+p.dy-dh/2,w:dw,h:dh};
}
// Special openings in the supplied artwork. Coordinates remain in the original 1024x1536 frame space.
// circle frames must never show square photo corners; tilted instant-photo frames use a rotated clip.
function slotShape(frameId,index){
 const circles={26:[0,1,2],30:[0,1,2,3],45:[0,1,2,3]};
 if(circles[frameId]?.includes(index)) return {type:'ellipse'};
 const tilted={6:[-7,7,-7],11:[-7,7,-7],38:[-7,7,-7],39:[-5,0,5],41:[-7,7,-7]};
 if(tilted[frameId]?.[index]!==undefined) return {type:'rotated',angle:tilted[frameId][index]};
 return {type:'round',radius:Math.max(5,Math.min(state.slots[index][2],state.slots[index][3])*.035)};
}
function clipSlot(context,slot,shape){
 const [x,y,w,h]=slot;context.beginPath();
 if(shape.type==='ellipse') context.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
 else if(shape.type==='rotated'){
  context.translate(x+w/2,y+h/2);context.rotate((shape.angle||0)*Math.PI/180);context.rect(-w/2,-h/2,w,h);
 }
 else {const r=Math.min(shape.radius||0,w/2,h/2);context.moveTo(x+r,y);context.arcTo(x+w,y,x+w,y+h,r);context.arcTo(x+w,y+h,x,y+h,r);context.arcTo(x,y+h,x,y,r);context.arcTo(x,y,x+w,y,r);}
 context.clip();
}
function drawCanvas(){
 if(!state.frameImage)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(state.frameImage,0,0,canvas.width,canvas.height);
 state.slots.forEach((slot,i)=>{
  const p=state.photos[i];const [x,y,w,h]=slot;
  if(p&&p.img){
   ctx.save();clipSlot(ctx,slot,slotShape(state.frame.id,i));const r=photoRect(slot,p);ctx.drawImage(p.img,r.x,r.y,r.w,r.h);ctx.restore();
  }else if(!state.configMode){
   ctx.save();ctx.strokeStyle='rgba(236,139,173,.95)';ctx.lineWidth=Math.max(3,canvas.width/360);ctx.setLineDash([10,8]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);ctx.fillStyle='rgba(255,242,247,.84)';ctx.beginPath();ctx.arc(x+w/2,y+h/2,Math.min(w,h)*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c97d99';ctx.font=`bold ${Math.max(18,Math.min(w,h)*.14)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',x+w/2,y+h/2);ctx.restore();
  }
  if(i===state.selectedSlot&&!state.configMode){
   ctx.save();ctx.strokeStyle='#d86e95';ctx.lineWidth=Math.max(4,canvas.width/300);ctx.setLineDash([12,7]);ctx.strokeRect(x,y,w,h);ctx.restore();
  }
 });
 if(state.configMode&&state.drawCurrent){
  const b=normalRect(state.drawStart,state.drawCurrent);ctx.save();ctx.strokeStyle='#7d65cf';ctx.lineWidth=Math.max(4,canvas.width/300);ctx.setLineDash([14,8]);ctx.strokeRect(...b);ctx.restore();
 }
 $('canvasHint').hidden=state.slots.every((s,i)=>state.photos[i]?.img);
 $('progressText').textContent=`${state.photos.filter(p=>p.img).length} / ${state.slots.length} ô đã có ảnh`;
 $('downloadBtn').disabled=!state.photos.some(p=>p.img);
}
function renderSlots(){
 $('slotList').innerHTML=state.slots.map((s,i)=>{const p=state.photos[i];return `<div class="slot-item ${i===state.selectedSlot?'active':''}" data-slot="${i}"><div class="slot-thumb">${p?.img?`<img src="${p.img.src}" alt="">`:'♡'}</div><div class="slot-details"><b>Ô ảnh ${i+1}</b><small>${p?.name?esc(p.name):'Chưa chọn ảnh'}</small></div><div class="slot-actions"><button class="mini-btn choose" data-slot="${i}">＋ Ảnh</button><input class="file-input" id="file-${i}" data-slot="${i}" type="file" accept="image/*"></div></div>`}).join('');
 $('slotList').querySelectorAll('.slot-item').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button')||e.target.closest('input'))return;selectSlot(Number(el.dataset.slot));}));
 $('slotList').querySelectorAll('.choose').forEach(b=>b.addEventListener('click',()=>{$(`file-${b.dataset.slot}`).click();}));
 $('slotList').querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',e=>loadPhoto(Number(input.dataset.slot),e.target.files[0])));
 selectSlot(state.selectedSlot);drawCanvas();
}
function selectSlot(i){
 state.selectedSlot=i;
 document.querySelectorAll('.slot-item').forEach(el=>el.classList.toggle('active',Number(el.dataset.slot)===i));
 const p=state.photos[i];$('selectedTools').hidden=state.configMode;
 $('selectedSlotName').textContent=`Ô ${i+1}`;$('zoomRange').value=p?.zoom||1;
 drawCanvas();
}
function loadPhoto(i,file){
 if(!file)return;
 if(!file.type.startsWith('image/')){alert('Vui lòng chọn một file ảnh.');return;}
 const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const old=state.photos[i];if(old?.img&&old.img.src.startsWith('blob:'))URL.revokeObjectURL(old.img.src);state.photos[i]={img:im,name:file.name,zoom:1,dx:0,dy:0};state.selectedSlot=i;renderSlots();};
 im.onerror=()=>alert('Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG khác.');
 im.src=url;
}
$('zoomRange').addEventListener('input',()=>{const p=state.photos[state.selectedSlot];if(p?.img){p.zoom=Number($('zoomRange').value);drawCanvas();}});
$('resetCrop').addEventListener('click',()=>{const p=state.photos[state.selectedSlot];if(p?.img){p.zoom=1;p.dx=0;p.dy=0;$('zoomRange').value=1;drawCanvas();}});
$('resetAll').addEventListener('click',()=>{if(!state.frame)return;if(!confirm('Bạn muốn xóa ảnh đã chọn trong tất cả ô?'))return;state.photos=state.slots.map(()=>({img:null,name:'',zoom:1,dx:0,dy:0}));renderSlots();});
function canvasPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
function slotAt(pt){for(let i=state.slots.length-1;i>=0;i--){const [x,y,w,h]=state.slots[i];if(pt.x>=x&&pt.x<=x+w&&pt.y>=y&&pt.y<=y+h)return i;}return -1;}
function normalRect(a,b){return [Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y)];}
canvas.addEventListener('pointerdown',e=>{
 if(!state.frame)return;const pt=canvasPoint(e);
 if(state.configMode){state.drawStart=pt;state.drawCurrent=pt;canvas.setPointerCapture(e.pointerId);drawCanvas();return;}
 const i=slotAt(pt);if(i>=0){selectSlot(i);const p=state.photos[i];if(p?.img){state.dragging=true;state.dragPoint=pt;canvas.setPointerCapture(e.pointerId);}}
});
canvas.addEventListener('pointermove',e=>{
 const pt=canvasPoint(e);
 if(state.configMode&&state.drawStart){state.drawCurrent=pt;drawCanvas();return;}
 if(state.dragging&&state.dragPoint){const p=state.photos[state.selectedSlot];if(p?.img){p.dx+=pt.x-state.dragPoint.x;p.dy+=pt.y-state.dragPoint.y;state.dragPoint=pt;drawCanvas();}}
});
canvas.addEventListener('pointerup',e=>{
 if(state.configMode&&state.drawStart&&state.drawCurrent){
  const b=normalRect(state.drawStart,state.drawCurrent);state.drawStart=null;state.drawCurrent=null;
  if(b[2]>15&&b[3]>15){state.slots.push(b.map(Math.round));state.photos.push({img:null,name:'',zoom:1,dx:0,dy:0});state.selectedSlot=state.slots.length-1;renderSlots();}
  else drawCanvas();
 }
 state.dragging=false;state.dragPoint=null;
});
canvas.addEventListener('pointercancel',()=>{state.drawStart=null;state.drawCurrent=null;state.dragging=false;state.dragPoint=null;drawCanvas();});
$('downloadBtn').addEventListener('click',()=>{
 if(!state.frameImage)return;
 // Export from a full-resolution canvas. Uploaded photos are drawn at their natural decoded resolution.
 const out=document.createElement('canvas');out.width=state.frame.width;out.height=state.frame.height;const o=out.getContext('2d');
 o.drawImage(state.frameImage,0,0,out.width,out.height);
 state.slots.forEach((slot,i)=>{const p=state.photos[i];if(!p?.img)return;const [x,y,w,h]=slot;const r=photoRect(slot,p);o.save();clipSlot(o,slot,slotShape(state.frame.id,i));o.drawImage(p.img,r.x,r.y,r.w,r.h);o.restore();});
 out.toBlob(blob=>{if(!blob){alert('Không xuất được ảnh.');return;}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`DuckFrameBooth-${state.frame.name.replace(/\s+/g,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),15000);},'image/png');
});
$('enterBtn').addEventListener('click',()=>showPage('catalog'));
$('backCatalog').addEventListener('click',()=>{state.configMode=false;showPage('catalog');});
$('logoHome').addEventListener('click',e=>{e.preventDefault();showPage('welcome');});
$('headerBack').addEventListener('click',()=>showPage(state.frame?'catalog':'welcome'));
$('searchFrames').addEventListener('input',()=>{const q=$('searchFrames').value.toLowerCase().trim();renderCatalog(state.frames.filter(f=>(f.name+' '+f.originalName).toLowerCase().includes(q)));});
$('openQr').addEventListener('click',()=>showPage('qrSection'));
$('makeQr').addEventListener('click',async()=>{
 const url=$('siteUrl').value.trim();if(!url){alert('Hãy nhập link website công khai sau khi deploy.');return;}
 try{const r=await fetch('/api/qr?url='+encodeURIComponent(url));const data=await r.json();if(!r.ok)throw Error(data.error||'Không tạo được QR');$('qrResult').innerHTML=`<img src="${data.data}" alt="QR DuckFrameBooth"><a href="${data.data}" download="DuckFrameBooth-QR.png">Tải mã QR PNG ↓</a><p class="microcopy">${esc(data.url)}</p>`;}
 catch(e){alert(e.message);}
});
// Admin slot setup controls are inserted in the editor panel to let the owner correct auto-detected slot boxes.
const configButton=document.createElement('button');configButton.className='btn btn-light btn-full';configButton.style.marginBottom='12px';configButton.textContent='⚙ Sửa vị trí ô ảnh (quản trị)';configButton.hidden=new URLSearchParams(location.search).get('admin')!=='1';
$('slotList').parentElement.insertBefore(configButton,$('slotList'));
const configHelp=document.createElement('div');configHelp.className='microcopy';configHelp.style.marginBottom='10px';configHelp.hidden=true;configHelp.innerHTML='Kéo trên frame để vẽ từng ô ảnh. Vẽ đủ các ô theo thứ tự mong muốn, rồi nhấn <b>Lưu vị trí ô ảnh</b>. Cấu hình sẽ được lưu trên máy chủ website.';configButton.after(configHelp);
const saveConfig=document.createElement('button');saveConfig.className='btn btn-main btn-full';saveConfig.style.marginBottom='12px';saveConfig.textContent='Lưu vị trí ô ảnh';saveConfig.hidden=true;configHelp.after(saveConfig);
configButton.addEventListener('click',()=>{
 if(!state.frame)return;
 if(!state.configMode){if(!confirm('Chuyển sang chế độ quản trị để vẽ lại ô ảnh? Những ảnh đã chọn ở frame này sẽ bị xóa.'))return;
  state.configMode=true;state.slots=[];state.photos=[];state.selectedSlot=0;configHelp.hidden=false;saveConfig.hidden=false;configButton.textContent='✓ Đang sửa ô ảnh';$('selectedTools').hidden=true;renderSlots();drawCanvas();
 }else{state.configMode=false;configHelp.hidden=true;saveConfig.hidden=true;configButton.textContent='⚙ Sửa vị trí ô ảnh (quản trị)';state.photos=state.slots.map(()=>({img:null,name:'',zoom:1,dx:0,dy:0}));renderSlots();}
});
saveConfig.addEventListener('click',async()=>{
 if(state.slots.length<1){alert('Hãy vẽ ít nhất một ô ảnh.');return;}
 try{const r=await fetch(`/api/frames/${state.frame.id}/slots`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({slots:state.slots})});const data=await r.json();if(!r.ok)throw Error(data.error||'Lỗi lưu cấu hình');
  state.frame=data.frame;state.configMode=false;configHelp.hidden=true;saveConfig.hidden=true;configButton.textContent='⚙ Sửa vị trí ô ảnh (quản trị)';state.photos=state.slots.map(()=>({img:null,name:'',zoom:1,dx:0,dy:0}));await loadFrames();state.frame=state.frames.find(f=>f.id===data.frame.id);$('editorSubtitle').textContent=`${state.frame.slotCount} ô ảnh · Chọn ảnh từ thiết bị rồi căn chỉnh từng ô.`;renderSlots();alert('Đã lưu vị trí ô ảnh cho frame này.');}
 catch(e){alert('Không lưu được: '+e.message);}
});
loadFrames().catch(e=>{$('frameGrid').innerHTML=`<div class="loading">Lỗi tải frame: ${esc(e.message)}</div>`;});

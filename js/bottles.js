"use strict";
/* ===================== BOTTLE KEEP ===================== */
const bkExpires=b=>b.kept+b.days*DAY;
const bkDaysLeft=b=>Math.ceil((bkExpires(b)-Date.now())/DAY);
function bottleArt(level,id){
  const cid="bc"+id;
  return `<svg viewBox="0 0 60 120" width="58%" aria-hidden="true"><defs><clipPath id="${cid}"><path d="M24 4h12v20l6 10v78a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V34l6-10z"/></clipPath></defs>
    <rect x="0" y="${116-level*0.82}" width="60" height="120" fill="#EAB343" clip-path="url(#${cid})"/>
    <path d="M24 4h12v20l6 10v78a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V34l6-10z" fill="none" stroke="#6B5040" stroke-width="2"/></svg>`;
}
function renderBottles(){
  const q=state.bkQ.trim().toLowerCase(), qd=q.replace(/\D/g,"");
  const list=bottles.filter(b=>(!q||b.name.toLowerCase().includes(q)||b.item.toLowerCase().includes(q)||(qd.length>=3&&b.phone.replace(/\D/g,"").endsWith(qd)))&&(state.bkFilter==="all"||bkDaysLeft(b)<=7)).sort((a,b)=>bkExpires(a)-bkExpires(b));
  const exp=bottles.filter(b=>bkDaysLeft(b)<=7).length;
  $("#bkEyebrow").textContent=`${T("ຝາກຢູ່","Kept:")} ${bottles.length} ${T("ຂວດ · ໃກ້ໝົດອາຍຸ","bottles · expiring soon:")} ${exp} ${T("ຂວດ","")}`;
  $$("#bkFilter button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===state.bkFilter));
  $("#bkGrid").innerHTML=list.length?list.map(b=>{ const dl=bkDaysLeft(b); return `
    <button class="bk-card ${dl<=7?"exp":""}" data-bk="${b.id}" aria-label="${esc(b.name)} ${esc(b.item)} ${T("ເຫຼືອ","Level")} ${b.level}%">
      <span class="bk-photo">${b.photo?`<img src="${b.photo}" alt="">`:bottleArt(b.level,b.id)}<span class="lvl">${b.level}%</span></span>
      <span class="bk-info">
        <span class="top"><b>${esc(b.name)}</b><span class="chip xs">${esc(b.locker)}</span></span>
        <span class="small muted">${T("ໂທ","Tel")} ···· ${esc(b.phone.replace(/\D/g,"").slice(-4))}</span>
        <span class="bt">${esc(b.item)}</span>
        <span class="level"><span style="width:${b.level}%"></span></span>
        <span class="small" style="color:${dl<=7?"var(--danger)":"var(--ink-3)"};font-weight:${dl<=7?600:400}">${dl<0?`${T("ໝົດອາຍຸແລ້ວ","Expired")} ${-dl} ${T("ມື້","days ago")}`:dl<=7?`${T("ໝົດອາຍຸໃນ","Expires in")} ${dl} ${T("ມື້","days ago")}`:`${T("ຝາກ","Kept")} ${dmy(b.kept)} · ${T("ໝົດ","expires")} ${dmy(bkExpires(b))}`}</span>
        <span class="small muted" style="display:flex;align-items:center;gap:4px">${b.photo?icon("i-camera","xs")+T("ມີຮູບຫຼັກຖານ","Has proof photo"):icon("i-image","xs")+T("ຍັງບໍ່ມີຮູບ","No photo yet")}</span>
      </span>
    </button>`;}).join(""):`<div class="empty" style="grid-column:1/-1">${T("ບໍ່ພົບຂວດທີ່ຝາກ","No kept bottles found")}</div>`;
  const sel=$("#bkItem").value;
  $("#bkItem").innerHTML=cfg.products.filter(p=>p.keep).map(p=>`<option>${esc(p.name)}</option>`).join("")+`<option>${T("ອື່ນໆ (ລະບຸໃນໝາຍເຫດ)","Other (describe in note)")}</option>`;
  if(sel&&[...$("#bkItem").options].some(o=>o.value===sel)) $("#bkItem").value=sel;
  $("#bkLvl").innerHTML=[[100,T("ເຕັມ","Full")],[75,"¾"],[50,"½"],[25,"¼"]].map(([v,l])=>`<button type="button" class="opt" data-lv="${v}" aria-pressed="${state.bkDraft.level===v}" aria-label="${T("ເຫຼືອ","Level")} ${v}%">${l}</button>`).join("");
  $("#bkRange").value=state.bkDraft.level; $("#bkRangeOut").textContent=`${T("ເຫຼືອປະມານ","about")} ${state.bkDraft.level}%`;
  renderPhotoBox();
}
function renderPhotoBox(){
  const p=state.bkDraft.photo;
  $("#bkPhotoBox").innerHTML=`${p?`<img src="${p}" alt="${T("ຮູບຂວດທີ່ຖ່າຍໄວ້","Bottle photo taken")}">`:`<div style="color:var(--gold-ink)">${icon("i-camera")}</div><div class="small">${T("ຖ່າຍໃຫ້ເຫັນສະຫຼາກ ແລະ ລະດັບຂອງແຫຼວໃນຂວດຊັດໆ","Show the label and liquid level clearly")}</div>`}
    <div class="btns"><button type="button" class="btn btn-sm" data-cam>${icon("i-camera","sm")}${p?T("ຖ່າຍໃໝ່","Retake"):T("ເປີດກ້ອງ","Open camera")}</button><button type="button" class="btn btn-sm" data-file>${icon("i-upload","sm")}${T("ເລືອກຮູບ","Choose photo")}</button></div>`;
}
function shrink(src,max=640,type="image/jpeg",q=.72){ return new Promise(res=>{ const img=new Image(); img.onload=()=>{ const s=Math.min(1,max/Math.max(img.width,img.height)); const c=document.createElement("canvas"); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s); c.getContext("2d").drawImage(img,0,0,c.width,c.height); res(c.toDataURL(type,q)); }; img.onerror=()=>res(null); img.src=src; }); }
const readFile=f=>new Promise(res=>{ if(!f) return res(null); const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=()=>res(null); fr.readAsDataURL(f); });
async function takePhoto(){
  if(!navigator.mediaDevices?.getUserMedia){ $("#bkFile").click(); return null; }
  let stream;
  try{ stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280}},audio:false}); }
  catch(e){ toast(T("ເປີດກ້ອງບໍ່ໄດ້ — ເລືອກຮູບຈາກເຄື່ອງແທນ","Can't open the camera — choose a photo instead"),"i-camera",true); $("#bkFile").click(); return null; }
  let shot=null;
  await openDyn({eyebrow:T("ຫຼັກຖານການຝາກຂວດ","Bottle keep proof"),title:T("ຖ່າຍຮູບຂວດ","Photograph bottle"),body:`<div class="cam"><video id="camV" autoplay playsinline muted></video></div><p class="muted small" style="margin:0">${T("ໃຫ້ເຫັນສະຫຼາກ ແລະ ລະດັບຂອງແຫຼວໃນຂວດ","Show the label and liquid level")}</p>`,
    actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ຖ່າຍ","Capture"),value:"shot",cls:"btn-gold",icon:"i-camera",id:"camShot"}],
    mount(el,close){ const v=$("#camV",el); v.srcObject=stream; $("#camShot",el).addEventListener("click",ev=>{ ev.preventDefault(); const c=document.createElement("canvas"); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext("2d").drawImage(v,0,0); shot=c.toDataURL("image/jpeg",.85); close("shot"); }); }});
  stream.getTracks().forEach(t=>t.stop());
  return shot?await shrink(shot):null;
}
$("#bkPhotoBox").addEventListener("click",async e=>{
  if(e.target.closest("[data-file]")){ state.bkDraft.target=null; $("#bkFile").click(); }
  if(e.target.closest("[data-cam]")){ state.bkDraft.target=null; const p=await takePhoto(); if(p){ state.bkDraft.photo=p; renderPhotoBox(); } }
});
$("#bkFile").addEventListener("change",async e=>{
  const raw=await readFile(e.target.files[0]); e.target.value=""; if(!raw) return;
  const p=await shrink(raw); if(!p){ toast(T("ອ່ານຮູບບໍ່ໄດ້","Couldn't read the image"),"i-alert",true); return; }
  const tid=state.bkDraft.target; state.bkDraft.target=null;
  if(tid){ const b=bottles.find(x=>x.id===tid); if(b){ b.photo=p; b.hist.push({t:Date.now(),by:state.user.name,text:T("ອັບເດດຮູບຫຼັກຖານ","Proof photo updated")}); log("bottle",`${T("ອັບເດດຮູບ","Updated photo")} ${b.item} · ${b.name}`); save(); renderBottles(); } return; }
  state.bkDraft.photo=p; renderPhotoBox();
});
$("#bkLvl").addEventListener("click",e=>{const b=e.target.closest("[data-lv]"); if(!b)return; state.bkDraft.level=+b.dataset.lv; renderBottles();});
$("#bkRange").addEventListener("input",e=>{ state.bkDraft.level=+e.target.value; $("#bkRangeOut").textContent=`${T("ເຫຼືອປະມານ","about")} ${state.bkDraft.level}%`; $$("#bkLvl .opt").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.lv===state.bkDraft.level)); });
$("#bkFilter").addEventListener("click",e=>{const b=e.target.closest("[data-f]"); if(!b)return; state.bkFilter=b.dataset.f; renderBottles();});
$("#bkSearch").addEventListener("input",e=>{state.bkQ=e.target.value; renderBottles();});
$("#bkSave").onclick=async()=>{
  const name=$("#bkName").value.trim(), phone=$("#bkPhone").value.trim(), locker=$("#bkLocker").value.trim()||"—";
  if(!name){ toast(T("ໃສ່ຊື່ລູກຄ້າ","Enter the customer's name"),"i-alert",true); $("#bkName").focus(); return; }
  if(phone.replace(/\D/g,"").length<6){ toast(T("ໃສ່ເບີໂທໃຫ້ຄົບ","Enter the full phone number"),"i-alert",true); $("#bkPhone").focus(); return; }
  if(!state.bkDraft.photo){ toast(T("ຕ້ອງຖ່າຍຮູບຂວດເປັນຫຼັກຖານກ່ອນບັນທຶກ","Take a photo of the bottle before saving"),"i-camera",true); return; }
  const g=await guard("bottleKeep",T("ຮັບຝາກຂວດ","Bottle kept")); if(!g.ok) return;
  const b={id:uid("bk"),name,phone,item:$("#bkItem").value,level:state.bkDraft.level,locker,kept:Date.now(),days:+$("#bkDays").value,photo:state.bkDraft.photo,note:$("#bkNote").value.trim(),by:state.user.name,hist:[{t:Date.now(),by:state.user.name,text:`${T("ຮັບຝາກ · ເຫຼືອ","Kept · level")} ${state.bkDraft.level}%`}]};
  bottles.unshift(b);
  log("bottle",`${T("ຮັບຝາກ","Kept")} ${b.item} (${b.level}%) · ${b.name} · ${T("ຕູ້","locker")} ${b.locker}`,g.by);
  ["#bkName","#bkPhone","#bkLocker","#bkNote"].forEach(s=>$(s).value=""); state.bkDraft={level:50,photo:null,target:null};
  save(); renderBottles(); toast(`${T("ບັນທຶກແລ້ວ · ພິມປ້າຍຂວດ","Saved · printing bottle tag")} ${b.locker} → ${cfg.printer.receipt}`,"i-print");
};
$("#bkJump").onclick=()=>{ $("#bkFormTitle").scrollIntoView({behavior:"smooth",block:"start"}); setTimeout(()=>$("#bkName").focus({preventScroll:true}),400); };
$("#bkGrid").addEventListener("click",e=>{ const c=e.target.closest("[data-bk]"); if(c) openBottle(c.dataset.bk); });
async function openBottle(id){
  const b=bottles.find(x=>x.id===id); if(!b) return;
  const dl=bkDaysLeft(b), start=Math.max(0,b.level-25);
  const r=await openDyn({cls:"w-lg",eyebrow:`${T("ຕູ້","locker")} ${esc(b.locker)} · ${T("ໂທ","Tel")} ${esc(b.phone)}`,title:esc(b.name),sub:`${esc(b.item)} · ${T("ເຫຼືອ","Level")} ${b.level}% · ${dl<0?T("ໝົດອາຍຸແລ້ວ","Expired"):`${T("ໝົດອາຍຸ","expires")} ${dmy(bkExpires(b))} (${T("ອີກ","in")} ${dl} ${T("ມື້)","days)")}`}`,
    body:`<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:18px" class="bk-detail">
      <div class="bk-photo" style="width:100%;height:auto;aspect-ratio:3/4">${b.photo?`<img src="${b.photo}" alt="${T("ຮູບຫຼັກຖານ","Proof photo")} ${esc(b.name)}">`:bottleArt(b.level,"d"+b.id)}</div>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${b.photo?"":`<div class="alert warn">${icon("i-camera","sm")}<span>${T("ຂວດນີ້ຍັງບໍ່ມີຮູບຫຼັກຖານ — ກົດ “ເພີ່ມຮູບ” ດ້ານລຸ່ມ","This bottle has no proof photo — tap “Add photo” below")}</span></div>`}
        <div><label class="label" for="wdR">${T("ເບີກຄັ້ງນີ້ — ເຫຼືອຫຼັງເບີກ","This withdrawal — level after")}</label><input type="range" name="lv" min="0" max="${b.level}" step="5" value="${start}" style="width:100%;accent-color:var(--gold-500)" id="wdR"><div class="help" id="wdO">${T("ເຫຼືອ","Level")} ${start}%${start===0?(" · "+T("ດື່ມໝົດ/ຮັບຄືນ","finished / returned")):""}</div></div>
        <div class="small muted">${T("ຝາກໂດຍ","Kept by")} ${esc(b.by)} · ${dmy(b.kept)}${b.note?` · ${esc(b.note)}`:""}</div>
        <div><span class="label">${T("ປະຫວັດ","History")}</span><div class="small" style="display:flex;flex-direction:column;gap:4px">${(b.hist.length?b.hist:[{t:b.kept,by:b.by,text:T("ຮັບຝາກ","Kept")}]).map(h=>`<div><span class="muted">${dmy(h.t)} ${hhmm(h.t)} · ${esc(h.by)}</span> — ${esc(h.text)}</div>`).join("")}</div></div>
      </div></div>`,
    actions:[{label:b.photo?T("ປ່ຽນຮູບ","Change photo"):T("ເພີ່ມຮູບ","Add photo"),value:"photo",icon:"i-camera"},{label:T("ຕໍ່ອາຍຸ +30 ມື້","Extend +30 days"),value:"renew"},{label:T("ບັນທຶກການເບີກ","Save withdrawal"),value:"withdraw",cls:"btn-gold"}],
    mount(el){ const r=$("#wdR",el); r.addEventListener("input",()=>$("#wdO",el).textContent=`${T("ເຫຼືອ","Level")} ${r.value}%${r.value==0?(" · "+T("ດື່ມໝົດ/ຮັບຄືນ","finished / returned")):""}`); }});
  if(r.value==="renew"){ b.days+=30; b.hist.push({t:Date.now(),by:state.user.name,text:T("ຕໍ່ອາຍຸ +30 ມື້","Extend +30 days")}); log("bottle",`${T("ຕໍ່ອາຍຸຂວດ","Extended bottle")} ${b.item} · ${b.name} +30 ${T("ມື້","days")}`); toast(T("ຕໍ່ອາຍຸແລ້ວ","Extended"),"i-check"); }
  if(r.value==="withdraw"){ const lv=+r.data.lv; b.hist.push({t:Date.now(),by:state.user.name,text:`${T("ເບີກ","Withdrew")} ${b.level}% → ${lv}%`}); log("bottle",`${T("ເບີກ","Withdrew")} ${b.item} · ${b.name} ${b.level}% → ${lv}%`);
    if(lv<=0){ bottles.splice(bottles.indexOf(b),1); toast(`${b.name} ${T("ຮັບຂວດຄືນ/ດື່ມໝົດແລ້ວ","bottle returned / finished")}`,"i-check"); } else { b.level=lv; toast(`${T("ບັນທຶກການເບີກ · ເຫຼືອ","Withdrawal saved · level")} ${lv}%`,"i-check"); } }
  if(r.value==="photo"){
    if(navigator.mediaDevices?.getUserMedia){ const p=await takePhoto(); if(p){ b.photo=p; b.hist.push({t:Date.now(),by:state.user.name,text:T("ອັບເດດຮູບຫຼັກຖານ","Proof photo updated")}); log("bottle",`${T("ອັບເດດຮູບ","Updated photo")} ${b.item} · ${b.name}`); } else state.bkDraft.target=b.id; }
    else { state.bkDraft.target=b.id; $("#bkFile").click(); }
  }
  save(); renderBottles();
}


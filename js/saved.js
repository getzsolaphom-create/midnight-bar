"use strict";
/* ==================================================================
   ບິນທີ່ບັນທຶກ · SAVED BILLS
   ຮ້ານຍັງບໍ່ມີເຄື່ອງພິມ — ບິນທຸກໃບຈຶ່ງຖືກບັນທຶກໄວ້ໃນເຄື່ອງນີ້ແທນການພິມ
   ເກັບແຍກ key ຈາກ cfg ເພື່ອບໍ່ໃຫ້ຂໍ້ມູນຕັ້ງຄ່າໜັກເກີນ
   ================================================================== */
const SKEY="midnight-bar-pos-saved-v1";
const SAVED_MAX=600;
let savedBills=[];
function loadSaved(){
  try{ const raw=localStorage.getItem(SKEY); savedBills=raw?JSON.parse(raw):[]; }catch(e){ savedBills=[]; }
  if(!Array.isArray(savedBills)) savedBills=[];
}
function saveSaved(){
  try{ localStorage.setItem(SKEY,JSON.stringify(savedBills)); return true; }
  catch(e){
    // ພື້ນທີ່ເຕັມ: ຕັດບິນເກົ່າສຸດອອກແລ້ວລອງອີກ
    while(savedBills.length>40){
      savedBills.length=Math.floor(savedBills.length*0.8);
      try{ localStorage.setItem(SKEY,JSON.stringify(savedBills)); return true; }catch(e2){}
    }
    toast(T("ພື້ນທີ່ເກັບໃນບຣາວເຊີເຕັມ — ບັນທຶກບິນບໍ່ສຳເລັດ","Browser storage is full — the bill was not saved"),"i-alert",true);
    return false;
  }
}
loadSaved();

/* ---------- ສ້າງຂໍ້ມູນບິນ 1 ໃບ ---------- */
function billSnapshot(b,{part=null,pay=null,kind="saved"}={}){
  const t=totals(b), tb=tableOf(b.table);
  let lines=liveLines(b), amount=t.total, label="";
  if(b.split&&part!=null){
    const p=b.split.parts[part];
    if(b.split.mode==="item") lines=lines.filter(l=>p.items[l.id]).map(l=>({...l,qty:p.items[l.id]}));
    amount=partAmounts(b)[part]; label=p.label;
  }
  return {
    id:uid("sb"), no:b.no, label, kind,
    table:tb.name, zone:zoneName(tb.zone), guests:b.guests, waiter:b.waiter,
    by:state.user?.name||"", at:Date.now(), opened:b.opened,
    items:lines.map(l=>({name:l.name,qty:l.qty,unit:l.unit,amt:l.unit*l.qty})),
    sub:t.sub, hhSave:t.hhSave, disc:t.disc, svc:t.svc, svcPct:cfg.shop.svcPct, total:t.total,
    amount, paid:kind==="paid",
    pay:pay||null,
    shop:{name:cfg.shop.name,address:cfg.shop.address,phone:cfg.shop.phone,footer:cfg.shop.footer},
    receipt:receiptHTML(b,{part,payLines:pay?.lines||"",qr:b.payBy==="transfer"&&kind!=="paid"}),
  };
}
function pushSaved(rec){
  savedBills.unshift(rec);
  if(savedBills.length>SAVED_MAX) savedBills.length=SAVED_MAX;
  saveSaved();
  return rec;
}
/* ບັນທຶກບິນ (ແທນການພິມ) — ຖ້າບິນໃບນີ້ບັນທຶກແລ້ວຍັງບໍ່ໄດ້ຊຳລະ ຈະທັບໃບເກົ່າ */
function saveBillNow(b,opt={}){
  const rec=billSnapshot(b,opt);
  if(rec.kind!=="paid"){
    const i=savedBills.findIndex(x=>x.no===b.no&&x.label===rec.label&&x.kind!=="paid");
    if(i>=0){ rec.id=savedBills[i].id; savedBills.splice(i,1); }
  }
  return pushSaved(rec);
}

/* ---------- ບິນເປັນຂໍ້ຄວາມ (ສຳລັບສົ່ງໃຫ້ລູກຄ້າທາງ WhatsApp / Messenger) ---------- */
function savedText(r){
  const W=32, line="-".repeat(W);
  const row=(a,b2)=>{ a=String(a); b2=String(b2); const sp=Math.max(1,W-a.length-b2.length); return a+" ".repeat(sp)+b2; };
  const L=[];
  L.push(r.shop.name.toUpperCase());
  if(r.shop.address) L.push(r.shop.address);
  if(r.shop.phone) L.push(r.shop.phone);
  L.push(line);
  L.push(row(`${T("ບິນ","Bill")} #${r.no}${r.label?"-"+r.label:""}`,`${T("ໂຕະ","Table")} ${r.table}`));
  L.push(row(`${dmy(r.at)} ${hhmm(r.at)}`,r.by));
  L.push(line);
  r.items.forEach(it=>L.push(row(`${it.qty}x ${it.name}`,fmt(it.amt))));
  L.push(line);
  L.push(row("Subtotal",fmt(r.sub)));
  if(r.hhSave) L.push(row("(Happy hour",`-${fmt(r.hhSave)})`));
  if(r.disc) L.push(row("Discount",`-${fmt(r.disc)}`));
  if(r.svc) L.push(row(`Service ${r.svcPct}%`,fmt(r.svc)));
  L.push(row("TOTAL",`${fmt(r.total)} K`));
  if(r.label) L.push(row(`${T("ບິນຍ່ອຍ","Sub-bill")} ${r.label}`,`${fmt(r.amount)} K`));
  if(r.pay?.method) L.push(row(r.pay.method,`${fmt(r.amount)} K`));
  if(r.pay?.change) L.push(row(T("ເງິນທອນ","Change"),fmt(r.pay.change)));
  L.push(line);
  if(r.shop.footer) L.push(r.shop.footer);
  return L.join("\n");
}
function savedDocHTML(r){
  return `<!doctype html><html lang="lo"><head><meta charset="utf-8"><title>Bill ${esc(r.no)}${r.label?"-"+esc(r.label):""} · ${esc(r.shop.name)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;padding:24px;background:#EDE7DC;font:400 14px/1.5 "Noto Sans Lao",sans-serif;display:flex;justify-content:center}
.receipt{width:80mm;box-sizing:border-box;padding:16px 18px;background:#FBF7EF;color:#2C1F17;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.receipt img{display:block;width:54px;margin:0 auto 8px}
.rh{text-align:center;font-weight:700;font-size:17px;letter-spacing:.06em}
.rs{text-align:center;font-size:11px;color:#6B5747}
hr{border:0;border-top:1px dashed #BFAE97;margin:8px 0}
.rr{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;padding:1px 0}
.rr.big{font-weight:700;font-size:15px}
.rr span:last-child{font-family:"JetBrains Mono",monospace}
.thanks{text-align:center;font-size:11px;color:#6B5747;margin-top:6px}
.ordno{text-align:center}.ordno .ol{font-size:11px;color:#6B5747}.ordno .ov{font:500 22px "JetBrains Mono",monospace}
.grp{font-weight:700;margin-top:6px;border-bottom:1px solid #BFAE97}
@media print{body{background:#fff;padding:0}.receipt{box-shadow:none;width:auto;padding:0}}
</style></head><body><div class="receipt">${r.receipt}</div></body></html>`;
}
function downloadFile(name,text,type="text/plain;charset=utf-8"){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name;
  document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

/* ==================================================================
   ບັນທຶກບິນຂອງກະລົງເຄື່ອງ (ຕອນປິດກະ)
   ໄຟລ໌ດຽວ: ໃບສະຫຼຸບປິດກະ + ບິນທຸກໃບຂອງກະນີ້ — ເປີດອ່ານ ແລະ ພິມໄດ້ ບໍ່ຕ້ອງມີເນັດ
   ເກັບໄວ້ເປັນຫຼັກຖານຂອງກະ ເຖິງບຣາວເຊີຖືກລ້າງ ຫຼື ປ່ຽນເຄື່ອງ ກໍຍັງມີໄຟລ໌
   ================================================================== */
function shiftSavedBills(){
  const from = state.shift ? state.shift.at : dayStart(Date.now());
  const list = savedBills.filter(x=>x.at>=from).slice().sort((a,b)=>a.at-b.at);
  /* ບິນໃບດຽວອາດມີ 2 ລາຍການ (ຮ່າງ + ຊຳລະແລ້ວ) — ເອົາສະເພາະໃບທີ່ຊຳລະແລ້ວ */
  const paid = new Set(list.filter(x=>x.paid).map(x=>x.no+"|"+x.label));
  return list.filter(x=>x.paid||!paid.has(x.no+"|"+x.label));
}
function shiftFileStamp(){
  const d=new Date(state.closeInfo?.at||Date.now());
  const p=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
/* ໂລໂກ້ເປັນຮູບຝັງ (~130 KB) ຖ້າປ່ອຍໃຫ້ຊ້ຳທຸກໃບ ໄຟລ໌ຄືນໜຶ່ງ 80 ໃບຈະໃຫຍ່ເປັນ 10 MB
   ຈຶ່ງເກັບໄວ້ບ່ອນດຽວໃນ CSS ແລ້ວທຸກໃບອ້າງເຖິງອັນນັ້ນ */
const BLANK_PX="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
function dedupeLogo(html){
  const lg=cfg.shop&&cfg.shop.logo;
  if(!lg||lg.length<2000) return {html,css:""};
  return {html:html.split(lg).join(BLANK_PX),
          css:`.receipt img{content:url("${lg}")}`};
}
function shiftDocHTML(){
  const list=shiftSavedBills(), ci=state.closeInfo;
  const paidN=list.filter(x=>x.paid).length, sum=list.filter(x=>x.paid).reduce((a,x)=>a+x.amount,0);
  const head=`${T("ກະວັນທີ","Shift of")} ${dmy(ci?.at||Date.now())}${ci?` · ${T("ປິດກະ","closed")} ${hhmm(ci.at)} · ${esc(ci.by)}`:` · ${T("ຮ່າງ ຍັງບໍ່ປິດກະ","draft, shift still open")}`}`;
  const body=dedupeLogo(`<div class="wrap">
<div class="receipt report">${shiftReportHTML()}</div>
${list.map(r=>`<div class="receipt${r.paid?"":" unpaid"}">${r.receipt}</div>`).join("")}
</div>`);
  return `<!doctype html><html lang="lo"><head><meta charset="utf-8">
<title>${esc(cfg.shop.name)} · ${T("ບິນກະ","Shift bills")} ${dmy(ci?.at||Date.now())}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;padding:24px 16px;background:#EDE7DC;font:400 14px/1.5 "Noto Sans Lao",sans-serif;color:#2C1F17}
.hd{max-width:980px;margin:0 auto 18px;text-align:center}
.hd h1{margin:0;font-size:20px;letter-spacing:.06em}
.hd p{margin:4px 0 0;font-size:12.5px;color:#6B5747}
.wrap{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:flex-start;max-width:1200px;margin:0 auto}
.receipt{width:80mm;box-sizing:border-box;padding:16px 18px;background:#FBF7EF;box-shadow:0 10px 30px rgba(0,0,0,.14)}
.receipt img{display:block;width:54px;margin:0 auto 8px}
.rh{text-align:center;font-weight:700;font-size:17px;letter-spacing:.06em}
.rs{text-align:center;font-size:11px;color:#6B5747}
.rs.l{text-align:left;padding-left:14px}
hr{border:0;border-top:1px dashed #BFAE97;margin:8px 0}
.rr{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;padding:1px 0}
.rr.big{font-weight:700;font-size:15px}
.rr.sub{color:#6B5747}
.rr span:last-child{font-family:"JetBrains Mono",monospace}
.grp{font-weight:700;margin-top:8px;border-bottom:1px solid #BFAE97}
.sig{display:flex;justify-content:space-between;gap:16px;margin-top:22px;text-align:center;font-size:11px}
.sig span{flex:1;border-top:1px solid #8B7A66;padding-top:4px}
.thanks{text-align:center;font-size:11px;color:#6B5747;margin-top:6px}
.ordno{text-align:center}.ordno .ol{font-size:11px;color:#6B5747}.ordno .ov{font:500 22px "JetBrains Mono",monospace}
.qr-img{display:block;background:#fff;border-radius:8px;max-width:100%;height:auto;image-rendering:pixelated}
.bill-qr{text-align:center;margin-top:8px}
.unpaid{outline:2px solid #B4452F}
@media print{body{background:#fff;padding:0}.hd{display:none}.wrap{display:block}
  .receipt{box-shadow:none;outline:0;width:auto;padding:0;break-after:page}}
${body.css}
</style></head><body>
<div class="hd"><h1>${esc(cfg.shop.name).toUpperCase()}</h1>
<p>${head}</p>
<p>${T("ບິນ","Bills")} ${list.length} ${T("ໃບ","")} · ${T("ຊຳລະແລ້ວ","paid")} ${paidN} ${T("ໃບ","")} · ${T("ລວມ","total")} ${fmt(sum)} ₭</p></div>
${body.html}</body></html>`;
}
function shiftCsv(){
  const list=shiftSavedBills();
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const head=["bill","part","date","time","table","guests","waiter","cashier","status","method","items","subtotal","discount","service","total","amount"];
  const rows=list.map(r=>[r.no,r.label,dmy(r.at),hhmm(r.at),r.table,r.guests,r.waiter,r.by,r.paid?"paid":"unpaid",r.pay?.method||"",
    r.items.map(i=>`${i.qty}x ${i.name}`).join(" | "),r.sub,r.disc,r.svc,r.total,r.amount].map(q).join(","));
  return "﻿"+[head.join(","),...rows].join("\n");
}
/* ບັນທຶກລົງເຄື່ອງ: HTML ກ່ອນ ແລ້ວ CSV ຕາມມາ (ບາງບຣາວເຊີບລັອກການດາວໂຫຼດ 2 ໄຟລ໌ພ້ອມກັນ ຈຶ່ງຫ່າງກັນ) */
function saveShiftToDevice(){
  const list=shiftSavedBills();
  if(!list.length){ toast(T("ກະນີ້ຍັງບໍ່ມີບິນໃຫ້ບັນທຶກ","No bills in this shift to save"),"i-alert",true); return false; }
  const stamp=shiftFileStamp();
  downloadFile(`midnight-bar-shift-${stamp}.html`,shiftDocHTML(),"text/html;charset=utf-8");
  setTimeout(()=>downloadFile(`midnight-bar-shift-${stamp}.csv`,shiftCsv(),"text/csv;charset=utf-8"),900);
  log("shift",`${T("ບັນທຶກບິນກະລົງເຄື່ອງ","Saved shift bills to the device")} · ${list.length} ${T("ໃບ","bills")}`);
  toast(`${T("ບັນທຶກລົງເຄື່ອງແລ້ວ","Saved to this device")} · ${list.length} ${T("ໃບ","bills")} (HTML + CSV)`,"i-archive");
  return true;
}
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); toast(T("ສຳເນົາບິນແລ້ວ — ເອົາໄປວາງສົ່ງໃຫ້ລູກຄ້າໄດ້","Bill copied — paste it to send to the customer"),"i-check"); }
  catch(e){
    const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.append(ta); ta.select();
    try{ document.execCommand("copy"); toast(T("ສຳເນົາບິນແລ້ວ","Bill copied"),"i-check"); }
    catch(e2){ toast(T("ສຳເນົາບໍ່ໄດ້ — ໃຫ້ດາວໂຫຼດແທນ","Copy failed — download it instead"),"i-alert",true); }
    ta.remove();
  }
}

/* ---------- ໜ້າບິນທີ່ບັນທຶກ ---------- */
const SAVED_RANGE=()=>[{k:"today",t:T("ມື້ນີ້","Today")},{k:"7",t:T("7 ມື້","7 days")},{k:"30",t:T("30 ມື້","30 days")},{k:"all",t:T("ທັງໝົດ","All")}];
const dayStart=t=>{ const d=new Date(t); d.setHours(0,0,0,0); return d.getTime(); };
function savedFiltered(){
  const q=state.sbQ.trim().toLowerCase(), r=state.sbRange;
  const from=r==="all"?0:r==="today"?dayStart(Date.now()):dayStart(Date.now())-(+r-1)*DAY;
  return savedBills.filter(x=>{
    if(x.at<from) return false;
    if(state.sbOnly==="paid"&&!x.paid) return false;
    if(state.sbOnly==="open"&&x.paid) return false;
    if(!q) return true;
    return (`${x.no} ${x.label} ${x.table} ${x.waiter} ${x.by} ${dmy(x.at)} ${x.items.map(i=>i.name).join(" ")}`).toLowerCase().includes(q);
  });
}
function renderSaved(){
  const list=savedFiltered();
  const sum=list.reduce((s,x)=>s+x.amount,0);
  $("#sbRange").innerHTML=SAVED_RANGE().map(r=>`<button class="opt" data-sbr="${r.k}" aria-pressed="${state.sbRange===r.k}">${r.t}</button>`).join("");
  $("#sbOnly").innerHTML=[{k:"all",t:T("ທຸກສະຖານະ","Any status")},{k:"paid",t:T("ຊຳລະແລ້ວ","Paid")},{k:"open",t:T("ຍັງບໍ່ຊຳລະ","Unpaid")}]
    .map(o=>`<button class="opt" data-sbo="${o.k}" aria-pressed="${state.sbOnly===o.k}">${o.t}</button>`).join("");
  $("#sbEyebrow").textContent=`${T("ບັນທຶກໄວ້ໃນເຄື່ອງນີ້","Stored on this device")} · ${savedBills.length} ${T("ໃບ","bills")}`;
  $("#sbStat").innerHTML=`${icon("i-receipt","sm")}<span>${list.length} ${T("ໃບ","bills")} · ${kip(sum)}</span>`;
  $("#sbList").innerHTML=list.length?list.map(x=>`
    <button class="sb-card" data-sb="${x.id}">
      <span class="sb-top"><span class="sb-no">#${esc(x.no)}${x.label?"-"+esc(x.label):""}</span><span class="sb-tag ${x.paid?"paid":"open"}">${x.paid?T("ຊຳລະແລ້ວ","Paid"):T("ບັນທຶກໄວ້","Saved")}</span></span>
      <span class="sb-tbl">${T("ໂຕະ","Table")} ${esc(x.table)}</span>
      <span class="sb-amt num">${fmt(x.amount)} <small>₭</small></span>
      <span class="sb-meta">${dmy(x.at)} ${hhmm(x.at)} · ${esc(x.by||x.waiter)} · ${x.items.length} ${T("ລາຍການ","items")}${x.pay?.method?" · "+esc(x.pay.method):""}</span>
    </button>`).join(""):`<p class="empty">${savedBills.length?T("ບໍ່ພົບບິນທີ່ຊອກຫາ","No bills match your search"):T("ຍັງບໍ່ມີບິນທີ່ບັນທຶກໄວ້ — ບິນຈະເຂົ້າມານີ້ເມື່ອກົດ “ບັນທຶກບິນ” ຫຼື ຮັບຊຳລະເງິນ","No saved bills yet — bills appear here when you tap “Save bill” or take a payment")}</p>`;
  $("#sbCsv").disabled=!list.length;
}
function openSaved(id){
  const r=savedBills.find(x=>x.id===id); if(!r) return;
  const canDel=can("settings")==="yes";
  openDyn({cls:"w-md",eyebrow:`${dmy(r.at)} ${hhmm(r.at)} · ${esc(r.by||r.waiter)}`,
    title:`${T("ບິນ","Bill")} #${esc(r.no)}${r.label?"-"+esc(r.label):""}`,
    sub:`${T("ໂຕະ","Table")} ${esc(r.table)}${r.zone?" · "+esc(r.zone):""} · ${r.guests} ${T("ຄົນ","guests")} · ${kip(r.amount)}${r.pay?.method?" · "+esc(r.pay.method):""}`,
    body:`<div class="sb-view"><div class="receipt${+cfg.printer.paper===58?" p58":""}">${r.receipt}</div></div>
      <div class="sb-tools">
        <button type="button" class="btn" data-act="copy">${icon("i-send")}${T("ສຳເນົາເປັນຂໍ້ຄວາມ","Copy as text")}</button>
        <button type="button" class="btn" data-act="file">${icon("i-receipt")}${T("ດາວໂຫຼດບິນ","Download bill")}</button>
        <button type="button" class="btn" data-act="print">${icon("i-print")}${T("ພິມ","Print")}</button>
        ${canDel?`<button type="button" class="btn btn-danger" data-act="del">${icon("i-trash")}${T("ລຶບ","Delete")}</button>`:""}
      </div>`,
    actions:[{label:T("ປິດ","Close"),value:"cancel"}],
    mount(el,close){
      el.addEventListener("click",async e=>{
        const a=e.target.closest("[data-act]")?.dataset.act; if(!a) return;
        if(a==="copy") copyText(savedText(r));
        if(a==="file") downloadFile(`bill-${r.no}${r.label?"-"+r.label:""}-${dmy(r.at).replace(/\//g,"-")}.html`,savedDocHTML(r),"text/html;charset=utf-8");
        if(a==="print") printHTML(r.receipt);
        if(a==="del"){
          close("cancel");
          if(await confirmBox(T("ລຶບບິນນີ້","Delete this bill"),`${T("ບິນ","Bill")} #${esc(r.no)} · ${kip(r.amount)} ${T("ຈະຫາຍໄປຈາກເຄື່ອງນີ້ຖາວອນ","will be permanently removed from this device")}`,T("ລຶບ","Delete"),true)){
            savedBills=savedBills.filter(x=>x.id!==r.id); saveSaved();
            log("bill",`${T("ລຶບບິນທີ່ບັນທຶກ","Deleted saved bill")} #${r.no}${r.label?"-"+r.label:""}`);
            renderSaved(); toast(T("ລຶບແລ້ວ","Deleted"),"i-trash");
          }
        }
      });
    }});
}
function savedCsv(){
  const list=savedFiltered();
  const esc2=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const head=["bill","part","date","time","table","guests","waiter","cashier","status","method","items","subtotal","discount","service","total","amount"];
  const rows=list.map(r=>[r.no,r.label,dmy(r.at),hhmm(r.at),r.table,r.guests,r.waiter,r.by,r.paid?"paid":"saved",r.pay?.method||"",
    r.items.map(i=>`${i.qty}x ${i.name}`).join(" | "),r.sub,r.disc,r.svc,r.total,r.amount].map(esc2).join(","));
  downloadFile(`midnight-bar-bills-${dmy(Date.now()).replace(/\//g,"-")}.csv`,"﻿"+[head.join(","),...rows].join("\n"),"text/csv;charset=utf-8");
  toast(`${T("ສົ່ງອອກ","Exported")} ${list.length} ${T("ໃບ","bills")} → CSV`,"i-send");
}
$("#sbList").addEventListener("click",e=>{ const b=e.target.closest("[data-sb]"); if(b) openSaved(b.dataset.sb); });
$("#sbRange").addEventListener("click",e=>{ const b=e.target.closest("[data-sbr]"); if(!b) return; state.sbRange=b.dataset.sbr; renderSaved(); });
$("#sbOnly").addEventListener("click",e=>{ const b=e.target.closest("[data-sbo]"); if(!b) return; state.sbOnly=b.dataset.sbo; renderSaved(); });
$("#sbSearch").addEventListener("input",e=>{ state.sbQ=e.target.value; renderSaved(); });
$("#sbCsv").onclick=savedCsv;

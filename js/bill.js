"use strict";
/* ===================== BILL + SPLIT ===================== */
const LETTERS="ABCDEFGHIJ";
const partSub=(b,p)=>liveLines(b).reduce((s,l)=>s+(p.items[l.id]||0)*l.unit,0);
function unassigned(b){ const m={}; liveLines(b).forEach(l=>{ const used=b.split.parts.reduce((s,p)=>s+(p.items[l.id]||0),0); if(l.qty-used>0) m[l.id]=l.qty-used; }); return m; }
function partAmounts(b){
  const t=totals(b), sp=b.split;
  const paidSum=sp.parts.reduce((s,p)=>s+(p.paid?p.paidAmt:0),0);
  const unpaid=sp.parts.map((p,i)=>p.paid?null:i).filter(i=>i!=null);
  const out=sp.parts.map(p=>p.paid?p.paidAmt:0);
  const remain=Math.max(0,t.total-paidSum);
  if(!unpaid.length) return out;
  if(sp.mode==="equal"){
    let per=Math.ceil(remain/unpaid.length/1000)*1000; if(per*(unpaid.length-1)>remain) per=Math.floor(remain/unpaid.length);
    unpaid.forEach((i,k)=>out[i]=k===unpaid.length-1?remain-per*(unpaid.length-1):per);
  }else{
    const k=t.sub?t.total/t.sub:0;
    unpaid.forEach(i=>out[i]=Math.round(partSub(b,sp.parts[i])*k));
    if(!Object.keys(unassigned(b)).length){ const last=unpaid[unpaid.length-1]; out[last]=remain-unpaid.slice(0,-1).reduce((s,i)=>s+out[i],0); }
  }
  return out;
}
const makeParts=(n,old=[])=>Array.from({length:n},(_,i)=>old[i]||{label:LETTERS[i],items:{},paid:false,paidAmt:0,method:""});
/* ===================== ORDERS · SLIPS · PRINT ===================== */
const ordNo=n=>String(n).padStart(4,"0");
const tblNo=id=>{ const nm=String(tableOf(id).name); const m=nm.match(/^\s*T?\s*(\d+)\s*$/i); return m?String(+m[1]):nm; };
const ordLabel=(b,seq)=>`${tblNo(b.table)}-${ordNo(seq)}`;
const billOrders=b=>(b.orders||[]).filter(o=>b.lines.some(l=>l.ord===o.seq&&!l.void));
const printNow=()=>window.print();
function printHTML(html,cls=""){ $("#print-area").innerHTML=`<div class="receipt ${cls} ${+cfg.printer.paper===58?"p58":""}">${html}</div>`; printNow(); }
function ordBlockHTML(b){
  const os=billOrders(b);
  return `<div class="ordno"><div class="ol">${T("ໂຕະ-ເລກອໍເດີ້","Table-Order no.")}</div><div class="ov ${os.length>1?"multi":""}">${os.length?os.map(o=>ordLabel(b,o.seq)).join(" · "):"—"}</div></div>`;
}
function slipHTML(b,o){
  const ls=b.lines.filter(l=>l.ord===o.seq&&!l.void);
  const pcs=ls.reduce((s,l)=>s+l.qty,0), amt=ls.reduce((s,l)=>s+l.unit*l.qty,0);
  return `<img src="${cfg.shop.logo}" alt=""><div class="rh">${esc(cfg.shop.name).toUpperCase()}</div><div class="rs">${T("ບິນນ້ອຍ · ອໍເດີ","Order slip")}</div><hr>
  <div class="ordno"><div class="ol">${T("ໂຕະ-ເລກອໍເດີ້","Table-Order no.")}</div><div class="ov">${ordLabel(b,o.seq)}</div></div><hr>
  <div class="rr"><span>${T("ໂຕະ","Table")}</span><span>${esc(tableOf(b.table).name)}</span></div>
  <div class="rr"><span>${T("ເວລາ","Time")}</span><span>${dmy(o.at)} ${hhmm(o.at)}</span></div>
  <div class="rr"><span>${T("ພະນັກງານ","Staff")}</span><span>${esc(o.by||"")}</span></div><hr>
  ${ls.map(l=>{ const sub=prod(l.pid)?.sub; return `<div class="rr"><span>${l.qty}x ${esc(l.name)}</span><span>${fmt(l.unit*l.qty)}</span></div>${sub&&sub!==l.name?`<div class="rs l">${esc(sub)}</div>`:""}${l.mods.length?`<div class="rs l">${l.mods.map(esc).join(" · ")}</div>`:""}`; }).join("")}
  <hr><div class="rr"><span>${T("ຈຳນວນເຄື່ອງ","Items")}</span><span>${pcs}</span></div>
  <div class="rr big"><span>${T("ລວມ","Total")}</span><span>${fmt(amt)} ₭</span></div>`;
}
async function showSlip(b,o){
  const r=await openDyn({cls:"w-sm",eyebrow:T("ບິນນ້ອຍ · ຫຼັງຮ້ານ","Order slip · back of house"),title:`${T("ອໍເດີ","Order")} ${ordLabel(b,o.seq)}`,
    body:`<div class="receipt-wrap" style="position:static"><div class="receipt ${+cfg.printer.paper===58?"p58":""}" id="slipPreview">${slipHTML(b,o)}</div></div>`,
    actions:[{label:T("ປິດ","Close"),value:"cancel"},{label:T("ພິມບິນນ້ອຍ","Print slip"),value:"print",cls:"btn-gold",icon:"i-print",id:"slipPrintBtn"}]});
  if(r.value==="print"){ printHTML(slipHTML(b,o)); log("order",`${T("ພິມບິນນ້ອຍ","Printed order slip")} ${ordLabel(b,o.seq)}`); toast(`${T("ພິມບິນນ້ອຍ","Order slip printed")} ${ordLabel(b,o.seq)}`,"i-print"); }
}
function renderSlips(b){
  const os=billOrders(b);
  $("#orderSlips").innerHTML=os.length?`<p class="label" style="margin:22px 0 8px">${T("ບິນນ້ອຍ (ແຍກຕາມອໍເດີ)","Order slips (one per order)")}</p><div class="slip-list">${os.map(o=>{
    const ls=b.lines.filter(l=>l.ord===o.seq&&!l.void), n=ls.reduce((s,l)=>s+l.qty,0), amt=ls.reduce((s,l)=>s+l.unit*l.qty,0);
    return `<div class="slip-row"><b class="num">${ordLabel(b,o.seq)}</b><span class="muted small">${hhmm(o.at)} · ${n} ${T("ເຄື່ອງ","pcs")} · ${kip(amt)}</span><button class="btn btn-sm" data-slip="${o.seq}">${icon("i-print","sm")}${T("ເບິ່ງ / ພິມຄືນ","View / reprint")}</button></div>`; }).join("")}</div>`:"";
}
$("#orderSlips").addEventListener("click",e=>{ const x=e.target.closest("[data-slip]"); if(!x) return; const b=bill(), o=(b.orders||[]).find(v=>v.seq==x.dataset.slip); if(o) showSlip(b,o); });

/* ===================== SHIFT REPORT ===================== */
function shiftReportHTML(){
  const s=summary(), ci=state.closeInfo, now=Date.now(), ex=s.expected, c={LAK:cntOf("LAK",s),THB:cntOf("THB",s),USD:cntOf("USD",s)};
  const R=(a,b,cls="")=>`<div class="rr ${cls}"><span>${a}</span><span>${b}</span></div>`;
  const other=s.net-s.gross+s.disc;
  const transfers=Object.entries(s.methods).filter(([k])=>!k.startsWith("cash")).sort((a,b)=>b[1]-a[1]);
  const tSum=transfers.reduce((a,[,v])=>a+v,0), diff=c.LAK-ex.LAK;
  const groups={};
  Object.entries(s.items).forEach(([k,[q,amt]])=>{ const pr=k.startsWith("n:")?null:prod(k), cat=pr?catOf(pr.cat):{id:"x",th:T("ອື່ນໆ","Other")}; (groups[cat.id]=groups[cat.id]||{th:cat.th,rows:[]}).rows.push([pr?pr.name:k.replace(/^n:/,""),Math.round(q),Math.round(amt)]); });
  const gOrder=[...cfg.cats.map(v=>v.id),"x"].filter(id=>groups[id]);
  const pieces=Object.values(s.items).reduce((a,v)=>a+Math.round(v[0]),0);
  return `<img src="${cfg.shop.logo}" alt=""><div class="rh">${esc(cfg.shop.name).toUpperCase()}</div>
  <div class="rs"><b>${T("ໃບສະຫຼຸບປິດກະ","Shift close summary")}</b>${ci?"":` · ${T("ຮ່າງ (ຍັງບໍ່ປິດກະ)","draft (shift still open)")}`}</div><hr>
  ${R(`${T("ກະ","Shift")} #0001`,dmy(now))}
  ${R(T("ເປີດກະ","Opened"),state.shift?`${hhmm(state.shift.at)} · ${esc(state.shift.by)}`:"—")}
  ${R(T("ປິດກະ","Closed"),ci?`${hhmm(ci.at)} · ${esc(ci.by)}`:"—")}<hr>
  <div class="grp">${T("ຍອດຂາຍ","Sales")}</div>
  ${R(T("ຈຳນວນບິນ","Bills"),s.bills)}
  ${R(T("ຍອດຂາຍກ່ອນຫຼຸດ","Gross sales"),fmt(s.gross))}
  ${R(T("ສ່ວນຫຼຸດ","Discounts"),"-"+fmt(s.disc))}
  ${other?R(T("ຄ່າບໍລິການ / ປັດເສດ","Service / rounding"),(other>0?"+":"")+fmt(other)):""}
  ${R(T("ຍອດຂາຍສຸດທິ","Net sales"),fmt(s.net)+" ₭","big")}<hr>
  <div class="grp">${T("ແຍກຕາມວິທີຊຳລະ","By payment method")}</div>
  ${R(T("ເງິນສົດ · ກີບ","Cash · kip"),fmt(s.methods["cash-LAK"]))}
  ${R(`${T("ເງິນສົດ · ບາດ","Cash · baht")} (฿${fmt(s.cashIn.THB)})`,fmt(s.methods["cash-THB"]))}
  ${R(`${T("ເງິນສົດ · ໂດລາ","Cash · dollar")} ($${fmt(s.cashIn.USD)})`,fmt(s.methods["cash-USD"]))}
  ${R(T("ລວມເງິນສົດ","Total cash"),fmt(s.cash),"sub")}
  ${transfers.map(([k,v])=>R(`${T("ໂອນ","Transfer")} · ${esc(k)}`,fmt(v))).join("")}
  ${R(T("ລວມໂອນ","Total transfer"),fmt(tSum),"sub")}<hr>
  <div class="grp">${T("ເງິນສົດກີບໃນລິ້ນຊັກ","Kip cash in drawer")}</div>
  ${R(T("ຂາຍເງິນສົດກີບ","Kip cash sales"),fmt(s.cashIn.LAK))}
  ${R(T("ຄວນມີ","Expected"),fmt(ex.LAK))}
  ${R(T("ນັບໄດ້","Counted"),fmt(c.LAK))}
  ${R(T("ສ່ວນຕ່າງ","Difference"),(diff>0?"+":"")+fmt(diff))}
  ${R(T("ເງິນສົດຂາຍກີບທີ່ນຳສົ່ງ","Kip cash to hand over"),fmt(c.LAK)+" ₭","big")}
  ${R(`${T("ບາດ ຄວນມີ/ນັບໄດ້","Baht expected/counted")}`,`฿${fmt(ex.THB)} / ฿${fmt(c.THB)}`)}
  ${R(`${T("ໂດລາ ຄວນມີ/ນັບໄດ້","Dollar expected/counted")}`,`$${fmt(ex.USD)} / $${fmt(c.USD)}`)}
  ${ci&&ci.reason?`<div class="rs l">${T("ເຫດຜົນ:","Reason:")} ${esc(ci.reason)}</div>`:""}<hr>
  <div class="grp">${T("ສິນຄ້າທີ່ຂາຍທັງໝົດ ວັນທີ","All items sold on")} ${dmy(now)}</div>
  ${gOrder.map(id=>{ const g=groups[id]; g.rows.sort((a,b)=>b[2]-a[2]); return `<div class="rs l"><b>${esc(g.th)}</b></div>`+g.rows.map(([n,q,a])=>R(`${q}x ${esc(n)}`,fmt(a))).join(""); }).join("")}
  <hr>${R(`${T("ລວມທຸກລາຍການ","All items")} (${pieces} ${T("ຊິ້ນ","pcs")})`,fmt(s.gross)+" ₭","big")}<hr>
  ${R(T("ຍົກເລີກລາຍການ","Voids"),`${s.voids} ${T("ຄັ້ງ","times")}`)}
  ${R(T("ບິນຄ້າງ","Open bills"),state.bills.filter(b=>b.status!=="paid").length)}
  <div class="sig"><span>${T("ຜູ້ປິດກະ","Closed by")}</span><span>${T("ເຈົ້າຂອງຮ້ານ","Owner")}</span></div>`;
}
async function showReport(){
  /* ວົນຮອບ: ກົດ "ບັນທຶກລົງເຄື່ອງ" ແລ້ວກ່ອງເປີດຄືນ ຈະໄດ້ພິມຕໍ່ໄດ້ໂດຍບໍ່ຕ້ອງເປີດໃໝ່ເອງ */
  for(;;){
    const n=(typeof shiftSavedBills==="function"?shiftSavedBills().length:0);
    const r=await openDyn({cls:"w-sm",eyebrow:state.shiftClosed?T("ປິດກະແລ້ວ","Shift closed"):T("ຮ່າງ · ຍັງບໍ່ປິດກະ","Draft · shift still open"),title:T("ໃບສະຫຼຸບປິດກະ","Shift close summary"),
      body:`<div class="receipt-wrap" style="position:static"><div class="receipt report ${+cfg.printer.paper===58?"p58":""}" id="reportPreview">${shiftReportHTML()}</div></div>`,
      actions:[{label:T("ປິດ","Close"),value:"cancel"},
               {label:`${T("ບັນທຶກບິນລົງເຄື່ອງ","Save bills to device")}${n?` (${n})`:""}`,value:"savefile",icon:"i-archive",id:"reportSaveBtn"},
               {label:T("ພິມລາຍງານ","Print report"),value:"print",cls:"btn-gold",icon:"i-print",id:"reportPrintBtn"}]});
    if(r.value==="savefile"){ saveShiftToDevice(); continue; }
    if(r.value==="print"){ printHTML(shiftReportHTML(),"report"); log("shift",`${T("ພິມໃບສະຫຼຸບປິດກະ","Printed shift summary")} #0001`); toast(`${T("ພິມໃບສະຫຼຸບປິດກະ","Shift summary printed")} → ${cfg.printer.receipt}`,"i-print"); }
    return;
  }
}
/* QR ໂອນເງິນໃນໃບບິນ — ສະແດງສະເພາະບິນທີ່ພະນັກງານເລືອກ "ລູກຄ້າໂອນ" ແລະຍັງບໍ່ທັນຊຳລະ; ບິນເງິນສົດບໍ່ມີ QR */
const qrBanks=()=>cfg.pay.transfer?cfg.pay.banks.filter(k=>k.on&&k.qr&&laoQrValid(k.qr)):[];
const qrBankOf=b=>{ const l=qrBanks(); return l.find(k=>k.id===b.payBank)||l[0]||null; };
function billQrHTML(b,part,pick){
  if(b.status==="paid") return "";
  const bk=(pick&&pick.qr&&laoQrValid(pick.qr))?pick:qrBankOf(b);
  if(!bk) return "";
  const due=(b.split&&part!=null)?partAmounts(b)[part]:totals(b).total;
  if(!(due>0)) return "";
  const svg=laoQrSvg(bk.qr,due,b.no,196);
  if(!svg) return "";
  return `<hr><div class="bill-qr" style="text-align:center">
    <div class="rs" style="font-weight:700">${T("ສະແກນເພື່ອໂອນ","Scan to pay")} · ${esc(bk.name)}</div>
    <div style="display:flex;justify-content:center;margin:6px 0">${svg}</div>
    <div class="rs">${T("ຍອດ","Amount")} ${fmt(due)} ₭ · ${T("ອ້າງອີງ","ref.")} #${b.no}</div></div>`;
}
function receiptHTML(b,{part=null,payLines="",qr=false}={}){
  const t=totals(b), tb=tableOf(b.table); let lines=liveLines(b), partNote="";
  if(b.split&&part!=null){
    const p=b.split.parts[part];
    if(b.split.mode==="item") lines=lines.filter(l=>p.items[l.id]).map(l=>({...l,qty:p.items[l.id]}));
    partNote=`<div class="rr big"><span>${T("ບິນຍ່ອຍ","Sub-bill")} ${p.label} (${part+1}/${b.split.n})</span><span>${fmt(partAmounts(b)[part])} ₭</span></div>`;
  }
  return `<img src="${cfg.shop.logo}" alt=""><div class="rh">${esc(cfg.shop.name).toUpperCase()}</div><div class="rs">${esc(cfg.shop.address)} · ${esc(cfg.shop.phone)}</div><hr>
  <div class="rr"><span>Bill #${b.no}${b.split&&part!=null?"-"+b.split.parts[part].label:""}</span><span>${esc(tb.name)}</span></div>
  <div class="rr"><span>${dmy(Date.now())} ${hhmm(Date.now())}</span><span>${esc(state.user?.name||"")}</span></div><hr>
  ${ordBlockHTML(b)}<hr>
  ${lines.map(l=>`<div class="rr"><span>${l.qty}x ${esc(l.name)}</span><span>${fmt(l.unit*l.qty)}</span></div>`).join("")||`<div class="rs">— ${T("ບໍ່ມີລາຍການ","no items")} —</div>`}
  <hr>
  <div class="rr"><span>Subtotal${b.split&&part!=null?(" ("+T("ທັງໂຕະ)","whole table)")):""}</span><span>${fmt(t.sub)}</span></div>
  ${t.hhSave?`<div class="rr"><span>(Happy hour saved</span><span>${fmt(t.hhSave)})</span></div>`:""}
  ${t.disc?`<div class="rr"><span>Discount</span><span>-${fmt(t.disc)}</span></div>`:""}
  ${t.svc?`<div class="rr"><span>Service ${cfg.shop.svcPct}%</span><span>${fmt(t.svc)}</span></div>`:""}
  <div class="rr ${partNote?"":"big"}"><span>TOTAL</span><span>${fmt(t.total)} ₭</span></div>
  ${partNote}${payLines}
  ${qr?billQrHTML(b,part,typeof qr==="object"?qr:null):""}
  <hr><div class="thanks">${esc(cfg.shop.footer)}</div>`;
}
function renderBill(){
  const b=bill(); const t=totals(b); const tb=tableOf(b.table);
  const open=state.bills.filter(x=>x.status!=="paid");
  $("#openCount").innerHTML=`${icon("i-receipt","sm")}<span>${T("ເປີດຢູ່","Open")} ${open.length} ${T("ບິນ","Bill")} · ${kip(open.reduce((s,x)=>s+totals(x).total,0))}</span>`;
  $("#billsList").innerHTML=open.sort((a,c)=>tableOf(a.table).name.localeCompare(tableOf(c.table).name,undefined,{numeric:true})).map(x=>{const xt=totals(x);return `
    <button class="bill-pick" data-bill="${x.no}" aria-current="${x.no===state.current}">
      <span class="tno">${esc(tableOf(x.table).name)}</span>
      <span class="bmeta">#${x.no} · ${x.guests} ${T("ຄົນ","guests")}${x.split?` · ${T("ແຍກ","split")} ${x.split.n}`:""}</span>
      <span class="bamt num">${fmt(xt.total)}</span>
      <span class="bmeta">${esc(x.waiter)} · ${minsSince(x.opened)}</span>
      <span class="bst">${x.status==="printed"?`<span style="color:var(--danger)">● ${cfg.printer.mode==="save"?T("ບັນທຶກແລ້ວ","Saved"):T("ພິມແລ້ວ","Printed")}</span>`:`<span style="color:var(--gold-ink)">● ${T("ເປີດ","Open")}</span>`}</span>
    </button>`;}).join("")||`<div class="empty">${T("ບໍ່ມີບິນຄ້າງ","No open bills")}</div>`;
  $("#billsList [aria-current=true]")?.scrollIntoView({block:"nearest",inline:"center"});
  $("#billEyebrow").textContent=`${T("ບິນ","Bill")} #${b.no} · ${T("ໂຕະ","Table")} ${tb.name}`;
  $("#bdTitle").textContent=`${T("ໂຕະ","Table")} ${tb.name}`;
  $("#bdMeta").textContent=`${T("ບິນ","Bill")} #${b.no} · ${zoneName(tb.zone)} · ${b.guests} ${T("ຄົນ · ພະນັກງານ","guests · server")} ${b.waiter} · ${T("ເປີດມາ","open for")} ${minsSince(b.opened)}`;
  $("#bdStatus").innerHTML=b.status==="paid"?`<span class="chip pill-ok"><span class="dot"></span>${T("ຊຳລະແລ້ວ","Paid")}</span>`:b.status==="printed"?`<span class="chip pill-danger"><span class="dot"></span>${cfg.printer.mode==="save"?T("ບັນທຶກບິນແລ້ວ","Bill saved"):T("ພິມບິນແລ້ວ","Bill printed")}</span>`:`<span class="chip pill-warn"><span class="dot"></span>${T("ເປີດຢູ່","Open")}</span>`;
  const ce=can("editPrice"),cv=can("void");
  $("#bdRows").innerHTML=b.lines.length?b.lines.map(l=>{ return `
    <tr class="${l.void?"void":""}">
      <td class="q">${l.qty}×</td>
      <td><div class="nm" style="font-weight:500">${esc(l.name)}</div>${l.mods.length?`<div class="muted" style="font-size:12.5px">${l.mods.map(esc).join(" · ")}</div>`:""}${l.void?`<div style="font-size:12px;color:var(--danger)">${T("ຍົກເລີກ","Cancel")} · ${esc(l.void)}</div>`:""}${!l.sent&&!l.void?`<div style="font-size:12px;color:var(--gold-ink)">${T("ຍັງບໍ່ຢືນຢັນ","Not confirmed")}</div>`:""}${l.priceNote?`<div style="font-size:12px;color:var(--blue-600)">${esc(l.priceNote)}</div>`:""}</td>
      <td class="r unit num">${fmt(l.unit)}${l.orig!==l.unit?`<div class="muted" style="font-size:12px"><s>${fmt(l.orig)}</s></div>`:""}</td>
      <td class="r num" style="font-weight:500">${fmt(l.unit*l.qty)}</td>
      <td class="act">${l.void||b.status==="paid"?"":`<button class="btn btn-ghost icon-btn sm" data-price="${l.id}" aria-label="${T("ແກ້ລາຄາ","Change price of")} ${esc(l.name)}${ce!=="yes"?(" ("+T("ຕ້ອງອະນຸມັດ)","approval needed)")):""}" title="${T("ແກ້ລາຄາ","Change price of")}">${icon("i-edit","sm")}</button><button class="btn btn-ghost icon-btn sm" data-void="${l.id}" aria-label="${T("ຍົກເລີກ","Cancel")} ${esc(l.name)}${cv!=="yes"&&l.sent?(" ("+T("ຕ້ອງອະນຸມັດ)","approval needed)")):""}" title="${T("ຍົກເລີກລາຍການ","Void item")}">${icon("i-trash","sm")}</button>`}</td>
    </tr>`;}).join(""):`<tr><td colspan="5" class="empty">${T("ຍັງບໍ່ມີລາຍການ","No items yet")} — <a class="link" href="#/menu">${T("ເພີ່ມຈາກເມນູ","add from the menu")}</a></td></tr>`;
  const dc=can("discount");
  $("#discOpts").innerHTML=[{id:"none",label:T("ບໍ່ມີ","None")},...cfg.discounts].map(d=>`<button class="opt" data-disc="${d.id}" aria-pressed="${d.id==="none"?!b.disc:b.disc?.id===d.id}" ${b.status==="paid"?"disabled":""}>${esc(d.label)}${d.id!=="none"&&dc!=="yes"?` ${icon(dc==="pin"?"i-key":"i-lock","xs")}`:""}</button>`).join("");
  $("#svcLabel").textContent=`${T("ຄ່າບໍລິການ","Service charge")} ${cfg.shop.svcPct}%`;
  $("#svcToggle").checked=b.svc; $("#svcToggle").disabled=b.status==="paid";
  $("#bdTotals").innerHTML=`
    <div class="sum-row"><span>${T("ຍອດລວມລາຍການ","Items total")}</span><span class="num">${kip(t.sub)}</span></div>
    ${t.hhSave?`<div class="sum-row disc"><span>${T("ລວມສ່ວນຫຼຸດ Happy hour ແລ້ວ","Includes Happy hour discount")}</span><span class="num">${kip(t.hhSave)}</span></div>`:""}
    ${t.disc?`<div class="sum-row disc"><span>${T("ສ່ວນຫຼຸດ","Discount")} ${esc(b.disc.label)}</span><span class="num">−${kip(t.disc)}</span></div>`:""}
    ${t.svc?`<div class="sum-row"><span>${T("ຄ່າບໍລິການ","Service charge")} ${cfg.shop.svcPct}%</span><span class="num">${kip(t.svc)}</span></div>`:""}
    <div class="sum-row total"><span>${T("ຍອດສຸດທິ","Net total")}</span><span class="v num">${kip(t.total)}</span></div>`;
  renderSplit(b);
  const anyPaid=b.split&&b.split.parts.some(p=>p.paid);
  $("#splitBtn span").textContent=b.split?T("ຍົກເລີກການແຍກ","Cancel split"):T("ແຍກບິນ","Split bill");
  $("#splitBtn").disabled=!t.items||b.status==="paid"||anyPaid;
  const sv=cfg.printer.mode==="save";
  $("#printBillBtn").innerHTML=`${icon(sv?"i-archive":"i-print")}${sv?T("ບັນທຶກບິນ","Save bill"):T("ພິມບິນ","Print bill")}`;
  $("#printBillBtn").disabled=!t.items||b.status==="paid";
  const pc=can("payment");
  $("#goPayBtn").innerHTML=pc==="no"?`${icon("i-lock")}${T("ແຄັດເຊຍເປັນຜູ້ຮັບຊຳລະ","The cashier takes payment")}`:`${T("ຊຳລະເງິນ","Payment")}${b.split?(" ("+T("ບິນຍ່ອຍຖັດໄປ)","next sub-bill)")):""}${icon("i-right")}`;
  $("#goPayBtn").disabled=!t.items||b.status==="paid";
  $("#goPayBtn").classList.toggle("btn-gold",pc!=="no");
  $("#billReceipt").className="receipt"+(+cfg.printer.paper===58?" p58":"");
  renderPayHint(b);
  $("#billReceipt").innerHTML=receiptHTML(b,{qr:b.payBy==="transfer"}); renderSlips(b);
}
/* ເລືອກວິທີຈ່າຍໃນໜ້າບິນ: ເງິນສົດ = ບໍ່ມີ QR · ໂອນ = ມີ QR ລັອກຍອດໃນບິນ */
function renderPayHint(b){
  const el=$("#payHintOpts"); if(!el) return;
  const off=b.status==="paid"?"disabled":"";
  const isT=b.payBy==="transfer", qb=qrBanks();
  let h="";
  if(cfg.pay.cash) h+=`<button class="opt" data-ph="cash" aria-pressed="${!isT}" ${off}>${T("ເງິນສົດ","Cash")}</button>`;
  if(cfg.pay.transfer) h+=`<button class="opt" data-ph="transfer" aria-pressed="${isT}" ${off}>${T("ໂອນເງິນ","Transfer")}</button>`;
  if(isT&&qb.length>1){ const cur=qrBankOf(b); h+=qb.map(k=>`<button class="opt" data-phbank="${k.id}" aria-pressed="${cur&&cur.id===k.id}" ${off}>${esc(k.name)}</button>`).join(""); }
  el.innerHTML=h;
  const note=$("#payHintNote");
  if(note) note.textContent=isT?(qb.length?"":T("ຍັງບໍ່ໄດ້ໃສ່ຂໍ້ຄວາມ QR ຂອງບັນຊີ — ໄປທີ່ ຕັ້ງຄ່າ › ຊຳລະເງິນ","No QR text set yet — go to Settings › Payment")):"";
}
$("#payHintOpts").addEventListener("click",e=>{
  const b=bill(); if(b.status==="paid") return;
  const m=e.target.closest("[data-ph]"), k=e.target.closest("[data-phbank]");
  if(m){ b.payBy=m.dataset.ph==="transfer"?"transfer":"cash"; }
  else if(k){ b.payBank=k.dataset.phbank; }
  else return;
  saveSession(); render();
});
function renderSplit(b){
  const el=$("#splitArea");
  if(!b.split){ el.innerHTML=""; return; }
  const sp=b.split, amts=partAmounts(b), anyPaid=sp.parts.some(p=>p.paid), ua=sp.mode==="item"?unassigned(b):{};
  const lineById=id=>b.lines.find(l=>l.id==id);
  const uaCount=Object.values(ua).reduce((a,c)=>a+c,0);
  const pc=can("payment");
  const partCard=(p,i)=>{
    const sel=sp.mode==="item"&&!p.paid;
    return `<div class="part ${sel&&sp.active===i?"active":""} ${p.paid?"paid":""}" ${sel?`data-act-part="${i}" role="button" tabindex="0" aria-pressed="${sp.active===i}" aria-label="${T("ເລືອກບິນຍ່ອຍ","Select sub-bill")} ${p.label} ${T("ເພື່ອໃສ່ລາຍການ","to add items")}"`:""}>
      <div class="part-h"><span class="pl">${p.label}</span><b>${T("ບິນຍ່ອຍ","Sub-bill")} ${p.label}</b>${p.paid?`<span class="chip xs pill-ok">${icon("i-check","xs")}${T("ຊຳລະແລ້ວ","Paid")} · ${esc(p.method)}</span>`:sel&&sp.active===i?`<span class="chip xs pill-warn">${T("ກຳລັງເລືອກ","Selected")}</span>`:""}</div>
      ${sp.mode==="item"?`<div class="part-items">${Object.entries(p.items).filter(([,q])=>q>0).map(([id,q])=>{const l=lineById(id); if(!l||l.void) return ""; return `<div class="pi"><span>${q} × ${esc(l.name)}</span><span style="display:flex;align-items:center;gap:4px"><span class="num muted">${fmt(q*l.unit)}</span>${p.paid?"":`<button type="button" data-unassign="${i}:${id}" aria-label="${T("ເອົາ","Remove")} ${esc(l.name)} ${T("ອອກຈາກບິນ","from bill")} ${p.label}">${icon("i-minus","sm")}</button>`}</span></div>`;}).join("")||`<span class="muted small">${T("ແຕະບິນນີ້ ແລ້ວແຕະລາຍການທາງຊ້າຍ","Tap this bill, then tap items on the left")}</span>`}</div>`:`<div class="muted small">${T("ຫານ","Split")} ${sp.n} ${T("ເທົ່າໆກັນ","ways equally")}${i===sp.n-1?(" · "+T("ໃບສຸດທ້າຍຮັບເສດ","last bill takes the remainder")):""}</div>`}
      <div class="part-amt"><span class="muted small">${sp.mode==="item"?`${T("ລາຍການ","Items")} ${fmt(partSub(b,p))} · ${T("ລວມສ່ວນຫຼຸດ/ຄ່າບໍລິການ","incl. discount/service")}`:T("ຕ້ອງຈ່າຍ","To pay")}</span><b class="num">${kip(amts[i])}</b></div>
      ${p.paid?"":`<button type="button" class="btn ${pc==="no"?"":"btn-gold"}" data-paypart="${i}" ${amts[i]<=0?"disabled":""}>${icon(pc==="no"?"i-lock":"i-wallet","sm")}${T("ຊຳລະບິນ","Pay bill")} ${p.label}</button>`}
    </div>`;};
  el.innerHTML=`<div class="split">
    <div class="split-top">
      <div><h3>${T("ແຍກເປັນ","Split into")} ${sp.n} ${T("ບິນ","bills")}</h3><div class="muted small">${T("ໃນໂຕະ","at table")} ${esc(tableOf(b.table).name)} · ${T("ແຕ່ລະບິນຈ່າຍແຍກ ໃຊ້ວິທີຊຳລະຕ່າງກັນໄດ້","each bill is paid separately, by any method")}</div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="seg" role="group" aria-label="${T("ວິທີແຍກ","Split method")}">
          <button type="button" data-smode="item" aria-pressed="${sp.mode==="item"}" ${anyPaid?"disabled":""}>${T("ເລືອກລາຍການເອງ","By item")}</button>
          <button type="button" data-smode="equal" aria-pressed="${sp.mode==="equal"}" ${anyPaid?"disabled":""}>${T("ຫານເທົ່າກັນ","Equally")}</button>
        </div>
        <div class="stepper" aria-label="${T("ຈຳນວນບິນ","Number of bills")}"><button type="button" data-sn="-1" ${sp.n<=2||anyPaid?"disabled":""} aria-label="${T("ຫຼຸດຈຳນວນບິນ","Fewer bills")}">${icon("i-minus","sm")}</button><output>${sp.n}</output><button type="button" data-sn="1" ${sp.n>=10||anyPaid?"disabled":""} aria-label="${T("ເພີ່ມຈຳນວນບິນ","More bills")}">${icon("i-plus","sm")}</button></div>
      </div>
    </div>
    ${sp.mode==="item"?`<div class="split-body">
      <div class="pool"><h4>${T("ຍັງບໍ່ໄດ້ແບ່ງ","Unassigned")} <span class="muted" style="font-weight:400">(${uaCount})</span></h4>
        <div class="muted small">${T("ແຕະລາຍການ","Tap an item")} = ${T("ໃສ່ 1 ຊິ້ນລົງ","moves 1 to")} <b>${T("ບິນ","Bill")} ${sp.parts[sp.active]?.label||"-"}</b></div>
        ${Object.entries(ua).map(([id,q])=>{const l=lineById(id); return `<button type="button" class="pool-item" data-assign="${id}"><span>${q} × ${esc(l.name)}</span><span class="num muted">${fmt(l.unit)}</span></button>`;}).join("")||`<div class="alert good" style="margin-top:10px">${icon("i-check","sm")}<span>${T("ແບ່ງຄົບທຸກລາຍການແລ້ວ","Every item is assigned")}</span></div>`}
        ${uaCount?`<button type="button" class="btn btn-sm btn-block" style="margin-top:10px" data-assign-all>${T("ໃສ່ທີ່ເຫຼືອທັງໝົດລົງບິນ","Put the rest on bill")} ${sp.parts[sp.active]?.label||""}</button>`:""}
      </div>
      <div class="split-grid" style="margin-top:0">${sp.parts.map(partCard).join("")}</div>
    </div>`:`<div class="split-grid">${sp.parts.map(partCard).join("")}</div>`}
  </div>`;
}
$("#splitArea").addEventListener("click",e=>{
  const b=bill(), sp=b.split; if(!sp) return; const t=e.target;
  const pay=t.closest("[data-paypart]"); if(pay){ e.stopPropagation(); state.payPart=+pay.dataset.paypart; resetPay(); navTo("pay"); return; }
  const m=t.closest("[data-smode]"); if(m){ sp.mode=m.dataset.smode; sp.parts.forEach(p=>p.items={}); log("split",`${T("ບິນ","Bill")} #${b.no} ${T("ແຍກແບບ","split mode: ")}${sp.mode==="equal"?T("ຫານເທົ່າກັນ","Equally"):T("ເລືອກລາຍການ","by item")}`); renderBill(); return; }
  const sn=t.closest("[data-sn]"); if(sn){ sp.n=Math.min(10,Math.max(2,sp.n+ +sn.dataset.sn)); sp.parts=makeParts(sp.n,sp.parts.slice(0,sp.n)); sp.active=Math.min(sp.active,sp.n-1); saveSession(); renderBill(); return; }
  const un=t.closest("[data-unassign]"); if(un){ e.stopPropagation(); const [i,id]=un.dataset.unassign.split(":"); const p=sp.parts[i]; p.items[id]--; if(p.items[id]<=0) delete p.items[id]; saveSession(); renderBill(); return; }
  const as=t.closest("[data-assign]"); if(as){ const p=sp.parts[sp.active]; if(!p||p.paid){ toast(T("ເລືອກບິນຍ່ອຍທີ່ຍັງບໍ່ຊຳລະກ່ອນ","Choose an unpaid sub-bill first"),"i-alert",true); return; } p.items[as.dataset.assign]=(p.items[as.dataset.assign]||0)+1; saveSession(); renderBill(); return; }
  if(t.closest("[data-assign-all]")){ const p=sp.parts[sp.active]; Object.entries(unassigned(b)).forEach(([id,q])=>p.items[id]=(p.items[id]||0)+q); saveSession(); renderBill(); return; }
  const ap=t.closest("[data-act-part]"); if(ap){ sp.active=+ap.dataset.actPart; renderBill(); }
});
$("#splitArea").addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-act-part]")){ e.preventDefault(); e.target.click(); } });
$("#billsList").addEventListener("click",e=>{const x=e.target.closest("[data-bill]"); if(!x)return; state.current=x.dataset.bill; state.payPart=null; resetPay(); saveSession(); render();});
$("#discOpts").addEventListener("click",async e=>{
  const x=e.target.closest("[data-disc]"); if(!x)return; const b=bill();
  if(x.dataset.disc==="none"){ if(b.disc) log("discount",`${T("ຍົກເລີກສ່ວນຫຼຸດ · ບິນ","Removed discount · bill")} #${b.no}`); b.disc=null; resetPay(); render(); return; }
  const d=cfg.discounts.find(z=>z.id===x.dataset.disc);
  const g=await guard("discount",T("ໃຫ້ສ່ວນຫຼຸດ","Give discounts"),`${T("ສ່ວນຫຼຸດ","Discount")} ${d.label} · ${T("ບິນ","Bill")} #${b.no}`); if(!g.ok) return;
  b.disc={...d};
  log("discount",`${T("ສ່ວນຫຼຸດ","Discount")} ${d.label} (${kip(totals(b).disc)}) · ${tableOf(b.table).name} #${b.no}`,g.by);
  resetPay(); render();
});
$("#svcToggle").onchange=e=>{ const b=bill(); b.svc=e.target.checked; log("bill",`${b.svc?T("ເພີ່ມ","Add"):T("ຍົກເລີກ","Cancel")}${T("ຄ່າບໍລິການ","Service charge")} ${cfg.shop.svcPct}% · ${T("ບິນ","Bill")} #${b.no}`); resetPay(); render(); };
$("#splitBtn").onclick=async()=>{
  const b=bill();
  if(b.split){ b.split=null; log("split",`${T("ຍົກເລີກການແຍກບິນ","Cancelled split of bill")} #${b.no}`); render(); return; }
  const g=await guard("split",T("ແຍກບິນ","Split bill")); if(!g.ok) return;
  b.split={mode:"item",n:2,active:0,parts:makeParts(2)};
  log("split",`${T("ແຍກບິນ","Split bill")} #${b.no} ${T("ເປັນ 2 ບິນ","into 2 bills")}`,g.by); render();
  $("#splitArea").scrollIntoView({block:"nearest",behavior:"smooth"});
};
$("#printBillBtn").onclick=()=>{
  const b=bill();
  if(cfg.printer.mode==="save"){
    const rec=saveBillNow(b);
    b.status="printed";
    log("bill",`${T("ບັນທຶກບິນ","Save bill")} #${b.no} · ${kip(rec.amount)}`);
    render(); toast(`${T("ບັນທຶກບິນ","Saved bill")} #${b.no} ${T("ແລ້ວ — ເບິ່ງໄດ້ໃນໜ້າ “ບິນທີ່ບັນທຶກ”","— see it on the Saved bills page")}`,"i-archive");
    openSaved(rec.id); return;
  }
  b.status="printed"; log("bill",`${T("ພິມບິນ","Print bill")} #${b.no} (${cfg.printer.copies} ${T("ຊຸດ)","copies)")}`); render(); toast(`${T("ພິມບິນ","Print bill")} #${b.no} → ${cfg.printer.receipt}`,"i-print"); printHTML(receiptHTML(b,{qr:b.payBy==="transfer"}));
};
$("#goPayBtn").onclick=()=>{ const b=bill(); state.payPart=b.split?b.split.parts.findIndex(p=>!p.paid):null; if(state.payPart<0) state.payPart=null; resetPay(); navTo("pay"); };
const REASONS=[T("ລູກຄ້າປ່ຽນໃຈ","Customer changed mind"),T("ສັ່ງຜິດ","Wrong order"),T("ຂອງເສຍ / ຫົກ","Spoiled / spilled"),T("ລໍຖ້າດົນເກີນໄປ","Waited too long"),T("ຂວດແຕກ","Broken bottle")];
$("#bdRows").addEventListener("click",async e=>{
  const b=bill();
  const v=e.target.closest("[data-void]");
  if(v){
    const l=b.lines.find(x=>x.id==v.dataset.void);
    if(!l.sent){ b.lines=b.lines.filter(x=>x!==l); render(); toast(`${T("ລຶບ","Removed")} ${l.name} (${T("ຍັງບໍ່ຢືນຢັນ)","not confirmed)")}`,"i-trash"); return; }
    const r=await openDyn({cls:"w-sm",eyebrow:(T("ບັນທຶກໃນ","Recorded in")+" Audit log"),title:T("ຍົກເລີກລາຍການ","Void item"),sub:`${l.qty} × ${esc(l.name)} · ${kip(l.unit*l.qty)}`,
      body:`<div class="choices" id="vr">${REASONS.map(x=>`<button type="button" class="choice" data-r="${esc(x)}" aria-pressed="false"><b>${esc(x)}</b></button>`).join("")}</div><input type="hidden" name="reason" id="vrIn">`,
      actions:[{label:T("ບໍ່ຍົກເລີກ","Keep item"),value:"cancel"},{label:T("ຢືນຢັນຍົກເລີກ","Confirm void"),value:"ok",cls:"btn-danger",icon:"i-trash",id:"vrOk",disabled:true}],
      mount(el){ $("#vr",el).addEventListener("click",ev=>{ const c=ev.target.closest("[data-r]"); if(!c) return; $$("#vr .choice",el).forEach(x=>x.setAttribute("aria-pressed",x===c)); $("#vrIn",el).value=c.dataset.r; $("#vrOk",el).disabled=false; }); }});
    if(r.value!=="ok") return;
    const g=await guard("void",T("ຍົກເລີກລາຍການທີ່ຢືນຢັນແລ້ວ","Void confirmed items"),`${l.qty} × ${l.name} · ${r.data.reason}`); if(!g.ok) return;
    l.void=r.data.reason;
    if(b.split) b.split.parts.forEach(p=>delete p.items[l.id]);
    log("void",`${T("ຍົກເລີກ","Voided")} ${l.qty} × ${l.name} (${kip(l.unit*l.qty)}) · ${tableOf(b.table).name} #${b.no} · ${r.data.reason}`,g.by);
    resetPay(); render(); toast(`${T("ຍົກເລີກ","Voided")} ${l.name} · ${r.data.reason}`,"i-trash"); return;
  }
  const pe=e.target.closest("[data-price]");
  if(pe){
    const l=b.lines.find(x=>x.id==pe.dataset.price);
    const r=await openDyn({cls:"w-sm",eyebrow:(T("ບັນທຶກໃນ","Recorded in")+" Audit log"),title:T("ແກ້ລາຄາໃນບິນ","Change price on bill"),sub:`${l.qty} × ${esc(l.name)} · ${T("ລາຄາເດີມ","original price")} ${kip(l.unit)}/${T("ໜ່ວຍ","unit")}`,
      body:`<div><label class="label" for="npr">${T("ລາຄາໃໝ່ຕໍ່ໜ່ວຍ (ກີບ)","New unit price (kip)")}</label><input class="inp num" id="npr" name="price" inputmode="numeric" value="${l.unit}" required pattern="[0-9,]+"></div>
            <div><label class="label" for="nrs">${T("ເຫດຜົນ","Reason")}</label><input class="inp" id="nrs" name="reason" required placeholder="${T("ເຊັ່ນ ລາຄາໂປຣວັນເກີດ, ໃສ່ລາຄາຜິດ","e.g. birthday promo, wrong price entered")}"></div>`,
      actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ບັນທຶກລາຄາ","Save price"),value:"ok",cls:"btn-gold"}]});
    if(r.value!=="ok") return;
    const np=Number(String(r.data.price).replace(/[^\d]/g,""));
    if(np===l.unit) return;
    const g=await guard("editPrice",T("ແກ້ລາຄາໃນບິນ","Change price on bill"),`${l.name} ${fmt(l.unit)} → ${fmt(np)} ₭`); if(!g.ok) return;
    log("price",`${T("ແກ້ລາຄາໃນບິນ","Change price on bill")} #${b.no}: ${l.name} ${fmt(l.unit)} → ${fmt(np)} ₭ · ${r.data.reason}`,g.by);
    l.priceNote=`${T("ແກ້ລາຄາ","Change price of")} ${fmt(l.unit)} → ${fmt(np)} · ${r.data.reason}`; l.unit=np; l.orig=Math.max(l.orig,np);
    resetPay(); render(); toast(T("ແກ້ລາຄາແລ້ວ","Price updated"),"i-edit");
  }
});


"use strict";
/* ===================== PAYMENT ===================== */
function resetPay(){ Object.assign(state.pay,{ok:false}); }
function payCtx(){
  const b=bill();
  if(b.split){ let i=state.payPart; if(i==null||!b.split.parts[i]||b.split.parts[i].paid) i=b.split.parts.findIndex(p=>!p.paid); state.payPart=i<0?null:i; return {b,part:state.payPart,due:i<0?0:partAmounts(b)[i]}; }
  return {b,part:null,due:totals(b).total};
}
const curs=()=>["LAK",...["THB","USD"].filter(c=>cfg.cur[c].on)];
const RATE=c=>c==="LAK"?1:cfg.cur[c].rate;
const SYM={LAK:"₭",THB:T("฿","฿"),USD:"$"}, CURNAME={LAK:T("ກີບ","kip"),THB:T("ບາດ","baht"),USD:T("ໂດລາ","dollar")};
const dueIn=(d,c)=>c==="LAK"?d:Math.ceil(d/RATE(c)/cfg.cur.foreignRound)*cfg.cur.foreignRound;
function renderPay(){
  const {b,part,due}=payCtx(); const p=state.pay; const tb=tableOf(b.table);
  if(!cfg.pay.cash&&p.method==="cash") p.method="transfer";
  if(!cfg.pay.transfer&&p.method==="transfer") p.method="cash";
  if(!curs().includes(p.cur)) p.cur="LAK";
  const banks=cfg.pay.banks.filter(k=>k.on); if(!banks.find(k=>k.id===p.bank)) p.bank=banks[0]?.id||null;
  $("#payCashier").textContent=`${T("ແຄັດເຊຍ","Cashier")} · ${state.user.name}`;
  $("#payEyebrow").textContent=`${T("ຊຳລະເງິນ · ໂຕະ","Payment · Table")} ${tb.name} · ${T("ບິນ","Bill")} #${b.no}${part!=null?"-"+b.split.parts[part].label:""}`;
  $("#dueLabel").textContent=part!=null?`${T("ຍອດບິນຍ່ອຍ","Sub-bill")} ${b.split.parts[part].label}`:T("ຍອດທີ່ຕ້ອງຊຳລະ","Amount due");
  $("#dueAmt").innerHTML=`${fmt(due)} <span>₭</span>`;
  $("#dueSplit").textContent=b.split?`${T("ຍອດທັງໂຕະ","whole table")} ${kip(totals(b).total)} · ${T("ແຍກ","split")} ${b.split.n} ${T("ບິນ","Bill")}`:`${totals(b).items} ${T("ລາຍການ","items")}`;
  $("#partSwitch").innerHTML=b.split?b.split.parts.map((x,i)=>`<button class="opt" data-pp="${i}" aria-pressed="${i===part}" ${x.paid?"disabled":""}>${T("ບິນ","Bill")} ${x.label} · ${x.paid?T("ຊຳລະແລ້ວ","Paid"):kip(partAmounts(b)[i])}</button>`).join(""):"";
  $("#methods").innerHTML=[cfg.pay.cash?`<button class="method" data-method="cash" aria-pressed="${p.method==="cash"}"><span class="mi">${icon("i-cash")}</span><span><b>${T("ເງິນສົດ","Cash")}</b><small>${curs().map(c=>CURNAME[c]).join(" · ")}</small></span></button>`:"",
    cfg.pay.transfer&&banks.length?`<button class="method" data-method="transfer" aria-pressed="${p.method==="transfer"}"><span class="mi">${icon("i-qr")}</span><span><b>${T("ໂອນເງິນ","Transfer")}</b><small>QR ${T("ຍອດຕົງຕາມບິນ","exact bill amount")}</small></span></button>`:""].join("");
  $("#cashPanel").hidden=p.method!=="cash"; $("#transferPanel").hidden=p.method!=="transfer";
  $("#curOpts").innerHTML=curs().map(c=>`<button class="opt" data-cur="${c}" aria-pressed="${p.cur===c}">${SYM[c]} ${CURNAME[c]}</button>`).join("");
  $("#rateNote").textContent=p.cur==="LAK"?T("ກີບ — ບໍ່ຕ້ອງແປງຄ່າເງິນ","Kip — no conversion needed"):`${T("ອັດຕາ","Rate")} 1 ${SYM[p.cur]} = ${fmt(RATE(p.cur))} ₭ (${T("ອັບເດດ","updated")} ${dmy(cfg.cur.updated)} ${hhmm(cfg.cur.updated)}) · ${T("ປັດຂຶ້ນເທື່ອລະ","rounded up to")} ${cfg.cur.foreignRound} ${SYM[p.cur]} · ${T("ທອນເປັນກີບ","change given in kip")}`;
  $("#dueInLabel").textContent=`${T("ຍອດເປັນ","Amount in ")}${CURNAME[p.cur]}`;
  $("#dueIn").textContent=`${p.cur==="USD"?"$":""}${fmt(dueIn(due,p.cur))} ${p.cur==="USD"?"":SYM[p.cur]}`;
  let ready=p.method==="cash";
  $("#bankOpts").innerHTML=banks.map(k=>`<button class="opt" data-bank="${k.id}" aria-pressed="${p.bank===k.id}"${bankColor(k.name)?` style="--bk:${bankColor(k.name)}"`:""}>${esc(k.name)}</button>`).join("");
  const bk=banks.find(k=>k.id===p.bank);
  $("#qrAmt").textContent=kip(due);
  $("#qrBank").innerHTML=bk?`${esc(bk.name)} · ${esc(bk.accName)}<br>${T("ເລກບັນຊີ","Account no.")} ${esc(bk.acc)} · ${T("ອ້າງອີງ","ref.")} #${b.no}`:T("ຍັງບໍ່ໄດ້ຕັ້ງຄ່າບັນຊີ","No account set up");
  $("#transferOk").checked=p.ok;
  drawQR(b.no+(bk?.acc||"")+due);
  if(p.method==="transfer") ready=p.ok&&!!bk;
  ready=ready&&due>0&&b.status!=="paid";
  $("#confirmPay").disabled=!ready;
  $("#confirmLabel").textContent=ready?`${T("ຢືນຢັນຮັບຊຳລະ","Confirm payment")} ${kip(due)}`:T("ຢືນຢັນຮັບຊຳລະ","Confirm payment");
  const pl=p.method==="cash"?`<div class="rr"><span>Cash ${p.cur}</span><span>${p.cur==="LAK"?fmt(due)+" ₭":SYM[p.cur]+fmt(dueIn(due,p.cur))}</span></div>`:p.method==="transfer"&&bk?`<div class="rr"><span>Transfer</span><span>${esc(bk.name)}</span></div>`:"";
  $("#payReceipt").className="receipt"+(+cfg.printer.paper===58?" p58":"");
  $("#payReceipt").innerHTML=receiptHTML(b,{part,payLines:pl});
}
function drawQR(seed){
  let h=0; for(const ch of seed) h=(h*31+ch.charCodeAt(0))>>>0; h=h||1;
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>17;h^=h<<5;h>>>=0;return h/4294967296;};
  let s=""; const N=29; const F=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7" fill="#2C1F17"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="#2C1F17"/>`;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const f=(x<8&&y<8)||(x>N-9&&y<8)||(x<8&&y>N-9); if(!f&&rnd()>.52) s+=`<rect x="${x}" y="${y}" width="1" height="1"/>`; }
  $("#qrSvg").innerHTML=`<g fill="#2C1F17">${s}</g>${F(0,0)}${F(N-7,0)}${F(0,N-7)}<rect x="11" y="11" width="7" height="7" rx="1.5" fill="var(--accent,#B8862B)"/><text x="14.5" y="16.3" font-size="4.6" text-anchor="middle" fill="#fff" font-family="Cormorant Garamond" font-weight="700">M</text>`;
}
$("#methods").addEventListener("click",e=>{const m=e.target.closest("[data-method]"); if(!m)return; state.pay.method=m.dataset.method; renderPay();});
$("#partSwitch").addEventListener("click",e=>{const m=e.target.closest("[data-pp]"); if(!m)return; state.payPart=+m.dataset.pp; resetPay(); renderPay();});
$("#curOpts").addEventListener("click",e=>{const x=e.target.closest("[data-cur]"); if(!x)return; state.pay.cur=x.dataset.cur; renderPay();});
$("#bankOpts").addEventListener("click",e=>{const x=e.target.closest("[data-bank]"); if(!x)return; state.pay.bank=x.dataset.bank; state.pay.ok=false; renderPay();});
$("#transferOk").onchange=e=>{state.pay.ok=e.target.checked; renderPay();};
$("#confirmPay").onclick=async()=>{
  const {b,part,due}=payCtx(); const p=state.pay; const t=totals(b);
  const bk=cfg.pay.banks.find(k=>k.id===p.bank);
  const method=p.method==="cash"?`cash-${p.cur}`:bk.name;
  let info;
  if(p.method==="cash") info=`${T("ຮັບເງິນສົດ","Cash received")} ${p.cur==="LAK"?kip(due):SYM[p.cur]+fmt(dueIn(due,p.cur))}`;
  else info=`${T("ໂອນຜ່ານ","Transfer via")} ${esc(bk.name)}`;
  const share=t.total?due/t.total:1;
  let items;
  if(b.split&&b.split.mode==="item"){ const pt=b.split.parts[part]; items=liveLines(b).filter(l=>pt.items[l.id]).map(l=>({name:l.name,pid:l.pid,qty:pt.items[l.id],amt:pt.items[l.id]*l.unit})); }
  else items=liveLines(b).map(l=>({name:l.name,pid:l.pid,qty:l.qty*share,amt:l.unit*l.qty*share}));
  state.sales.push({no:b.no,total:due,method,cur:p.cur,recv:p.method==="cash"?dueIn(due,p.cur):0,change:0,disc:Math.round(t.disc*share),svc:Math.round(t.svc*share),items,at:new Date(),by:state.user.name});
  $("#print-area").innerHTML=`<div class="receipt">${$("#payReceipt").innerHTML}</div>`;
  const payLines=p.method==="cash"?`<div class="rr"><span>Cash ${p.cur}</span><span>${p.cur==="LAK"?fmt(due)+" \u20ad":SYM[p.cur]+fmt(dueIn(due,p.cur))}</span></div>`:`<div class="rr"><span>Transfer</span><span>${esc(bk.name)}</span></div>`;
  const savedRec=saveBillNow(b,{part,kind:"paid",pay:{method:p.method==="cash"?`${T("ເງິນສົດ","Cash")} ${CURNAME[p.cur]}`:bk.name,cur:p.cur,recv:p.method==="cash"?dueIn(due,p.cur):0,change:0,lines:payLines}});
  let last=true,label="";
  if(b.split){ const pt=b.split.parts[part]; pt.paid=true; pt.paidAmt=due; pt.method=p.method==="cash"?`${T("ເງິນສົດ","Cash")} ${CURNAME[p.cur]}`:bk.name; label=`-${pt.label}`; last=b.split.parts.every(x=>x.paid); }
  if(last) b.status="paid";
  log("payment",`${T("ຮັບຊຳລະ","Received")} ${kip(due)} · ${tableOf(b.table).name} #${b.no}${label} · ${p.method==="cash"?`${T("ເງິນສົດ","Cash")} ${CURNAME[p.cur]}`:bk.name}`);
  resetPay();
  if(cfg.printer.mode==="save") toast(`${T("ບັນທຶກບິນ","Saved bill")} #${b.no}${label} ${T("ໄວ້ໃນເຄື່ອງແລ້ວ","on this device")}`,"i-archive");
  else if(cfg.printer.auto) toast(`${T("ພິມໃບຮັບເງິນອັດຕະໂນມັດ","Auto-printed receipt,")} ${cfg.printer.copies} ${T("ຊຸດ","copies")} → ${cfg.printer.receipt}`,"i-print");
  const r=await openDyn({cls:"w-sm",title:T("ຊຳລະເງິນຮຽບຮ້ອຍ","Payment complete"),
    body:`<div style="text-align:center"><div class="success-ic">${icon("i-check")}</div>
      <p style="font-size:40px;font-weight:600;margin:10px 0 0">${kip(due)}</p>
      <p class="muted" style="margin:4px 0 0">${T("ໂຕະ","Table")} ${esc(tableOf(b.table).name)} · ${T("ບິນ","Bill")} #${b.no}${label}</p><p style="margin:10px 0 0">${info}</p>
      ${!last?`<div class="alert info" style="margin-top:14px;text-align:left">${icon("i-split","sm")}<span>${T("ຍັງເຫຼືອ","Still")} ${b.split.parts.filter(x=>!x.paid).length} ${T("ບິນຍ່ອຍໃນໂຕະນີ້","sub-bills left at this table")}</span></div>`:""}</div>`,
    actions:[cfg.printer.mode==="print"?{label:T("ພິມໃບຮັບເງິນ","Print receipt"),value:"print",icon:"i-print"}:{label:T("ເບິ່ງບິນທີ່ບັນທຶກ","View saved bill"),value:"view",icon:"i-archive"},{label:last?T("ຮັບອໍເດີໂຕະຖັດໄປ","Next table"):T("ຊຳລະບິນຍ່ອຍຖັດໄປ","Pay next sub-bill"),value:"next",cls:"btn-gold",icon:"i-right"}]});
  if(r.value==="print") printNow();
  if(r.value==="view") openSaved(savedRec.id);
  if(last){ const nx=state.bills.find(x=>x.status!=="paid"); if(nx) state.current=nx.no; else { const nb=mkBill(String(state.billSeq++).padStart(4,"0"),cfg.tables[0].id,2,state.user.name,0,[]); state.bills.push(nb); state.current=nb.no; } state.payPart=null; location.hash=r.value==="next"&&can("order")!=="no"?"#/menu":"#/bill"; }
  else state.payPart=b.split.parts.findIndex(x=>!x.paid);
  render();
};


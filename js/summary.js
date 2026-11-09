"use strict";
/* ===================== SUMMARY ===================== */
const cntOf=(c,s)=>state.counted[c]??s.expected[c];
const BASE={bills:0,net:0,disc:0,
  hours:["17:00","18:00","19:00","20:00","21:00","22:00","23:00","00:00","01:00"].map(h=>[h,0]),
  methods:{"cash-LAK":0,"cash-THB":0,"cash-USD":0},
  items:{},
  cashIn:{LAK:0,THB:0,USD:0}};
function summary(){
  const s=structuredClone(BASE); s.svc=0;
  state.sales.forEach(x=>{
    s.bills++; s.net+=x.total; s.disc+=x.disc; s.methods[x.method]=(s.methods[x.method]||0)+x.total;
    const hr=String(x.at.getHours()).padStart(2,"0")+":00"; let slot=s.hours.find(h=>h[0]===hr); if(!slot){ slot=[hr,0]; s.hours.push(slot); const o=h=>(+h[0].slice(0,2)+12)%24; s.hours.sort((a,b)=>o(a)-o(b)); } slot[1]+=x.total/1000;
    s.svc+=x.svc||0;
    x.items.forEach(i=>{ const k=i.pid||("n:"+i.name); const c=s.items[k]||(s.items[k]=[0,0]); c[0]+=i.qty; c[1]+=i.amt||0; });
    if(x.method.startsWith("cash")) s.cashIn[x.cur]+=x.recv;
  });
  s.gross=Object.values(s.items).reduce((a,c)=>a+c[1],0);
  s.top={}; Object.entries(s.items).forEach(([k,c])=>{ const nm=k.startsWith("n:")?k.slice(2):(prod(k)?.name||k); s.top[nm]=(s.top[nm]||0)+c[0]; });
  s.voids=audit.filter(a=>a.type==="void").length;
  s.cash=s.methods["cash-LAK"]+s.methods["cash-THB"]+s.methods["cash-USD"];
  s.expected={LAK:s.cashIn.LAK,THB:s.cashIn.THB,USD:s.cashIn.USD};
  return s;
}
function renderSummary(){
  const s=summary();
  $("#sumEyebrow").textContent=state.shift?`${T("ກະ","Shift")} #0001 · ${T("ເປີດ","opened")} ${hhmm(state.shift.at)} ${T("ໂດຍ","by")} ${state.shift.by}`:`${T("ກະ","Shift")} #0001`;
  $("#kpis").innerHTML=`
    <div class="kpi hero"><div class="k">${T("ຍອດຂາຍສຸດທິ","Net sales")}</div><div class="v num">${fmt(s.net)} ₭</div><div class="d">${T("ຫຼັງຫັກສ່ວນຫຼຸດ","after discounts of")} ${kip(s.disc)}</div></div>
    <div class="kpi"><div class="k">${T("ຈຳນວນບິນ","Number of bills")}</div><div class="v num">${s.bills}</div><div class="d">${T("ບິນທີ່ຊຳລະແລ້ວ","paid bills")}</div></div>
    <div class="kpi"><div class="k">${T("ສະເລ່ຍຕໍ່ບິນ","Average per bill")}</div><div class="v num">${fmt(s.bills?Math.round(s.net/s.bills/100)*100:0)}</div><div class="d">${T("ກີບ","kip")}</div></div>
    <div class="kpi"><div class="k">${T("ເງິນສົດ / ໂອນ","Cash / transfer")}</div><div class="v num">${s.net?Math.round(s.cash/s.net*100):0}<span style="font-size:.55em">%</span> / ${s.net?100-Math.round(s.cash/s.net*100):0}<span style="font-size:.55em">%</span></div><div class="d">${kip(s.cash)} ${T("ເງິນສົດ","Cash")}</div></div>`;
  const W=Math.max(320,Math.round($("#hourChart").clientWidth||640)),H=W<480?220:260,P={l:4,r:4,t:24,b:28};
  const max=Math.max(1,...s.hours.map(h=>h[1])), peak=s.hours.some(h=>h[1]>0)?s.hours.findIndex(h=>h[1]===max):-1, bw=(W-P.l-P.r)/s.hours.length, barW=Math.min(44,bw*.62), yS=v=>(H-P.b)-(v/max)*(H-P.t-P.b);
  const bars=s.hours.map((h,i)=>{const x=P.l+i*bw+(bw-barW)/2,y=yS(h[1]),hh=(H-P.b)-y,r=Math.min(4,hh);
    return `<rect class="hit" x="${P.l+i*bw}" y="${P.t-10}" width="${bw}" height="${H-P.t-P.b+10}" tabindex="0" data-i="${i}" aria-label="${h[0]} ${T("ຍອດຂາຍ","sales")} ${fmt(h[1]*1000)} ${T("ກີບ","kip")}"/>
    <path class="bar ${i===peak?"peak":""}" d="M${x},${H-P.b} V${y+r} Q${x},${y} ${x+r},${y} H${x+barW-r} Q${x+barW},${y} ${x+barW},${y+r} V${H-P.b} Z"/>
    ${i===peak?`<text class="lbl" x="${x+barW/2}" y="${y-8}" text-anchor="middle">${fmt(h[1])}</text>`:""}
    <text class="axis" x="${x+barW/2}" y="${H-8}" text-anchor="middle">${W<480?h[0].slice(0,2):h[0]}</text>`;}).join("");
  $("#hourChart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T("ກຣາຟແທ່ງຍອດຂາຍລາຍຊົ່ວໂມງ ໜ່ວຍພັນກີບ ສູງສຸດ","Bar chart of sales by hour in thousand kip, peak")} ${peak>=0?s.hours[peak][0]:""}">${[.5,1].map(f=>`<line class="grid" x1="0" x2="${W}" y1="${yS(max*f)}" y2="${yS(max*f)}"/>`).join("")}<line x1="0" x2="${W}" y1="${H-P.b}" y2="${H-P.b}" stroke="var(--line-strong)"/>${bars}<text class="axis" x="2" y="12" text-anchor="start">${T("ພັນກີບ","k kip")}</text></svg><div class="tip" id="hourTip"></div>`;
  $("#peakNote").textContent=peak<0?T("ຍັງບໍ່ມີຍອດຂາຍ","No sales yet"):`${T("ຊ່ວງພີກ","Peak")} ${s.hours[peak][0]}–${String((+s.hours[peak][0].slice(0,2)+1)%24).padStart(2,"0")}:00 → ${T("ວາງກຳລັງພະນັກງານ ແລະ ສະຕັອກໃຫ້ພໍສຳລັບຊ່ວງນີ້","plan enough staff and stock for this window")}`;
  $("#hourTable").innerHTML=`<table class="data-table"><thead><tr><th>${T("ຊົ່ວໂມງ","Hour")}</th><th class="r">${T("ຍອດຂາຍ (ກີບ)","Sales (kip)")}</th></tr></thead><tbody>${s.hours.map(h=>`<tr><td>${h[0]}</td><td class="r num">${fmt(h[1]*1000)}</td></tr>`).join("")}</tbody></table>`;
  const tip=$("#hourTip");
  $$("#hourChart .hit").forEach(el=>{ const show=()=>{const h=s.hours[el.dataset.i]; const sc=$("#hourChart svg").getBoundingClientRect().width/W; tip.innerHTML=`${h[0]} · <b>${kip(h[1]*1000)}</b>`; tip.style.left=(+el.getAttribute("x")+bw/2)*sc+"px"; tip.style.top=yS(h[1])*sc+"px"; tip.style.opacity=1;};
    el.addEventListener("mouseenter",show); el.addEventListener("focus",show); el.addEventListener("mouseleave",()=>tip.style.opacity=0); el.addEventListener("blur",()=>tip.style.opacity=0); });
  const top=Object.entries(s.top).sort((a,b)=>b[1]-a[1]).slice(0,6), tmax=top.length?top[0][1]:1;
  $("#topItems").innerHTML=!top.length?`<div class="empty">${T("ຍັງບໍ່ມີຍອດຂາຍ","No sales yet")}</div>`:top.map(([n,q])=>`<div><div class="bl-row"><span>${esc(n)}</span><span class="num muted">${fmt(q)} ${T("ທີ່","sold")}</span></div><div class="track"><span style="width:${q/tmax*100}%"></span></div></div>`).join("");
  const transfers=Object.entries(s.methods).filter(([k])=>!k.startsWith("cash")).sort((a,b)=>b[1]-a[1]);
  const mix=[[T("ເງິນສົດ (ທຸກສະກຸນ)","Cash (all currencies)"),s.cash,"var(--c1)"],...transfers.slice(0,6).map(([k,v],i)=>[k,v,bankColor(k)||`var(--c${(i%3)+2})`])];
  $("#payStack").innerHTML=mix.map(m=>`<span style="flex:${m[1]};background:${m[2]}" title="${esc(m[0])} ${kip(m[1])}"></span>`).join("");
  $("#payStack").setAttribute("aria-label",(T("ສັດສ່ວນວິທີຊຳລະ:","Payment mix:")+" ")+mix.map(m=>`${m[0]} ${(s.net?Math.round(m[1]/s.net*100):0)}%`).join(", "));
  $("#payLegend").innerHTML=mix.map(m=>`<div><i style="background:${m[2]}"></i><span>${esc(m[0])}</span><span class="lv num">${(s.net?Math.round(m[1]/s.net*100):0)}%</span></div>`).join("");
  $("#payTable").innerHTML=`<thead><tr><th>${T("ຊ່ອງທາງ","Channel")}</th><th class="r">${T("ຍອດ (ກີບ)","Amount (kip)")}</th></tr></thead><tbody>
    <tr><td>${T("ເງິນສົດ · ກີບ","Cash · kip")}</td><td class="r num">${fmt(s.methods["cash-LAK"])}</td></tr>
    <tr><td>${T("ເງິນສົດ · ບາດ","Cash · baht")} (${fmt(s.cashIn.THB)} ${T("฿)","฿)")}</td><td class="r num">${fmt(s.methods["cash-THB"])}</td></tr>
    <tr><td>${T("ເງິນສົດ · ໂດລາ","Cash · dollar")} ($${fmt(s.cashIn.USD)})</td><td class="r num">${fmt(s.methods["cash-USD"])}</td></tr>
    ${transfers.map(([k,v])=>`<tr><td><i class="bk-dot" style="background:${bankColor(k)||"var(--c2)"}"></i>${T("ໂອນ","Transfer")} · ${esc(k)}</td><td class="r num">${fmt(v)}</td></tr>`).join("")}
    <tr><td><b>${T("ຍອດຂາຍສຸດທິ","Net sales")}</b></td><td class="r num"><b style="color:var(--gold-ink)">${fmt(s.net)}</b></td></tr></tbody>`;
  const rows=[["LAK",("₭ "+T("ກີບ","kip"))],["THB",T("฿ ບາດ","฿ baht")],["USD",("$ "+T("ໂດລາ","dollar"))]];
  if($("#countRows").dataset.closed!==String(state.shiftClosed)||!$("#countRows").children.length){
    $("#countRows").innerHTML=rows.map(([c,n])=>`<tr><td><b>${n}</b></td><td class="num muted" data-exp="${c}"></td><td><label class="sr-only" for="cnt-${c}">${T("ນັບໄດ້","Counted")} ${n}</label><input id="cnt-${c}" inputmode="numeric" data-cnt="${c}" value="${fmt(state.counted[c]??0)}" ${state.shiftClosed?"disabled":""}></td><td class="num" data-diff="${c}" style="font-weight:600"></td></tr>`).join("");
    $("#countRows").dataset.closed=String(state.shiftClosed);
  }
  const off=[]; let offKip=0;
  rows.forEach(([c])=>{const exp=s.expected[c],d=cntOf(c,s)-exp; $(`[data-exp="${c}"]`).textContent=fmt(exp); { const inp=$("#cnt-"+c); if(state.counted[c]==null&&inp&&document.activeElement!==inp) inp.value=fmt(exp); } const el=$(`[data-diff="${c}"]`); el.textContent=(d>0?"+":"")+fmt(d); el.style.color=d===0?"var(--ok)":"var(--danger)"; if(d){ off.push(`${CURNAME[c]}${d<0?T("ຂາດ","Short"):T("ເກີນ","Over")} ${fmt(Math.abs(d))} ${SYM[c]}`); offKip+=Math.abs(d*RATE(c)); }});
  state.offNote=off; state.offKip=offKip;
  const need=offKip>cfg.security.diffThreshold;
  $("#countAlert").innerHTML=state.shiftClosed?`<div class="alert good">${icon("i-check","sm")}<span>${T("ປິດກະຮຽບຮ້ອຍແລ້ວ","Shift closed")}</span></div>`:off.length?`<div class="alert ${need?"warn":"info"}">${icon("i-alert","sm")}<span>${off.join(" · ")} — ${need?`${T("ເກີນເກນ","over the limit")} ${kip(cfg.security.diffThreshold)} ${T("ຕ້ອງໃສ່ເຫດຜົນກ່ອນປິດກະ","a reason is required before closing")}`:`${T("ບໍ່ເກີນເກນ","within the limit")} ${kip(cfg.security.diffThreshold)}`}</span></div>`:`<div class="alert good">${icon("i-check","sm")}<span>${T("ຍອດເງິນສົດຕົງທຸກສະກຸນ ພ້ອມປິດກະ","Cash matches in every currency — ready to close")}</span></div>`;
  $("#voidNote").innerHTML=`${T("ຍົກເລີກລາຍການ","Voids:")} ${s.voids} ${T("ຄັ້ງ · ບິນຄ້າງ","· open bills:")} ${state.bills.filter(b=>b.status!=="paid").length} ${T("ບິນ","bills")}${state.user.role==="owner"?` · <a class="link" href="#/settings" data-goaudit>${T("ເບິ່ງ","View")} Audit log</a>`:""}`;
  const ccs=can("closeShift");
  $("#closeShiftBtn").disabled=state.shiftClosed||ccs==="no";
  $("#closeShiftBtn").innerHTML=`${icon(ccs==="pin"?"i-key":"i-lock")}${state.shiftClosed?T("ປິດກະແລ້ວ","Shift closed"):T("ປິດກະ","Close shift")}${ccs==="pin"&&!state.shiftClosed?(" · "+T("ຕ້ອງໃຊ້ PIN ເຈົ້າຂອງ","owner PIN required")):""}`;
}
$("#voidNote").addEventListener("click",e=>{ if(e.target.closest("[data-goaudit]")){ e.preventDefault(); state.setTab="audit"; navTo("settings"); } });
$("#hourTableBtn").onclick=e=>{const t=$("#hourTable"); t.hidden=!t.hidden; $("#hourChart").hidden=!t.hidden; e.target.textContent=t.hidden?T("ເບິ່ງເປັນຕາຕະລາງ","View as table"):T("ເບິ່ງເປັນກຣາຟ","View as chart"); e.target.setAttribute("aria-expanded",!t.hidden);};
$("#countRows").addEventListener("change",e=>{const c=e.target.dataset.cnt; if(!c)return; const v=Number(e.target.value.replace(/[^\d]/g,""))||0; state.counted[c]=v; e.target.value=fmt(v); renderSummary();});
$("#printReport").onclick=()=>showReport();
$("#sendSheetsBtn").onclick=()=>pushDayToSheets(true);
$("#saveShiftBtn").onclick=()=>saveShiftToDevice();
$("#closeShiftBtn").onclick=async()=>{
  const g=await guard("closeShift",T("ປິດກະ","Close shift"),(T("ຢືນຢັນຍອດເງິນສົດ ແລະ ປິດກະ","Confirm cash and close shift")+" #0001")); if(!g.ok) return;
  let reason="";
  if(state.offKip>cfg.security.diffThreshold){
    const r=await openDyn({cls:"w-sm",eyebrow:T("ເງິນຂາດ/ເກີນເກີນເກນ","Cash short/over beyond the limit"),title:T("ໃສ່ເຫດຜົນກ່ອນປິດກະ","Give a reason before closing"),sub:esc(state.offNote.join(" · ")),
      body:`<div><label class="label" for="cr">${T("ເຫດຜົນ","Reason")}</label><textarea class="inp" id="cr" name="reason" required placeholder="${T("ເຊັ່ນ ທອນເງິນຜິດໂຕະ","e.g. gave change to the wrong table")} 7"></textarea></div>`,
      actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ປິດກະ","Close shift"),value:"ok",cls:"btn-gold",icon:"i-lock"}]});
    if(r.value!=="ok") return; reason=r.data.reason;
  } else if(!(await confirmBox(T("ປິດກະ #0001?","Close shift #0001?"),T("ຫຼັງປິດກະຈະແກ້ໄຂຍອດນັບເງິນສົດບໍ່ໄດ້","After closing, the cash count can't be edited"),T("ປິດກະ","Close shift")))) return;
  { const s0=summary(); ["LAK","THB","USD"].forEach(c=>{ if(state.counted[c]==null) state.counted[c]=s0.expected[c]; }); }
  state.shiftClosed=true; state.closeInfo={at:Date.now(),by:state.user.name,reason};
  log("shift",`${T("ປິດກະ","Close shift")} #0001${state.offNote.length?` · ${state.offNote.join(" · ")}`:(" · "+T("ຍອດຕົງ","cash matches"))}${reason?` · ${T("ເຫດຜົນ:","reason:")} ${reason}`:""}`,g.by);
  pushDayToSheets();
  renderSummary(); toast(T("ປິດກະ #0001 ຮຽບຮ້ອຍ","Shift #0001 closed"),"i-lock");
  await showReport();
};


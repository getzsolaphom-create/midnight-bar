"use strict";
/* ===================== GOOGLE SHEETS (ສົ່ງສະຫຼຸບປິດກະ) =====================
   ໝາຍເຫດ: ຄ່າ "เงินสด"/"โอน" ຂ້າງລຸ່ມນີ້ແມ່ນລະຫັດພາຍໃນທີ່ສົ່ງໃຫ້ Apps Script
   ຝັ່ງ Apps Script (laoType/laoPay) ແປເປັນລາວໃຫ້ແລ້ວ ກ່ອນຂຽນລົງຊີດ
   ຈຶ່ງບໍ່ຄວນປ່ຽນ ຖ້າບໍ່ໄດ້ອັບເດດ Apps Script ພ້ອມກັນ */
function buildDayPayload(){
  const s=summary(), d=new Date(), pad=n=>String(n).padStart(2,"0");
  const date=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const isCash=m=>String(m).startsWith("cash");
  const payName=m=>isCash(m)?"เงินสด "+String(m).slice(5):m;
  const OTHER="ອື່ນໆ";   // ສິນຄ້າທີ່ບໍ່ຢູ່ໃນເມນູ (ພິມເອງ) → ໝວດ "ອື່ນໆ" ຄືກັບໃນໃບສະຫຼຸບປິດກະ
  const catName=pid=>{ const pr=pid&&prod(pid); return pr?catOf(pr.cat).th:OTHER; };
  const items=state.sales.flatMap(x=>x.items.map(i=>({
    date, bill:x.no, type:isCash(x.method)?"เงินสด":"โอน", pay:payName(x.method),
    name:i.pid?(prod(i.pid)?.name||i.name):i.name, cat:catName(i.pid),
    qty:Math.round(i.qty*100)/100, amt:Math.round(i.amt||0)
  })));
  // ສິນຄ້າທີ່ຂາຍທັງໝົດ ຈັດຕາມໝວດ — ໃຊ້ລຳດັບ ແລະ ຕົວເລກດຽວກັບໃບສະຫຼຸບປິດກະ
  const groups={};
  Object.entries(s.items).forEach(([k,[q,amt]])=>{
    const pr=k.startsWith("n:")?null:prod(k), cat=pr?catOf(pr.cat):{id:"x",th:OTHER};
    (groups[cat.id]=groups[cat.id]||{th:cat.th,rows:[]}).rows.push([pr?pr.name:k.replace(/^n:/,""),Math.round(q),Math.round(amt)]);
  });
  const products=[...cfg.cats.map(v=>v.id),"x"].filter(id=>groups[id]).flatMap(id=>{
    const g=groups[id]; g.rows.sort((a,b)=>b[2]-a[2]);
    return g.rows.map(([name,qty,amt])=>({date,cat:g.th,name,qty,amt}));
  });
  const transferTotal=Object.entries(s.methods).filter(([k])=>!isCash(k)).reduce((a,[,v])=>a+v,0);
  return {date, dev:(typeof LIVE!=="undefined"&&LIVE.dev)||"", shift:"0001", by:state.closeInfo?.by||state.user?.name||"",
    net:s.net, disc:s.disc, bills:s.bills,
    cashLAK:s.methods["cash-LAK"]||0, cashTHB:s.methods["cash-THB"]||0, cashUSD:s.methods["cash-USD"]||0,
    cashTotal:s.cash, transferTotal, items, products};
}
async function pushDayToSheets(manual){
  const sh=cfg.sheets||{};
  if(!sh.url){ if(manual) toast(T("ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Google Sheets — ໄປທີ່ ຕັ້ງຄ່າ › ປິດກະ & ຄວາມປອດໄພ","Google Sheets is not set up yet — go to Settings › Shift & security"),"i-alert",true); return false; }
  try{
    // no-cors: ສົ່ງໄດ້ແຕ່ອ່ານຄຳຕອບກັບບໍ່ໄດ້ → ກວດຜົນໃນຊີດເອງ
    await fetch(sh.url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({...buildDayPayload(),token:sh.token||""})});
    log("shift",T("ສົ່ງສະຫຼຸບຍອດເຂົ້າ Google Sheets","Sent the summary to Google Sheets")); toast(T("ສົ່ງຍອດເຂົ້າ Google Sheets ແລ້ວ","Sales sent to Google Sheets"),"i-check"); return true;
  }catch(e){ toast(T("ສົ່ງເຂົ້າ Google Sheets ບໍ່ສຳເລັດ — ກວດອິນເຕີເນັດ","Could not send to Google Sheets — check the internet"),"i-alert",true); return false; }
}


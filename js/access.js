"use strict";
/* ===================== ACCESS page ===================== */
const PAGE_ACCESS=[
  {p:T("ເມນູ / ສັ່ງອາຫານ","Menu / ordering"),perm:"order",d:T("ເລືອກເມນູ ຕົວເລືອກ ຢືນຢັນອໍເດີ","Choose items, options, confirm orders")},
  {p:T("ບິນ","Bill"),perm:null,d:T("ເບິ່ງບິນທຸກໂຕະ ພິມບິນ (ປຸ່ມສ່ວນຫຼຸດ/ຍົກເລີກ/ແກ້ລາຄາ ກວດສິດແຍກ)","See every table's bill, print bills (discount/void/price buttons check their own permissions)")},
  {p:T("ຊຳລະເງິນ","Payment"),perm:"payment",d:T("ຮັບເງິນສົດ/ໂອນ ທອນເງິນ","Take cash/transfer, give change")},
  {p:T("ສະຫຼຸບຍອດ & ປິດກະ","Summary & close shift"),perm:"viewSales",d:T("ຍອດຂາຍ ກຣາຟ ນັບເງິນສົດ","Sales, charts, cash count")},
  {p:T("ຝາກຂວດ","Bottles"),perm:"bottleKeep",d:T("ຮັບຝາກ ເບີກ ຖ່າຍຮູບຫຼັກຖານ","Keep, withdraw, proof photos")},
  {p:T("ສິດການໃຊ້ງານ","Permissions"),perm:null,d:T("ໜ້ານີ້ — ທຸກຄົນອ່ານໄດ້","This page — everyone can read it")},
  {p:T("ຕັ້ງຄ່າຫຼັງບ້ານ","Back-office settings"),perm:"settings",d:T("ຂໍ້ມູນຮ້ານ ເມນູ ລາຄາ ພະນັກງານ PIN ສິດ ແລະອື່ນໆ","Shop info, menu, prices, staff, PINs, permissions, etc.")},
];
const cell=v=>`<span class="perm-cell ${v}">${v==="yes"?icon("i-check","xs")+T("ໄດ້","Yes"):v==="pin"?icon("i-key","xs")+"PIN":"—"}</span>`;
function renderAccess(){
  const u=state.user;
  $("#accMeta").innerHTML=`<span class="chip pill-dark">${icon("i-user","xs")}${T("ທ່ານຄື","You are")} ${esc(u.name)} · ${ROLES[u.role]}</span>${u.role==="owner"?`<button class="btn" data-goperm>${icon("i-edit","sm")}${T("ແກ້ໄຂສິດ","Edit permissions")}</button>`:""}`;
  const list=role=>PERMS.map(p=>{const v=permOf(role,p.k); return `<li>${icon(v==="yes"?"i-check":v==="pin"?"i-key":"i-x")}<span>${esc(p.t)}${v==="pin"?` <span class="muted">— ${T("ຕ້ອງໃຫ້ເຈົ້າຂອງໃສ່","needs the owner's")} PIN</span>`:v==="no"?` <span class="muted">— ${T("ເຮັດບໍ່ໄດ້","not allowed")}</span>`:""}</span></li>`;}).join("");
  const who=role=>cfg.staff.filter(s=>s.role===role&&s.active).map(s=>esc(s.name)).join(", ")||"—";
  $("#accBody").innerHTML=`
    <div class="alert info">${icon("i-shield","sm")}<span><b>${T("ຫຼັກການ:","How it works:")}</b> ${T("ທຸກຄົນມີລະຫັດ PIN ສ່ວນຕົວບໍ່ຊ້ຳກັນ","everyone has their own unique PIN")} · <b>${T("ເຈົ້າຂອງຮ້ານເຂົ້າໄດ້ທຸກໜ້າທຸກລະບົບ","the owner can open every page")}</b> · ${T("ແຄັດເຊຍ ແລະ ພະນັກງານບໍລິການເຂົ້າໄດ້ສະເພາະທີ່ກຳນົດ · ຊ່ອງ “PIN”","cashiers and servers only get what's allowed · a “PIN” cell")} = ${T("ເຮັດໄດ້ເມື່ອເຈົ້າຂອງຮ້ານໃສ່ PIN ຂອງເຈົ້າຂອງໃນເຄື່ອງນັ້ນເພື່ອອະນຸມັດ · ທຸກການກະທຳສຳຄັນຖືກບັນທຶກໃນ Audit log ທີ່ແກ້ ຫຼື ລຶບບໍ່ໄດ້","works once the owner enters the owner PIN on that device · every important action goes into an Audit log that can't be edited or deleted")}</span></div>
    <div class="role-cards">
      <div class="role-card owner"><div class="eyebrow" style="color:var(--gold-300)">${T("ເຕັມສິດ","Full access")}</div><h3>${T("ເຈົ້າຂອງຮ້ານ","Owner")}</h3><div class="muted small">${who("owner")}</div>
        <ul>${[T("ເຂົ້າໄດ້ທຸກໜ້າ ທຸກລະບົບ ບໍ່ຕ້ອງຂໍອະນຸມັດ","Opens every page and feature without approval"),T("ຕັ້ງຄ່າຫຼັງບ້ານໄດ້ຜູ້ດຽວ: ຂໍ້ມູນຮ້ານ ເມນູ ລາຄາ ໂປຣໂມຊັນ ອັດຕາແລກປ່ຽນ ທະນາຄານ ໂຕະ ເຄື່ອງພິມ","Only one who can change back-office settings: shop info, menu, prices, promotions, exchange rates, banks, tables, printers"),T("ຈັດການພະນັກງານ ຕຳແໜ່ງ ຕັ້ງ/ປ່ຽນ PIN ຂອງທຸກຄົນ ແລະ ກຳນົດສິດແຕ່ລະຕຳແໜ່ງ","Manages staff and roles, sets/changes everyone's PIN and each role's permissions"),T("ໃຊ້ PIN ຂອງຕົນເອງອະນຸມັດວຽກທີ່ລັອກ (ສ່ວນຫຼຸດ ຍົກເລີກລາຍການ ແກ້ລາຄາ ປິດກະ)","Uses their own PIN to approve locked actions (discounts, voids, price changes, closing shift)"),T("ເບິ່ງ Audit log ທັງໝົດ","Sees the full Audit log")].map(x=>`<li>${icon("i-check")}<span>${x}</span></li>`).join("")}</ul>
        ${u.role==="owner"?`<span class="chip xs pill-warn me">${T("ທ່ານ","You")}</span>`:""}</div>
      <div class="role-card"><div class="eyebrow">${T("ໜ້າຮ້ານ · ເກັບເງິນ","Front counter · payments")}</div><h3>${T("ແຄັດເຊຍ","Cashier")}</h3><div class="muted small">${who("cashier")}</div><ul>${list("cashier")}</ul>${u.role==="cashier"?`<span class="chip xs pill-warn me">${T("ທ່ານ","You")}</span>`:""}</div>
      <div class="role-card"><div class="eyebrow">${T("ບໍລິການທີ່ໂຕະ","Table service")}</div><h3>${T("ພະນັກງານບໍລິການ","Server")}</h3><div class="muted small">${who("waiter")}</div><ul>${list("waiter")}</ul>${u.role==="waiter"?`<span class="chip xs pill-warn me">${T("ທ່ານ","You")}</span>`:""}</div>
    </div>
    <div class="card"><div class="card-h"><h2>${T("ເຂົ້າໜ້າໃດໄດ້ແດ່","Which pages each role can open")}</h2></div><div class="card-b scroll-x">
      <table class="data-table"><thead><tr><th>${T("ໜ້າ","Page")}</th><th>${T("ໃຊ້ເຮັດຫຍັງ","What it's for")}</th><th class="c">${T("ເຈົ້າຂອງ","Owner")}</th><th class="c">${T("ແຄັດເຊຍ","Cashier")}</th><th class="c">${T("ພະນັກງານບໍລິການ","Server")}</th></tr></thead>
      <tbody>${PAGE_ACCESS.map(a=>`<tr><td><b>${a.p}</b></td><td class="muted small">${a.d}</td>${["owner","cashier","waiter"].map(r=>`<td class="c">${cell(a.perm?permOf(r,a.perm):"yes")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
    <div class="card"><div class="card-h"><h2>${T("ເຮັດຫຍັງໄດ້ແດ່","What each role can do")}</h2><span class="muted small">${T("ເຈົ້າຂອງຕັ້ງໄດ້ທີ່ ຕັ້ງຄ່າ › ພະນັກງານ ແລະ ສິດ","The owner sets this in Settings › Staff & permissions")}</span></div><div class="card-b scroll-x">
      <table class="data-table"><thead><tr><th>${T("ການເຮັດວຽກ","Action")}</th><th>${T("ລາຍລະອຽດ","Details")}</th><th class="c">${T("ເຈົ້າຂອງ","Owner")}</th><th class="c">${T("ແຄັດເຊຍ","Cashier")}</th><th class="c">${T("ພະນັກງານບໍລິການ","Server")}</th></tr></thead>
      <tbody>${PERMS.map(p=>`<tr><td><b>${esc(p.t)}</b></td><td class="muted small">${esc(p.d)}</td>${["owner","cashier","waiter"].map(r=>`<td class="c">${cell(permOf(r,p.k))}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
    <div class="sum-grid-2">
      <div class="card"><div class="card-h"><h2>${T("ລະຫັດ PIN ເຮັດວຽກແນວໃດ","How PINs work")}</h2></div><div class="card-b"><ol class="steps">
        <li>${T("ທຸກຄົນມີ","Everyone has a personal")} PIN ${cfg.security.pinLen} ${T("ຫຼັກຂອງຕົນເອງ ເຈົ້າຂອງເປັນຜູ້ຕັ້ງໃຫ້ ແລະ PIN ຊ້ຳກັນບໍ່ໄດ້ — PIN ຂອງເຈົ້າຂອງຈຶ່ງຕ່າງຈາກຂອງພະນັກງານສະເໝີ","digits, set by the owner; no two PINs can match — so the owner's PIN always differs from staff PINs")}</li>
        <li>${T("ເປີດເຄື່ອງ → ເລືອກຊື່ → ໃສ່ PIN ລະບົບຈະເປີດສະເພາະໜ້າທີ່ຕຳແໜ່ງນັ້ນເຂົ້າໄດ້ (ໜ້າອື່ນຂຶ້ນໄອຄອນກະແຈ)","Open the device → pick your name → enter your PIN; only the pages your role can use open (others show a key icon)")}</li>
        <li>${T("ໃສ່ຜິດ","After")} ${cfg.security.maxTries} ${T("ຄັ້ງ ລະບົບລັອກ 30 ວິນາທີ ແລະ ບັນທຶກໄວ້","wrong tries, the screen locks for 30 seconds and it's logged")}</li>
        <li>${+cfg.security.lockMin?`${T("ບໍ່ມີການໃຊ້ງານ","After")} ${cfg.security.lockMin} ${T("ນາທີ ລະບົບລັອກໜ້າຈໍເອງ ຕ້ອງໃສ່ PIN ໃໝ່","idle minutes the screen locks itself and needs the PIN again")}`:T("ຕອນນີ້ປິດການລັອກອັດຕະໂນມັດຢູ່","Auto-lock is currently off")}</li>
        <li>${T("ວຽກທີ່ເປັນ “PIN” ເຊັ່ນ ສ່ວນຫຼຸດ ຍົກເລີກລາຍການ: ລະບົບຈະເປີດໜ້າຕ່າງໃຫ້ເຈົ້າຂອງໃສ່ PIN ຂອງເຈົ້າຂອງ (PIN ພະນັກງານໃຊ້ແທນບໍ່ໄດ້)","“PIN” actions such as discounts and voids open a window for the owner to enter the owner PIN (a staff PIN won't work)")}</li>
        <li>${T("ທຸກການອະນຸມັດບັນທຶກວ່າໃຜຂໍ ໃຜອະນຸມັດ ເມື່ອໃດ ໃນ","Every approval records who asked, who approved and when, in the")} Audit log</li></ol></div></div>
      <div class="card"><div class="card-h"><h2>${T("ຕົວຢ່າງສະຖານະການ","Example situations")}</h2></div><div class="card-b"><ul class="steps" style="list-style:disc">
        <li><b>${T("ພະນັກງານບໍລິການ","Server")}</b> ${T("ຮັບອໍເດີ ແຍກບິນ ຮັບຝາກຂວດໄດ້ ແຕ່ຮັບຊຳລະເງິນບໍ່ໄດ້","can take orders, split bills and keep bottles, but can't take payment")}</li>
        <li><b>${T("ແຄັດເຊຍ","Cashier")}</b> ${T("ຮັບເງິນໄດ້ ຖ້າລູກຄ້າຂໍສ່ວນຫຼຸດ 10% ລະບົບຈະໃຫ້ເຈົ້າຂອງໃສ່ PIN ອະນຸມັດ","can take payment; if a customer asks for 10% off, the owner must approve with their PIN")}</li>
        <li><b>${T("ພະນັກງານບໍລິການ","Server")}</b> ${T("ຈະຍົກເລີກ Mojito ທີ່ຢືນຢັນອໍເດີໄປແລ້ວ ຕ້ອງເລືອກເຫດຜົນ ແລ້ວໃຫ້ເຈົ້າຂອງໃສ່","voiding a confirmed Mojito needs a reason, then the owner's")} PIN</li>
        <li><b>${T("ເຈົ້າຂອງ","Owner")}</b> ${T("ປ່ຽນລາຄາ Mojito ໃນຫຼັງບ້ານ ລະບົບບັນທຶກ “ລາຄາເດີມ → ລາຄາໃໝ່” ໄວ້ໃນ","changes the Mojito price in the back office; “old price → new price” is recorded in the")} Audit log</li></ul></div></div>
    </div>`;
}
$("#accMeta").addEventListener("click",e=>{ if(e.target.closest("[data-goperm]")){ state.setTab="staff"; navTo("settings"); } });


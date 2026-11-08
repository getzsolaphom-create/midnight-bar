"use strict";
/* ===================== SETTINGS (owner only) ===================== */
const SET_TABS=[
  {id:"shop",t:T("ຂໍ້ມູນຮ້ານ","Shop info"),i:"i-store"},
  {id:"staff",t:T("ພະນັກງານ ແລະ ສິດ","Staff & permissions"),i:"i-users"},
  {id:"menu",t:T("ເມນູ ແລະ ສິນຄ້າ","Menu & products"),i:"i-menu"},
  {id:"promo",t:T("ໂປຣໂມຊັນ ແລະ ສ່ວນຫຼຸດ","Promotions & discounts"),i:"i-tag"},
  {id:"cur",t:T("ສະກຸນເງິນ & ອັດຕາແລກປ່ຽນ","Currencies & exchange rates"),i:"i-coins"},
  {id:"pay",t:T("ວິທີຊຳລະ & ບັນຊີທະນາຄານ","Payment methods & bank accounts"),i:"i-bank"},
  {id:"tables",t:T("ໂຕະ ແລະ ພື້ນທີ່","Tables & zones"),i:"i-table"},
  {id:"printer",t:T("ເຄື່ອງພິມ & ໃບຮັບເງິນ","Printers & receipts"),i:"i-print"},
  {id:"security",t:T("ປິດກະ & ຄວາມປອດໄພ","Closing & security"),i:"i-shield"},
  {id:"audit",t:T("ປະຫວັດການເຮັດວຽກ (Audit log)","Activity history (Audit log)"),i:"i-history"},
];
const AUDIT_TYPES={login:[T("ເຂົ້າ/ອອກລະບົບ","Sign in/out"),"pill-dark"],logout:[T("ເຂົ້າ/ອອກລະບົບ","Sign in/out"),"pill-dark"],access:[T("ອະນຸມັດເຂົ້າໜ້າ","Page approval"),"pill-warn"],discount:[T("ສ່ວນຫຼຸດ","Discount"),"pill-warn"],void:[T("ຍົກເລີກລາຍການ","Void item"),"pill-danger"],price:[T("ແກ້ລາຄາ","Price change"),"pill-bar"],reopen:[T("ແກ້ບິນທີ່ພິມ","Printed bill edit"),"pill-danger"],perm:[T("ປ່ຽນສິດ","Permission change"),"pill-danger"],staff:[(T("ພະນັກງານ","Staff")+"/PIN"),"pill-danger"],product:[T("ສິນຄ້າ","Products"),"pill-kitchen"],settings:[T("ຕັ້ງຄ່າ","Settings"),""],rate:[T("ອັດຕາແລກປ່ຽນ","Exchange rates"),"pill-bar"],shift:[T("ປິດກະ","Close shift"),"pill-ok"],bottle:[T("ຝາກຂວດ","Bottles"),"pill-ok"],split:[T("ແຍກບິນ","Split bill"),""],payment:[T("ຮັບຊຳລະ","Received"),"pill-ok"],order:[T("ອໍເດີ","Order"),"pill-ok"],bill:[T("ບິນ","Bill"),""]};
const F=(label,path,{type="text",help="",full=false,opts=null}={})=>{
  const v=getPath(cfg,path), id="f_"+path.replace(/\./g,"_");
  if(type==="bool") return `<label class="switch ${full?"full":""}" for="${id}"><span>${label}${help?`<span class="help" style="display:block">${help}</span>`:""}</span><input type="checkbox" class="tog" id="${id}" data-path="${path}" data-type="bool" data-label="${esc(label)}" ${v?"checked":""}></label>`;
  let ctl;
  if(opts) ctl=`<select class="inp" id="${id}" data-path="${path}" data-type="${typeof v==="number"?"num":"str"}" data-label="${esc(label)}">${opts.map(o=>{const [ov,ol]=Array.isArray(o)?o:[o,o]; return `<option value="${esc(ov)}" ${String(v)===String(ov)?"selected":""}>${esc(ol)}</option>`;}).join("")}</select>`;
  else if(type==="area") ctl=`<textarea class="inp" id="${id}" data-path="${path}" data-type="str" data-label="${esc(label)}">${esc(v)}</textarea>`;
  else ctl=`<input class="inp ${type==="num"?"num":""}" id="${id}" ${type==="num"?'inputmode="numeric"':type==="time"?'type="time"':""} data-path="${path}" data-type="${type==="num"?"num":"str"}" data-label="${esc(label)}" value="${esc(type==="num"?fmt(v):v)}">`;
  return `<div class="${full?"full":""}"><label class="label" for="${id}">${label}</label>${ctl}${help?`<div class="help">${help}</div>`:""}</div>`;
};
const sec=(title,sub,body,right="")=>`<div class="card"><div class="card-h"><div><h2>${title}</h2>${sub?`<div class="muted small">${sub}</div>`:""}</div>${right}</div><div class="card-b">${body}</div></div>`;
function renderSettings(){
  $("#setNav").innerHTML=SET_TABS.map(t=>`<button data-tab="${t.id}" aria-current="${state.setTab===t.id}">${icon(t.i,"sm")}<span>${t.t}</span></button>`).join("");
  let h="";
  switch(state.setTab){
  case "shop":
    h=sec(T("ຂໍ້ມູນຮ້ານ","Shop info"),T("ສະແດງໃນໜ້າເຂົ້າສູ່ລະບົບ ໃບຮັບເງິນ ແລະ ປ້າຍຝາກຂວດ","Shown on the sign-in screen, receipts and bottle tags"),`
      <div class="form-grid">
        <div class="full"><span class="label">${T("ໂລໂກ້","Logo")}</span><div class="logo-edit"><img src="${cfg.shop.logo}" alt="${T("ໂລໂກ້ປັດຈຸບັນ","Current logo")}"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="logo">${icon("i-upload","sm")}${T("ອັບໂຫຼດໂລໂກ້ໃໝ່","Upload new logo")}</button><button class="btn btn-ghost" data-act="logoReset">${T("ໃຊ້ໂລໂກ້ເດີມ","Use original logo")}</button></div></div></div>
        ${F(T("ຊື່ຮ້ານ","Shop name"),"shop.name")}${F(T("ເບີໂທ","Phone"),"shop.phone")}
        ${F(T("ທີ່ຢູ່","Address"),"shop.address",{full:true})}
        ${F(T("ຂໍ້ຄວາມທ້າຍໃບຮັບເງິນ","Receipt footer"),"shop.footer",{full:true,type:"area"})}
      </div>`)+sec(T("ຄ່າບໍລິການ","Service charge"),T("ຄ່າເລີ່ມຕົ້ນສຳລັບບິນໃໝ່ທຸກບິນ — ປິດ/ເປີດລາຍບິນໄດ້ໃນໜ້າບິນ","Default for every new bill — switch it per bill on the bill page"),`
      <div class="form-grid">${F(T("ຄິດຄ່າບໍລິການເປັນຄ່າເລີ່ມຕົ້ນ","Add service charge by default"),"shop.svcDefault",{type:"bool"})}${F(T("ອັດຕາຄ່າບໍລິການ (%)","Service charge rate (%)"),"shop.svcPct",{type:"num"})}</div>`);
    break;
  case "staff":
    h=sec(T("ລາຍຊື່ພະນັກງານ","Staff list"),`PIN ${T("ເປັນຕົວເລກ","is")} ${cfg.security.pinLen} ${T("ຫຼັກ ບໍ່ຊ້ຳກັນ · ທຸກການປ່ຽນ PIN/ຕຳແໜ່ງ ຖືກບັນທຶກໃນ","digits, unique · every PIN/role change is recorded in the")} Audit log`,`
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ຊື່","Name")}</th><th>${T("ຕຳແໜ່ງ","Role")}</th><th>PIN</th><th class="c">${T("ໃຊ້ງານ","Active")}</th><th></th></tr></thead><tbody>
      ${cfg.staff.map((s,i)=>`<tr><td><div style="display:flex;align-items:center;gap:10px"><span class="avatar av-${s.role}" style="margin:0;width:34px;height:34px">${esc(s.name[0]||"?")}</span><input class="inp sm" style="max-width:160px" data-path="staff.${i}.name" data-type="str" data-label="${T("ຊື່ພະນັກງານ","Staff name")}" value="${esc(s.name)}" aria-label="${T("ຊື່","Name")}"></div></td>
        <td><select class="inp sm" style="min-width:150px" data-staffrole="${i}" aria-label="${T("ຕຳແໜ່ງຂອງ","Role of")} ${esc(s.name)}">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${s.role===k?"selected":""}>${v}</option>`).join("")}</select></td>
        <td><div style="display:flex;gap:8px;align-items:center"><span style="font-family:var(--f-mono);letter-spacing:.2em">${"•".repeat(s.pin.length)}</span><button class="btn btn-sm" data-act="pin" data-i="${i}">${icon("i-key","xs")}${T("ຕັ້ງ","Set")} PIN</button></div></td>
        <td class="c"><input type="checkbox" class="tog" data-staffon="${i}" ${s.active?"checked":""} aria-label="${T("ເປີດໃຊ້ງານ","Enable")} ${esc(s.name)}"></td>
        <td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delStaff" data-i="${i}" aria-label="${T("ລຶບ","Delete")} ${esc(s.name)}">${icon("i-trash","sm")}</button></td></tr>`).join("")}
      </tbody></table></div>`,`<button class="btn btn-gold" data-act="addStaff">${icon("i-plus","sm")}${T("ເພີ່ມພະນັກງານ","Add staff")}</button>`)
    +sec(T("ສິດຂອງແຕ່ລະຕຳແໜ່ງ","Permissions by role"),T("ແຕະຊ່ອງເພື່ອສະຫຼັບ: ໄດ້ → PIN ເຈົ້າຂອງ → ບໍ່ໄດ້ · ເຈົ້າຂອງໄດ້ທຸກຢ່າງສະເໝີ · ມີຜົນທັນທີກັບທຸກປຸ່ມ ແລະ ທຸກໜ້າ","Tap a cell to cycle: Yes → Owner PIN → No · the owner can always do everything · takes effect on every button and page right away"),`
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ການເຮັດວຽກ","Action")}</th><th class="c">${T("ເຈົ້າຂອງ","Owner")}</th><th class="c">${T("ແຄັດເຊຍ","Cashier")}</th><th class="c">${T("ພະນັກງານບໍລິການ","Server")}</th></tr></thead><tbody>
      ${PERMS.map(p=>`<tr><td><b>${esc(p.t)}</b><div class="help" style="margin:0">${esc(p.d)}</div></td><td class="c">${cell("yes")}</td>${["cashier","waiter"].map(r=>{const v=permOf(r,p.k); return `<td class="c">${p.ownerOnly?cell("no"):`<button class="perm-cell ${v}" data-perm="${p.k}" data-role="${r}" aria-label="${esc(p.t)} ${ROLES[r]}: ${PERM_LABEL[v]} — ${T("ແຕະເພື່ອປ່ຽນ","tap to change")}">${v==="yes"?icon("i-check","xs")+T("ໄດ້","Yes"):v==="pin"?icon("i-key","xs")+"PIN":"—"}</button>`}</td>`;}).join("")}</tr>`).join("")}
      </tbody></table></div>`);
    break;
  case "menu":{
    const cnt=id=>cfg.products.filter(p=>p.cat===id).length;
    const lowN=cfg.products.filter(p=>p.stock!=null&&p.stock<=p.min).length;
    const f=state.pf;
    h=sec(T("ໝວດໝູ່","Categories"),T("ຊື່ ແລະ ໄອຄອນຂອງໝວດເມນູ","Names and icons of menu categories"),`
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ຊື່ໝວດ","Category name")}</th><th>English</th><th>${T("ໄອຄອນ","Icon")}</th><th class="r">${T("ສິນຄ້າ","Products")}</th><th></th></tr></thead><tbody>
      ${cfg.cats.map((c,i)=>`<tr><td><input class="inp sm" style="min-width:130px" data-path="cats.${i}.th" data-type="str" data-label="${T("ຊື່ໝວດ","Category name")}" value="${esc(c.th)}" aria-label="${T("ຊື່ໝວດ","Category name")}"></td><td><input class="inp sm" style="min-width:110px" data-path="cats.${i}.en" data-type="str" data-label="${T("ຊື່ໝວດ","Category name")} EN" value="${esc(c.en)}" aria-label="${T("ຊື່","Name")} EN"></td>
        <td><select class="inp sm" data-path="cats.${i}.icon" data-type="str" data-label="${T("ໄອຄອນໝວດ","Category icon")}" aria-label="${T("ໄອຄອນ","Icon")}">${Object.keys(CAT_ICONS).map(k=>`<option ${c.icon===k?"selected":""}>${k}</option>`).join("")}</select></td>
        <td class="r num">${cnt(c.id)}</td><td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delCat" data-i="${i}" aria-label="${T("ລຶບໝວດ","Delete category")} ${esc(c.th)}" ${cnt(c.id)?("disabled title='"+T("ຍ້າຍສິນຄ້າອອກກ່ອນ","Move its products out first")+"'"):""}>${icon("i-trash","sm")}</button></td></tr>`).join("")}
      </tbody></table></div>`,`<button class="btn" data-act="addCat">${icon("i-plus","sm")}${T("ເພີ່ມໝວດ","Add category")}</button>`)
    +sec(T("ສິນຄ້າ","Products"),`${cfg.products.length} ${T("ລາຍການ","items")} · ${cfg.products.filter(p=>p.soldOut).length} ${T("ໝົດ","Sold out")} · ${lowN} ${T("ຕ່ຳກວ່າຂັ້ນຕ່ຳ · ຕັ້ງ “ໝົດ” ແລ້ວໜ້າເມນູຂຶ້ນປ້າຍໝົດທັນທີ","below minimum · mark “Sold out” and the menu shows the label at once")}`,`
      <div class="opt-group" style="margin-bottom:12px">${[["all",T("ທັງໝົດ","All")],...cfg.cats.map(c=>[c.id,c.th]),["__low",T("ສະຕັອກຕ່ຳ","Low stock")],["__out",T("ໝົດ","Sold out")]].map(([k,l])=>`<button class="opt" data-pf="${k}" aria-pressed="${f===k}">${esc(l)}</button>`).join("")}</div>
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ສິນຄ້າ","Products")}</th><th>${T("ໝວດ","Category")}</th><th class="r">${T("ລາຄາ","Price")}</th><th class="r">${T("ສະຕັອກ","Stock")}</th><th class="c">${T("ໝົດ","Sold out")}</th><th class="c">${T("ເຊື່ອງ","Hide")}</th><th></th></tr></thead><tbody>
      ${cfg.products.map((p,i)=>[p,i]).filter(([p])=>f==="all"||p.cat===f||(f==="__low"&&p.stock!=null&&p.stock<=p.min)||(f==="__out"&&p.soldOut)).map(([p,i])=>{const c=catOf(p.cat), low=p.stock!=null&&p.stock<=p.min; return `<tr class="${p.hidden?"hidden-row":""}">
        <td><div class="prod-name cat-${catCls(c)}"><span class="sw">${icon(CAT_ICONS[c.icon]||"i-box")}</span><div><b>${esc(p.name)}</b><div class="help" style="margin:0">${esc(p.sub)}${p.opts.length?` · ${T("ຕົວເລືອກ","options:")} ${p.opts.length} ${T("ກຸ່ມ","groups")}`:""}${p.keep?(" · "+T("ຝາກຂວດໄດ້","bottle keep")):""}</div></div></div></td>
        <td><span class="chip xs">${esc(c.th)}</span></td>
        <td class="r num">${fmt(p.price)}</td>
        <td class="r num">${p.stock==null?`<span class="muted">${T("ບໍ່ນັບ","not tracked")}</span>`:`<span style="color:${low?"var(--danger)":"inherit"};font-weight:${low?600:400}">${p.stock}</span> <span class="muted small">/ ${p.min}</span>`}</td>
        <td class="c"><input type="checkbox" class="tog" data-sold="${i}" ${p.soldOut?"checked":""} aria-label="${T("ຕັ້ງ","Set")} ${esc(p.name)} ${T("ເປັນໝົດ","as sold out")}"></td>
        <td class="c"><input type="checkbox" class="tog" data-hide="${i}" ${p.hidden?"checked":""} aria-label="${T("ເຊື່ອງ","Hide")} ${esc(p.name)} ${T("ຈາກເມນູ","from menu")}"></td>
        <td class="r" style="white-space:nowrap"><button class="btn btn-ghost icon-btn sm" data-act="editProd" data-i="${i}" aria-label="${T("ແກ້ໄຂ","Edit")} ${esc(p.name)}">${icon("i-edit","sm")}</button><button class="btn btn-ghost icon-btn sm" data-act="delProd" data-i="${i}" aria-label="${T("ລຶບ","Delete")} ${esc(p.name)}">${icon("i-trash","sm")}</button></td></tr>`;}).join("")||`<tr><td colspan="7" class="empty">${T("ບໍ່ມີສິນຄ້າໃນກຸ່ມນີ້","No products in this group")}</td></tr>`}
      </tbody></table></div>`,`<button class="btn btn-gold" data-act="addProd">${icon("i-plus","sm")}${T("ເພີ່ມສິນຄ້າໃໝ່","Add new product")}</button>`);
    break;}
  case "promo":
    h=sec("Happy hour",`${T("ຕອນນີ້:","Now:")} ${hhActive()?("<b style='color:var(--ok)'>"+T("ກຳລັງໃຊ້ງານ","running")+"</b>"):T("ບໍ່ເຮັດວຽກ","not running")}`,`
      <div class="form-grid">${F((T("ເປີດໃຊ້","Enable")+" Happy hour"),"hh.on",{type:"bool"})}${F(T("ໃຊ້ທັນທີບໍ່ສົນເວລາ (ງານພິເສດ / ທົດສອບ)","Force on regardless of time (special event / testing)"),"hh.force",{type:"bool"})}
      ${F(T("ເລີ່ມ","Start"),"hh.start",{type:"time"})}${F(T("ສິ້ນສຸດ","End"),"hh.end",{type:"time"})}${F(T("ຫຼຸດ (%)","Discount (%)"),"hh.pct",{type:"num"})}<div></div>
      <div class="full"><span class="label">${T("ໝວດທີ່ຫຼຸດ","Discounted categories")}</span><div class="checks">${cfg.cats.map(c=>`<label class="check"><input type="checkbox" data-hhcat="${c.id}" ${cfg.hh.cats.includes(c.id)?"checked":""}><span>${esc(c.th)}</span></label>`).join("")}</div></div></div>`)
    +sec(T("ສ່ວນຫຼຸດທີ່ໃຊ້ໄດ້","Available discounts"),T("ປຸ່ມສ່ວນຫຼຸດທີ່ເລືອກໄດ້ໃນໜ້າບິນ (ຍັງຕ້ອງຜ່ານສິດ “ໃຫ້ສ່ວນຫຼຸດ”)","Discount buttons on the bill page (still subject to the “Give discounts” permission)"),`
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ຊື່ເທິງປຸ່ມ","Button label")}</th><th>${T("ປະເພດ","Type")}</th><th class="r">${T("ຄ່າ","Value")}</th><th></th></tr></thead><tbody>
      ${cfg.discounts.map((d,i)=>`<tr><td><input class="inp sm" style="min-width:140px" data-path="discounts.${i}.label" data-type="str" data-label="${T("ຊື່ສ່ວນຫຼຸດ","Discount name")}" value="${esc(d.label)}" aria-label="${T("ຊື່ສ່ວນຫຼຸດ","Discount name")}"></td>
      <td><select class="inp sm" style="min-width:150px" data-path="discounts.${i}.type" data-type="str" data-label="${T("ປະເພດສ່ວນຫຼຸດ","Discount type")} ${esc(d.label)}" aria-label="${T("ປະເພດ","Type")}"><option value="pct" ${d.type==="pct"?"selected":""}>${T("ເປີເຊັນ (%)","Percent (%)")}</option><option value="amt" ${d.type==="amt"?"selected":""}>${T("ຈຳນວນເງິນ (₭)","Amount (₭)")}</option></select></td>
      <td><input class="inp sm num" style="max-width:140px;margin-left:auto;display:block" inputmode="numeric" data-path="discounts.${i}.value" data-type="num" data-label="${T("ຄ່າສ່ວນຫຼຸດ","Discount value")} ${esc(d.label)}" value="${fmt(d.value)}" aria-label="${T("ຄ່າ","Value")}"></td>
      <td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delDisc" data-i="${i}" aria-label="${T("ລຶບສ່ວນຫຼຸດ","Delete discount")}">${icon("i-trash","sm")}</button></td></tr>`).join("")}
      </tbody></table></div>`,`<button class="btn" data-act="addDisc">${icon("i-plus","sm")}${T("ເພີ່ມສ່ວນຫຼຸດ","Add discount")}</button>`);
    break;
  case "cur":
    h=sec(T("ອັດຕາແລກປ່ຽນ","Exchange rates"),`${T("ທຽບກັບກີບ · ອັບເດດລ່າສຸດ","Against kip · last updated")} ${dmy(cfg.cur.updated)} ${hhmm(cfg.cur.updated)} · ${T("ແກ້ໄດ້ທັນທີບໍ່ຕ້ອງແກ້ໂຄດ","edit any time, no code changes")}`,`
      <div class="form-grid">
        <div style="display:flex;flex-direction:column;gap:10px">${F(T("1 ບາດ (฿) = ຈັກກີບ","1 baht (฿) in kip"),"cur.THB.rate",{type:"num"})}${F(T("ຮັບເງິນບາດ","Accept baht"),"cur.THB.on",{type:"bool"})}</div>
        <div style="display:flex;flex-direction:column;gap:10px">${F(("1 "+T("ໂດລາ","dollar")+" ($) = "+T("ຈັກກີບ","in kip")),"cur.USD.rate",{type:"num"})}${F(T("ຮັບເງິນໂດລາ","Accept dollars"),"cur.USD.on",{type:"bool"})}</div>
      </div>`)+sec(T("ກົດການປັດເສດ","Rounding rules"),"",`
      <div class="form-grid">${F(T("ປັດຍອດເງິນຕ່າງປະເທດຂຶ້ນເທື່ອລະ","Round foreign amounts up to"),"cur.foreignRound",{opts:[[1,("1 "+T("ໜ່ວຍ (ເຊັ່ນ 499 ฿)","unit (e.g. 499 ฿)"))],[5,("5 "+T("ໜ່ວຍ","unit"))],[10,("10 "+T("ໜ່ວຍ","unit"))]]})}
      ${F(T("ປັດເງິນທອນ (ກີບ) ລົງເທື່ອລະ","Round change (kip) down to"),"cur.changeRound",{opts:[[100,"100 ₭"],[500,"500 ₭"],[1000,"1,000 ₭"],[5000,"5,000 ₭"]]})}</div>`);
    break;
  case "pay":
    h=sec(T("ຊ່ອງທາງຊຳລະເງິນ","Payment channels"),T("ປິດຊ່ອງທາງແລ້ວຈະຫາຍຈາກໜ້າຊຳລະເງິນທັນທີ","A channel you turn off disappears from the payment page at once"),`<div class="form-grid">${F(T("ຮັບເງິນສົດ","Accept cash"),"pay.cash",{type:"bool"})}${F(T("ຮັບໂອນເງິນ (QR)","Accept transfers (QR)"),"pay.transfer",{type:"bool"})}</div>`)
    +sec((T("ບັນຊີທະນາຄານສຳລັບ","Bank accounts for")+" QR"),T("ເລກບັນຊີ ແລະ ຊື່ບັນຊີສະແດງໃຕ້ QR ໃນໜ້າຊຳລະເງິນ","The account number and name appear under the QR on the payment page"),`
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ທະນາຄານ","Bank")}</th><th>${T("ເລກບັນຊີ","Account no.")}</th><th>${T("ຊື່ບັນຊີ","Account name")}</th><th class="c">${T("ໃຊ້ງານ","Active")}</th><th></th></tr></thead><tbody>
      ${cfg.pay.banks.map((k,i)=>`<tr><td><input class="inp sm" style="min-width:110px" data-path="pay.banks.${i}.name" data-type="str" data-label="${T("ຊື່ທະນາຄານ","Bank name")}" value="${esc(k.name)}" aria-label="${T("ທະນາຄານ","Bank")}"></td><td><input class="inp sm" style="min-width:170px" data-path="pay.banks.${i}.acc" data-type="str" data-label="${T("ເລກບັນຊີ","Account no.")} ${esc(k.name)}" value="${esc(k.acc)}" aria-label="${T("ເລກບັນຊີ","Account no.")}"></td><td><input class="inp sm" style="min-width:170px" data-path="pay.banks.${i}.accName" data-type="str" data-label="${T("ຊື່ບັນຊີ","Account name")} ${esc(k.name)}" value="${esc(k.accName)}" aria-label="${T("ຊື່ບັນຊີ","Account name")}"></td>
      <td class="c"><input type="checkbox" class="tog" data-path="pay.banks.${i}.on" data-type="bool" data-label="${T("ເປີດໃຊ້","Enable")} ${esc(k.name)}" ${k.on?"checked":""} aria-label="${T("ເປີດໃຊ້","Enable")} ${esc(k.name)}"></td>
      <td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delBank" data-i="${i}" aria-label="${T("ລຶບບັນຊີ","Delete account")}">${icon("i-trash","sm")}</button></td></tr>`).join("")}
      </tbody></table></div>`,`<button class="btn" data-act="addBank">${icon("i-plus","sm")}${T("ເພີ່ມບັນຊີ","Add account")}</button>`);
    break;
  case "tables":
    h=sec(T("ໂຊນ","Zones"),"",`<div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ຊື່ໂຊນ","Zone name")}</th><th class="r">${T("ໂຕະ","Table")}</th><th></th></tr></thead><tbody>
      ${cfg.zones.map((z,i)=>{const n=cfg.tables.filter(t=>t.zone===z.id).length; return `<tr><td><input class="inp sm" data-path="zones.${i}.name" data-type="str" data-label="${T("ຊື່ໂຊນ","Zone name")}" value="${esc(z.name)}" aria-label="${T("ຊື່ໂຊນ","Zone name")}"></td><td class="r num">${n}</td><td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delZone" data-i="${i}" ${n?"disabled":""} aria-label="${T("ລຶບໂຊນ","Delete zone")}">${icon("i-trash","sm")}</button></td></tr>`;}).join("")}
      </tbody></table></div>`,`<button class="btn" data-act="addZone">${icon("i-plus","sm")}${T("ເພີ່ມໂຊນ","Add zone")}</button>`)
    +sec(T("ໂຕະ","Table"),`${cfg.tables.length} ${T("ໂຕະ · ປິດຊົ່ວຄາວແລ້ວຈະເປີດບິນທີ່ໂຕະນັ້ນບໍ່ໄດ້","tables · a closed table can't open new bills")}`,`<div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ຊື່ໂຕະ","Table name")}</th><th>${T("ໂຊນ","Zones")}</th><th class="r">${T("ບ່ອນນັ່ງ","Seats")}</th><th class="c">${T("ເປີດໃຊ້","Enable")}</th><th></th></tr></thead><tbody>
      ${cfg.tables.map((t,i)=>`<tr><td><input class="inp sm" style="max-width:120px" data-path="tables.${i}.name" data-type="str" data-label="${T("ຊື່ໂຕະ","Table name")}" value="${esc(t.name)}" aria-label="${T("ຊື່ໂຕະ","Table name")}"></td>
      <td><select class="inp sm" style="min-width:140px" data-path="tables.${i}.zone" data-type="str" data-label="${T("ໂຊນຂອງ","Zone of")} ${esc(t.name)}" aria-label="${T("ໂຊນ","Zones")}">${cfg.zones.map(z=>`<option value="${z.id}" ${t.zone===z.id?"selected":""}>${esc(z.name)}</option>`).join("")}</select></td>
      <td><input class="inp sm num" style="max-width:90px;margin-left:auto;display:block" inputmode="numeric" data-path="tables.${i}.seats" data-type="num" data-label="${T("ບ່ອນນັ່ງ","Seats")} ${esc(t.name)}" value="${t.seats}" aria-label="${T("ບ່ອນນັ່ງ","Seats")}"></td>
      <td class="c"><input type="checkbox" class="tog" data-path="tables.${i}.on" data-type="bool" data-label="${T("ເປີດໃຊ້ໂຕະ","Enable table")} ${esc(t.name)}" ${t.on?"checked":""} aria-label="${T("ເປີດໃຊ້","Enable")} ${esc(t.name)}"></td>
      <td class="r"><button class="btn btn-ghost icon-btn sm" data-act="delTable" data-i="${i}" aria-label="${T("ລຶບໂຕະ","Delete table")}">${icon("i-trash","sm")}</button></td></tr>`).join("")}
      </tbody></table></div>`,`<button class="btn" data-act="addTable">${icon("i-plus","sm")}${T("ເພີ່ມໂຕະ","Add table")}</button>`);
    break;
  case "printer":{
    const PR=[("EPSON TM-T82 · "+T("ແຄັດເຊຍ","Cashier")),T("Sunmi ໃນຕົວເຄື່ອງ","Sunmi built-in"),T("ບໍ່ພິມ","Don't print")];
    h=sec(T("ຮູບແບບການອອກບິນ","How bills are issued"),T("ຮ້ານຍັງບໍ່ມີເຄື່ອງພິມ — ເລືອກ “ບັນທຶກບິນ” ໄວ້ ບິນທຸກໃບຈະຖືກເກັບໄວ້ໃນເຄື່ອງນີ້. ຖ້າຊື້ເຄື່ອງພິມມາແລ້ວ ຈຶ່ງປ່ຽນເປັນ “ພິມບິນ”.","The shop has no printer yet — keep it on “Save bill” and every bill is stored on this device. Switch to “Print bill” once a printer is connected."),`<div class="form-grid">${F(T("ເມື່ອປິດບິນ","When closing a bill"),"printer.mode",{opts:[["save",T("ບັນທຶກບິນໄວ້ໃນເຄື່ອງ (ບໍ່ມີເຄື່ອງພິມ)","Save the bill on this device (no printer)")],["print",T("ພິມບິນອອກເຄື່ອງພິມ","Print the bill on a printer")]],full:true})}</div>`)
    +sec(T("ໃບຮັບເງິນ","Receipt"),"",`<div class="form-grid">${F(T("ຂະໜາດເຈ້ຍ","Paper size"),"printer.paper",{opts:[[80,("80 "+T("ມມ.","mm"))],[58,("58 "+T("ມມ.","mm"))]]})}${F(T("ຈຳນວນຊຸດທີ່ພິມ","Copies"),"printer.copies",{opts:[[1,("1 "+T("ຊຸດ","copies"))],[2,("2 "+T("ຊຸດ (ຮ້ານ + ລູກຄ້າ)","copies (shop + customer)"))],[3,("3 "+T("ຊຸດ","copies"))]]})}${F(T("ພິມໃບຮັບເງິນອັດຕະໂນມັດເມື່ອຮັບຊຳລະ","Print receipt automatically after payment"),"printer.auto",{type:"bool",full:true})}${F(T("ພິມບິນນ້ອຍທັນທີເມື່ອຢືນຢັນອໍເດີ (ບໍ່ສະແດງຕົວຢ່າງ)","Print the order slip immediately on confirm (skip the preview)"),"printer.autoSlip",{type:"bool",full:true})}</div>`)
    +sec(T("ເຄື່ອງພິມທີ່ໃຊ້","Printers in use"),"",`<div class="form-grid">${F(T("ໃບຮັບເງິນ / ບິນ","Receipt / bill"),"printer.receipt",{opts:PR})}<div style="align-self:end"><button class="btn" data-act="testPrint">${icon("i-print","sm")}${T("ທົດສອບພິມ","Test print")}</button></div></div>`);
    break;}
  case "security":
    h=sec(T("ການປິດກະ","Closing shift"),"",`<div class="form-grid">${F(T("ເງິນທອນເລີ່ມຕົ້ນ (ຄ່າທີ່ຕື່ມໃຫ້ຕອນເປີດກະ · ກີບ)","Opening change — default shown when opening the shift (kip)"),"shift.float",{type:"num",help:T("ເງິນທຶນຂອງເຈົ້າຂອງຮ້ານ · ບໍ່ລວມໃນຍອດຂາຍ · ຕອນປິດກະຈະຫັກອອກແລ້ວເກັບໄວ້ໃຊ້ມື້ຕໍ່ໄປ","Owner's capital · not part of sales · set aside at closing for the next day")})}${F(T("ເງິນຂາດ/ເກີນເກີນກວ່ານີ້ ຕ້ອງໃສ່ເຫດຜົນ (ກີບ)","A reason is required beyond this short/over amount (kip)"),"security.diffThreshold",{type:"num",help:T("ລວມທຸກສະກຸນທຽບເປັນກີບ","All currencies converted to kip")})}</div>`)
    +sec(T("ຄວາມປອດໄພ","Security"),"",`<div class="form-grid">${F(T("ລັອກໜ້າຈໍອັດຕະໂນມັດເມື່ອບໍ່ໃຊ້ງານ","Auto-lock when idle"),"security.lockMin",{opts:[[0,T("ບໍ່ລັອກ","Never")],[1,("1 "+T("ນາທີ","min"))],[3,("3 "+T("ນາທີ","min"))],[5,("5 "+T("ນາທີ","min"))],[10,("10 "+T("ນາທີ","min"))],[15,("15 "+T("ນາທີ","min"))]]})}
      ${F(T("ຄວາມຍາວ PIN","PIN length"),"security.pinLen",{opts:[[4,("4 "+T("ຫຼັກ","digits"))],[6,("6 "+T("ຫຼັກ","digits"))]],help:T("ມີຜົນກັບ PIN ທີ່ຕັ້ງໃໝ່","Applies to newly set PINs")})}
      ${F(T("ໃສ່ PIN ຜິດໄດ້ຈັກຄັ້ງກ່ອນລັອກ 30 ວິນາທີ","Wrong PIN tries before a 30-second lock"),"security.maxTries",{opts:[[3,("3 "+T("ຄັ້ງ","tries"))],[5,("5 "+T("ຄັ້ງ","tries"))],[10,("10 "+T("ຄັ້ງ","tries"))]]})}</div>`)
    +sec("Google Sheets",T("ສົ່ງສະຫຼຸບຍອດປິດກະ (ເງິນສົດ/ໂອນ/ສິນຄ້າທີ່ຂາຍ) ເຂົ້າ Google Sheets ອັດຕະໂນມັດຕອນກົດປິດກະ","Send the shift summary (cash/transfer/items sold) to Google Sheets automatically when the shift is closed"),`<div class="form-grid">${F(T("Web app URL (ຈາກ Apps Script)","Web app URL (from Apps Script)"),"sheets.url",{full:true,help:T("ລົງທ້າຍດ້ວຍ /exec · ເວັ້ນວ່າງ = ບໍ່ສົ່ງ","Ends with /exec · leave empty to disable")})}${F(T("TOKEN (ຕ້ອງຕົງກັບໃນ Apps Script)","TOKEN (must match the one in Apps Script)"),"sheets.token",{full:true})}<div class="full" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="testSheets">${icon("i-send","sm")}${T("ສົ່ງຂໍ້ມູນປັດຈຸບັນເຂົ້າຊີດ (ທົດສອບ)","Send current data to the sheet (test)")}</button></div></div>`)
    +sec(T("ການຕັ້ງຄ່າກາງ (ທຸກເຄື່ອງ)","Shared settings (all devices)"),T("ເຄື່ອງເຈົ້າຂອງສົ່ງການຕັ້ງຄ່າຂຶ້ນຊີດ — ເມນູ ລາຄາ ພະນັກງານ ໂຕະ ສິດ ບັນຊີທະນາຄານ · ເຄື່ອງອື່ນດຶງໄປໃຊ້ຕອນເປີດແອັບ ບໍ່ຕ້ອງຕັ້ງຄ່າເອງ","The owner's device sends settings to the sheet — menu, prices, staff, tables, permissions, bank accounts · other devices pull them when the app opens, with no setup"),`<div class="form-grid"><div class="full" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="pushCfg">${icon("i-send","sm")}${T("ສົ່ງການຕັ້ງຄ່າໃຫ້ທຸກເຄື່ອງ","Send settings to all devices")}</button><button class="btn" data-act="pullCfg">${icon("i-refresh","sm")}${T("ດຶງການຕັ້ງຄ່າລ່າສຸດ","Pull the latest settings")}</button></div></div>`)
    +sec(T("ຂໍ້ມູນໃນເຄື່ອງ","Data on this device"),T("ຕົ້ນແບບນີ້ຍັງບໍ່ມີຖານຂໍ້ມູນ — ການຕັ້ງຄ່າ ຝາກຂວດ ແລະ Audit log ເກັບໃນບຣາວເຊີເຄື່ອງນີ້ເທົ່ານັ້ນ · ບິນ ແລະ ຍອດຂາຍຈະຫາຍເມື່ອຣີເຟຣຊ","This prototype has no database yet — settings, kept bottles and the Audit log stay in this browser only · bills and sales disappear on refresh"),`<button class="btn btn-danger" data-act="reset">${icon("i-trash","sm")}${T("ເລີ່ມໃໝ່ທັງໝົດ (ລ້າງທຸກຢ່າງ)","Start over (clear everything)")}</button>`);
    break;
  case "audit":{
    const f=state.auditFilter;
    const G={all:null,price:["price"],void:["void"],perm:["perm","staff"],discount:["discount"],login:["login","logout","access"],other:"other"};
    const known=["price","void","perm","staff","discount","login","logout","access"];
    const rows=audit.filter(a=>f==="all"||(f==="other"?!known.includes(a.type):G[f].includes(a.type)));
    h=sec(T("ປະຫວັດການເຮັດວຽກ (Audit log)","Activity history (Audit log)"),(T("ບັນທຶກທຸກຄັ້ງທີ່ມີການແກ້ລາຄາ ຍົກເລີກລາຍການ ໃຫ້ສ່ວນຫຼຸດ ປ່ຽນສິດ/PIN — ໃຜເຮັດ ໃຜອະນຸມັດ ເມື່ອໃດ","Every price change, void, discount and permission/PIN change is recorded — who did it, who approved, and when")+" · <b>"+T("ແກ້ໄຂ ຫຼື ລຶບບໍ່ໄດ້","can't be edited or deleted")+"</b>"),`
      <div class="opt-group" style="margin-bottom:12px">${[["all",T("ທັງໝົດ","All")],["price",T("ແກ້ລາຄາ","Change price of")],["void",T("ຍົກເລີກລາຍການ","Void item")],["perm",T("ສິດ & ພະນັກງານ","Permissions & staff")],["discount",T("ສ່ວນຫຼຸດ","Discount")],["login",T("ເຂົ້າ/ອອກລະບົບ","Sign in/out")],["other",T("ອື່ນໆ","Other")]].map(([k,l])=>`<button class="opt" data-af="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>
      <div class="scroll-x"><table class="data-table"><thead><tr><th>${T("ເວລາ","Time")}</th><th>${T("ຜູ້ເຮັດ","By")}</th><th>${T("ປະເພດ","Type")}</th><th>${T("ລາຍລະອຽດ","Details")}</th><th>${T("ອະນຸມັດໂດຍ","Approved by")}</th></tr></thead><tbody>
      ${rows.slice(0,200).map(a=>{const [tl,tc]=AUDIT_TYPES[a.type]||[a.type,""]; return `<tr><td class="num small">${dmy(a.t)}<br><b>${hhmm(a.t)}</b></td><td><b>${esc(a.who)}</b><div class="help" style="margin:0">${ROLES[a.role]||""}</div></td><td><span class="chip xs ${tc}">${tl}</span></td><td style="min-width:240px">${esc(a.detail)}</td><td>${a.by?`<span class="chip xs pill-warn">${icon("i-key","xs")}${esc(a.by)}</span>`:`<span class="muted">—</span>`}</td></tr>`;}).join("")||`<tr><td colspan="5" class="empty">${T("ບໍ່ມີລາຍການ","no items")}</td></tr>`}
      </tbody></table></div>`,`<span class="chip">${rows.length} ${T("ລາຍການ","items")}</span>`);
    break;}
  }
  $("#setBody").innerHTML=h;
}
$("#setNav").addEventListener("click",e=>{const b=e.target.closest("[data-tab]"); if(!b)return; state.setTab=b.dataset.tab; renderSettings(); if(window.innerWidth<1024) $("#setBody").scrollIntoView({block:"start",behavior:"smooth"});});
$("#setBody").addEventListener("change",e=>{
  const el=e.target;
  if(el.dataset.path){
    const path=el.dataset.path, type=el.dataset.type, old=getPath(cfg,path);
    let v=type==="bool"?el.checked:type==="num"?Number(String(el.value).replace(/[^\d.]/g,""))||0:el.value.trim();
    if(type==="str"&&!v&&!/footer|address|acc|sheets/.test(path)){ el.value=old; toast(T("ຊ່ອງນີ້ວ່າງບໍ່ໄດ້","This field can't be empty"),"i-alert",true); return; }
    if(old===v) return;
    setPath(cfg,path,v);
    if(/^cur\.(THB|USD)\.rate$/.test(path)) cfg.cur.updated=Date.now();
    const fv=x=>typeof x==="boolean"?(x?T("ເປີດ","Open"):T("ປິດ","Close")):typeof x==="number"?fmt(x):`“${x}”`;
    const tp=path.startsWith("cur.")?"rate":path.startsWith("staff.")?"staff":"settings";
    log(tp,`${el.dataset.label}: ${fv(old)} → ${fv(v)}`);
    applyBrand(); renderSettings(); return;
  }
  if(el.dataset.staffrole!=null){ const s=cfg.staff[el.dataset.staffrole], old=s.role;
    if(old==="owner"&&cfg.staff.filter(x=>x.role==="owner"&&x.active).length<=1){ toast(T("ຕ້ອງມີເຈົ້າຂອງຮ້ານຢ່າງໜ້ອຍ 1 ຄົນ","There must be at least 1 owner"),"i-alert",true); renderSettings(); return; }
    s.role=el.value; log("staff",`${T("ຕຳແໜ່ງຂອງ","Role of")} ${s.name}: ${ROLES[old]} → ${ROLES[s.role]}`); if(s.id===state.user.id) state.user.role=s.role; renderSettings(); renderNav(); return; }
  if(el.dataset.staffon!=null){ const s=cfg.staff[el.dataset.staffon];
    if(!el.checked&&s.role==="owner"&&cfg.staff.filter(x=>x.role==="owner"&&x.active).length<=1){ el.checked=true; toast(T("ຕ້ອງມີເຈົ້າຂອງຮ້ານທີ່ໃຊ້ງານໄດ້ຢ່າງໜ້ອຍ 1 ຄົນ","There must be at least 1 active owner"),"i-alert",true); return; }
    s.active=el.checked; log("staff",`${s.active?T("ເປີດ","Enabled"):T("ປິດ","Disabled")}${T("ການໃຊ້ງານຂອງ","access for")} ${s.name}`); return; }
  if(el.dataset.sold!=null){ const p=cfg.products[el.dataset.sold]; p.soldOut=el.checked; log("product",`${p.name}: ${p.soldOut?T("ຕັ້ງເປັນ “ໝົດ”","Marked “Sold out”"):T("ເປີດຂາຍອີກຄັ້ງ","Back on sale")}`); renderSettings(); return; }
  if(el.dataset.hide!=null){ const p=cfg.products[el.dataset.hide]; p.hidden=el.checked; log("product",`${p.name}: ${p.hidden?T("ເຊື່ອງຈາກເມນູ","Hidden from menu"):T("ສະແດງໃນເມນູ","Shown in menu")}`); renderSettings(); return; }
  if(el.dataset.hhcat!=null){ const c=el.dataset.hhcat; cfg.hh.cats=el.checked?[...new Set([...cfg.hh.cats,c])]:cfg.hh.cats.filter(x=>x!==c); log("settings",`Happy hour ${T("ໝວດ:","categories:")} ${cfg.hh.cats.map(x=>catOf(x).th).join(", ")||T("ບໍ່ມີ","None")}`); return; }
});
$("#setBody").addEventListener("click",async e=>{
  const pc=e.target.closest("[data-perm]");
  if(pc){ const {perm,role}=pc.dataset, order=["yes","pin","no"], old=permOf(role,perm), nv=order[(order.indexOf(old)+1)%3];
    cfg.perms[perm]=cfg.perms[perm]||{}; cfg.perms[perm][role]=nv; log("perm",`${T("ສິດ","Access")} “${PERMS.find(p=>p.k===perm).t}” ${T("ຂອງ","for ")}${ROLES[role]}: ${PERM_LABEL[old]} → ${PERM_LABEL[nv]}`); renderSettings(); return; }
  const af=e.target.closest("[data-af]"); if(af){ state.auditFilter=af.dataset.af; renderSettings(); return; }
  const pf=e.target.closest("[data-pf]"); if(pf){ state.pf=pf.dataset.pf; renderSettings(); return; }
  const b=e.target.closest("[data-act]"); if(!b) return;
  const i=+b.dataset.i, act=b.dataset.act;
  switch(act){
    case "logo": $("#logoFile").click(); return;
    case "logoReset": cfg.shop.logo=LOGO_DEFAULT; log("settings",T("ປ່ຽນໂລໂກ້ກັບເປັນຄ່າເລີ່ມຕົ້ນ","Logo reset to default")); break;
    case "pin":{ const s=cfg.staff[i], len=cfg.security.pinLen;
      const r=await openDyn({cls:"w-sm",eyebrow:`${esc(s.name)} · ${ROLES[s.role]}`,title:T("ຕັ້ງ PIN ໃໝ່","Set new PIN"),body:`<div><label class="label" for="np1">PIN ${T("ໃໝ່","— new")} (${len} ${T("ຫຼັກ)","digits)")}</label><input class="inp num" id="np1" name="a" type="password" inputmode="numeric" autocomplete="new-password" required pattern="\\d{${len}}" maxlength="${len}"></div><div><label class="label" for="np2">${T("ຢືນຢັນ","Confirm")} PIN</label><input class="inp num" id="np2" name="b" type="password" inputmode="numeric" autocomplete="new-password" required pattern="\\d{${len}}" maxlength="${len}"></div><p class="help" style="margin:0">PIN ${T("ຕ້ອງບໍ່ຊ້ຳກັບຄົນອື່ນ · ລະບົບບັນທຶກວ່າມີການປ່ຽນ ແຕ່ບໍ່ເກັບຕົວເລກ PIN ໃນ","Must not match anyone else's · the change is logged, but the PIN digits are never stored in the")} log</p>`,actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ບັນທຶກ PIN","Save PIN"),value:"ok",cls:"btn-gold",icon:"i-key"}]});
      if(r.value!=="ok") return;
      if(r.data.a!==r.data.b){ toast(T("PIN ສອງຊ່ອງບໍ່ກົງກັນ","The two PINs don't match"),"i-alert",true); return; }
      if(cfg.staff.some(x=>x!==s&&x.pin===r.data.a)){ toast(T("PIN ນີ້ມີຄົນໃຊ້ແລ້ວ ເລືອກ PIN ອື່ນ","That PIN is taken — choose another"),"i-alert",true); return; }
      s.pin=r.data.a; log("staff",`${T("ປ່ຽນ PIN ຂອງ","Changed PIN for")} ${s.name}`); toast(`${T("ຕັ້ງ PIN ຂອງ","PIN set for")} ${s.name} ${T("ແລ້ວ","")}`,"i-key"); break; }
    case "addStaff":{ const len=cfg.security.pinLen;
      const r=await openDyn({cls:"w-sm",title:T("ເພີ່ມພະນັກງານ","Add staff"),body:`<div><label class="label" for="nsn">${T("ຊື່","Name")}</label><input class="inp" id="nsn" name="name" required></div><div><label class="label" for="nsr">${T("ຕຳແໜ່ງ","Role")}</label><select class="inp" id="nsr" name="role">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${k==="waiter"?"selected":""}>${v}</option>`).join("")}</select></div><div><label class="label" for="nsp">PIN (${len} ${T("ຫຼັກ)","digits)")}</label><input class="inp num" id="nsp" name="pin" type="password" inputmode="numeric" required pattern="\\d{${len}}" maxlength="${len}" autocomplete="new-password"></div>`,actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ເພີ່ມ","Add"),value:"ok",cls:"btn-gold"}]});
      if(r.value!=="ok") return;
      if(cfg.staff.some(x=>x.pin===r.data.pin)){ toast(T("PIN ນີ້ມີຄົນໃຊ້ແລ້ວ","That PIN is taken"),"i-alert",true); return; }
      cfg.staff.push({id:uid("s"),name:r.data.name.trim(),role:r.data.role,pin:r.data.pin,active:true}); log("staff",`${T("ເພີ່ມພະນັກງານ","Add staff")} ${r.data.name.trim()} (${ROLES[r.data.role]})`); break; }
    case "delStaff":{ const s=cfg.staff[i];
      if(s.id===state.user.id){ toast(T("ລຶບບັນຊີທີ່ກຳລັງໃຊ້ຢູ່ບໍ່ໄດ້","You can't delete the account that's signed in"),"i-alert",true); return; }
      if(s.role==="owner"&&cfg.staff.filter(x=>x.role==="owner").length<=1){ toast(T("ຕ້ອງມີເຈົ້າຂອງຮ້ານຢ່າງໜ້ອຍ 1 ຄົນ","There must be at least 1 owner"),"i-alert",true); return; }
      if(!(await confirmBox(`${T("ລຶບ","Delete")} ${esc(s.name)}?`,T("ພະນັກງານຄົນນີ້ຈະເຂົ້າສູ່ລະບົບບໍ່ໄດ້ອີກ ປະຫວັດໃນ Audit log ຍັງຢູ່","This person won't be able to sign in again; their Audit log history stays"),T("ລຶບ","Delete"),true))) return;
      cfg.staff.splice(i,1); log("staff",`${T("ລຶບພະນັກງານ","Delete staff")} ${s.name}`); break; }
    case "addCat":{ const r=await openDyn({cls:"w-sm",title:T("ເພີ່ມໝວດໝູ່","Add category"),body:`<div><label class="label" for="ncn">${T("ຊື່ໝວດ","Category name")}</label><input class="inp" id="ncn" name="th" required></div><div><label class="label" for="nce">English</label><input class="inp" id="nce" name="en"></div>`,actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:T("ເພີ່ມ","Add"),value:"ok",cls:"btn-gold"}]});
      if(r.value!=="ok") return; cfg.cats.push({id:uid("c"),th:r.data.th.trim(),en:r.data.en||"",station:"bar",icon:"x"}); log("settings",`${T("ເພີ່ມໝວດ","Add category")} ${r.data.th.trim()}`); break; }
    case "delCat":{ const c=cfg.cats[i]; cfg.cats.splice(i,1); cfg.hh.cats=cfg.hh.cats.filter(x=>x!==c.id); if(state.cat===c.id) state.cat="all"; log("settings",`${T("ລຶບໝວດ","Delete category")} ${c.th}`); break; }
    case "addProd": editProduct(null); return;
    case "editProd": editProduct(i); return;
    case "delProd":{ const p=cfg.products[i]; if(!(await confirmBox(`${T("ລຶບ","Delete")} ${esc(p.name)}?`,T("ສິນຄ້າຈະຫາຍຈາກເມນູຖາວອນ (ຖ້າແຄ່ຊົ່ວຄາວໃຫ້ໃຊ້ “ເຊື່ອງ” ຫຼື “ໝົດ” ແທນ)","The product will be removed from the menu for good (for a temporary change use “Hide” or “Sold out”)"),T("ລຶບ","Delete"),true))) return; cfg.products.splice(i,1); log("product",`${T("ລຶບສິນຄ້າ","Delete product")} ${p.name} (${kip(p.price)})`); break; }
    case "addDisc": cfg.discounts.push({id:uid("d"),label:T("ສ່ວນຫຼຸດໃໝ່ 15%","New discount 15%"),type:"pct",value:15}); log("settings",T("ເພີ່ມສ່ວນຫຼຸດ “ສ່ວນຫຼຸດໃໝ່ 15%”","Added discount “New discount 15%”")); break;
    case "delDisc":{ const d=cfg.discounts[i]; cfg.discounts.splice(i,1); log("settings",`${T("ລຶບສ່ວນຫຼຸດ","Delete discount")} ${d.label}`); break; }
    case "addBank": cfg.pay.banks.push({id:uid("k"),name:T("ທະນາຄານໃໝ່","New bank"),acc:"",accName:cfg.shop.name.toUpperCase(),on:false}); log("settings",T("ເພີ່ມບັນຊີທະນາຄານ","Added bank account")); break;
    case "delBank":{ const k=cfg.pay.banks[i]; if(!(await confirmBox(`${T("ລຶບບັນຊີ","Delete account")} ${esc(k.name)}?`,T("QR ຂອງບັນຊີນີ້ຈະບໍ່ສະແດງໃນໜ້າຊຳລະເງິນອີກ","This account's QR will no longer show on the payment page"),T("ລຶບ","Delete"),true))) return; cfg.pay.banks.splice(i,1); log("settings",`${T("ລຶບບັນຊີ","Delete account")} ${k.name}`); break; }
    case "addZone": cfg.zones.push({id:uid("z"),name:T("ໂຊນໃໝ່","New zone")}); log("settings",T("ເພີ່ມໂຊນ","Add zone")); break;
    case "delZone":{ const z=cfg.zones[i]; cfg.zones.splice(i,1); log("settings",`${T("ລຶບໂຊນ","Delete zone")} ${z.name}`); break; }
    case "addTable":{ const n=cfg.tables.length+1; cfg.tables.push({id:uid("t"),name:"T"+n,zone:cfg.zones[0]?.id,seats:4,on:true}); log("settings",`${T("ເພີ່ມໂຕະ","Add table")} T${n}`); break; }
    case "delTable":{ const t=cfg.tables[i]; if(state.bills.some(b=>b.table===t.id&&b.status!=="paid")){ toast(T("ໂຕະນີ້ມີບິນຄ້າງຢູ່","This table has an open bill"),"i-alert",true); return; } cfg.tables.splice(i,1); log("settings",`${T("ລຶບໂຕະ","Delete table")} ${t.name}`); break; }
    case "testSheets": await pushDayToSheets(true); return;
    case "pushCfg": await pushConfig(true); return;
    case "pullCfg": await pullConfig({manual:true,force:true}); return;
    case "testPrint": toast(`${T("ພິມທົດສອບ","Test print")} → ${cfg.printer.receipt}`,"i-print"); return;
    case "reset": if(await confirmBox(T("ເລີ່ມໃໝ່ທັງໝົດ?","Start over?"),T("ລ້າງບິນ ອໍເດີ ຍອດຂາຍ ຝາກຂວດ ແລະ Audit log ທັງໝົດ ແລະ ກັບໄປການຕັ້ງຄ່າເລີ່ມຕົ້ນ · ເລກອໍເດີ້ເລີ່ມ 0001 ໃໝ່ ແລະ ຈະຖາມເງິນທອນເລີ່ມຕົ້ນຕອນເຂົ້າລະບົບ","Clears all bills, orders, sales, kept bottles and the Audit log, and restores default settings · order numbers restart at 0001 and the opening change is asked at sign-in"),T("ເລີ່ມໃໝ່","Start over"),true)){ try{localStorage.removeItem(KEY);}catch(e){} location.hash=""; location.reload(); } return;
  }
  save(); applyBrand(); renderSettings();
});
$("#logoFile").addEventListener("change",async e=>{ const raw=await readFile(e.target.files[0]); e.target.value=""; if(!raw) return; const img=await shrink(raw,320,"image/png"); if(!img){ toast(T("ອ່ານຮູບບໍ່ໄດ້","Couldn't read the image"),"i-alert",true); return; } cfg.shop.logo=img; log("settings",T("ອັບໂຫຼດໂລໂກ້ໃໝ່","Upload new logo")); save(); applyBrand(); renderSettings(); });

async function editProduct(i){
  const isNew=i==null;
  const draft=isNew?{id:uid("p"),cat:cfg.cats[0]?.id,name:"",sub:"",price:0,opts:[],hidden:false,soldOut:false,stock:null,min:0,keep:false}:structuredClone(cfg.products[i]);
  const ogHTML=()=>draft.opts.map((g,gi)=>`<div class="og">
      <div style="display:grid;grid-template-columns:1fr 160px 40px;gap:8px;align-items:center">
        <input class="inp sm" data-og="${gi}" data-f="name" value="${esc(g.name)}" placeholder="${T("ຊື່ກຸ່ມ ເຊັ່ນ ຄວາມຫວານ, ຂະໜາດຂວດ","Group name, e.g. Sweetness, Bottle size")}" aria-label="${T("ຊື່ກຸ່ມຕົວເລືອກ","Option group name")}">
        <select class="inp sm" data-og="${gi}" data-f="type" aria-label="${T("ປະເພດ","Type")}"><option value="one" ${g.type==="one"?"selected":""}>${T("ເລືອກໄດ້","Pick")} 1</option><option value="many" ${g.type==="many"?"selected":""}>${T("ເລືອກໄດ້ຫຼາຍອັນ","Pick several")}</option></select>
        <button type="button" class="btn btn-ghost icon-btn sm" data-delog="${gi}" aria-label="${T("ລຶບກຸ່ມ","Delete group")}">${icon("i-trash","sm")}</button>
      </div>
      ${g.choices.map((c,ci)=>`<div class="og-row"><input class="inp sm" data-og="${gi}" data-ci="${ci}" data-f="label" value="${esc(c.label)}" placeholder="${T("ຊື່ຕົວເລືອກ","Option name")}" aria-label="${T("ຊື່ຕົວເລືອກ","Option name")}"><input class="inp sm num" data-og="${gi}" data-ci="${ci}" data-f="delta" value="${c.delta}" inputmode="numeric" placeholder="+${T("ລາຄາ","Price")}" aria-label="${T("ລາຄາເພີ່ມ (ກີບ)","Extra price (kip)")}"><button type="button" class="btn btn-ghost icon-btn sm" data-delch="${gi}:${ci}" aria-label="${T("ລຶບຕົວເລືອກ","Delete option")}">${icon("i-x","sm")}</button></div>`).join("")}
      <button type="button" class="btn btn-sm" data-addch="${gi}" style="align-self:flex-start">${icon("i-plus","xs")}${T("ເພີ່ມຕົວເລືອກ","Add option")}</button>
    </div>`).join("")||`<p class="muted small" style="margin:0">${T("ບໍ່ມີຕົວເລືອກ — ແຕະແລ້ວລົງບິນທັນທີ","No options — tapping adds it to the bill straight away")}</p>`;
  const r=await openDyn({cls:"w-lg",eyebrow:isNew?T("ສິນຄ້າໃໝ່","New product"):T("ແກ້ໄຂສິນຄ້າ","Edit product"),title:isNew?T("ເພີ່ມສິນຄ້າ","Add product"):esc(draft.name),
    body:`<div class="form-grid">
      <div><label class="label" for="pn">${T("ຊື່ສິນຄ້າ","Product name")}</label><input class="inp" id="pn" name="name" required value="${esc(draft.name)}"></div>
      <div><label class="label" for="ps">${T("ຊື່ຮອງ / ພາສາອື່ນ","Subtitle / other language")}</label><input class="inp" id="ps" name="sub" value="${esc(draft.sub)}"></div>
      <div><label class="label" for="pc">${T("ໝວດໝູ່","Categories")}</label><select class="inp" id="pc" name="cat">${cfg.cats.map(c=>`<option value="${c.id}" ${draft.cat===c.id?"selected":""}>${esc(c.th)}</option>`).join("")}</select></div>
      <div><label class="label" for="pp">${T("ລາຄາ (ກີບ)","Price (kip)")}</label><input class="inp num" id="pp" name="price" inputmode="numeric" required value="${draft.price||""}"></div>
      <div><label class="label" for="pst">${T("ສະຕັອກຄົງເຫຼືອ","Stock on hand")}</label><input class="inp num" id="pst" name="stock" inputmode="numeric" value="${draft.stock??""}" placeholder="${T("ປະວ່າງ","Leave blank")} = ${T("ບໍ່ນັບສະຕັອກ","don't track stock")}"><div class="help">${T("ເຫຼືອ 0 ລະບົບຕັ້ງເປັນ “ໝົດ” ໃຫ້ເອງ","At 0 it's marked “Sold out” automatically")}</div></div>
      <div><label class="label" for="pmin">${T("ຂັ້ນຕ່ຳ (ເຕືອນສະຕັອກຕ່ຳ)","Minimum (low-stock warning)")}</label><input class="inp num" id="pmin" name="min" inputmode="numeric" value="${draft.min||0}"></div>
      <label class="switch"><span>${T("ໝົດ (ຂຶ້ນປ້າຍໝົດທີ່ເມນູ)","Sold out (shows the label on the menu)")}</span><input type="checkbox" class="tog" name="soldOut" ${draft.soldOut?"checked":""}></label>
      <label class="switch"><span>${T("ເຊື່ອງຈາກເມນູ","Hidden from menu")}</span><input type="checkbox" class="tog" name="hidden" ${draft.hidden?"checked":""}></label>
      <label class="switch full"><span>${T("ຮັບຝາກຂວດໄດ້ (ສະແດງໃນໜ້າຝາກຂວດ)","Can be kept (shown on the bottle page)")}</span><input type="checkbox" class="tog" name="keep" ${draft.keep?"checked":""}></label>
    </div>
    <div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap"><span class="label" style="margin:0">${T("ຕົວເລືອກຂອງສິນຄ້າ (ເຊັ່ນ ຄວາມຫວານ ຄວາມເຜັດ ຂວດກາງ/ໃຫຍ່)","Product options (e.g. sweetness, spiciness, medium/large bottle)")}</span><button type="button" class="btn btn-sm" data-addog>${icon("i-plus","xs")}${T("ເພີ່ມກຸ່ມຕົວເລືອກ","Add option group")}</button></div>
      <div id="ogs" style="display:flex;flex-direction:column;gap:10px">${ogHTML()}</div>
      <p class="help">“+${T("ລາຄາ” ຄືລາຄາທີ່ບວກເພີ່ມຈາກລາຄາຫຼັກ (ໃສ່ 0 ຖ້າບໍ່ເພີ່ມ · ຕິດລົບໄດ້)","price” is added to the base price (enter 0 for none · negatives allowed)")}</p></div>`,
    actions:[{label:T("ຍົກເລີກ","Cancel"),value:"cancel"},{label:isNew?T("ເພີ່ມສິນຄ້າ","Add product"):T("ບັນທຶກ","Save"),value:"ok",cls:"btn-gold",icon:"i-check"}],
    mount(el){
      const box=$("#ogs",el), redraw=()=>box.innerHTML=ogHTML();
      el.addEventListener("click",ev=>{ const t=ev.target;
        if(t.closest("[data-addog]")){ draft.opts.push({name:"",type:"one",choices:[{label:"",delta:0}]}); redraw(); }
        else if(t.closest("[data-delog]")){ draft.opts.splice(+t.closest("[data-delog]").dataset.delog,1); redraw(); }
        else if(t.closest("[data-addch]")){ draft.opts[+t.closest("[data-addch]").dataset.addch].choices.push({label:"",delta:0}); redraw(); }
        else if(t.closest("[data-delch]")){ const [g,c]=t.closest("[data-delch]").dataset.delch.split(":").map(Number); draft.opts[g].choices.splice(c,1); redraw(); } });
      el.addEventListener("input",ev=>{ const t=ev.target; if(t.dataset.og==null) return; const g=draft.opts[+t.dataset.og];
        if(t.dataset.ci!=null){ const c=g.choices[+t.dataset.ci]; if(t.dataset.f==="delta") c.delta=Number(t.value.replace(/[^\d-]/g,""))||0; else c.label=t.value; }
        else if(t.dataset.f==="name") g.name=t.value; });
      el.addEventListener("change",ev=>{ const t=ev.target; if(t.dataset.og!=null&&t.dataset.f==="type") draft.opts[+t.dataset.og].type=t.value; });
    }});
  if(r.value!=="ok") return;
  const d=r.data, price=Number(String(d.price).replace(/[^\d]/g,""));
  if(!d.name.trim()||!price){ toast(T("ໃສ່ຊື່ ແລະ ລາຄາໃຫ້ຄົບ","Enter a name and a price"),"i-alert",true); return; }
  const np={...draft,name:d.name.trim(),sub:d.sub.trim(),cat:d.cat,price,stock:String(d.stock).trim()===""?null:Number(String(d.stock).replace(/[^\d]/g,"")),min:Number(String(d.min).replace(/[^\d]/g,""))||0,soldOut:!!d.soldOut,hidden:!!d.hidden,keep:!!d.keep,
    opts:draft.opts.map(g=>({...g,name:g.name.trim()||T("ຕົວເລືອກ","options:"),choices:g.choices.filter(c=>c.label.trim())})).filter(g=>g.choices.length)};
  if(np.stock===0) np.soldOut=true;
  if(isNew){ cfg.products.push(np); log("product",`${T("ເພີ່ມສິນຄ້າ","Added product")} ${np.name} · ${catOf(np.cat).th} · ${kip(np.price)}`); toast(`${T("ເພີ່ມ","Added")} ${np.name} ${T("ແລ້ວ — ແສດງໃນເມນູທັນທີ","— now on the menu")}`,"i-check"); }
  else{ const old=cfg.products[i];
    if(old.price!==np.price) log("price",`${np.name} ${T("ລາຄາ","Price")} ${fmt(old.price)} → ${fmt(np.price)} ₭`);
    const ch=[]; if(old.name!==np.name) ch.push(`${T("ຊື່","Name")} “${old.name}” → “${np.name}”`); if(old.cat!==np.cat) ch.push(`${T("ໝວດ","Category")} ${catOf(old.cat).th} → ${catOf(np.cat).th}`); if(JSON.stringify(old.opts)!==JSON.stringify(np.opts)) ch.push(T("ແກ້ຕົວເລືອກ","Edited options")); if(old.stock!==np.stock) ch.push(`${T("ສະຕັອກ","Stock")} ${old.stock??"-"} → ${np.stock??"-"}`); if(old.soldOut!==np.soldOut) ch.push(np.soldOut?T("ຕັ້ງເປັນໝົດ","Mark sold out"):T("ເປີດຂາຍ","Put on sale")); if(old.hidden!==np.hidden) ch.push(np.hidden?T("ເຊື່ອງ","Hide"):T("ສະແດງ","Show"));
    if(ch.length) log("product",`${np.name}: ${ch.join(" · ")}`);
    cfg.products[i]=np; toast(T("ບັນທຶກສິນຄ້າແລ້ວ","Product saved"),"i-check"); }
  save(); renderSettings();
}


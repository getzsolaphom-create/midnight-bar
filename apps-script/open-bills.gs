// ===================================================================
// Midnight Bar — ເພີ່ມເຂົ້າ Apps Script ເດີມ: ເບິ່ງບິນທີ່ເປີດຢູ່ຈາກເຄື່ອງອື່ນ
// ໄຟລ໌ນີ້ບໍ່ມີ TOKEN ຈຶ່ງອັບຂຶ້ນ GitHub ໄດ້ ແຕ່ຢ່າວາງ TOKEN ຈິງລົງໃນໄຟລ໌ນີ້
// ===================================================================
//
// ວິທີໃຊ້ (ເຮັດຄັ້ງດຽວ):
//  1) ວາງທັງໄຟລ໌ນີ້ຕໍ່ທ້າຍໂຄດ Apps Script ເດີມ (ຢ່າລຶບຂອງເກົ່າ)
//  2) ໃນຟັງຊັນ doPost ເດີມ ເພີ່ມແຖວນີ້ "ກ່ອນ" ແຖວ  if (d.token !== TOKEN) ...
//         if (d.action === "putOpen") return reply(putOpen_(d));
//  3) ໃນຟັງຊັນ doGet ເດີມ ເພີ່ມແຖວນີ້ "ກ່ອນ" ແຖວ  if (p.action !== "config" ...
//         if (p.action === "open" && p.k === OPEN_KEY) return out(readOpen_());
//  4) Deploy › Manage deployments › ໄອຄອນດິນສໍ › Version: New version › Deploy
//     (ຢ່າກົດ New deployment ເພາະຈະໄດ້ URL ໃໝ່)
//
// ຄວາມປອດໄພ: OPEN_KEY ຢູ່ໃນໂຄດແອັບສາທາລະນະ (ບໍ່ແມ່ນຄວາມລັບ) ຄືກັບ READ_KEY
// ຂໍ້ມູນທີ່ເກັບມີແຕ່ ໂຕະ · ຊື່ພະນັກງານທີ່ເປີດບິນ · ລາຍການ · ຍອດ ຂອງບິນທີ່ຍັງບໍ່ໄດ້ຈ່າຍ
// ຖ້າຢາກເຄັ່ງຂຶ້ນ ໃຫ້ຮັກສາ URL ຂອງ Apps Script ເປັນຄວາມລັບ

const OPEN_KEY = "mb-open";              // ຕ້ອງຕົງກັບ LIVE_KEY ໃນ js/live.js
const OPEN_MAX_AGE_MS = 24 * 3600 * 1000; // ລຶບພາບຖ່າຍຂອງເຄື່ອງທີ່ບໍ່ສົ່ງມາເກີນ 24 ຊົ່ວໂມງ
const OPEN_CACHE_S = 8;                  // ແຄຊຜົນອ່ານ 8 ວິນາທີ — ຫຼຸດການອ່ານ Properties

function putOpen_(d) {
  if (d.k !== OPEN_KEY) return { ok: false, error: "bad key" };
  const id = String(d.id || "").replace(/[^\w-]/g, "").slice(0, 16);
  if (!id) return { ok: false, error: "no id" };
  const val = JSON.stringify({
    id: id,
    user: String(d.user || "").slice(0, 40),
    at: Date.now(),                               // ໃຊ້ເວລາຂອງ server ບໍ່ເຊື່ອເວລາເຄື່ອງ
    bills: Array.isArray(d.bills) ? d.bills.slice(0, 60) : []
  });
  if (val.length > 8500) return { ok: false, error: "too big" };   // ຂີດຈຳກັດ ~9 KB ຕໍ່ 1 ຄ່າ
  PropertiesService.getScriptProperties().setProperty("open_" + id, val);
  CacheService.getScriptCache().remove("open_all");
  return { ok: true };
}

function readOpen_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("open_all");
  if (hit) return JSON.parse(hit);
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const now = Date.now(), devices = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf("open_") !== 0) return;
    try {
      const v = JSON.parse(all[k]);
      if (now - v.at > OPEN_MAX_AGE_MS) props.deleteProperty(k); else devices.push(v);
    } catch (e) { props.deleteProperty(k); }
  });
  const out = { ok: true, now: now, devices: devices };
  try { cache.put("open_all", JSON.stringify(out), OPEN_CACHE_S); } catch (e) {}
  return out;
}

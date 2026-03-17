/* ========================================
   CREATE SKP REQUEST — Multi-Step Wizard
   ======================================== */

// ===== DOM References =====
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modal");
const btnNext = document.getElementById("btnNext");
const btnBack = document.getElementById("btnBack");
const btnCancel = document.getElementById("btnCancel");
const toast = document.getElementById("toast");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

const WA_META_CONFIG = {
  wabaId: "703855955883005",
  apiVersion: "v25.0",
  token: "EAAb9ZAeZAEqcsBO5lQfMqqzAE4hhjBbKfBh02UW3f9i8klDhLcbYzCEJGh7OEBFgLghwRZCF91MB5YaFQ9lubWQUxCz4hfofqH4ZCMoO1d75RcQQewtSdrrk70oI59KL0ZC4ZCaohOkn7JBxnYqIINWCD5KZAAsTHdxantMZCECNMPSK28yFbeDGBGqEbX17ryr8ygZDZD",
};

let waTemplates = [];
let filteredWaTemplates = [];
let selectedWaTemplate = null;
const waTemplateListEl = document.getElementById("waTemplateList");
const waTemplateSearchEl = document.getElementById("waTemplateSearch");
const waTemplateLoadingEl = document.getElementById("waTemplateLoading");
const waTemplateErrorEl = document.getElementById("waTemplateError");
const waTemplatePreviewBodyEl = document.getElementById("waTemplatePreviewBody");
const waTemplatePreviewHeaderEl = document.getElementById("waTemplatePreviewHeader");
const waTemplateSelectedNameEl = document.getElementById("waTemplateSelectedName");
const waTemplateCategoryTagEl = document.getElementById("waTemplateCategoryTag");
const waTemplateActionBtn = document.getElementById("btnUseTemplate");
const waTemplateUsedLabelEl = document.getElementById("waTemplateUsedLabel");
const waChatEmptyEl = document.getElementById("waChatEmpty");
const waChatBubbleEl = document.getElementById("waChatBubble");

const BRAND_DATA_INDOFOOD = {
  indomie: { label: "Indomie", categories: { mie_instant: true, kebutuhan_dapur: true, makanan_ringan: true } },
  pop_mie: { label: "Pop Mie", categories: { mie_instant: true, kebutuhan_dapur: true, minuman: true } },
  chitato: { label: "Chitato", categories: { makanan_ringan: true, kebutuhan_dapur: true } },
  indomilk: { label: "Indomilk", categories: { susu_dairy: true, minuman: true } },
  cap_enaka: { label: "Cap Enaak", categories: { susu_dairy: true } },
  taro: { label: "Taro", categories: { makanan_ringan: true } },
  promina: { label: "Promina", categories: { susu_dairy: true, makanan_ringan: true } },
  bumbu_racik: { label: "Bumbu Racik", categories: { kebutuhan_dapur: true } },
  bimoli: { label: "Bimoli", categories: { kebutuhan_dapur: true } },
  qtela: { label: "Qtela", categories: { makanan_ringan: true } },
  ichi_ocha: { label: "Ichi Ocha", categories: { minuman: true } },
  club: { label: "Club", categories: { minuman: true } },
  milkuat: { label: "Milkuat", categories: { susu_dairy: true, minuman: true } },
  palmia: { label: "Palmia", categories: { kebutuhan_dapur: true } }
};

function populateDropdownBrand(dropdownId, includeAll = true, excludedBrands = []) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  let html = "";
  if (includeAll) html += '<div class="combobox-option" data-value="all">All Brands</div>';
  Object.keys(BRAND_DATA_INDOFOOD).forEach((brandKey) => {
    if (excludedBrands.includes(brandKey)) return;
    html += `<div class="combobox-option" data-value="${brandKey}">${BRAND_DATA_INDOFOOD[brandKey].label}</div>`;
  });
  dropdown.innerHTML = html;
}

function populateDropdownDC(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  dropdown.innerHTML = "";
  const dcs = ["DC Tangerang", "DC Cileungsi", "DC Balaraja", "DC Parung", "DC Bekasi", "DC Jakarta", "DC Bogor"];
  dcs.forEach(dc => {
    const opt = document.createElement("div");
    opt.className = "combobox-option";
    opt.dataset.value = dc.toLowerCase().replace(/\s+/g, '_');
    opt.textContent = dc;
    dropdown.appendChild(opt);
  });
}

function populateDropdownCategory(dropdownId, selectedBrands, isMulti = false) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  let html = isMulti ? '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>' : '';
  let cats = new Set();
  const brandsArr = Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands];
  brandsArr.forEach(b => {
    if (BRAND_DATA_INDOFOOD[b]) Object.keys(BRAND_DATA_INDOFOOD[b].categories).forEach(c => cats.add(c));
  });
  cats.forEach(c => {
    const label = c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    html += `<div class="combobox-option" data-value="${c}">${label}</div>`;
  });
  dropdown.innerHTML = html;
}

function populateDropdownPLU(dropdownId, selectedBrands, selectedCats) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  let html = '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>';
  const brandsArr = Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands];
  const catsArr = Array.isArray(selectedCats) ? selectedCats : [selectedCats];
  if (catsArr.includes('all')) { dropdown.innerHTML = html; return; }
  brandsArr.forEach(b => {
    if (indofoodData && indofoodData[b]) {
      const targetCats = (catsArr.length === 0 || catsArr.includes('all')) ? Object.keys(indofoodData[b]) : catsArr;
      targetCats.forEach(c => {
        const items = indofoodData[b][c];
        if (items && items.length) {
          items.forEach(plu => {
            const code = typeof plu === 'string' ? '' : (plu.code || '');
            const name = typeof plu === 'string' ? plu : (plu.name || '');
            const val = code || name.toLowerCase().replace(/\s+/g, '_');
            const label = code ? `${code} - ${name}` : name;
            if (!html.includes(`data-value="${val}"`)) html += `<div class="combobox-option" data-value="${val}">${label}</div>`;
          });
        }
      });
    }
  });
  dropdown.innerHTML = html;
}

const steps = document.querySelectorAll(".stepper .step");
const stepLines = document.querySelectorAll(".stepper .step-line");
const formSteps = document.querySelectorAll(".form-step");

let currentStep = 1;
const totalSteps = 3;
let currentPage = 'list';

const KOTA_DATA = {
  dki_jakarta: ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Jakarta Barat"],
  jawa_barat: ["Bandung", "Bogor", "Depok", "Bekasi", "Cirebon", "Sukabumi", "Karawang", "Tasikmalaya"],
  jawa_tengah: ["Semarang", "Surakarta", "Magelang", "Tegal", "Salatiga", "Purwokerto"],
  jawa_timur: ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Kediri", "Jember"],
  banten: ["Tangerang", "Serang", "Cilegon", "Tangerang Selatan", "Pandeglang", "Lebak"]
};

function setupLocationDependency(provCbId, kotaCbId) {
  const provContainer = document.getElementById(provCbId);
  const kotaContainer = document.getElementById(kotaCbId);
  if (!provContainer || !kotaContainer) return;
  initSearchableCombobox(provCbId, (val) => {
    const dropdownKota = kotaContainer.querySelector('.combobox-dropdown');
    const inputKota = kotaContainer.querySelector('.combobox-input');
    const hiddenKota = kotaContainer.querySelector('input[type="hidden"]');
    hiddenKota.value = '';
    inputKota.value = '';
    inputKota.classList.remove('has-value');
    dropdownKota.innerHTML = '';
    const clearBtn = kotaContainer.querySelector('.combobox-clear');
    if (clearBtn) clearBtn.remove();
    if (val && KOTA_DATA[val]) {
      KOTA_DATA[val].forEach(city => {
        const cityVal = city.toLowerCase().replace(/\s+/g, '_');
        const opt = document.createElement('div');
        opt.className = 'combobox-option';
        opt.dataset.value = cityVal;
        opt.textContent = city;
        dropdownKota.appendChild(opt);
      });
    }
    if (kotaContainer._onSearchableChange) kotaContainer._onSearchableChange('', '');
  });
  initSearchableCombobox(kotaCbId);
}

document.addEventListener('DOMContentLoaded', () => {
  setupLocationDependency('comboboxProvinsiSegment', 'comboboxKotaSegment');
  setupLocationDependency('comboboxProvinsiHist', 'comboboxKotaHist');
  initSearchableCombobox('comboboxDCSegment');
  initSearchableCombobox('comboboxDCHist');
});

let globalRowCount = 0;

function refreshAllBrandDropdowns(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = container.querySelectorAll('.targeting-row');
  rows.forEach(row => {
    const brandInputId = row.querySelector('.combobox-brand-target').id;
    const brandDropdownId = brandInputId.replace('cbBrand_', 'ddBrand_');
    const otherBrands = [];
    rows.forEach(otherRow => {
      if (otherRow !== row) {
        const val = otherRow.querySelector('.row-brand-val').value;
        if (val) otherBrands.push(val);
      }
    });
    populateDropdownBrand(brandDropdownId, false, otherBrands);
  });
}

function addTargetingRow(containerId, typePrefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  globalRowCount++;
  const rowIndex = globalRowCount;
  const rowId = `${typePrefix}_${rowIndex}`;
  const rowHtml = `
    <div class="targeting-row ${typePrefix}-row" id="${rowId}">
      <div class="col-brand">
        <span class="col-header-label">BRAND</span>
        <div class="searchable-combobox combobox-brand-target" id="cbBrand_${rowIndex}">
          <input type="hidden" class="row-brand-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Brand" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddBrand_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-category">
        <span class="col-header-label">CATEGORY</span>
        <div class="searchable-combobox combobox-category-target" id="cbCat_${rowIndex}" data-max="1">
          <input type="hidden" class="row-cat-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Category" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddCat_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-plu">
        <span class="col-header-label">PLU</span>
        <div class="searchable-combobox combobox-plu-target" id="cbPLU_${rowIndex}">
          <input type="hidden" class="row-plu-val" value="">
          <div class="combobox-input-wrapper"><div class="combobox-chips"></div><input type="text" class="combobox-input" placeholder="Select PLU" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddPLU_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-action">
        <span class="col-header-label" style="visibility: hidden;">ACTION</span>
        <button type="button" class="btn-remove-target-outline" onclick="removeTargetRow('${rowId}', '${containerId}')" title="Remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', rowHtml);
  refreshAllBrandDropdowns(containerId);
  initSearchableCombobox(`cbBrand_${rowIndex}`, (brandVal) => {
    const catDropdownId = `ddCat_${rowIndex}`;
    populateDropdownCategory(catDropdownId, brandVal ? [brandVal] : [], false);
    const ddCat = document.getElementById(catDropdownId);
    if (ddCat) ddCat.insertAdjacentHTML('afterbegin', '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>');
    resetMultiSelectCombobox(`cbCat_${rowIndex}`);
    resetMultiSelectCombobox(`cbPLU_${rowIndex}`);
    if (brandVal) populateDropdownPLU(`ddPLU_${rowIndex}`, [brandVal], []);
    refreshAllBrandDropdowns(containerId);
    updateTargetedAudienceVisibility();
  });
  initMultiSelectCombobox(`cbCat_${rowIndex}`, () => {
    const brandValCurrent = document.querySelector(`#cbBrand_${rowIndex} .row-brand-val`)?.value;
    const catVals = (document.querySelector(`#cbCat_${rowIndex} input[type="hidden"]`)?.value || '').split(',').filter(v => v && v !== 'all');
    populateDropdownPLU(`ddPLU_${rowIndex}`, [brandValCurrent], catVals);
    resetMultiSelectCombobox(`cbPLU_${rowIndex}`);
    updateTargetedAudienceVisibility();
    checkStepCompletion();
  });
  initMultiSelectCombobox(`cbPLU_${rowIndex}`, () => { updateTargetedAudienceVisibility(); });
}

function populateAffinityCategories() {
  const dropdown = document.getElementById('dropdownAffinityCategory');
  if (!dropdown) return;
  let html = '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>';
  const allCats = new Set();
  Object.values(competitorData || {}).forEach(brandObj => Object.keys(brandObj).forEach(cat => allCats.add(cat)));
  allCats.forEach(cat => {
    const label = cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    html += `<div class="combobox-option" data-value="${cat}">${label}</div>`;
  });
  dropdown.innerHTML = html;
}

function toggleAffinityFields() {
  const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
  const catGroup = document.getElementById('affinityCompetitorCategoryGroup');
  const pluGroup = document.getElementById('affinityCompetitorPLUGroup');
  if (affinityBy === 'categories') {
    if (catGroup) catGroup.style.display = 'block';
    if (pluGroup) pluGroup.style.display = 'none';
    resetMultiSelectCombobox('comboboxAffinityPLU');
  } else {
    if (catGroup) catGroup.style.display = 'none';
    if (pluGroup) pluGroup.style.display = 'block';
    resetMultiSelectCombobox('comboboxAffinityCategory');
    populateAffinityPLUs(null);
  }
  updateAffinitySelection();
}

function populateAffinityPLUs(selectedCats) {
  const dropdown = document.getElementById('dropdownAffinityPLU');
  if (!dropdown) return;
  let html = '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>';
  const catsArr = typeof selectedCats === 'string' ? (selectedCats ? selectedCats.split(',') : []) : (selectedCats || null);
  Object.values(competitorData || {}).forEach(brandObj => {
    if (catsArr === null) {
      Object.values(brandObj).forEach(items => {
        items.forEach(item => {
          const code = item.code || '', name = item.name || '';
          const val = code || name.toLowerCase().replace(/\s+/g, '_');
          const label = code ? `${code} - ${name}` : name;
          if (!html.includes(`data-value="${val}"`)) html += `<div class="combobox-option" data-value="${val}">${label}</div>`;
        });
      });
    } else {
      catsArr.forEach(cat => {
        const items = brandObj[cat];
        if (items && items.length) {
          items.forEach(item => {
            const code = item.code || '', name = item.name || '';
            const val = code || name.toLowerCase().replace(/\s+/g, '_');
            const label = code ? `${code} - ${name}` : name;
            if (!html.includes(`data-value="${val}"`)) html += `<div class="combobox-option" data-value="${val}">${label}</div>`;
          });
        }
      });
    }
  });
  dropdown.innerHTML = html;
}

function removeAffinityTargetRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  updateAffinitySelection();
}

function removeTargetRow(rowId, containerId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  refreshAllBrandDropdowns(containerId);
  updateTargetedAudienceVisibility();
}

function resetSearchableCombobox(id) {
  const container = document.getElementById(id);
  if (!container) return;
  const input = container.querySelector('.combobox-input');
  const hidden = container.querySelector('input[type="hidden"]');
  if (input) { input.value = ''; input.classList.remove('has-value'); }
  if (hidden) hidden.value = '';
  const dropdown = container.querySelector('.combobox-dropdown');
  if (dropdown) dropdown.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
}

let currentDetailId = null;
let editingSkpId = null;

// ===== SKP Data Store =====
let skpIdCounter = 8;
const skpStore = [
  {
    id: 1,
    name: "Indofood Thank You & Cross-Sell (Week 1)",
    description: "Campaign ucapan terima kasih dan cross-sell untuk pelanggan Indofood",
    idea: "Memberikan voucher discount setelah pembelian produk Indomie",
    campaignTypeDD: "voucher",
    promotionType: "affinity",
    temaPromosi: "Promo Terima Kasih Pelanggan Setia",
    bentukPromosi: "potongan_harga",
    mekanisme: "Diskon 15% untuk pembelian produk Indofood kategori Kebutuhan Dapur",
    brand: "Indomie", category: "Kebutuhan Dapur",
    startDate: "2026-03-04", endDate: "2026-03-14",
    status: "Approved", segment: "segment_b", submittedBy: "Rania Indofood",
    targetedType: "", targetedGroup: "", customerStatus: "", periodType: "",
    audience: 128500,
    logs: [
      { action: "Created", user: "Rania Indofood", time: "2026-03-01 09:15", type: "created", description: "SKP request dibuat" },
      { action: "Submitted", user: "Rania Indofood", time: "2026-03-01 09:20", type: "submitted", description: "SKP request di-submit untuk review" },
      { action: "Approved", user: "Admin Alfamart", time: "2026-03-02 14:30", type: "approved", description: "SKP request di-approve oleh admin" },
      { action: "Segment Selected", user: "Rania Indofood", time: "2026-03-03 10:00", type: "segment", description: "Segment B — Frequent Shoppers dipilih" },
    ]
  },
  {
    id: 2,
    name: "Indofood Sell (Week 2) - Upload",
    description: "Campaign targeted untuk meningkatkan penjualan Indofood minggu ke-2",
    idea: "", campaignTypeDD: "non_voucher", promotionType: "campaign_Type",
    temaPromosi: "Flash Sale Indofood", bentukPromosi: "gratis_produk",
    mekanisme: "Beli 2 gratis 1 untuk produk Chitato",
    brand: "Chitato", category: "Makanan Ringan",
    startDate: "2026-02-05", endDate: "2026-02-10",
    status: "Submitted", segment: "", submittedBy: "Rania Indofood",
    targetedType: "transaction", targetedGroup: "", customerStatus: "", periodType: "",
    audience: 45200,
    logs: [
      { action: "Created", user: "Rania Indofood", time: "2026-02-03 11:00", type: "created", description: "SKP request dibuat" },
      { action: "Submitted", user: "Rania Indofood", time: "2026-02-03 11:05", type: "submitted", description: "SKP request di-submit untuk review" },
    ]
  },
  {
    id: 3,
    name: "Indofood Sell (Week 3) - Promo",
    description: "Campaign promo produk Indofood minggu ke-3",
    idea: "Promo bundling antar produk Indofood", campaignTypeDD: "voucher", promotionType: "affinity",
    temaPromosi: "Bundling Hemat Indofood", bentukPromosi: "potongan_harga",
    mekanisme: "Diskon 20% untuk pembelian bundling Indomie + Chitato",
    brand: "Indomie, Chitato", category: "Kebutuhan Dapur, Makanan Ringan",
    startDate: "2026-01-24", endDate: "2026-01-27",
    status: "Rejected", segment: "", submittedBy: "Rania Indofood",
    targetedType: "", targetedGroup: "", customerStatus: "", periodType: "",
    audience: 95300,
    logs: [
      { action: "Created", user: "Rania Indofood", time: "2026-01-22 08:30", type: "created", description: "SKP request dibuat" },
      { action: "Submitted", user: "Rania Indofood", time: "2026-01-22 08:35", type: "submitted", description: "SKP request di-submit untuk review" },
      { action: "Rejected", user: "Admin Alfamart", time: "2026-01-23 16:45", type: "rejected", description: "SKP ditolak — Periode campaign terlalu pendek" },
    ]
  },
  {
    id: 4, name: "Chitato Party New Flavor", description: "Launch party for new Chitato flavors",
    status: "Approved", submittedBy: "Budi Chitato", startDate: "2026-04-01", endDate: "2026-04-15",
    templateStatus: 'Submitted', templateImage: 'https://placehold.co/600x400/1e293b/white?text=CHITATO+BANNER',
    selectedWaTemplate: { name: 'chitato_launch_promo', body: 'Halo Sobat Chitato! Cobain rasa baru Chitato Party sekarang juga. Dapatkan promo Beli 2 Gratis 1 hanya di Alfamart terdekat. Jangan sampai kehabisan!' },
    logs: [
      { action: "Approved", user: "Admin Alfamart", time: "2026-03-10 10:00", type: "approved" },
      { action: "Template Submitted", user: "Budi Chitato", time: "2026-03-15 11:30", type: "submitted" }
    ]
  },
  {
    id: 5, name: "Indomilk Kids School Promo", description: "Back to school promo for kids",
    status: "Approved", submittedBy: "Dewi Indomilk", startDate: "2026-05-01", endDate: "2026-05-31",
    templateStatus: 'Submitted', templateImage: 'https://placehold.co/600x400/3b82f6/white?text=INDOMILK+KIDS',
    selectedWaTemplate: { name: 'indomilk_kids_promo', body: 'Bekal sekolah jadi lebih seru dengan Indomilk Kids! Beli 1 karton dapatkan koleksi stiker eksklusif Avengers. Buruan ke Alfamart!' },
    logs: [
      { action: "Approved", user: "Admin Alfamart", time: "2026-03-12 09:00", type: "approved" },
      { action: "Template Submitted", user: "Dewi Indomilk", time: "2026-03-16 08:45", type: "submitted" }
    ]
  },
  {
    id: 6,
    name: "Indomilk Kids Promo - Voucher Ready Check",
    description: "Scenario: Voucher not available in BigQuery",
    status: "Approved",
    campaignTypeDD: "voucher",
    submittedBy: "Dewi Indomilk",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    templateStatus: 'Submitted',
    templateImage: 'https://placehold.co/600x400/3b82f6/white?text=BIGQUERY+CHECK',
    selectedWaTemplate: { name: 'voucher_promo_check_bq', body: 'Dapatkan voucher belanja Indomilk sekarang!' },
    voucherBigQuery: false,
    logs: [
      { action: "Approved", user: "Admin Alfamart", time: "2026-04-12 09:00", type: "approved" },
      { action: "Template Submitted", user: "Dewi Indomilk", time: "2026-05-16 08:45", type: "submitted" }
    ]
  },
  {
    id: 7,
    name: "Indofood Snack Promo - Assignment Check",
    description: "Scenario: Voucher not assigned to audience",
    status: "Approved",
    campaignTypeDD: "voucher",
    submittedBy: "Rania Indofood",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    templateStatus: 'Submitted',
    templateImage: 'https://placehold.co/600x400/f59e0b/white?text=ASSIGNMENT+CHECK',
    selectedWaTemplate: { name: 'snack_promo_check_assign', body: 'Voucher snack hemat untuk kamu!' },
    voucherBigQuery: true,
    voucherAssigned: false,
    logs: [
      { action: "Approved", user: "Admin Alfamart", time: "2026-05-12 09:00", type: "approved" },
      { action: "Template Submitted", user: "Rania Indofood", time: "2026-06-16 08:45", type: "submitted" }
    ]
  },
  {
    id: 8,
    name: "Bumbu Racik Promo - Data Cloud Check",
    description: "Scenario: Voucher not available in Data Cloud",
    status: "Approved",
    campaignTypeDD: "voucher",
    submittedBy: "Budi Bumbu",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    templateStatus: 'Submitted',
    templateImage: 'https://placehold.co/600x400/10b981/white?text=DATACLOUD+CHECK',
    selectedWaTemplate: { name: 'bumbu_promo_check_dc', body: 'Gunakan voucher bumbu racik di Alfamart!' },
    voucherBigQuery: true,
    voucherAssigned: true,
    voucherDataCloud: false,
    logs: [
      { action: "Approved", user: "Admin Alfamart", time: "2026-06-12 09:00", type: "approved" },
      { action: "Template Submitted", user: "Budi Bumbu", time: "2026-07-16 08:45", type: "submitted" }
    ]
  }
];

// ===== SKU Data =====
const indofoodData = {
  indomie: {
    kebutuhan_dapur: [
      { code: "IND_001", name: "Indomie Goreng Original" }, { code: "IND_002", name: "Indomie Soto Mie" },
      { code: "IND_003", name: "Indomie Ayam Bawang" }, { code: "IND_004", name: "Indomie Kari Ayam" },
      { code: "IND_005", name: "Indomie Rendang" }, { code: "IND_006", name: "Indomie Goreng Cabe Ijo" },
      { code: "IND_007", name: "Indomie Goreng Aceh" }, { code: "IND_008", name: "Indomie Seblak Hot Jeletot" },
      { code: "IND_009", name: "Indomie Rasa Ayam Spesial" }, { code: "IND_010", name: "Indomie Goreng Rasa Sambal Matah" },
    ],
    mie_instant: [
      { code: "IND_101", name: "Indomie Kuah Bakso Sapi" }, { code: "IND_102", name: "Indomie Kuah Kari Spesial" },
      { code: "IND_103", name: "Indomie Kuah Soto Banjar" }, { code: "IND_104", name: "Indomie Kuah Empal Gentong" },
      { code: "IND_105", name: "Indomie Kuah Coto Makassar" },
    ],
    makanan_ringan: [{ code: "IND_201", name: "Indomie Chips Rasa Rendang" }, { code: "IND_202", name: "Indomie Chips Rasa Ayam Bawang" }],
  },
  pop_mie: {
    kebutuhan_dapur: [
      { code: "PM_001", name: "Pop Mie Kuah Rasa Ayam" }, { code: "PM_002", name: "Pop Mie Kuah Rasa Baso" },
      { code: "PM_003", name: "Pop Mie Goreng Spesial" }, { code: "PM_004", name: "Pop Mie Kuah Pedes Dower" },
      { code: "PM_005", name: "Pop Mie Kari Ayam" }, { code: "PM_006", name: "Pop Mie Goreng Pedes Gledek" },
      { code: "PM_007", name: "Pop Mie Ayam Bawang" },
    ],
    mie_instant: [{ code: "PM_101", name: "Pop Mie Mini Rasa Soto" }, { code: "PM_102", name: "Pop Mie Mini Rasa Ayam Bawang" }, { code: "PM_103", name: "Pop Mie Mini Rasa Baso" }],
    minuman: [{ code: "PM_201", name: "Pop Mie Mineral Water 330ml" }]
  },
  indomilk: {
    susu_dairy: [
      { code: "IM_001", name: "Indomilk Kental Manis Putih 370g" }, { code: "IM_002", name: "Indomilk Kental Manis Cokelat 370g" },
      { code: "IM_003", name: "Indomilk UHT Full Cream 1L" }, { code: "IM_004", name: "Indomilk UHT Cokelat 1L" },
      { code: "IM_005", name: "Indomilk Kids UHT Strawberry 115ml" }, { code: "IM_006", name: "Indomilk Kids UHT Cokelat 115ml" },
      { code: "IM_007", name: "Indomilk Kids UHT Full Cream 115ml" }, { code: "IM_008", name: "Indomilk Steril Plain 189ml" },
      { code: "IM_009", name: "Indomilk Banana Milk 190ml" },
    ],
    minuman: [{ code: "IM_101", name: "Indomilk Good To Go Cokelat 250ml" }, { code: "IM_102", name: "Indomilk Good To Go Vanilla 250ml" }, { code: "IM_103", name: "Indomilk Jus Susu Jeruk 180ml" }, { code: "IM_104", name: "Indomilk Jus Susu Melon 180ml" }],
  },
  cap_enaka: { susu_dairy: [{ code: "CE_001", name: "Cap Enaak Krimer Kental Manis 370g" }, { code: "CE_002", name: "Cap Enaak Krimer Kental Manis Cokelat 370g" }, { code: "CE_003", name: "Cap Enaak Sachet Putih 38g" }] },
  chitato: {
    makanan_ringan: [
      { code: "CH_001", name: "Chitato Sapi Panggang 68g" }, { code: "CH_002", name: "Chitato Ayam Bumbu 68g" },
      { code: "CH_003", name: "Chitato Keju Supreme 68g" }, { code: "CH_004", name: "Chitato Sapi Panggang 120g" },
      { code: "CH_005", name: "Chitato Lite Seaweed 55g" }, { code: "CH_006", name: "Chitato Dozz Sapi Panggang" },
      { code: "CH_007", name: "Chitato Dozz Keju Mantap" },
    ],
    kebutuhan_dapur: [{ code: "CH_101", name: "Chitato Flavor Seasoning Sapi Panggang" }]
  },
  taro: { makanan_ringan: [{ code: "TR_001", name: "Taro Net Seaweed" }, { code: "TR_002", name: "Taro Net Potato BBQ" }, { code: "TR_003", name: "Taro Net Cowboy Steak" }, { code: "TR_004", name: "Taro Net Nori" }, { code: "TR_005", name: "Taro Puff Cheese" }, { code: "TR_006", name: "Taro Net Mix Teriyaki" }] },
  promina: {
    susu_dairy: [{ code: "PR_001", name: "Promina Bubuk Bayi" }, { code: "PR_002", name: "Promina Puding" }, { code: "PR_003", name: "Promina Bubur Tim Ayam" }, { code: "PR_004", name: "Promina Marie Biscuit" }, { code: "PR_005", name: "Promina Crunchies Cheese" }],
    makanan_ringan: [{ code: "PR_101", name: "Promina Rice Puffs Strawberry" }, { code: "PR_102", name: "Promina Rice Puffs Blueberry" }]
  },
  bumbu_racik: { kebutuhan_dapur: [{ code: "BR_001", name: "Bumbu Racik Nasi Goreng" }, { code: "BR_002", name: "Bumbu Racik Ayam Goreng" }, { code: "BR_003", name: "Bumbu Racik Sayur Asem" }, { code: "BR_004", name: "Bumbu Racik Tempe Goreng" }, { code: "BR_005", name: "Bumbu Racik Sayur Sop" }, { code: "BR_006", name: "Bumbu Racik Ikan Goreng" }, { code: "BR_007", name: "Bumbu Racik Tumis" }] },
  bimoli: { kebutuhan_dapur: [{ code: "BM_001", name: "Bimoli Minyak Goreng 1L Pouch" }, { code: "BM_002", name: "Bimoli Minyak Goreng 2L Pouch" }, { code: "BM_003", name: "Bimoli Spesial 2L Pouch" }, { code: "BM_004", name: "Bimoli Klasik 2L Jerigen" }] },
  qtela: { makanan_ringan: [{ code: "QT_001", name: "Qtela Keripik Singkong Original" }, { code: "QT_002", name: "Qtela Keripik Singkong Balado" }, { code: "QT_003", name: "Qtela Keripik Tempe" }, { code: "QT_004", name: "Qtela Opak Rasa Jagung" }] },
  ichi_ocha: { minuman: [{ code: "IO_001", name: "Ichi Ocha Green Tea 350ml" }, { code: "IO_002", name: "Ichi Ocha Honey 350ml" }, { code: "IO_003", name: "Ichi Ocha Thai Tea 350ml" }] },
  club: { minuman: [{ code: "CLB_001", name: "Club Air Mineral 600ml" }, { code: "CLB_002", name: "Club Air Mineral 1500ml" }, { code: "CLB_003", name: "Club Gelas 240ml" }] },
  milkuat: { susu_dairy: [{ code: "MK_001", name: "Milkuat Botol Cokelat 110ml" }, { code: "MK_002", name: "Milkuat Botol Strawberry 110ml" }], minuman: [{ code: "MK_101", name: "Milkuat Jus Buah 150ml" }] },
  palmia: { kebutuhan_dapur: [{ code: "PAL_001", name: "Palmia Margarin Serbaguna 200g" }, { code: "PAL_002", name: "Palmia Royal Butter Margarin 200g" }] }
};

const competitorData = {
  unilever: {
    kebutuhan_dapur: [{ code: "UN_001", name: "Bango Kecap Manis 520ml" }, { code: "UN_002", name: "Royco Kaldu Sapi 100g" }, { code: "UN_006", name: "Royco Kaldu Ayam 100g" }, { code: "UN_007", name: "Bango Bumbu Kuliner Nusantara" }],
    perawatan_tubuh: [{ code: "UN_003", name: "Lifebuoy Body Wash Total 10 900ml" }, { code: "UN_004", name: "Sunsilk Shampoo Black Shine 340ml" }, { code: "UN_005", name: "Pepsodent White 190g" }, { code: "UN_008", name: "Rexona Roll On Free Spirit" }, { code: "UN_009", name: "Dove Shampoo Hair Fall Rescue" }, { code: "UN_010", name: "Vaseline Healthy White" }],
    makanan_ringan: [{ code: "UN_101", name: "Wall's Ice Cream Neopolitana" }]
  },
  wings: {
    kebutuhan_dapur: [{ code: "WG_001", name: "Mie Sedaap Goreng" }, { code: "WG_002", name: "Mie Sedaap Soto" }, { code: "WG_003", name: "Kecap Sedaap" }, { code: "WG_006", name: "Mie Sedaap Korean Spicy Chicken" }, { code: "WG_010", name: "So Klin Lantai Apple" }],
    minuman: [{ code: "WG_004", name: "Floridina Orange 350ml" }, { code: "WG_005", name: "Teh Javana 350ml" }, { code: "WG_007", name: "Ale-Ale Orange" }, { code: "WG_011", name: "Golda Coffee 200ml" }],
    perawatan_tubuh: [{ code: "WG_008", name: "Nuvo Family Body Wash" }, { code: "WG_009", name: "Giv Sabun Mandi Cair" }, { code: "WG_012", name: "Zinc Shampoo Anti Dandruff" }],
  },
  nestle: {
    susu_dairy: [{ code: "NS_001", name: "Dancow FortiGro 800g" }, { code: "NS_002", name: "Bear Brand Original 189ml" }, { code: "NS_004", name: "Milo 3in1 Sachet" }, { code: "NS_005", name: "Nestle Carnation 370g" }, { code: "NS_009", name: "Lactogrow 3 Nutritods" }],
    makanan_ringan: [{ code: "NS_003", name: "KitKat 4F" }, { code: "NS_006", name: "Fox's Candy" }, { code: "NS_010", name: "Koko Krunch 170g" }],
    minuman: [{ code: "NS_007", name: "Nescafe Classic" }, { code: "NS_008", name: "Nestle Pure Life 600ml" }, { code: "NS_011", name: "S.Pellegrino 500ml" }],
  },
  frisian_flag: {
    susu_dairy: [{ code: "FF_001", name: "Frisian Flag Kental Manis 370g" }, { code: "FF_002", name: "Frisian Flag UHT Full Cream 1L" }, { code: "FF_003", name: "Frisian Flag UHT Cokelat 1L" }, { code: "FF_004", name: "Frisian Flag Primagro 1+" }],
    minuman: [{ code: "FF_005", name: "Frisian Flag Coconut 225ml" }, { code: "FF_006", name: "Frisian Flag Strawberry 225ml" }],
  },
  mayora: {
    makanan_ringan: [{ code: "MY_001", name: "Roma Kelapa 300g" }, { code: "MY_002", name: "Roma Sari Gandum" }, { code: "MY_003", name: "Beng-Beng" }, { code: "MY_006", name: "Better Sandwich Biscuit" }, { code: "MY_007", name: "Choki Choki" }, { code: "MY_010", name: "Kis Mint Candy" }],
    minuman: [{ code: "MY_004", name: "Kopiko 78c" }, { code: "MY_005", name: "Le Minerale 600ml" }, { code: "MY_008", name: "Teh Pucuk Harum 350ml" }, { code: "MY_011", name: "Torabika Cappuccino" }],
    kebutuhan_dapur: [{ code: "MY_009", name: "Energen Cereal Cokelat" }, { code: "MY_012", name: "Energen Kacang Hijau" }],
  },
  aqua_danone: {
    minuman: [{ code: "AQ_001", name: "Aqua 600ml" }, { code: "AQ_002", name: "Aqua 1500ml" }, { code: "AQ_003", name: "Mizone Active Cherry" }, { code: "AQ_004", name: "Vit 600ml" }],
    susu_dairy: [{ code: "AQ_101", name: "SGM Eksplor 1+" }, { code: "AQ_102", name: "SGM Eksplor 3+" }]
  },
  abc_heinz: {
    kebutuhan_dapur: [{ code: "ABC_001", name: "ABC Kecap Manis 520ml" }, { code: "ABC_002", name: "ABC Sambal Asli" }, { code: "ABC_003", name: "ABC Syrup Orange" }, { code: "ABC_004", name: "ABC Sarden Tomat" }],
    minuman: [{ code: "ABC_101", name: "ABC Sari Kedelai 200ml" }]
  },
  johnson_johnson: { perawatan_tubuh: [{ code: "JJ_001", name: "Johnson's Baby Powder" }, { code: "JJ_002", name: "Johnson's Baby Bath" }, { code: "JJ_003", name: "Listerine Cool Mint" }] }
};

const affinityData = { kebutuhan_dapur: [], susu_dairy: [], minuman: [], makanan_ringan: [], perawatan_tubuh: [] };

// ===== Searchable Combobox (Single Select) =====
function initSearchableCombobox(comboboxId, onChange) {
  const container = document.getElementById(comboboxId);
  if (!container) return;
  if (container.dataset.initialized === 'true') { if (onChange) container._onSearchableChange = onChange; return; }
  container.dataset.initialized = 'true';
  if (onChange) container._onSearchableChange = onChange;
  const input = container.querySelector('.combobox-input');
  const hiddenInput = container.querySelector('input[type="hidden"]');
  const dropdown = container.querySelector('.combobox-dropdown');
  const wrapper = container.querySelector('.combobox-input-wrapper');

  wrapper.addEventListener('click', (e) => {
    if (e.target.closest('.chip-remove')) return;
    const isOpen = container.classList.contains('open');
    closeAllComboboxes();
    if (!isOpen) {
      container.classList.add('open');
      dropdown.querySelectorAll('.combobox-option').forEach(opt => opt.classList.remove('hidden'));
      const noResults = dropdown.querySelector('.combobox-no-results');
      if (noResults) noResults.remove();
      input.focus(); input.select();
    }
  });

  input.addEventListener('input', () => {
    const filter = input.value.toLowerCase();
    let hasVisible = false;
    dropdown.querySelectorAll('.combobox-option').forEach(opt => {
      const visible = opt.textContent.toLowerCase().includes(filter);
      opt.classList.toggle('hidden', !visible);
      if (visible) hasVisible = true;
    });
    let noResults = dropdown.querySelector('.combobox-no-results');
    if (!hasVisible) {
      if (!noResults) { noResults = document.createElement('div'); noResults.className = 'combobox-no-results'; noResults.textContent = 'No results found'; dropdown.appendChild(noResults); }
    } else if (noResults) noResults.remove();
    if (!container.classList.contains('open')) container.classList.add('open');
  });

  function updateClearButton() {
    let clearBtn = wrapper.querySelector('.combobox-clear');
    if (hiddenInput.value) {
      if (!clearBtn) {
        clearBtn = document.createElement('div'); clearBtn.className = 'combobox-clear'; clearBtn.innerHTML = '&times;';
        wrapper.appendChild(clearBtn);
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hiddenInput.value = ''; input.value = ''; input.classList.remove('has-value');
          dropdown.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected'));
          if (container._onSearchableChange) container._onSearchableChange('', '');
          updateClearButton();
        });
      }
    } else if (clearBtn) clearBtn.remove();
  }

  dropdown.addEventListener('mousedown', (e) => {
    const opt = e.target.closest('.combobox-option');
    if (!opt) return;
    e.preventDefault();
    hiddenInput.value = opt.dataset.value;
    input.value = opt.textContent;
    input.classList.add('has-value');
    dropdown.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    container.classList.remove('open');
    input.classList.remove('error');
    const errMsg = container.parentElement.querySelector('.error-msg');
    if (errMsg) errMsg.remove();
    updateClearButton();
    if (container._onSearchableChange) container._onSearchableChange(opt.dataset.value, opt.textContent);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      container.classList.remove('open');
      dropdown.querySelectorAll('.combobox-option').forEach(opt => opt.classList.remove('hidden'));
      const noResults = dropdown.querySelector('.combobox-no-results');
      if (noResults) noResults.remove();
      if (!hiddenInput.value) input.value = '';
      else { const sel = dropdown.querySelector('.combobox-option.selected'); if (sel) input.value = sel.textContent; }
    }, 150);
  });
}

// ===== Multi-Select Combobox =====
function initMultiSelectCombobox(comboboxId, onChange) {
  const container = document.getElementById(comboboxId);
  if (!container) return;
  if (container.dataset.initialized === 'true') { if (onChange) container._onMultiSelectChange = onChange; return; }
  container.dataset.initialized = 'true';
  if (onChange) container._onMultiSelectChange = onChange;
  const input = container.querySelector('.combobox-input');
  const hiddenInput = container.querySelector('input[type="hidden"]');
  const dropdown = container.querySelector('.combobox-dropdown');
  const chipsContainer = container.querySelector('.combobox-chips') || createChipsContainer(container);

  function createChipsContainer(parent) {
    const el = document.createElement('div'); el.className = 'combobox-chips';
    parent.querySelector('.combobox-input-wrapper').insertBefore(el, input); return el;
  }
  function getSelectedValues() { return hiddenInput.value ? hiddenInput.value.split(',') : []; }
  function setSelectedValues(vals) { hiddenInput.value = vals.join(','); }

  function renderChips() {
    const vals = getSelectedValues();
    chipsContainer.innerHTML = '';
    const allOptions = Array.from(dropdown.querySelectorAll('.combobox-option')).filter(o => !o.classList.contains('select-all-option') && o.dataset.value !== 'all');
    const allOptionValues = allOptions.map(o => o.dataset.value);
    const isAllSelected = allOptionValues.length > 0 && allOptionValues.every(v => vals.includes(v));
    if (isAllSelected && allOptionValues.length > 1) {
      const chip = document.createElement('span'); chip.className = 'combobox-chip';
      chip.innerHTML = `<span>Pilih Semua</span><button type="button" class="chip-remove" data-value="all">&times;</button>`;
      chipsContainer.appendChild(chip); container.classList.add('all-selected');
    } else {
      container.classList.remove('all-selected');
      vals.forEach(val => {
        const opt = dropdown.querySelector(`.combobox-option[data-value="${val}"]`); if (!opt) return;
        const chip = document.createElement('span'); chip.className = 'combobox-chip';
        chip.innerHTML = `<span>${opt.textContent}</span><button type="button" class="chip-remove" data-value="${val}">&times;</button>`;
        chipsContainer.appendChild(chip);
      });
    }
    if (input.parentNode !== chipsContainer) chipsContainer.appendChild(input);
    if (vals.length > 0) { input.placeholder = ''; input.classList.add('has-chips'); }
    else { input.placeholder = container._originalPlaceholder || ''; input.classList.remove('has-chips'); }
    chipsContainer.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const removeVal = btn.dataset.value;
        let current = removeVal === 'all' ? [] : getSelectedValues().filter(v => v !== removeVal);
        setSelectedValues(current); renderChips(); updateOptionStyles();
        if (container._onMultiSelectChange) container._onMultiSelectChange(current);
      });
    });
  }

  container._originalPlaceholder = input.placeholder;

  function updateOptionStyles() {
    const vals = getSelectedValues();
    dropdown.querySelectorAll('.combobox-option').forEach(opt => opt.classList.toggle('selected', vals.includes(opt.dataset.value)));
  }

  container.querySelector('.combobox-input-wrapper').addEventListener('click', (e) => {
    if (e.target.closest('.chip-remove')) return;
    const isOpen = container.classList.contains('open');
    closeAllComboboxes();
    if (!isOpen) { container.classList.add('open'); input.focus(); }
  });

  input.addEventListener('input', () => {
    const filter = input.value.toLowerCase();
    let hasVisible = false;
    dropdown.querySelectorAll('.combobox-option').forEach(opt => {
      const visible = opt.textContent.toLowerCase().includes(filter);
      opt.classList.toggle('hidden', !visible); if (visible) hasVisible = true;
    });
    let noResults = dropdown.querySelector('.combobox-no-results');
    if (!hasVisible) {
      if (!noResults) { noResults = document.createElement('div'); noResults.className = 'combobox-no-results'; noResults.textContent = 'No results found'; dropdown.appendChild(noResults); }
    } else if (noResults) noResults.remove();
    if (!container.classList.contains('open')) container.classList.add('open');
  });

  dropdown.addEventListener('mousedown', (e) => {
    const opt = e.target.closest('.combobox-option'); if (!opt) return;
    e.preventDefault();
    const value = opt.dataset.value;
    const isSelectAll = opt.classList.contains('select-all-option') || value === 'all';
    let current = getSelectedValues();
    const max = parseInt(container.dataset.max) || 0;
    if (isSelectAll) {
      const allOptionValues = Array.from(dropdown.querySelectorAll('.combobox-option')).filter(o => !(o.classList.contains('select-all-option') || o.dataset.value === 'all')).map(o => o.dataset.value);
      const allSelected = allOptionValues.length > 0 && allOptionValues.every(v => current.includes(v));
      current = allSelected ? [] : allOptionValues;
    } else {
      if (max === 1) {
        if (current.includes(value) && current.length === 1) {
          current = [];
        } else {
          current = [value];
          container.classList.remove('open');
        }
      } else {
        if (current.includes(value)) current = current.filter(v => v !== value);
        else current.push(value);
      }
    }
    setSelectedValues(current); renderChips(); updateOptionStyles(); input.value = '';
    input.classList.remove('error');
    const errMsg = container.parentElement.querySelector('.error-msg');
    if (errMsg) errMsg.remove();
    if (container._onMultiSelectChange) container._onMultiSelectChange(current);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      container.classList.remove('open');
      dropdown.querySelectorAll('.combobox-option').forEach(opt => opt.classList.remove('hidden'));
      const noResults = dropdown.querySelector('.combobox-no-results');
      if (noResults) noResults.remove();
      input.value = '';
    }, 150);
  });
}

function closeAllComboboxes() {
  document.querySelectorAll('.searchable-combobox.open').forEach(cb => cb.classList.remove('open'));
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.searchable-combobox')) closeAllComboboxes();
});

function getComboboxText(comboboxId) {
  const container = document.getElementById(comboboxId);
  if (!container) return '-';
  const chips = container.querySelectorAll('.combobox-chip');
  if (chips.length > 0) {
    let labels = Array.from(chips).map(c => c.textContent.trim().replace('×', ''));
    if (labels.length === 1 && labels[0] === 'Pilih Semua') {
      const dropdown = container.querySelector('.combobox-dropdown');
      if (dropdown) {
        const allOptions = Array.from(dropdown.querySelectorAll('.combobox-option:not(.select-all-option)'))
          .filter(o => o.dataset.value !== 'all');
        if (allOptions.length > 0) return allOptions.map(o => o.textContent.trim()).join(', ');
      }
    }
    return labels.join(', ');
  }
  const input = container.querySelector('.combobox-input');
  return input ? (input.value || '-') : '-';
}

function resetCombobox(comboboxId) {
  const container = document.getElementById(comboboxId);
  if (!container) return;
  const input = container.querySelector('.combobox-input');
  const hiddenInput = container.querySelector('input[type="hidden"]');
  if (hiddenInput) hiddenInput.value = '';
  if (input) { input.value = ''; input.classList.remove('has-value', 'error'); }
  container.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected', 'hidden'));
  const chips = container.querySelector('.combobox-chips');
  if (chips) chips.innerHTML = '';
  container.classList.remove('open');
}

// ===== Modal Open/Close =====
openModalBtn.addEventListener("click", () => {
  editingSkpId = null;
  resetForm();
  modalOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
});

function closeModal() {
  modalOverlay.classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => resetForm(), 300);
}

closeModalBtn.addEventListener("click", closeModal);
btnCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalOverlay.classList.contains("open")) closeModal(); });

// ===== WA Template Helpers =====
async function fetchWhatsAppTemplates() {
  if (!waTemplateListEl || !waTemplateLoadingEl) return;
  waTemplateLoadingEl.style.display = "block";
  if (waTemplateErrorEl) waTemplateErrorEl.style.display = "none";
  waTemplateListEl.innerHTML = "";
  try {
    const url = new URL(`https://graph.facebook.com/${WA_META_CONFIG.apiVersion}/${WA_META_CONFIG.wabaId}/message_templates`);
    url.searchParams.set("access_token", WA_META_CONFIG.token);
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
    const json = await res.json();
    waTemplates = Array.isArray(json.data) ? json.data : [];
    filteredWaTemplates = [...waTemplates];
    renderWaTemplateList();
    if (waTemplates.length === 0) waTemplateListEl.innerHTML = '<div class="combobox-no-results" style="padding:8px 10px;font-size:0.8rem;">No templates found for this WABA.</div>';
  } catch (err) {
    console.error(err);
    if (waTemplateErrorEl) { waTemplateErrorEl.textContent = "Gagal mengambil template WhatsApp dari Meta API."; waTemplateErrorEl.style.display = "block"; }
  } finally { if (waTemplateLoadingEl) waTemplateLoadingEl.style.display = "none"; }
}

function renderWaTemplateList() {
  if (!waTemplateListEl) return;
  if (!filteredWaTemplates.length) { waTemplateListEl.innerHTML = '<div class="combobox-no-results" style="padding:8px 10px;font-size:0.8rem;">No templates match this search.</div>'; return; }
  filteredWaTemplates.forEach((tpl) => {
    const isSelected = selectedWaTemplate && selectedWaTemplate.id === tpl.id;
    const el = document.createElement("button"); el.type = "button"; el.className = "wa-template-item"; el.dataset.id = tpl.id;
    el.style.cssText = `width:100%;text-align:left;border:none;background:${isSelected ? "rgba(37,99,235,0.08)" : "transparent"};padding:6px 10px;cursor:pointer;display:flex;flex-direction:column;gap:2px;font-size:0.8rem;border-bottom:1px solid var(--border-subtle,#e4e4e7);`;
    el.innerHTML = `<span style="font-weight:600;color:var(--text-base);">${tpl.name}</span><span style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">${tpl.category || "-"}${tpl.language ? " • " + tpl.language : ""}</span>`;
    waTemplateListEl.appendChild(el);
  });
}

function renderWaTemplatePreview() {
  if (!waTemplatePreviewBodyEl || !selectedWaTemplate) return;
  const bodyComponent = selectedWaTemplate.components?.find((c) => c.type === "BODY") || null;
  waTemplatePreviewBodyEl.textContent = bodyComponent?.text || "(Body text not found in template)";
  if (waChatEmptyEl && waChatBubbleEl) { waChatEmptyEl.style.display = "none"; waChatBubbleEl.style.display = "block"; }
  if (waTemplateSelectedNameEl) waTemplateSelectedNameEl.textContent = `${selectedWaTemplate.name} • ${selectedWaTemplate.language || "—"}`;
  if (waTemplateCategoryTagEl) { if (selectedWaTemplate.category) { waTemplateCategoryTagEl.textContent = selectedWaTemplate.category; waTemplateCategoryTagEl.style.display = "inline-flex"; } else waTemplateCategoryTagEl.style.display = "none"; }
  if (waTemplatePreviewHeaderEl) {
    const headerComponent = selectedWaTemplate.components?.find(c => c.type === "HEADER") || null;
    if (headerComponent && headerComponent.format === "IMAGE") { waTemplatePreviewHeaderEl.innerHTML = `<div style="width:100%;aspect-ratio:16/9;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;"><img src="img/promo_header.png" alt="Promo Header" style="width:100%;height:100%;object-fit:cover;"></div>`; waTemplatePreviewHeaderEl.style.display = "block"; }
    else { waTemplatePreviewHeaderEl.style.display = "none"; waTemplatePreviewHeaderEl.innerHTML = ""; }
  }
}

function updateWaTemplateActionState() {
  if (!waTemplateActionBtn) return;
  waTemplateActionBtn.disabled = false;
  if (selectedWaTemplate) { waTemplateActionBtn.textContent = "Change Template"; if (waTemplateUsedLabelEl) waTemplateUsedLabelEl.textContent = `Template yang digunakan: ${selectedWaTemplate.name}`; }
  else { waTemplateActionBtn.textContent = "Use This Template"; if (waTemplateUsedLabelEl) waTemplateUsedLabelEl.textContent = "Belum ada template yang digunakan."; }
}

if (waTemplateListEl) { waTemplateListEl.addEventListener("click", (e) => { const item = e.target.closest(".wa-template-item"); if (!item) return; selectWaTemplateByIdLegacy(item.dataset.id); }); }
if (waTemplateSearchEl) { waTemplateSearchEl.addEventListener("input", (e) => { const q = e.target.value.trim().toLowerCase(); filteredWaTemplates = q ? waTemplates.filter((tpl) => { const bodyText = tpl.components?.find((c) => c.type === "BODY")?.text || ""; return tpl.name.toLowerCase().includes(q) || bodyText.toLowerCase().includes(q); }) : [...waTemplates]; renderWaTemplateList(); }); }
if (waTemplateActionBtn) { waTemplateActionBtn.addEventListener("click", updateWaTemplateActionState); updateWaTemplateActionState(); }

function selectWaTemplateByIdLegacy(id) {
  const tpl = waTemplates.find((t) => t.id === id);
  if (!tpl) return;
  selectedWaTemplate = tpl;
  if (waTemplateListEl) waTemplateListEl.querySelectorAll(".wa-template-item").forEach((btn) => { btn.style.background = btn.dataset.id === id ? "rgba(37,99,235,0.08)" : "transparent"; });
  renderWaTemplatePreview(); updateWaTemplateActionState();
}

// ===== Sidebar Toggle =====
menuToggle?.addEventListener("click", () => sidebar.classList.toggle("open"));
document.getElementById("sidebarToggleBtn").addEventListener("click", () => sidebar.classList.toggle("collapsed"));

// ===== Step Navigation =====
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;
  if (step > currentStep && !validateStep(currentStep)) return;
  currentStep = step; updateStepper(); updateFormStep(); updateButtons();
}

function updateStepper() {
  steps.forEach((stepEl, i) => {
    const stepNum = i + 1; stepEl.classList.remove("active", "completed");
    if (stepNum < currentStep) stepEl.classList.add("completed");
    else if (stepNum === currentStep) stepEl.classList.add("active");
  });
  stepLines.forEach((line, i) => line.classList.toggle("filled", i < currentStep - 1));
}

function updateFormStep() {
  formSteps.forEach((step, i) => { step.classList.remove("active"); if (i + 1 === currentStep) step.classList.add("active"); });
  if (currentStep === 3) {
    generateReview();
    const reviewWaTemplateBody = document.getElementById("reviewWaTemplateBody");
    const reviewWaPhoneBodyPreview = document.getElementById("reviewWaPhoneBodyPreview");
    if (reviewWaTemplateBody && reviewWaPhoneBodyPreview) reviewWaTemplateBody.addEventListener("input", function() { reviewWaPhoneBodyPreview.textContent = this.value; });
  }
  document.querySelector(".form-steps-container").scrollTop = 0;
}

function updateButtons() {
  btnBack.style.display = currentStep > 1 ? "flex" : "none";
  if (currentStep === totalSteps) {
    btnNext.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Submit Request`;
    btnNext.classList.add("btn-success");
  } else {
    btnNext.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    btnNext.classList.remove("btn-success");
  }
  checkStepCompletion();
}

btnNext.addEventListener("click", () => { if (currentStep === totalSteps) submitForm(); else goToStep(currentStep + 1); });
btnBack.addEventListener("click", () => goToStep(currentStep - 1));

// ===== Validation =====
function validateStep(step) {
  clearErrors();
  switch (step) { case 1: return validateStep1(); case 2: return validateStep2(); default: return true; }
}

function validateStep1() {
  let valid = true;
  const name = document.getElementById("campaignName"), desc = document.getElementById("campaignDesc"), start = document.getElementById("startDate"), end = document.getElementById("endDate");
  if (name && !name.value.trim()) { showError(name, "Campaign name is required"); valid = false; }
  if (desc && !desc.value.trim()) { showError(desc, "Description is required"); valid = false; }
  if (start && !start.value) { showError(start, "Start date is required"); valid = false; }
  if (end && !end.value) { showError(end, "End date is required"); valid = false; }
  if (start && start.value && end && end.value && new Date(start.value) >= new Date(end.value)) { showError(end, "End date must be after start date"); valid = false; }
  return valid;
}

function validateStep2() {
  clearErrors(); let valid = true;
  const tema = document.getElementById("temaPromosi"), bentuk = document.getElementById("bentukPromosi"), mekanisme = document.getElementById("mekanismePromosi");
  if (tema && !tema.value.trim()) { showError(tema, "Tema promosi is required"); valid = false; }
  if (bentuk && !bentuk.value) { showError(bentuk, "Please select bentuk promosi"); valid = false; }
  if (mekanisme && !mekanisme.value.trim()) { showError(mekanisme, "Mekanisme promosi is required"); valid = false; }
  const type = document.querySelector('input[name="campaignType"]:checked');
  if (!type) { document.querySelectorAll(".type-card-inner").forEach((c) => c.classList.add("error")); valid = false; }
  if (type && type.value === "affinity") {
    const brand = document.getElementById("selectBrand"), category = document.getElementById("selectCategory");
    const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
    if (brand && !brand.value) { const brandInput = document.querySelector('#comboboxBrand .combobox-input'); if (brandInput) brandInput.classList.add('error'); valid = false; }
    if (category && !category.value) { const catInput = document.querySelector('#comboboxCategory .combobox-input'); if (catInput) catInput.classList.add('error'); valid = false; }
    if (affinityBy === 'categories') { const compCat = document.getElementById("selectAffinityCategory"); if (compCat && !compCat.value) { const el = document.querySelector('#comboboxAffinityCategory .combobox-input'); if (el) el.classList.add('error'); valid = false; } }
    else { const compPlu = document.getElementById("selectAffinityPLU"); if (compPlu && !compPlu.value) { const el = document.querySelector('#comboboxAffinityPLU .combobox-input'); if (el) el.classList.add('error'); valid = false; } }
    const orderBy = document.getElementById("affinityOrderBy"); if (orderBy && !orderBy.value) { showError(orderBy, "Order by is required"); valid = false; }
  }
  if (type && type.value === "campaign_Type") {
    const tTypeChecked = document.querySelector('input[name="targetedType"]:checked');
    const targetedTypeValue = tTypeChecked ? tTypeChecked.value : '';
    if (!targetedTypeValue) { valid = false; }
    else if (targetedTypeValue === 'segmentation') {
      const sTypeChecked = document.querySelector('input[name="segmentationType"]:checked');
      const segTypeValue = sTypeChecked ? sTypeChecked.value : '';
      if (!segTypeValue) { valid = false; }
      else if (segTypeValue === 'loyalty') { const rows = document.querySelectorAll('#loyaltyRowsContainer .targeting-row'); let anyRowValid = false; rows.forEach(r => { const b = r.querySelector('.row-brand-val')?.value, c = r.querySelector('.row-cat-val')?.value, p = r.querySelector('.row-period-val')?.value, l = r.querySelector('.row-level-val')?.value; if (b && c && p && l) anyRowValid = true; }); if (!anyRowValid) valid = false; }
      else if (segTypeValue === 'nel') { const rows = document.querySelectorAll('#nelRowsContainer .targeting-row'); let anyRowValid = false; rows.forEach(r => { const b = r.querySelector('.row-brand-val')?.value, c = r.querySelector('.row-cat-val')?.value, s = r.querySelector('.row-status-val')?.value; if (b && c && s) anyRowValid = true; }); if (!anyRowValid) valid = false; }
    } else if (targetedTypeValue === 'historical') { const rows = document.querySelectorAll('#histTargetingRowsContainer .targeting-row'); let anyRowValid = false; rows.forEach(r => { if (r.querySelector('.row-brand-val')?.value) anyRowValid = true; }); if (!anyRowValid) valid = false; }
  }
  return valid;
}

function showError(input, message) {
  input.classList.add("error");
  const errorEl = document.createElement("span"); errorEl.className = "error-msg"; errorEl.textContent = message;
  input.parentElement.appendChild(errorEl);
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  document.querySelectorAll(".error-msg").forEach((el) => el.remove());
}

function checkStepCompletion() {
  let isComplete = false;
  switch (currentStep) {
    case 1: {
      const name = document.getElementById("campaignName").value.trim(), desc = document.getElementById("campaignDesc").value.trim(), campaignTypeDD = document.getElementById("campaignTypeDropdown").value, start = document.getElementById("startDate").value, end = document.getElementById("endDate").value;
      isComplete = !!(name && desc && campaignTypeDD && start && end && new Date(start) < new Date(end)); break;
    }
    case 2: {
      const tema = document.getElementById("temaPromosi").value.trim(), bentuk = document.getElementById("bentukPromosi").value, mekanisme = document.getElementById("mekanismePromosi").value.trim();
      let promoComplete = !!(tema && bentuk && mekanisme), targetComplete = false;
      const type = document.querySelector('input[name="campaignType"]:checked');
      if (type) {
        if (type.value === "affinity") {
          const brand = document.getElementById("selectBrand")?.value, category = document.getElementById("selectCategory")?.value;
          const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
          let subComplete = affinityBy === 'categories' ? !!document.getElementById("selectAffinityCategory")?.value : !!document.getElementById("selectAffinityPLU")?.value;
          targetComplete = !!(brand && category && subComplete);
        } else if (type.value === "campaign_Type") {
          const tType = document.querySelector('input[name="targetedType"]:checked')?.value || '';
          if (tType === 'segmentation') {
            const segType = document.querySelector('input[name="segmentationType"]:checked')?.value || '';
            if (segType === 'loyalty') { const rows = document.querySelectorAll('#loyaltyRowsContainer .targeting-row'); rows.forEach(r => { if (r.querySelector('.row-brand-val')?.value) targetComplete = true; }); }
            else if (segType === 'nel') { const rows = document.querySelectorAll('#nelRowsContainer .targeting-row'); rows.forEach(r => { if (r.querySelector('.row-brand-val')?.value) targetComplete = true; }); }
          } else if (tType === 'historical') { const rows = document.querySelectorAll('#histTargetingRowsContainer .targeting-row'); rows.forEach(r => { if (r.querySelector('.row-brand-val')?.value) targetComplete = true; }); }
        }
      }
      isComplete = promoComplete && targetComplete; break;
    }
    case 3: isComplete = true; break;
  }
  btnNext.classList.toggle('btn-disabled', !isComplete);
  btnNext.disabled = !isComplete;
}

['campaignName', 'campaignDesc', 'campaignTypeDropdown', 'temaPromosi', 'mekanismePromosi', 'startDate', 'endDate'].forEach(id => {
  const el = document.getElementById(id);
  if (el) { el.addEventListener('input', checkStepCompletion); el.addEventListener('change', checkStepCompletion); }
});
document.getElementById('bentukPromosi').addEventListener('change', checkStepCompletion);

document.querySelectorAll('input[name="campaignType"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const affinitySection = document.getElementById("affinitySection");
    const targetingSection = document.getElementById("targetingSection");
    if (e.target.value === "affinity") {
      affinitySection.style.display = "block"; targetingSection.style.display = "none";
      toggleAffinityFields(); resetTargetedFields();
    } else {
      affinitySection.style.display = "none"; targetingSection.style.display = "block";
      resetCombobox('comboboxBrand'); resetCombobox('comboboxCategory');
      resetCombobox('comboboxBrandAffinityTarget'); resetCombobox('comboboxCategoryAffinityTarget'); resetCombobox('comboboxAffinityInclude');
      document.getElementById("affinityCategoryGroup").style.display = "none";
      document.getElementById("audienceCard").style.display = "none";
      document.getElementById("btnHitungAffinity").style.display = "none";
      if (document.getElementById("hitungAffinityNote")) document.getElementById("hitungAffinityNote").style.display = "none";
      document.getElementById("affinityCheckboxes").innerHTML = "";
      const affinityTargetRows = document.getElementById("affinityTargetRowsContainer");
      if (affinityTargetRows) affinityTargetRows.innerHTML = "";
      const selectAllAffinity = document.getElementById("selectAllAffinitySKU");
      if (selectAllAffinity) selectAllAffinity.checked = false;
    }
    checkStepCompletion();
  });
});

function resetTargetedFields() {
  const el = (id) => document.getElementById(id);
  if (el('targetedType')) el('targetedType').value = '';
  if (el('segmentationWrapper')) el('segmentationWrapper').style.display = 'none';
  if (el('historicalWrapper')) el('historicalWrapper').style.display = 'none';
  if (el('segmentationType')) el('segmentationType').value = '';
  if (el('loyaltyFields')) el('loyaltyFields').style.display = 'none';
  if (el('nelFields')) el('nelFields').style.display = 'none';
  resetCombobox('comboboxDCSegment');
  const loyaltyContainer = document.getElementById('loyaltyRowsContainer'); if (loyaltyContainer) loyaltyContainer.innerHTML = '';
  const nelContainer = document.getElementById('nelRowsContainer'); if (nelContainer) nelContainer.innerHTML = '';
  const histContainer = document.getElementById('histTargetingRowsContainer'); if (histContainer) histContainer.innerHTML = '';
  addLoyaltyRow(); addNelRow(); addHistoricalTargetRow();
  ['segAgeRange', 'segGender'].forEach(id => { if (el(id)) el(id).value = ''; });
  resetCombobox('comboboxProvinsiSegment'); resetCombobox('comboboxKotaSegment');
  resetCombobox('comboboxDCHist');
  ['histAgeRange', 'histGender'].forEach(id => { if (el(id)) el(id).value = ''; });
  resetCombobox('comboboxProvinsiHist'); resetCombobox('comboboxKotaHist');
  if (el('btnHitungTargeted')) el('btnHitungTargeted').style.display = 'none';
  if (el('hitungTargetedNote')) el('hitungTargetedNote').style.display = 'none';
  if (el('audienceCardTargeted')) el('audienceCardTargeted').style.display = 'none';
}

function addLoyaltyRow() { addSegmentationRow('loyaltyRowsContainer', 'loyRow', 'loyalty'); }
function addNelRow() { addSegmentationRow('nelRowsContainer', 'nelRow', 'nel'); }
function addHistoricalTargetRow() { addTargetingRow('histTargetingRowsContainer', 'histRow'); }

function addSegmentationRow(containerId, typePrefix, segmentType) {
  const container = document.getElementById(containerId); if (!container) return;
  globalRowCount++;
  const rowIndex = globalRowCount;
  const rowId = `${typePrefix}_${rowIndex}`;
  let rowContent = '';
  if (segmentType === 'loyalty') {
    rowContent = `
      <div class="col-period">
        <span class="col-header-label">PERIODE</span>
        <select class="form-select row-period-val">
          <option value="" disabled selected>Select Period</option>
          <option value="8_weeks">8 Weeks</option>
          <option value="24_weeks">24 Weeks</option>
        </select>
      </div>
      <div class="col-brand">
        <span class="col-header-label">BRAND</span>
        <div class="searchable-combobox combobox-brand-target" id="cbBrand_${rowIndex}" data-max="1">
          <input type="hidden" class="row-brand-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Brand" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddBrand_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-category">
        <span class="col-header-label">CATEGORY</span>
        <div class="searchable-combobox combobox-category-target" id="cbCat_${rowIndex}" data-max="1">
          <input type="hidden" class="row-cat-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Category" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddCat_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-level">
        <span class="col-header-label">LOYALTY LEVEL</span>
        <div class="searchable-combobox combobox-level-target" id="cbLevel_${rowIndex}">
          <input type="hidden" class="row-level-val" value="">
          <div class="combobox-input-wrapper"><div class="combobox-chips"></div><input type="text" class="combobox-input" placeholder="Select Level" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddLevel_${rowIndex}">
            <div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>
            <div class="combobox-option" data-value="switcher">Switcher</div>
            <div class="combobox-option" data-value="loyalist">Loyalist</div>
          </div>
        </div>
      </div>`;
  } else if (segmentType === 'nel') {
    rowContent = `
      <div class="col-brand">
        <span class="col-header-label">BRAND</span>
        <div class="searchable-combobox combobox-brand-target" id="cbBrand_${rowIndex}" data-max="1">
          <input type="hidden" class="row-brand-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Brand" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddBrand_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-category">
        <span class="col-header-label">CATEGORY</span>
        <div class="searchable-combobox combobox-category-target" id="cbCat_${rowIndex}" data-max="1">
          <input type="hidden" class="row-cat-val" value="">
          <div class="combobox-input-wrapper"><input type="text" class="combobox-input" placeholder="Select Category" autocomplete="off"></div>
          <div class="combobox-dropdown" id="ddCat_${rowIndex}"></div>
        </div>
      </div>
      <div class="col-status">
        <span class="col-header-label">NEL STATUS</span>
        <select class="form-select row-status-val">
          <option value="" disabled selected>Select Status</option>
          <option value="new">New</option>
          <option value="existing">Existing</option>
          <option value="lapsed">Lapsed</option>
        </select>
      </div>`;
  }

  const rowHtml = `
    <div class="targeting-row ${typePrefix}-row" id="${rowId}">
      ${rowContent}
      <div class="col-action">
        <span class="col-header-label" style="visibility: hidden;">ACTION</span>
        <button type="button" class="btn-remove-target-outline" onclick="removeTargetRow('${rowId}', '${containerId}')" title="Remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </div>`;

  container.insertAdjacentHTML('beforeend', rowHtml);
  refreshAllBrandDropdowns(containerId);
  populateDropdownBrand(`ddBrand_${rowIndex}`, false);

  initSearchableCombobox(`cbBrand_${rowIndex}`, (brandVal) => {
    const catDropdownId = `ddCat_${rowIndex}`;
    populateDropdownCategory(catDropdownId, brandVal ? [brandVal] : [], false);
    const ddCat = document.getElementById(catDropdownId);
    if (ddCat) ddCat.insertAdjacentHTML('afterbegin', '<div class="combobox-option select-all-option" data-value="all"><span class="select-all-text">Pilih Semua</span></div>');
    resetMultiSelectCombobox(`cbCat_${rowIndex}`);
    if (brandVal) populateDropdownPLU(`ddPLU_${rowIndex}`, [brandVal], []);
    refreshAllBrandDropdowns(containerId);
    updateTargetedAudienceVisibility();
  });

  initMultiSelectCombobox(`cbCat_${rowIndex}`, () => {
    const brandValCurrent = document.querySelector(`#cbBrand_${rowIndex} .row-brand-val`)?.value;
    const catVals = (document.querySelector(`#cbCat_${rowIndex} input[type="hidden"]`)?.value || '').split(',').filter(v => v && v !== 'all');
    populateDropdownPLU(`ddPLU_${rowIndex}`, [brandValCurrent], catVals);
    resetMultiSelectCombobox(`cbPLU_${rowIndex}`);
    updateTargetedAudienceVisibility(); checkStepCompletion();
  });

  initMultiSelectCombobox(`cbPLU_${rowIndex}`, () => updateTargetedAudienceVisibility());

  if (segmentType === 'loyalty') initMultiSelectCombobox(`cbLevel_${rowIndex}`, () => updateTargetedAudienceVisibility());

  document.querySelectorAll(`#${rowId} select`).forEach(s => s.addEventListener('change', () => { updateTargetedAudienceVisibility(); checkStepCompletion(); }));
}

initSearchableCombobox('comboboxDCSegment', () => updateTargetedAudienceVisibility());
initSearchableCombobox('comboboxDCHist', () => updateTargetedAudienceVisibility());

document.getElementById('btnAddLoyaltyRow')?.addEventListener('click', addLoyaltyRow);
document.getElementById('btnAddNelRow')?.addEventListener('click', addNelRow);
document.getElementById('btnAddHistRow')?.addEventListener('click', addHistoricalTargetRow);

['segAgeRange', 'segGender', 'segProvinsi', 'segKota', 'histAgeRange', 'histGender', 'histProvinsi', 'histKota'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', updateTargetedAudienceVisibility);
});

function resetMultiSelectCombobox(id) {
  const container = document.getElementById(id); if (!container) return;
  const hiddenInput = container.querySelector('input[type="hidden"]'), input = container.querySelector('.combobox-input'), chips = container.querySelector('.combobox-chips');
  if (hiddenInput) hiddenInput.value = ''; if (input) input.value = ''; if (chips) chips.innerHTML = '';
  container.querySelectorAll('.combobox-option').forEach(o => o.classList.remove('selected'));
}

document.querySelectorAll('input[name="targetedType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const val = e.target.value;
    document.getElementById('segmentationWrapper').style.display = val === 'segmentation' ? 'block' : 'none';
    document.getElementById('historicalWrapper').style.display = val === 'historical' ? 'block' : 'none';
    updateTargetedAudienceVisibility(); checkStepCompletion();
  });
});

document.querySelectorAll('input[name="segmentationType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const val = e.target.value;
    document.getElementById('loyaltyFields').style.display = val === 'loyalty' ? 'block' : 'none';
    document.getElementById('nelFields').style.display = val === 'nel' ? 'block' : 'none';
    updateTargetedAudienceVisibility(); checkStepCompletion();
  });
});

['segAgeRange', 'segGender', 'segProvinsi', 'segKota', 'histAgeRange', 'histGender', 'histOrderBy', 'histProvinsi', 'histKota'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => { updateTargetedAudienceVisibility(); checkStepCompletion(); });
});

// ===== Targeted Audience Visibility =====
function updateTargetedAudienceVisibility() {
  const type = document.querySelector('input[name="campaignType"]:checked');
  if (!type || type.value !== 'campaign_Type') {
    const btn = document.getElementById('btnHitungTargeted'), note = document.getElementById('hitungTargetedNote'), card = document.getElementById('audienceCardTargeted');
    if (btn) btn.style.display = 'none'; if (note) note.style.display = 'none'; if (card) card.style.display = 'none'; return;
  }
  const tType = document.querySelector('input[name="targetedType"]:checked')?.value || '';
  const btn = document.getElementById('btnHitungTargeted'), note = document.getElementById('hitungTargetedNote'), card = document.getElementById('audienceCardTargeted');
  if (card) card.style.display = 'none';
  let isComplete = false;
  if (tType === 'segmentation') {
    const segType = document.querySelector('input[name="segmentationType"]:checked')?.value || '';
    if (segType === 'loyalty') { document.querySelectorAll('#loyaltyRowsContainer .targeting-row').forEach(r => { const b = r.querySelector('.row-brand-val')?.value, c = r.querySelector('.row-cat-val')?.value, p = r.querySelector('.row-period-val')?.value, l = r.querySelector('.row-level-val')?.value; if (b && c && p && l) isComplete = true; }); }
    else if (segType === 'nel') { document.querySelectorAll('#nelRowsContainer .targeting-row').forEach(r => { const b = r.querySelector('.row-brand-val')?.value, c = r.querySelector('.row-cat-val')?.value, s = r.querySelector('.row-status-val')?.value; if (b && c && s) isComplete = true; }); }
  } else if (tType === 'historical') { document.querySelectorAll('#histTargetingRowsContainer .targeting-row').forEach(r => { if (r.querySelector('.row-brand-val')?.value) isComplete = true; }); }
  if (isComplete) {
    if (btn) btn.style.display = 'block';
    if (note) {
      note.style.display = 'block';
      const data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}');
      const remaining = Math.max(0, 3 - (data.count || 0));
      note.textContent = `* Batas perhitungan audience: 3 kali per hari. (Sisa: ${remaining})`;
    }
  } else { if (btn) btn.style.display = 'none'; if (note) note.style.display = 'none'; }
}

// ===== SINGLE btnHitungTargeted listener — dengan breakdown lengkap per row =====
const btnHitungTargeted = document.getElementById('btnHitungTargeted');
if (btnHitungTargeted) {
  btnHitungTargeted.addEventListener('click', function() {
    const btn = this;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    const audienceCard = document.getElementById('audienceCardTargeted');
    const audienceEl = document.getElementById('audienceValueTargeted');

    if (!checkCalculationLimit()) return;

    text.style.display = 'none';
    loader.style.display = 'flex';
    if (audienceCard) audienceCard.style.display = 'none';
    btn.disabled = true;

    setTimeout(() => {
      text.style.display = 'block';
      loader.style.display = 'none';
      btn.disabled = false;

      const targetedType = document.querySelector('input[name="targetedType"]:checked')?.value || '';
      const breakdownContainer = document.getElementById('audienceBreakdownTargeted');
      let total = 0;
      let breakdownHTML = '';

      // Helper: ambil label brand dari dropdown option dalam satu row
      function getBrandLabel(row, brandVal) {
        const dropdown = row.querySelector('.combobox-dropdown');
        const opt = dropdown ? dropdown.querySelector(`.combobox-option[data-value="${brandVal}"]`) : null;
        return opt ? opt.textContent.trim() : (BRAND_DATA_INDOFOOD[brandVal]?.label || brandVal);
      }

      // Helper: ambil label chips dari combobox dalam satu row, expand "Pilih Semua" jika perlu
      function getChipLabels(row, comboboxClass) {
        const combobox = row.querySelector(comboboxClass);
        if (!combobox) return [];
        const chips = combobox.querySelectorAll('.combobox-chip span:first-child');
        let labels = Array.from(chips).map(ch => ch.textContent.trim()).filter(t => t);
        
        // Jika hanya ada chip "Pilih Semua", ambil semua label dari dropdown
        if (labels.length === 1 && labels[0] === 'Pilih Semua') {
          const dropdown = combobox.querySelector('.combobox-dropdown');
          if (dropdown) {
            const allOptions = Array.from(dropdown.querySelectorAll('.combobox-option:not(.select-all-option)'))
              .filter(opt => opt.dataset.value !== 'all');
            if (allOptions.length > 0) {
              labels = allOptions.map(opt => opt.textContent.trim());
            }
          }
        }
        return labels;
      }

      if (targetedType === 'historical') {
        const rows = document.querySelectorAll('#histTargetingRowsContainer .targeting-row');
        const rowBreakdowns = [];

        rows.forEach((row, index) => {
          const brandVal = row.querySelector('.row-brand-val')?.value || '';
          if (!brandVal) return;

          const brandLabel = getBrandLabel(row, brandVal);
          const catLabels = getChipLabels(row, '.combobox-category-target');
          const pluLabels = getChipLabels(row, '.combobox-plu-target');

          const catLabel = catLabels.length > 0 ? catLabels.join(', ') : 'Semua Kategori';
          const pluLabel = pluLabels.length > 0 ? pluLabels.join(', ') : 'Semua PLU';

          let rowAudience = 0;
          let logic = '';
          if (pluLabels.length > 0) { rowAudience = 15000 + Math.floor(Math.random() * 10000); logic = 'Filter PLU'; }
          else if (catLabels.length > 0) { rowAudience = 45000 + Math.floor(Math.random() * 20000); logic = 'Filter Kategori'; }
          else { rowAudience = 120000 + Math.floor(Math.random() * 50000); logic = 'Filter Brand'; }

          total += rowAudience;
          rowBreakdowns.push(`
            <div style="margin-bottom:8px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
              <div style="font-weight:600;font-size:0.75rem;color:#1e293b;margin-bottom:6px;">Row ${index+1}: ${brandLabel}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                <span style="background:#eff6ff;color:#3b82f6;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Kat: ${catLabel}</span>
                <span style="background:#f0fdf4;color:#16a34a;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">PLU: ${pluLabel}</span>
                <span style="background:#fefce8;color:#ca8a04;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Logic: ${logic}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px dashed #cbd5e1;">
                <span style="font-size:0.72rem;color:#475569;">Est. Audience:</span>
                <span style="font-weight:700;color:var(--primary);font-size:0.8rem;">${rowAudience.toLocaleString('id-ID')}</span>
              </div>
            </div>`);
        });

        if (total === 0) breakdownHTML = `<div style="font-size:0.82rem;color:var(--text-base);">Tidak ada baris historical yang valid.</div>`;
        else breakdownHTML = `<div style="font-weight:600;font-size:0.82rem;color:var(--text-base);margin-bottom:10px;">Detail per Row (Historical):</div>` + rowBreakdowns.join('');

      } else if (targetedType === 'segmentation') {
        const segType = document.querySelector('input[name="segmentationType"]:checked')?.value || '';
        const age = document.getElementById('segAgeRange')?.value || 'All Ages';
        const gender = document.getElementById('segGender')?.value || 'All Genders';

        // Ambil DC label
        const dcCombo = document.getElementById('comboboxDCSegment');
        const dcInput = dcCombo ? dcCombo.querySelector('.combobox-input') : null;
        const dcLabel = dcInput?.value || '-';

        // Ambil Provinsi label
        const provCombo = document.getElementById('comboboxProvinsiSegment');
        const provInput = provCombo ? provCombo.querySelector('.combobox-input') : null;
        const provLabel = provInput?.value || '-';

        breakdownHTML = `
          <div style="font-size:0.82rem;color:var(--text-base);">
            <div style="font-weight:600;margin-bottom:8px;">Filter Segmentasi:</div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
              <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Usia:</span><span style="font-weight:600;">${age}</span></div>
              <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Gender:</span><span style="font-weight:600;">${gender}</span></div>
              ${dcLabel !== '-' ? `<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">DC:</span><span style="font-weight:600;">${dcLabel}</span></div>` : ''}
              ${provLabel !== '-' ? `<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Provinsi:</span><span style="font-weight:600;">${provLabel}</span></div>` : ''}
            </div>
            <div style="font-weight:600;margin-bottom:8px;">Detail per Row (${segType === 'loyalty' ? 'Loyalty' : 'NEL'}):</div>`;

        if (segType === 'loyalty') {
          const rows = document.querySelectorAll('#loyaltyRowsContainer .targeting-row');
          rows.forEach((row, i) => {
            const brandVal = row.querySelector('.row-brand-val')?.value || '';
            if (!brandVal) return;

            const brandLabel = getBrandLabel(row, brandVal);
            const catLabels = getChipLabels(row, '.combobox-category-target');
            const levelLabels = getChipLabels(row, '.combobox-level-target');
            const periodSelect = row.querySelector('.row-period-val');
            const periodVal = periodSelect ? periodSelect.value : '';
            const periodLabel = periodVal === '8_weeks' ? '8 Minggu' : periodVal === '24_weeks' ? '24 Minggu' : (periodVal || '-');

            const catLabel = catLabels.length > 0 ? catLabels.join(', ') : 'Semua Kategori';
            const levelLabel = levelLabels.length > 0 ? levelLabels.join(', ') : 'Semua Level';

            const base = 8000 + Math.floor(Math.random() * 4000);
            const rowAudience = Math.floor(base * Math.max(catLabels.length, 1) * 1.5);
            total += rowAudience;

            breakdownHTML += `
              <div style="margin-bottom:8px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
                <div style="font-weight:600;font-size:0.75rem;color:#1e293b;margin-bottom:6px;">Row ${i+1}: ${brandLabel}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                  <span style="background:#eff6ff;color:#3b82f6;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Kat: ${catLabel}</span>
                  <span style="background:#f0fdf4;color:#16a34a;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Periode: ${periodLabel}</span>
                  <span style="background:#fefce8;color:#ca8a04;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Level: ${levelLabel}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px dashed #cbd5e1;">
                  <span style="font-size:0.72rem;color:#475569;">Est. Audience:</span>
                  <span style="font-weight:700;color:var(--primary);font-size:0.8rem;">${rowAudience.toLocaleString('id-ID')}</span>
                </div>
              </div>`;
          });

        } else if (segType === 'nel') {
          const rows = document.querySelectorAll('#nelRowsContainer .targeting-row');
          rows.forEach((row, i) => {
            const brandVal = row.querySelector('.row-brand-val')?.value || '';
            if (!brandVal) return;

            const brandLabel = getBrandLabel(row, brandVal);
            const catLabels = getChipLabels(row, '.combobox-category-target');
            const statusSelect = row.querySelector('.row-status-val');
            const statusVal = statusSelect ? statusSelect.value : '';
            const statusLabel = statusVal === 'new' ? 'New' : statusVal === 'existing' ? 'Existing' : statusVal === 'lapsed' ? 'Lapsed' : '-';
            const statusColor = statusVal === 'new' ? '#16a34a' : statusVal === 'existing' ? '#2563eb' : statusVal === 'lapsed' ? '#dc2626' : '#64748b';
            const statusBg = statusVal === 'new' ? '#f0fdf4' : statusVal === 'existing' ? '#eff6ff' : statusVal === 'lapsed' ? '#fef2f2' : '#f1f5f9';

            const catLabel = catLabels.length > 0 ? catLabels.join(', ') : 'Semua Kategori';
            const base = 10000 + Math.floor(Math.random() * 5000);
            const rowAudience = Math.floor(base * Math.max(catLabels.length, 1) * 1.8);
            total += rowAudience;

            breakdownHTML += `
              <div style="margin-bottom:8px;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
                <div style="font-weight:600;font-size:0.75rem;color:#1e293b;margin-bottom:6px;">Row ${i+1}: ${brandLabel}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                  <span style="background:#eff6ff;color:#3b82f6;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Kat: ${catLabel}</span>
                  <span style="background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;">Status: ${statusLabel}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px dashed #cbd5e1;">
                  <span style="font-size:0.72rem;color:#475569;">Est. Audience:</span>
                  <span style="font-weight:700;color:var(--primary);font-size:0.8rem;">${rowAudience.toLocaleString('id-ID')}</span>
                </div>
              </div>`;
          });
        }

        breakdownHTML += `</div>`;
        if (total === 0) { total = 30000 + Math.floor(Math.random() * 20000); breakdownHTML += `<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">Estimasi berdasarkan filter umum.</div>`; }

      } else {
        total = 50000 + Math.floor(Math.random() * 30000);
        breakdownHTML = `<div style="font-size:0.82rem;color:var(--text-base);font-style:italic;">Audience dihitung berdasarkan filter segmentasi.</div>`;
      }

      if (breakdownContainer) { breakdownContainer.innerHTML = breakdownHTML; breakdownContainer.style.display = 'block'; }
      if (audienceEl) animateNumber(audienceEl, total, true);
      if (audienceCard) audienceCard.style.display = 'flex';

      const data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}');
      const remaining = Math.max(0, 3 - (data.count || 0));
      const btnNote = document.getElementById('hitungTargetedNote');
      if (btnNote) btnNote.textContent = `* Batas perhitungan audience: 3 kali per hari. (Sisa: ${remaining})`;
    }, 1200);
  });
}

// ===== Area Targeting =====
const kotaData = {
  dki_jakarta: ["Jakarta Pusat", "Jakarta Utara", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur"],
  jawa_barat: ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi", "Karawang", "Sukabumi"],
  jawa_tengah: ["Semarang", "Solo", "Pekalongan", "Magelang", "Salatiga", "Tegal"],
  jawa_timur: ["Surabaya", "Malang", "Kediri", "Madiun", "Mojokerto", "Pasuruan"],
  banten: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"],
  sumatera_utara: ["Medan", "Binjai", "Pematang Siantar", "Tebing Tinggi"],
  sumatera_selatan: ["Palembang", "Prabumulih", "Pagar Alam", "Lubuklinggau"],
  sulawesi_selatan: ["Makassar", "Pare-Pare", "Palopo", "Maros"],
  bali: ["Denpasar", "Badung", "Gianyar", "Tabanan"],
  kalimantan_selatan: ["Banjarmasin", "Banjarbaru", "Barito Kuala"],
};

const areaTargetingRadios = document.querySelectorAll('input[name="areaTargeting"]');
if (areaTargetingRadios.length > 0) {
  areaTargetingRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const dcGroup = document.getElementById('dcSelectionGroup'), wilayahGroup = document.getElementById('wilayahSelectionGroup'), targetingIncludeGroup = document.getElementById('targetingIncludeGroup');
      const dcSelect = document.getElementById('selectDC'), provSelect = document.getElementById('selectProvinsi'), kotaSelect = document.getElementById('selectKota');
      if (dcSelect) dcSelect.value = ''; if (provSelect) provSelect.value = '';
      if (kotaSelect) { kotaSelect.value = ''; kotaSelect.innerHTML = '<option value="">Pilih Kota (opsional)</option>'; }
      resetCombobox('comboboxTargetingInclude');
      if (e.target.value === 'dc') { if (dcGroup) dcGroup.style.display = 'block'; if (wilayahGroup) wilayahGroup.style.display = 'none'; if (targetingIncludeGroup) targetingIncludeGroup.style.display = 'block'; }
      else if (e.target.value === 'wilayah') { if (dcGroup) dcGroup.style.display = 'none'; if (wilayahGroup) wilayahGroup.style.display = 'block'; if (targetingIncludeGroup) targetingIncludeGroup.style.display = 'none'; }
      else { if (dcGroup) dcGroup.style.display = 'none'; if (wilayahGroup) wilayahGroup.style.display = 'none'; if (targetingIncludeGroup) targetingIncludeGroup.style.display = 'none'; }
    });
  });
}

const selectProvinsiEl = document.getElementById('selectProvinsi');
if (selectProvinsiEl) {
  selectProvinsiEl.addEventListener('change', (e) => {
    const kotaSelect = document.getElementById('selectKota'); if (!kotaSelect) return;
    kotaSelect.innerHTML = '<option value="">Pilih Kota (opsional)</option>';
    if (e.target.value && kotaData[e.target.value]) { kotaData[e.target.value].forEach((kota) => { const opt = document.createElement('option'); opt.value = kota.toLowerCase().replace(/\s+/g, '_'); opt.textContent = kota; kotaSelect.appendChild(opt); }); }
  });
}

// ===== Toast =====
function showToast(message, type = 'error') {
  const existingToast = document.querySelector('.custom-toast'); if (existingToast) existingToast.remove();
  const toast = document.createElement('div'); toast.className = 'custom-toast';
  Object.assign(toast.style, { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%) translateY(20px)', opacity: '0', backgroundColor: type === 'error' ? '#fee2e2' : '#dcfce7', color: type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${type === 'error' ? '#f87171' : '#86efac'}`, padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', fontWeight: '500', zIndex: '9999', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' });
  const iconSvg = type === 'error' ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  toast.innerHTML = `${iconSvg}<span>${message}</span>`; document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== Calculation Limit =====
function checkCalculationLimit() {
  const today = new Date().toISOString().split('T')[0];
  let data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}');
  if (data.date !== today) data = { date: today, count: 0 };
  if (data.count >= 3) { showToast("Batas perhitungan audience (3x sehari) telah tercapai.", "error"); return false; }
  data.count++; localStorage.setItem('audienceCalcLimit', JSON.stringify(data)); return true;
}

const devResetBtn = document.getElementById('devResetBtn');
if (devResetBtn) { devResetBtn.addEventListener('click', () => { localStorage.removeItem('audienceCalcLimit'); showToast("Limit perhitungan berhasil di-reset untuk demo!", "success"); }); }

const categoryAudienceBase = { kebutuhan_dapur: 185000, susu_dairy: 142000, minuman: 210000, makanan_ringan: 165000, perawatan_tubuh: 128000 };

// ===== SKU Update Helpers =====
function updateSKUList() {
  const brandHidden = document.getElementById('selectBrand'), categoryHidden = document.getElementById('selectCategory');
  const selectedBrands = brandHidden.value ? brandHidden.value.split(',') : [], selectedCategories = categoryHidden.value ? categoryHidden.value.split(',') : [];
  const audienceCard = document.getElementById("audienceCard"), btnH = document.getElementById("btnHitungAffinity"), btnHN = document.getElementById("hitungAffinityNote");
  if (audienceCard) audienceCard.style.display = "none"; if (btnH) btnH.style.display = "none"; if (btnHN) btnHN.style.display = "none";
  updateAffinitySelection();
}

function updateAffinityTargetSKUList() { updateAffinitySelection(); }

function updateTargetingSKUList() {
  const group = document.getElementById("targetingCategoryGroup"), container = document.getElementById("targetingCheckboxes");
  if (!group || !container) return;
  const brandHidden = document.getElementById('selectBrandTarget'), categoryHidden = document.getElementById('selectCategoryTarget');
  if (!brandHidden || !categoryHidden) return;
  group.style.display = "none"; container.innerHTML = "";
  if (brandHidden.value && categoryHidden.value) updateTargetingAudience();
  else { const btnH = document.getElementById("btnHitungTargeting"), btnHN = document.getElementById("hitungTargetingNote"), audCard = document.getElementById("audienceCardTarget"); if (btnH) btnH.style.display = "none"; if (btnHN) btnHN.style.display = "none"; if (audCard) audCard.style.display = "none"; }
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'selectAllAffinitySKU') {
    const isChecked = e.target.checked;
    document.querySelectorAll('#affinityCheckboxes .checkbox-item input[type="checkbox"]').forEach(cb => { const parent = cb.closest('.checkbox-item'); if (parent.style.display !== 'none') { cb.checked = isChecked; parent.classList.toggle("checked", isChecked); } });
    updateAffinitySelection(); checkStepCompletion();
  }
  if (e.target && e.target.id === 'selectAllAffinityTargetSKU') {
    const isChecked = e.target.checked;
    document.querySelectorAll('#affinityTargetCheckboxes .checkbox-item input[type="checkbox"]').forEach(cb => { const parent = cb.closest('.checkbox-item'); if (parent.style.display !== 'none') { cb.checked = isChecked; parent.classList.toggle("checked", isChecked); } });
    updateAffinitySelection(); checkStepCompletion();
  }
  if (e.target && e.target.id === 'selectAllTargetingSKU') {
    const isChecked = e.target.checked;
    document.querySelectorAll('#targetingCheckboxes .checkbox-item input[type="checkbox"]').forEach(cb => { const parent = cb.closest('.checkbox-item'); if (parent.style.display !== 'none') { cb.checked = isChecked; parent.classList.toggle("checked", isChecked); } });
    updateTargetingSelection(); checkStepCompletion();
  }
});

const skuSearchInputEl = document.getElementById('skuSearchInput');
if (skuSearchInputEl) { skuSearchInputEl.addEventListener('input', (e) => { const filter = e.target.value.toLowerCase(); document.querySelectorAll('#affinityCheckboxes .checkbox-item').forEach(item => { item.style.display = item.querySelector('span').textContent.toLowerCase().includes(filter) ? '' : 'none'; }); }); }
const skuSearchTarget = document.getElementById('skuSearchInputTarget');
if (skuSearchTarget) { skuSearchTarget.addEventListener('input', (e) => { const filter = e.target.value.toLowerCase(); document.querySelectorAll('#targetingCheckboxes .checkbox-item').forEach(item => { item.style.display = item.querySelector('span').textContent.toLowerCase().includes(filter) ? '' : 'none'; }); }); }

function updateAffinitySelection(checkbox) {
  if (checkbox) { const item = checkbox.closest(".checkbox-item"); item.classList.toggle("checked", checkbox.checked); }
  const checkedTarget = document.querySelectorAll("#affinityTargetCheckboxes input:checked");
  let dynamicRowSelections = 0;
  document.querySelectorAll('#affinityTargetRowsContainer .targeting-row').forEach(row => {
    const cat = row.querySelector('.aff-cat-val')?.value, pluStr = row.querySelector('.aff-plu-val')?.value;
    if (cat) dynamicRowSelections += pluStr ? pluStr.split(',').length : 1;
  });
  const allBoxesTarget = document.querySelectorAll('#affinityTargetCheckboxes .checkbox-item input[type="checkbox"]');
  const selectAllTarget = document.getElementById("selectAllAffinityTargetSKU");
  if (selectAllTarget && allBoxesTarget.length > 0) selectAllTarget.checked = (checkedTarget.length === allBoxesTarget.length);
  const audienceCard = document.getElementById("audienceCard"), btnHitung = document.getElementById("btnHitungAffinity"), btnHitungNote = document.getElementById("hitungAffinityNote");
  if (audienceCard) audienceCard.style.display = "none";
  const brand = document.getElementById("selectBrand")?.value, category = document.getElementById("selectCategory")?.value;
  const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
  let subSelected = affinityBy === 'categories' ? !!document.getElementById("selectAffinityCategory")?.value : !!document.getElementById("selectAffinityPLU")?.value;
  const shouldShow = !!(brand && category && subSelected);
  if (shouldShow) {
    const data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}'), today = new Date().toISOString().split('T')[0];
    const remaining = Math.max(0, 3 - (data.date === today ? data.count : 0));
    if (btnHitung) btnHitung.style.display = "block";
    if (btnHitungNote) { btnHitungNote.style.display = 'block'; btnHitungNote.textContent = `* Batas perhitungan audience: 3 kali per hari. (Sisa: ${remaining})`; }
  } else { if (btnHitung) btnHitung.style.display = "none"; if (btnHitungNote) btnHitungNote.style.display = "none"; }
  checkStepCompletion();
}

function updateTargetingAudience() {
  const brandEl = document.getElementById('selectBrandTarget'), categoryEl = document.getElementById('selectCategoryTarget');
  if (!brandEl || !categoryEl) return;
  const audienceCard = document.getElementById("audienceCardTarget"), btnHitung = document.getElementById("btnHitungTargeting"), btnHitungNote = document.getElementById("hitungTargetingNote");
  if (audienceCard) audienceCard.style.display = "none";
  if (brandEl.value && categoryEl.value) {
    const data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}'), today = new Date().toISOString().split('T')[0];
    const remaining = Math.max(0, 10 - (data.date === today ? data.count : 0));
    if (btnHitung) btnHitung.style.display = "block";
    if (btnHitungNote) btnHitungNote.textContent = `* Batas perhitungan audience: 3 kali per hari. (Sisa: ${remaining})`;
  } else { if (btnHitung) btnHitung.style.display = "none"; if (btnHitungNote) btnHitungNote.style.display = "none"; }
}

function updateTargetingSelection(checkbox) { updateTargetingAudience(); checkStepCompletion(); }

// ===== Affinity Hitung =====
document.getElementById("btnHitungAffinity").addEventListener("click", function () {
  const btn = this, text = btn.querySelector('.btn-text'), loader = btn.querySelector('.btn-loader'), audienceCard = document.getElementById("audienceCard");
  const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
  const selectId = affinityBy === 'categories' ? 'selectAffinityCategory' : 'selectAffinityPLU';
  const selectedValues = document.getElementById(selectId).value.split(',').filter(v => v);
  if (selectedValues.length === 0) return;
  if (!checkCalculationLimit()) return;
  text.style.display = 'none'; loader.style.display = 'flex'; audienceCard.style.display = 'none'; btn.disabled = true;
  setTimeout(() => {
    text.style.display = 'block'; loader.style.display = 'none'; btn.disabled = false;
    const bdContainer = document.getElementById('audienceBreakdownAffinity');
    const comboboxId = affinityBy === 'categories' ? 'comboboxAffinityCategory' : 'comboboxAffinityPLU';
    const container = document.getElementById(comboboxId);
    const chips = container.querySelectorAll('.combobox-chip');
    const labelMap = {};
    // Populate dari dropdown options agar label tersedia meskipun chip-nya "Pilih Semua"
    const dropdown = container.querySelector('.combobox-dropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.combobox-option:not(.select-all-option)').forEach(opt => {
        const v = opt.dataset.value;
        if (v && v !== 'all') labelMap[v] = opt.textContent.trim();
      });
    }
    // Backup dari chips jika dropdown tidak tersedia atau berbeda
    chips.forEach(chip => { 
      const val = chip.querySelector('.chip-remove')?.dataset.value, 
            label = chip.textContent.trim().replace('×', ''); 
      if (val && val !== 'all') labelMap[val] = label; 
    });
    let total = 0;
    let breakdownHTML = `<div style="font-size:0.82rem;color:var(--text-base);line-height:1.5;"><div style="font-weight:600;margin-bottom:8px;color:var(--primary);">Detail Audience per ${affinityBy === 'categories' ? 'Category' : 'PLU'}:</div>`;
    selectedValues.forEach(val => {
      const label = labelMap[val] || val.replace(/_/g, ' ').toUpperCase();
      const itemAudience = 8000 + Math.floor(Math.random() * 15000);
      total += itemAudience;
      breakdownHTML += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed rgba(0,0,0,0.05);"><span style="color:var(--text-muted);">${label}</span><span style="font-weight:600;color:var(--text-base);">${itemAudience.toLocaleString('id-ID')}</span></div>`;
    });
    breakdownHTML += '</div>';
    if (bdContainer) { bdContainer.innerHTML = breakdownHTML; bdContainer.style.display = 'block'; }
    animateNumber(document.getElementById("audienceValue"), total, true);
    audienceCard.style.display = "flex";
    const data = JSON.parse(localStorage.getItem('audienceCalcLimit') || '{}');
    const remaining = Math.max(0, 3 - (data.count || 0));
    const btnHitungNote = document.getElementById("hitungAffinityNote");
    if (btnHitungNote) btnHitungNote.textContent = `* Batas perhitungan audience: 3 kali per hari. (Sisa: ${remaining})`;
  }, 1200);
});

const btnAddAffinityTargetRow = document.getElementById('btnAddAffinityTargetRow');
if (btnAddAffinityTargetRow) { btnAddAffinityTargetRow.addEventListener('click', () => addAffinityTargetRow()); addAffinityTargetRow(); }

function animateNumber(el, target, formatThousands = false) {
  let current = 0; const step = Math.ceil(target / 30);
  const interval = setInterval(() => { current += step; if (current >= target) { current = target; clearInterval(interval); } el.textContent = formatThousands ? current.toLocaleString("id-ID") : current; }, 20);
}

// ===== Date Duration =====
const startDate = document.getElementById("startDate"), endDate = document.getElementById("endDate");
function updateDuration() {
  const durationCard = document.getElementById("durationCard"), durationText = document.getElementById("durationText");
  if (startDate.value && endDate.value) {
    const diffDays = Math.ceil((new Date(endDate.value) - new Date(startDate.value)) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) { durationText.textContent = `Campaign duration: ${diffDays} days`; durationCard.style.display = "flex"; } else durationCard.style.display = "none";
  } else durationCard.style.display = "none";
}
startDate.addEventListener("change", updateDuration);
endDate.addEventListener("change", updateDuration);

// ===== Generate Review =====
function generateReview() {
  const sections = document.getElementById("reviewSections");
  const campaignName = document.getElementById("campaignName").value;
  const campaignDesc = document.getElementById("campaignDesc").value;
  const campaignIdea = document.getElementById("campaignIdea").value;
  const temaPromosi = document.getElementById("temaPromosi").value;
  const bentukPromosi = document.getElementById("bentukPromosi");
  const bentukText = bentukPromosi.options[bentukPromosi.selectedIndex]?.text || "-";
  const mekanisme = document.getElementById("mekanismePromosi").value;
  const campaignTypeDD = document.getElementById("campaignTypeDropdown");
  const campaignTypeDDText = campaignTypeDD.options[campaignTypeDD.selectedIndex]?.text || "-";
  const typeRadio = document.querySelector('input[name="campaignType"]:checked');
  const campaignType = typeRadio ? typeRadio.value : "-";

  let targetingInfo = "";
  if (campaignType === "affinity") {
    const brandText = getComboboxText('comboboxBrand'), categoryText = getComboboxText('comboboxCategory');
    const affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
    const affinityByText = affinityBy === 'categories' ? 'Competitor Categories' : 'Competitor PLUs';
    const affinityValueText = affinityBy === 'categories' ? getComboboxText('comboboxAffinityCategory') : getComboboxText('comboboxAffinityPLU');
    const audienceVal = document.getElementById('audienceValue') ? document.getElementById('audienceValue').textContent : '0';
    targetingInfo = `
      <div class="review-row"><span class="review-label">Brand</span><span class="review-value">${brandText}</span></div>
      <div class="review-row"><span class="review-label">Category</span><span class="review-value">${categoryText}</span></div>
      <div class="review-row"><span class="review-label">Affinity By</span><span class="review-value">${affinityByText}</span></div>
      <div class="review-row"><span class="review-label">Selected ${affinityBy === 'categories' ? 'Categories' : 'PLUs'}</span><span class="review-value" style="word-break:break-all;">${affinityValueText}</span></div>
      <div class="review-row"><span>Order By</span><span class="review-value" style="text-transform:capitalize;">${(document.getElementById('affinityOrderBy').value || '').replace('_', ' ')}</span></div>
      <div class="review-row"><span class="review-label">Audience</span><span class="review-value" style="color:var(--primary);font-weight:700;">${audienceVal}</span></div>`;
  } else if (campaignType === "campaign_Type") {
    const targetedTypeRadio = document.querySelector('input[name="targetedType"]:checked');
    const targetedTypeValue = targetedTypeRadio ? targetedTypeRadio.value : '';
    const targetedTypeText = targetedTypeValue === 'segmentation' ? 'Segmentation' : (targetedTypeValue === 'historical' ? 'Historical' : '-');
    let targetedDetailRows = '';
    if (targetedTypeValue === 'segmentation') {
      const segAge = document.getElementById('segAgeRange').value || 'All Ages';
      const segGender = document.getElementById('segGender').value || 'All Genders';
      const segTypeRadio = document.querySelector('input[name="segmentationType"]:checked');
      const segType = segTypeRadio ? segTypeRadio.value : '';
      const segTypeText = segType === 'loyalty' ? 'Loyalty' : (segType === 'nel' ? 'NEL' : '-');
      let rowSummaryHtml = '';
      document.querySelectorAll(`#${segType === 'loyalty' ? 'loyaltyRowsContainer' : 'nelRowsContainer'} .targeting-row`).forEach((row, idx) => {
        const brand = getComboboxText(row.querySelector('.combobox-brand-target').id);
        const category = getComboboxText(row.querySelector('.combobox-category-target').id);
        const periode = row.querySelector('.row-period-val')?.value || '-';
        let extra = segType === 'loyalty' ? ` | Level: ${getComboboxText(row.querySelector('.combobox-level-target').id)}` : ` | Status: ${row.querySelector('.row-status-val')?.value || '-'}`;
        if (brand !== '-') rowSummaryHtml += `<div style="margin-bottom:4px;padding:4px;background:#f8f9fa;border-radius:4px;">Row ${idx+1}: <strong>${brand}</strong> > ${category || 'All'} > Periode: ${periode} ${extra}</div>`;
      });
      if (!rowSummaryHtml) rowSummaryHtml = '-';
      targetedDetailRows = `
        <div class="review-row" style="flex-direction:column;align-items:flex-start;"><span class="review-label">Targeting Rows</span><div style="width:100%;margin-top:8px;">${rowSummaryHtml}</div></div>
        <div class="review-row"><span class="review-label">Age Range</span><span class="review-value">${segAge}</span></div>
        <div class="review-row"><span class="review-label">Gender</span><span class="review-value" style="text-transform:capitalize">${segGender}</span></div>
        <div class="review-row"><span class="review-label">Segmentation Type</span><span class="review-value">${segTypeText}</span></div>
        <div class="review-row"><span class="review-label">DC</span><span class="review-value">${getComboboxText('comboboxDCSegment')}</span></div>
        <div class="review-row"><span class="review-label">Provinsi</span><span class="review-value">${getComboboxText('comboboxProvinsiSegment')}</span></div>
        <div class="review-row"><span class="review-label">Kota</span><span class="review-value">${getComboboxText('comboboxKotaSegment')}</span></div>`;
    } else if (targetedTypeValue === 'historical') {
      const histAge = document.getElementById('histAgeRange').value || 'All Ages';
      const histGender = document.getElementById('histGender').value || 'All Genders';
      let rowsHtml = '';
      const historicalRows = document.querySelectorAll('#histTargetingRowsContainer .targeting-row');
      if (historicalRows.length > 0) {
        historicalRows.forEach((row, idx) => {
          const brand = getComboboxText(row.querySelector('.combobox-brand-target').id);
          const category = getComboboxText(row.querySelector('.combobox-category-target').id);
          const plu = getComboboxText(row.querySelector('.combobox-plu-target').id);
          if (brand !== '-') rowsHtml += `<div style="margin-bottom:4px;padding:4px;background:#f8f9fa;border-radius:4px;">Row ${idx+1}: <strong>${brand}</strong> > ${category || 'All'} > ${plu || 'All'}</div>`;
        });
      } else rowsHtml = 'No historical rows defined.';
      targetedDetailRows = `
        <div class="review-row"><span class="review-label">Age Range</span><span class="review-value">${histAge}</span></div>
        <div class="review-row"><span class="review-label">Gender</span><span class="review-value" style="text-transform:capitalize">${histGender}</span></div>
        <div class="review-row" style="flex-direction:column;align-items:flex-start;"><span class="review-label">Brands & Products</span><div style="width:100%;margin-top:8px;">${rowsHtml}</div></div>
        <div class="review-row"><span class="review-label">DC</span><span class="review-value">${getComboboxText('comboboxDCHist')}</span></div>
        <div class="review-row"><span class="review-label">Provinsi</span><span class="review-value">${getComboboxText('comboboxProvinsiHist')}</span></div>
        <div class="review-row"><span class="review-label">Kota</span><span class="review-value">${getComboboxText('comboboxKotaHist')}</span></div>
        <div class="review-row"><span class="review-label">Order By</span><span class="review-value" style="text-transform:capitalize;">${(document.getElementById('historicalOrderBy').value || '').replace('_', ' ')}</span></div>`;
    }
    const targetedAudienceVal = document.getElementById('audienceValueTargeted') ? document.getElementById('audienceValueTargeted').textContent : '0';
    targetingInfo = `<div class="review-row"><span class="review-label">Targeted Type</span><span class="review-value">${targetedTypeText}</span></div>${targetedDetailRows}<div class="review-row"><span class="review-label">Audience</span><span class="review-value" style="color:var(--primary);font-weight:700;">${targetedAudienceVal}</span></div>`;
  }

  const affBreakdown = document.getElementById('audienceBreakdownAffinity');
  if (campaignType === 'affinity' && affBreakdown && affBreakdown.style.display !== 'none') targetingInfo += `<div class="review-row" style="flex-direction:column;align-items:stretch;margin-top:10px;border-top:1px dashed #eee;padding-top:10px;">${affBreakdown.innerHTML}</div>`;
  const targetBreakdown = document.getElementById('audienceBreakdownTargeted');
  if (campaignType === 'campaign_Type' && targetBreakdown && targetBreakdown.style.display !== 'none') targetingInfo += `<div class="review-row" style="flex-direction:column;align-items:stretch;margin-top:10px;border-top:1px dashed #eee;padding-top:10px;">${targetBreakdown.innerHTML}</div>`;

  const startVal = document.getElementById("startDate").value, endVal = document.getElementById("endDate").value;
  const startFormatted = startVal ? new Date(startVal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
  const endFormatted = endVal ? new Date(endVal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
  const diffDays = startVal && endVal ? Math.ceil((new Date(endVal) - new Date(startVal)) / (1000 * 60 * 60 * 24)) : 0;

  sections.innerHTML = `
    <div class="review-card">
      <div class="review-card-header"><span class="review-card-title">Campaign Information</span><button class="review-edit-btn" data-edit-card="campaignInfoCard"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button></div>
      <div class="review-card-body" id="campaignInfoCard">
        <div class="review-display-mode">
          <div class="review-row"><span class="review-label">Campaign Name</span><span class="review-value">${campaignName}</span></div>
          <div class="review-row"><span class="review-label">Description</span><span class="review-value">${campaignDesc}</span></div>
          ${campaignIdea ? `<div class="review-row"><span class="review-label">Campaign Idea</span><span class="review-value">${campaignIdea}</span></div>` : ''}
          <div class="review-row"><span class="review-label">Campaign Type</span><span class="review-value">${campaignTypeDDText}</span></div>
        </div>
        <div class="review-edit-mode" style="display:none;">
          <div class="review-row" style="flex-direction:column;gap:4px;"><label class="form-label">Campaign Name</label><input type="text" class="form-input" id="reviewCampaignName" value="${campaignName}"></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">Description</label><textarea class="form-input" id="reviewCampaignDesc" rows="2">${campaignDesc}</textarea></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">Campaign Idea</label><textarea class="form-input" id="reviewCampaignIdea" rows="2">${campaignIdea}</textarea></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">Campaign Type</label><div class="select-wrapper"><select class="form-select" id="reviewCampaignTypeDD"><option value="voucher" ${campaignTypeDD.value === 'voucher' ? 'selected' : ''}>Voucher</option><option value="non_voucher" ${campaignTypeDD.value === 'non_voucher' ? 'selected' : ''}>Non-Voucher</option></select></div></div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;"><button class="btn-outline review-cancel-btn" data-card="campaignInfoCard" style="padding:4px 12px;font-size:0.8rem;">Cancel</button><button class="btn-primary review-save-btn" data-card="campaignInfoCard" style="padding:4px 12px;font-size:0.8rem;">Save</button></div>
        </div>
      </div>
    </div>
    <div class="review-card">
      <div class="review-card-header"><span class="review-card-title">Promotion Details</span><button class="review-edit-btn" data-edit-card="promotionCard"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button></div>
      <div class="review-card-body" id="promotionCard">
        <div class="review-display-mode">
          <div class="review-row"><span class="review-label">Tema Promosi</span><span class="review-value">${temaPromosi}</span></div>
          <div class="review-row"><span class="review-label">Bentuk Promosi</span><span class="review-value">${bentukText}</span></div>
          <div class="review-row"><span class="review-label">Mekanisme</span><span class="review-value">${mekanisme}</span></div>
        </div>
        <div class="review-edit-mode" style="display:none;">
          <div class="review-row" style="flex-direction:column;gap:4px;"><label class="form-label">Tema Promosi</label><input type="text" class="form-input" id="reviewTemaPromosi" value="${temaPromosi}"></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">Bentuk Promosi</label><div class="select-wrapper"><select class="form-select" id="reviewBentukPromosi"><option value="potongan_harga" ${bentukPromosi.value === 'potongan_harga' ? 'selected' : ''}>Potongan Harga</option><option value="gratis_produk" ${bentukPromosi.value === 'gratis_produk' ? 'selected' : ''}>Gratis Produk</option></select></div></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">Mekanisme</label><textarea class="form-input" id="reviewMekanisme" rows="2">${mekanisme}</textarea></div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;"><button class="btn-outline review-cancel-btn" data-card="promotionCard" style="padding:4px 12px;font-size:0.8rem;">Cancel</button><button class="btn-primary review-save-btn" data-card="promotionCard" style="padding:4px 12px;font-size:0.8rem;">Save</button></div>
        </div>
      </div>
    </div>
    <div class="review-card">
      <div class="review-card-header"><span class="review-card-title">Targeting</span><button class="review-edit-btn" data-edit-card="targetingCard"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button></div>
      <div class="review-card-body" id="targetingCard">
        <div class="review-display-mode">
          <div class="review-row"><span class="review-label">Promotion Type</span><span class="review-value" style="text-transform:capitalize;">${campaignType === 'campaign_Type' ? 'Targeted' : campaignType}</span></div>
          ${targetingInfo}
        </div>
        <div class="review-edit-mode" style="display:none;"><div style="text-align:center;padding:20px;"><p style="margin-bottom:12px;font-size:0.9rem;color:var(--text-muted);">Targeting detail is complex. Please go back to Step 2 to edit targeting.</p><button class="btn-primary" onclick="currentStep=2;updateStepper();updateFormStep();updateButtons();" style="width:100%;">Go to Step 2: Targeting</button></div></div>
      </div>
    </div>
    <div class="review-card">
      <div class="review-card-header"><span class="review-card-title">Schedule</span><button class="review-edit-btn" data-edit-card="scheduleCard"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button></div>
      <div class="review-card-body" id="scheduleCard">
        <div class="review-display-mode">
          <div class="review-row"><span class="review-label">Start Date</span><span class="review-value">${startFormatted}</span></div>
          <div class="review-row"><span class="review-label">End Date</span><span class="review-value">${endFormatted}</span></div>
          <div class="review-row"><span class="review-label">Duration</span><span class="review-value">${diffDays > 0 ? diffDays + " days" : "-"}</span></div>
        </div>
        <div class="review-edit-mode" style="display:none;">
          <div class="review-row" style="flex-direction:column;gap:4px;"><label class="form-label">Start Date</label><input type="date" class="form-input" id="reviewStartDate" value="${startVal}"></div>
          <div class="review-row" style="flex-direction:column;gap:4px;margin-top:8px;"><label class="form-label">End Date</label><input type="date" class="form-input" id="reviewEndDate" value="${endVal}"></div>
          <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;"><button class="btn-outline review-cancel-btn" data-card="scheduleCard" style="padding:4px 12px;font-size:0.8rem;">Cancel</button><button class="btn-primary review-save-btn" data-card="scheduleCard" style="padding:4px 12px;font-size:0.8rem;">Save</button></div>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('[data-edit-card]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = document.getElementById(btn.dataset.editCard); if (!card) return;
      const displayMode = card.querySelector('.review-display-mode'), editMode = card.querySelector('.review-edit-mode');
      if (displayMode && editMode) { displayMode.style.display = 'none'; editMode.style.display = 'block'; }
    });
  });
  document.querySelectorAll('.review-cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = document.getElementById(btn.dataset.card); if (!card) return;
      const displayMode = card.querySelector('.review-display-mode'), editMode = card.querySelector('.review-edit-mode');
      if (displayMode && editMode) { displayMode.style.display = 'block'; editMode.style.display = 'none'; }
    });
  });
  document.querySelectorAll('.review-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.dataset.card;
      if (cardId === 'campaignInfoCard') {
        document.getElementById('campaignName').value = document.getElementById('reviewCampaignName').value;
        document.getElementById('campaignDesc').value = document.getElementById('reviewCampaignDesc').value;
        const ideaEl = document.getElementById('campaignIdea'); if (ideaEl) ideaEl.value = document.getElementById('reviewCampaignIdea')?.value || '';
        const campTypeDropdown = document.getElementById('campaignTypeDropdown'), campType = document.getElementById('reviewCampaignTypeDD')?.value;
        if (campTypeDropdown && campType) campTypeDropdown.value = campType;
      }
      if (cardId === 'promotionCard') {
        document.getElementById('temaPromosi').value = document.getElementById('reviewTemaPromosi').value;
        document.getElementById('mekanismePromosi').value = document.getElementById('reviewMekanisme').value;
        const bentukPromosiDropdown = document.getElementById('bentukPromosi'), bentuk = document.getElementById('reviewBentukPromosi')?.value;
        if (bentukPromosiDropdown && bentuk) bentukPromosiDropdown.value = bentuk;
      }
      if (cardId === 'scheduleCard') {
        document.getElementById('startDate').value = document.getElementById('reviewStartDate').value;
        document.getElementById('endDate').value = document.getElementById('reviewEndDate').value;
      }
      generateReview();
    });
  });
}

// ===== Submit Form =====
function submitForm() {
  const campaignName = document.getElementById("campaignName").value, campaignDesc = document.getElementById("campaignDesc").value, campaignIdea = document.getElementById("campaignIdea").value;
  const campaignTypeDD = document.getElementById("campaignTypeDropdown").value;
  const typeRadio = document.querySelector('input[name="campaignType"]:checked'), campaignType = typeRadio ? typeRadio.value : "-";
  const startVal = document.getElementById("startDate").value, endVal = document.getElementById("endDate").value;
  const temaPromosi = document.getElementById("temaPromosi").value;
  const bentukPromosi = document.getElementById("bentukPromosi").value;
  const mekanisme = document.getElementById("mekanismePromosi").value;
  let brandText = '-', categoryText = '-';
  if (campaignType === 'affinity') { brandText = getComboboxText('comboboxBrand'); categoryText = getComboboxText('comboboxCategory'); }
  const targetedType = document.querySelector('input[name="targetedType"]:checked')?.value || '';
  let audienceVal = '0';
  if (campaignType === 'affinity') audienceVal = document.getElementById('audienceValue') ? document.getElementById('audienceValue').textContent.replace(/\./g, '') : '0';
  else if (campaignType === 'campaign_Type') audienceVal = document.getElementById('audienceValueTargeted') ? document.getElementById('audienceValueTargeted').textContent.replace(/\./g, '') : '0';
  const now = new Date(), timeStr = now.toISOString().slice(0, 16).replace('T', ' ');

  if (editingSkpId) {
    const skp = skpStore.find(s => s.id === editingSkpId);
    if (skp) {
      Object.assign(skp, { name: campaignName, description: campaignDesc, idea: campaignIdea, campaignTypeDD, promotionType: campaignType, temaPromosi, bentukPromosi, mekanisme, brand: brandText, category: categoryText, startDate: startVal, endDate: endVal, targetedType, audience: audienceVal });
      skp.logs.push({ action: "Edited", user: "Rania Indofood", time: timeStr, type: "edited", description: "SKP data diperbarui" });
    }
    closeModal(); showToast("SKP Request updated successfully!", "success"); renderListTable(); showDetailPage(editingSkpId); editingSkpId = null; return;
  }

  const newId = skpIdCounter++;
  const newSkp = { id: newId, name: campaignName, description: campaignDesc, idea: campaignIdea, campaignTypeDD, promotionType: campaignType, temaPromosi, bentukPromosi, mekanisme, brand: brandText, category: categoryText, startDate: startVal, endDate: endVal, status: "Submitted", segment: "", submittedBy: "Rania Indofood", targetedType, audience: audienceVal, logs: [ { action: "Created", user: "Rania Indofood", time: timeStr, type: "created", description: "SKP request dibuat" }, { action: "Submitted", user: "Rania Indofood", time: timeStr, type: "submitted", description: "SKP request di-submit untuk review" } ] };

  if (targetedType === 'segmentation') {
    const segT = document.querySelector('input[name="segmentationType"]:checked')?.value || '';
    newSkp.segmentationType = segT;
    const segRows = [], conId = segT === 'loyalty' ? 'loyaltyRowsContainer' : 'nelRowsContainer';
    document.querySelectorAll(`#${conId} .targeting-row`).forEach(row => {
      const b = row.querySelector('.row-brand-val').value, c = row.querySelector('.row-cat-val').value, p = row.querySelector('.row-period-val')?.value;
      const extra = segT === 'loyalty' ? row.querySelector('.row-level-val')?.value : row.querySelector('.row-status-val')?.value;
      if (b) segRows.push({ brand: b, category: c, Periode: p, extra });
    });
    newSkp.segmentationRows = segRows;
    newSkp.dc = document.getElementById('comboboxDCSegment')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.provinsi = document.getElementById('comboboxProvinsiSegment')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.kota = document.getElementById('comboboxKotaSegment')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.ageRange = document.getElementById('segAgeRange')?.value || '';
    newSkp.gender = document.getElementById('segGender')?.value || '';
  } else if (targetedType === 'historical') {
    const rows = [];
    document.querySelectorAll('#histTargetingRowsContainer .targeting-row').forEach(row => {
      const b = row.querySelector('.row-brand-val').value, c = row.querySelector('.row-cat-val')?.querySelector('input[type="hidden"]')?.value, p = row.querySelector('.row-plu-val')?.value;
      if (b) rows.push({ brand: b, category: c, plu: p });
    });
    newSkp.historicalRows = rows;
    newSkp.dc = document.getElementById('comboboxDCHist')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.provinsi = document.getElementById('comboboxProvinsiHist')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.kota = document.getElementById('comboboxKotaHist')?.querySelector('input[type="hidden"]')?.value || '';
    newSkp.ageRange = document.getElementById('histAgeRange')?.value || '';
    newSkp.gender = document.getElementById('histGender')?.value || '';
    newSkp.orderBy = document.getElementById('historicalOrderBy')?.value || '';
  } else if (campaignType === 'affinity') {
    newSkp.affinityBy = document.querySelector('input[name="affinityBy"]:checked')?.value;
    newSkp.affinityCategory = getComboboxText('comboboxAffinityCategory');
    newSkp.affinityPLU = getComboboxText('comboboxAffinityPLU');
    newSkp.orderBy = document.getElementById('affinityOrderBy')?.value || '';
  }

  const affBreakdown = document.getElementById('audienceBreakdownAffinity');
  if (campaignType === 'affinity' && affBreakdown && affBreakdown.style.display !== 'none') newSkp.audienceBreakdown = affBreakdown.innerHTML;
  const targetBreakdown = document.getElementById('audienceBreakdownTargeted');
  if (campaignType === 'campaign_Type' && targetBreakdown && targetBreakdown.style.display !== 'none') newSkp.audienceBreakdown = targetBreakdown.innerHTML;

  skpStore.unshift(newSkp); closeModal(); renderListTable();
  setTimeout(() => showToast("SKP Request submitted successfully!", "success"), 200);
  setTimeout(() => showDetailPage(newId), 500);
}

function deleteRow(btn) {
  const row = btn.closest('tr'); row.style.animation = 'rowFadeOut 0.3s ease-out forwards';
  setTimeout(() => { row.remove(); document.getElementById('campaignTableBody').querySelectorAll('tr').forEach((r, i) => { r.querySelector('td:first-child').textContent = i + 1; }); }, 300);
}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.action-trigger');
  if (trigger) {
    e.stopPropagation(); const menu = trigger.closest('.action-menu');
    document.querySelectorAll('.action-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
    menu.classList.toggle('open'); return;
  }
  document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open'));
});

// ===== Reset Form =====
function resetForm() {
  currentStep = 1;
  const el = (id) => document.getElementById(id);
  ['campaignName', 'campaignDesc', 'campaignIdea', 'campaignTypeDropdown', 'temaPromosi', 'bentukPromosi', 'mekanismePromosi'].forEach(id => { if (el(id)) el(id).value = ''; });
  ['comboboxBrand', 'comboboxCategory', 'comboboxBrandAffinityTarget', 'comboboxCategoryAffinityTarget', 'comboboxAffinityInclude', 'comboboxBrandTargeted', 'comboboxCategoryTargeted'].forEach(id => resetCombobox(id));
  if (el("startDate")) el("startDate").value = ""; if (el("endDate")) el("endDate").value = "";
  if (el("affinityOrderBy")) el("affinityOrderBy").value = "quantity"; if (el("historicalOrderBy")) el("historicalOrderBy").value = "quantity";
  document.querySelectorAll('input[name="campaignType"]').forEach((r) => (r.checked = false));
  ['affinitySection', 'targetingSection', 'affinityCategoryGroup', 'audienceCard', 'btnHitungAffinity', 'hitungAffinityNote', 'durationCard'].forEach(id => { if (el(id)) el(id).style.display = 'none'; });
  if (el("affinityCheckboxes")) el("affinityCheckboxes").innerHTML = '';
  const affRows = el("affinityTargetRowsContainer"); if (affRows) affRows.innerHTML = '';
  resetTargetedFields();
  const selectAllAffinity = document.getElementById("selectAllAffinitySKU"); if (selectAllAffinity) selectAllAffinity.checked = false;
  selectedWaTemplate = null; filteredWaTemplates = [...waTemplates];
  if (waTemplateSelectedNameEl) waTemplateSelectedNameEl.textContent = "Belum ada template yang dipilih";
  if (waTemplatePreviewBodyEl) waTemplatePreviewBodyEl.textContent = "Pilih template di panel kanan untuk melihat preview isi pesan di sini.";
  if (waTemplateCategoryTagEl) waTemplateCategoryTagEl.style.display = "none";
  if (waTemplateListEl) renderWaTemplateList();
  if (waChatEmptyEl && waChatBubbleEl) { waChatEmptyEl.style.display = "flex"; waChatBubbleEl.style.display = "none"; }
  updateWaTemplateActionState();
  clearErrors(); updateStepper(); updateFormStep(); updateButtons();
}

(function initDates() {
  const today = new Date(), nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 20);
  document.getElementById("startDate").value = today.toISOString().split("T")[0];
  document.getElementById("endDate").value = nextMonth.toISOString().split("T")[0];
})();

populateDropdownBrand('dropdownBrand', false);
populateAffinityCategories();
toggleAffinityFields();

initMultiSelectCombobox('comboboxBrand', (brands) => {
  populateDropdownCategory('dropdownCategory', brands, true);
  initMultiSelectCombobox('comboboxCategory', () => updateAffinitySelection());
  resetMultiSelectCombobox('comboboxCategory'); updateAffinitySelection();
});
initMultiSelectCombobox('comboboxCategory', () => updateAffinitySelection());
initMultiSelectCombobox('comboboxAffinityCategory', () => updateAffinitySelection());
initMultiSelectCombobox('comboboxAffinityPLU', () => updateAffinitySelection());
initMultiSelectCombobox('comboboxCategory', () => { updateSKUList(); checkStepCompletion(); });
initMultiSelectCombobox('comboboxAffinityInclude');
initMultiSelectCombobox('comboboxBrandTargeted', () => checkStepCompletion());
initMultiSelectCombobox('comboboxCategoryTargeted', () => checkStepCompletion());

initSearchableCombobox('comboboxDCSegment', () => { updateTargetedAudienceVisibility(); checkStepCompletion(); });
initSearchableCombobox('comboboxDCHist', () => { updateTargetedAudienceVisibility(); checkStepCompletion(); });

// ===== SPA Navigation =====
function navigateTo(page, skipPush) {
  currentPage = page; document.body.dataset.detailEditMode = 'false';
  document.querySelectorAll('.page-content').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
  const pageTitle = document.querySelector('.page-title'), createBtn = document.getElementById('openModalBtn');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (page === 'list') {
    const el = document.getElementById('pageList'); el.style.display = 'block'; el.classList.add('active');
    if (pageTitle) pageTitle.textContent = 'Surat Kerja Sama Promosi'; if (createBtn) createBtn.style.display = '';
    renderListTable(); const navItem = document.querySelector('[data-nav="skp-request"]'); if (navItem) navItem.classList.add('active');
  } else if (page === 'detail') {
    const el = document.getElementById('pageDetail'); el.style.display = 'block'; el.classList.add('active');
    if (pageTitle) pageTitle.textContent = 'Detail SKP'; if (createBtn) createBtn.style.display = 'none';
    const navItem = document.querySelector('[data-nav="skp-request"]'); if (navItem) navItem.classList.add('active');
  } else if (page === 'admin') {
    const el = document.getElementById('pageAdmin'); el.style.display = 'block'; el.classList.add('active');
    if (pageTitle) pageTitle.textContent = 'SKP Approval'; if (createBtn) createBtn.style.display = 'none';
    renderAdminPage(); const navItem = document.querySelector('[data-nav="skp-admin"]'); if (navItem) navItem.classList.add('active');
  }
}

function renderListTable() {
  const tbody = document.getElementById('campaignTableBody'); if (!tbody) return;
  tbody.innerHTML = '';
  skpStore.forEach((skp, idx) => {
    const displayType = skp.promotionType === 'campaign_Type' ? 'Targeted' : (skp.promotionType === 'affinity' ? 'Affinity' : skp.promotionType);
    const startFormatted = skp.startDate ? new Date(skp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
    const endFormatted = skp.endDate ? new Date(skp.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
    const badgeClass = skp.status === 'Approved' ? 'badge-approved' : skp.status === 'Rejected' ? 'badge-rejected' : 'badge-Submited';
    const tr = document.createElement('tr'); tr.dataset.skpId = skp.id;
    tr.innerHTML = `<td>${idx + 1}</td><td onclick="showDetailPage(${skp.id})">${skp.name}</td><td><span class="badge ${badgeClass}">${skp.status}</span></td><td style="text-transform:capitalize;">${displayType}</td><td>${startFormatted}</td><td>${endFormatted}</td><td><div class="action-menu"><button class="btn-icon action-trigger">\u22ee</button><div class="action-dropdown"><button class="action-item" onclick="showDetailPage(${skp.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View</button><button class="action-item action-delete" onclick="deleteSkp(${skp.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg> Delete</button></div></div></td>`;
    tbody.appendChild(tr);
  });
}

function deleteSkp(id) {
  const idx = skpStore.findIndex(s => s.id === id); if (idx === -1) return;
  const row = document.querySelector(`tr[data-skp-id="${id}"]`);
  if (row) { row.style.animation = 'rowFadeOut 0.3s ease-out forwards'; setTimeout(() => { skpStore.splice(idx, 1); renderListTable(); }, 300); }
  else { skpStore.splice(idx, 1); renderListTable(); }
}

function showDetailPage(id) {
  const skp = skpStore.find(s => s.id === id); if (!skp) return;
  currentDetailId = id;
  if (currentPage !== 'detail') navigateTo('detail');
  document.getElementById('detailTitle').textContent = skp.name;
  document.getElementById('detailSubtitle').textContent = 'SKP-' + String(skp.id).padStart(4, '0');
  const badge = document.getElementById('detailStatusBadge');
  badge.textContent = skp.status; badge.className = 'badge ' + (skp.status === 'Approved' ? 'badge-approved' : skp.status === 'Rejected' ? 'badge-rejected' : 'badge-Submited');
  const editBtn = document.getElementById('btnEditDetail');
  if (skp.status === 'Approved') { if (editBtn) editBtn.style.display = 'none'; } else { if (editBtn) editBtn.style.display = 'flex'; }
  const segmentSection = document.getElementById('segmentPickerSection'); if (segmentSection) segmentSection.style.display = 'none';

  const waSection = document.getElementById('waTemplatePickerSection');
  if (waSection) {
    if (skp.status === 'Approved') {
      waSection.style.display = 'block';
      const setupLayout = waSection.querySelector('.wa-template-setup-layout'), submitBtn = document.getElementById('btnSubmitWaTemplate');
      if (skp.templateStatus === 'Submitted') {
        if (submitBtn) { submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="margin-right:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Template Submitted'; submitBtn.disabled = true; submitBtn.style.setProperty('background', '#059669', 'important'); submitBtn.style.setProperty('color', 'white', 'important'); submitBtn.style.setProperty('opacity', '1', 'important'); }
        if (setupLayout) { setupLayout.style.pointerEvents = "none"; setupLayout.style.opacity = "0.8"; }
      } else if (skp.templateStatus === 'Approved') {
        if (submitBtn) { submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="margin-right:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Template Approved'; submitBtn.disabled = true; submitBtn.style.setProperty('background', '#10b981', 'important'); submitBtn.style.setProperty('color', 'white', 'important'); submitBtn.style.setProperty('opacity', '1', 'important'); }
        if (setupLayout) { setupLayout.style.pointerEvents = "none"; setupLayout.style.opacity = "1"; }
      } else {
        if (submitBtn) { submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="margin-right:8px;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Templated'; submitBtn.disabled = false; submitBtn.style.setProperty('background', '#dc1e35', 'important'); submitBtn.style.setProperty('color', 'white', 'important'); submitBtn.style.setProperty('opacity', '1', 'important'); }
        if (setupLayout) { setupLayout.style.pointerEvents = "auto"; setupLayout.style.opacity = "1"; }
      }
      if (skp.selectedWaTemplate) {
        document.getElementById("waTemplateSearch").value = skp.selectedWaTemplate.name;
        document.getElementById("waTemplateSelectedBodyDisplay").textContent = skp.selectedWaTemplate.body;
        document.getElementById("waTemplatePreviewBody").textContent = skp.selectedWaTemplate.body;
        document.getElementById("waChatEmpty").style.display = "none"; document.getElementById("waChatBubble").style.display = "block";
        const previewBannerEl = document.getElementById("waPreviewBanner"), bannerPlaceholderEl = document.getElementById("bannerPlaceholder"), previewBannerImgEl = document.getElementById("waPreviewBannerImg");
        if (previewBannerEl) previewBannerEl.style.display = "block";
        if (!skp.templateImage) { if (bannerPlaceholderEl) bannerPlaceholderEl.style.display = "flex"; if (previewBannerImgEl) { previewBannerImgEl.src = ""; previewBannerImgEl.style.display = "none"; } }
        else { if (bannerPlaceholderEl) bannerPlaceholderEl.style.display = "none"; if (previewBannerImgEl) { previewBannerImgEl.src = skp.templateImage; previewBannerImgEl.style.display = "block"; } }
        document.getElementById("waUploadSection").style.opacity = "1"; document.getElementById("waUploadSection").style.pointerEvents = "auto";
        document.getElementById("waBodySection").style.opacity = "1"; document.getElementById("waBodySection").style.pointerEvents = "auto";
      }
      if (skp.templateImage) {
        document.getElementById("uploadPlaceholder").style.display = "none"; document.getElementById("uploadPreview").style.display = "block";
        document.getElementById("waUploadedImage").src = skp.templateImage; document.getElementById("waPreviewBanner").style.display = "block";
        document.getElementById("waPreviewBannerImg").src = skp.templateImage; document.getElementById("bannerPlaceholder").style.display = "none";
      }
    } else waSection.style.display = 'none';
  }

  const displayType = skp.promotionType === 'campaign_Type' ? 'Targeting' : (skp.promotionType === 'affinity' ? 'Affinity' : skp.promotionType);
  const campaignTypeDDText = skp.campaignTypeDD === 'voucher' ? 'Voucher' : (skp.campaignTypeDD === 'non_voucher' ? 'Non-Voucher' : skp.campaignTypeDD);
  const bentukText = skp.bentukPromosi === 'potongan_harga' ? 'Potongan Harga' : (skp.bentukPromosi === 'gratis_produk' ? 'Gratis Produk' : skp.bentukPromosi);
  const startObj = new Date(skp.startDate), endObj = new Date(skp.endDate);
  const startFormatted = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endFormatted = endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const diffDays = Math.ceil(Math.abs(endObj - startObj) / (1000 * 60 * 60 * 24)) + 1;
  const formattedAudience = skp.audience ? Number(skp.audience).toLocaleString('id-ID') : '0';

  let targetingRows = '';
  if (skp.promotionType === 'affinity') {
    targetingRows = `<div class="detail-row"><span class="detail-label">Brand</span><span class="detail-value">${skp.brand || '-'}</span></div><div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${skp.category || '-'}</span></div><div class="detail-row"><span class="detail-label">Affinity By</span><span class="detail-value" style="text-transform:capitalize;">${skp.affinityBy || '-'}</span></div>${skp.affinityBy === 'categories' ? `<div class="detail-row"><span class="detail-label">Competitor Categories</span><span class="detail-value" style="word-break:break-all;">${skp.affinityCategory || '-'}</span></div>` : ''}${(skp.affinityBy === 'plus' || skp.affinityBy === 'plu') ? `<div class="detail-row"><span class="detail-label">Competitor PLUs</span><span class="detail-value" style="word-break:break-all;">${skp.affinityPLU || '-'}</span></div>` : ''}<div class="detail-row"><span class="detail-label">Order By</span><span class="detail-value" style="text-transform:capitalize;">${(skp.orderBy || '').replace('_', ' ')}</span></div><div class="detail-row"><span class="detail-label">Audience</span><span class="detail-value" style="color:var(--primary);font-weight:700;">${formattedAudience}</span></div>${skp.audienceBreakdown ? `<div class="detail-row" style="flex-direction:column;align-items:stretch;margin-top:10px;border-top:1px dashed #eee;padding-top:10px;">${skp.audienceBreakdown}</div>` : ''}`;
  } else if (skp.promotionType === 'campaign_Type') {
    const tType = skp.targetedType || '-';
    let detailRows = `<div class="detail-row"><span class="detail-label">Targeted Type</span><span class="review-value" style="text-transform:capitalize">${tType}</span></div>`;
    if (tType === 'segmentation') {
      const segT = skp.segmentationType || '-';
      detailRows += `<div class="detail-row"><span class="detail-label">Age Range</span><span class="detail-value">${skp.ageRange || 'All Ages'}</span></div><div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value" style="text-transform:capitalize">${skp.gender || 'All Genders'}</span></div><div class="detail-row"><span class="detail-label">Segmentation Type</span><span class="detail-value" style="text-transform:uppercase">${segT}</span></div>`;
      let rowsHtml = ''; (skp.segmentationRows || []).forEach((row, idx) => { rowsHtml += `<div style="margin-bottom:4px;padding:4px;background:#f8f9fa;border-radius:4px;">Row ${idx+1}: <strong>${row.brand}</strong> > ${row.category} > Periode: ${row.Periode} > ${row.extra}</div>`; });
      detailRows += `<div class="detail-row" style="flex-direction:column;align-items:flex-start;"><span class="detail-label">Targeting Rows</span><div style="width:100%;margin-top:8px;">${rowsHtml || '-'}</div></div><div class="detail-row"><span class="detail-label">DC</span><span class="detail-value">${skp.dc || '-'}</span></div><div class="detail-row"><span class="detail-label">Provinsi</span><span class="detail-value">${skp.provinsi || '-'}</span></div><div class="detail-row"><span class="detail-label">Kota</span><span class="detail-value">${skp.kota || '-'}</span></div>`;
    } else if (tType === 'historical') {
      let rowsHtml = '';
      if (skp.historicalRows && skp.historicalRows.length > 0) skp.historicalRows.forEach((row, idx) => { rowsHtml += `<div class="detail-row"><span class="detail-label">Row ${idx+1}</span><span class="detail-value"><strong>${row.brand}</strong> > ${row.category || 'All'} > ${row.plu || 'All'}</span></div>`; });
      detailRows += `${rowsHtml}<div class="detail-row"><span class="detail-label">Age Range</span><span class="detail-value">${skp.ageRange || 'All Ages'}</span></div><div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value" style="text-transform:capitalize">${skp.gender || 'All Genders'}</span></div><div class="detail-row"><span class="detail-label">DC</span><span class="detail-value">${skp.dc || '-'}</span></div><div class="detail-row"><span class="detail-label">Provinsi</span><span class="detail-value">${skp.provinsi || '-'}</span></div><div class="detail-row"><span class="detail-label">Kota</span><span class="detail-value">${skp.kota || '-'}</span></div><div class="detail-row"><span class="detail-label">Order By</span><span class="detail-value" style="text-transform:capitalize;">${(skp.orderBy || '-').replace('_', ' ')}</span></div>`;
    }
    targetingRows = `${detailRows}<div class="detail-row"><span class="detail-label">Audience</span><span class="detail-value" style="color:var(--primary);font-weight:700;">${formattedAudience}</span></div>${skp.audienceBreakdown ? `<div class="detail-row" style="flex-direction:column;align-items:stretch;margin-top:10px;border-top:1px dashed #eee;padding-top:10px;">${skp.audienceBreakdown}</div>` : ''}`;
  }

  let segmentRow = '';
  if (skp.status === 'Approved') {
    const brandName = skp.brand ? skp.brand.toLowerCase().replace(/\s+/g, '_') : 'brand';
    const campName = skp.name ? skp.name.toLowerCase().replace(/\s+/g, '_') : 'campaign';
    const generatedSegmentId = `1sgKa000000oM${String(skp.id).padStart(2, 'D')}IAM`;
    const formattedPopulation = skp.audience ? Number(skp.audience).toLocaleString('id-ID') : '0';
    segmentRow = `<div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Segment info</span></div><div class="detail-card-body"><div class="detail-row"><span class="detail-label">Segment ID</span><span class="detail-value">${generatedSegmentId}</span></div><div class="detail-row"><span class="detail-label">Segment Name</span><span class="detail-value">segment_${brandName}_${campName}</span></div><div class="detail-row"><span class="detail-label">Jumlah Populasi</span><span class="detail-value" style="color:var(--primary);font-weight:700;">${formattedPopulation}</span></div></div></div>`;
  }

  const marketingCloudId = `701Ka000001${String(skp.id).padStart(2,'0')}MCIA0`;
  const isEditMode = document.body.dataset.detailEditMode === 'true';
  const detailCards = document.getElementById('detailCards');

  if (isEditMode) {
    detailCards.innerHTML = `
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Edit Campaign Information</span></div><div class="detail-card-body"><div class="form-group"><label class="form-label">Campaign Name</label><input type="text" class="form-input" id="editDetailName" value="${skp.name}"></div><div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="editDetailDesc" rows="3">${skp.description || ''}</textarea></div><div class="form-group"><label class="form-label">Campaign Idea</label><textarea class="form-textarea" id="editDetailIdea" rows="3">${skp.idea || ''}</textarea></div><div class="form-group"><label class="form-label">Campaign Type</label><select class="form-select" id="editDetailTypeDD"><option value="voucher" ${skp.campaignTypeDD === 'voucher' ? 'selected' : ''}>Voucher</option><option value="non_voucher" ${skp.campaignTypeDD === 'non_voucher' ? 'selected' : ''}>Non-Voucher</option></select></div></div></div>
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Edit Promotion Details</span></div><div class="detail-card-body"><div class="form-group"><label class="form-label">Tema Promosi</label><input type="text" class="form-input" id="editDetailTema" value="${skp.temaPromosi}"></div><div class="form-group"><label class="form-label">Bentuk Promosi</label><select class="form-select" id="editDetailBentuk"><option value="potongan_harga" ${skp.bentukPromosi === 'potongan_harga' ? 'selected' : ''}>Potongan Harga</option><option value="gratis_produk" ${skp.bentukPromosi === 'gratis_produk' ? 'selected' : ''}>Gratis Produk</option></select></div><div class="form-group"><label class="form-label">Mekanisme</label><textarea class="form-textarea" id="editDetailMekanisme" rows="3">${skp.mekanisme}</textarea></div></div></div>
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Edit Schedule</span></div><div class="detail-card-body"><div class="form-row"><div class="form-group flex-1"><label class="form-label">Start Date</label><input type="date" class="form-input" id="editDetailStart" value="${skp.startDate}"></div><div class="form-group flex-1"><label class="form-label">End Date</label><input type="date" class="form-input" id="editDetailEnd" value="${skp.endDate}"></div></div></div></div>
      <div style="display:flex;gap:12px;margin-top:16px;"><button class="btn-primary" onclick="saveSkpFromDetail()" style="flex:1;">Save Changes</button><button class="btn-outline" onclick="cancelEditDetail()" style="flex:1;">Cancel</button></div>`;
    if (editBtn) editBtn.style.display = 'none';
  } else {
    detailCards.innerHTML = `
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Campaign Information</span></div><div class="detail-card-body"><div class="detail-row"><span class="detail-label">Campaign ID</span><span class="detail-value">${marketingCloudId}</span></div><div class="detail-row"><span class="detail-label">Campaign Name</span><span class="detail-value">${skp.name}</span></div><div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${skp.description || '-'}</span></div>${skp.idea ? `<div class="detail-row"><span class="detail-label">Campaign Idea</span><span class="detail-value">${skp.idea}</span></div>` : ''}<div class="detail-row"><span class="detail-label">Campaign Type</span><span class="detail-value">${campaignTypeDDText}</span></div><div class="detail-row"><span class="detail-label">Submitted By</span><span class="detail-value">${skp.submittedBy}</span></div></div></div>
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Promotion Details</span></div><div class="detail-card-body"><div class="detail-row"><span class="detail-label">Tema Promosi</span><span class="detail-value">${skp.temaPromosi}</span></div><div class="detail-row"><span class="detail-label">Bentuk Promosi</span><span class="detail-value">${bentukText}</span></div><div class="detail-row"><span class="detail-label">Mekanisme</span><span class="detail-value">${skp.mekanisme}</span></div></div></div>
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Targeting</span></div><div class="detail-card-body"><div class="detail-row"><span class="detail-label">Promotion Type</span><span class="detail-value" style="text-transform:capitalize">${displayType}</span></div>${targetingRows}</div></div>
      <div class="detail-card"><div class="detail-card-header"><span class="detail-card-title">Schedule</span></div><div class="detail-card-body"><div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">${startFormatted}</span></div><div class="detail-row"><span class="detail-label">End Date</span><span class="detail-value">${endFormatted}</span></div><div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${diffDays > 0 ? diffDays + ' days' : '-'}</span></div></div></div>
      ${segmentRow}`;
    if (skp.status !== 'Approved' && editBtn) editBtn.style.display = 'flex';
  }
  renderActivityLog(skp);
}

function renderActivityLog(skp) {
  const timeline = document.getElementById('activityLogTimeline'); if (!timeline) return;
  const iconMap = {
    created: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    submitted: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    approved: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    rejected: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    edited: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    segment: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>',
    whatsapp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  };
  const logs = [...skp.logs].reverse();
  timeline.innerHTML = logs.map(log => `<div class="log-entry"><div class="log-dot ${log.type}">${iconMap[log.type] || ''}</div><div class="log-content"><div class="log-action">${log.action}</div><div class="log-user">by ${log.user}</div><div class="log-time">${log.time}</div>${log.description ? `<div class="log-desc">${log.description}</div>` : ''}</div></div>`).join('');
}

function editSkpFromDetail() {
  if (!currentDetailId) return;
  const skp = skpStore.find(s => s.id === currentDetailId); if (!skp) return;
  if (skp.status === 'Approved') { showToast('Campaign yang sudah di-approve tidak dapat di-edit', 'error'); return; }
  document.body.dataset.detailEditMode = 'true'; showDetailPage(currentDetailId);
}

function cancelEditDetail() { document.body.dataset.detailEditMode = 'false'; showDetailPage(currentDetailId); }

function saveSkpFromDetail() {
  if (!currentDetailId) return;
  const skp = skpStore.find(s => s.id === currentDetailId); if (!skp) return;
  const name = document.getElementById('editDetailName').value, desc = document.getElementById('editDetailDesc').value, idea = document.getElementById('editDetailIdea').value, typeDD = document.getElementById('editDetailTypeDD').value, tema = document.getElementById('editDetailTema').value, bentuk = document.getElementById('editDetailBentuk').value, mekanisme = document.getElementById('editDetailMekanisme').value, start = document.getElementById('editDetailStart').value, end = document.getElementById('editDetailEnd').value;
  if (!name || !desc || !tema || !mekanisme || !start || !end) { showToast('Harap isi semua field yang wajib', 'error'); return; }
  Object.assign(skp, { name, description: desc, idea, campaignTypeDD: typeDD, temaPromosi: tema, bentukPromosi: bentuk, mekanisme, startDate: start, endDate: end });
  skp.logs.push({ action: "Edited", user: "Rania Indofood", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "edited", description: "Detail SKP diperbarui di halaman detail" });
  document.body.dataset.detailEditMode = 'false'; showToast('Perubahan berhasil disimpan!', 'success'); renderListTable(); showDetailPage(currentDetailId);
}

function toggleEditTargetingSections(val) { const a = document.getElementById('editDetailAffinityFields'), t = document.getElementById('editDetailTargetedFields'); if (a) a.style.display = val === 'affinity' ? 'block' : 'none'; if (t) t.style.display = val === 'campaign_Type' ? 'block' : 'none'; }
function toggleEditTargetedSubsections(val) { const s = document.getElementById('editDetailSegFields'), h = document.getElementById('editDetailHistFields'); if (s) s.style.display = val === 'segmentation' ? 'block' : 'none'; if (h) h.style.display = val === 'historical' ? 'block' : 'none'; }
function toggleEditSegmentationSubsections(val) { const l = document.getElementById('editDetailLoyaltySub'), n = document.getElementById('editDetailNelSub'); if (l) l.style.display = val === 'loyalty' ? 'block' : 'none'; if (n) n.style.display = val === 'nel' ? 'block' : 'none'; }

function saveSegment() {
  if (!currentDetailId) return;
  const skp = skpStore.find(s => s.id === currentDetailId); if (!skp) return;
  const segmentVal = document.getElementById('detailSegmentSelect').value;
  if (!segmentVal) { showToast('Silakan pilih segment terlebih dahulu', 'error'); return; }
  const segmentLabels = { segment_a: 'Segment A — High Value Customers', segment_b: 'Segment B — Frequent Shoppers', segment_c: 'Segment C — New Customers', segment_d: 'Segment D — Lapsed Customers', segment_e: 'Segment E — Brand Loyalists' };
  skp.segment = segmentVal;
  skp.logs.push({ action: "Segment Selected", user: "Rania Indofood", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "segment", description: `${segmentLabels[segmentVal]} dipilih` });
  showToast('Segment berhasil disimpan!', 'success'); showDetailPage(currentDetailId);
}

// ===== Admin Page =====
function renderAdminPage() {
  renderAdminStats(); renderAdminTable(); renderContentApprovals();
  const filterEl = document.getElementById('adminStatusFilter'); if (filterEl) filterEl.onchange = () => renderAdminTable();
  const searchEl = document.getElementById('searchAdminInput'); if (searchEl) searchEl.oninput = () => renderAdminTable();
}

function renderContentApprovals() {
  const container = document.getElementById('contentApprovalList'), countBadge = document.getElementById('contentApprovalCount'); if (!container) return;
  const pendingTemplates = skpStore.filter(s => s.templateStatus === 'Submitted');
  if (countBadge) countBadge.textContent = pendingTemplates.length;
  if (pendingTemplates.length === 0) { container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;background:white;border-radius:12px;border:1.5px dashed #e2e8f0;color:#94a3b8;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px;opacity:0.3;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>No content templates awaiting review</p></div>`; return; }
  container.innerHTML = pendingTemplates.map(skp => {
    const dateStr = skp.startDate ? new Date(skp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
    return `<div class="content-approval-card"><div class="content-approval-header"><div style="flex:1;"><h4 class="content-approval-title">${skp.name}</h4><div class="content-approval-meta-sub"><span>By ${skp.submittedBy || 'System'}</span><span class="dot-separator"></span><span>${dateStr}</span></div></div><span class="content-approval-status-tag">Review</span></div><div class="content-approval-body"><div class="content-approval-media-wrapper"><img class="content-approval-img" src="${skp.templateImage || 'https://placehold.co/120x80/f1f5f9/94a3b8?text=No+Image'}"><div class="content-approval-img-overlay"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> BANNER</div></div><div class="content-approval-info"><div class="content-approval-info-label">WHATSAPP MESSAGE CONTENT</div><div class="content-approval-snippet">${skp.selectedWaTemplate ? skp.selectedWaTemplate.body : 'No body content'}</div></div></div><div class="content-approval-footer"><button class="btn-reject-sm" onclick="rejectTemplate(${skp.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button><button class="btn-approve-sm" onclick="approveTemplate(${skp.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Approve Template</button></div></div>`;
  }).join('');
}

function approveTemplate(id) {
  const skp = skpStore.find(s => s.id === id); if (!skp) return;

  // Voucher readiness checks for dummy scenarios
  if (skp.campaignTypeDD === 'voucher') {
    if (skp.voucherBigQuery === false) {
      showToast("Campaign tidak dapat di-approve karena voucher belum Tersedia", "error");
      return;
    }
    if (skp.voucherAssigned === false) {
      showToast("Campaign tidak dapat di-approve karena voucher belum ter-assign ke audience", "error");
      return;
    }
    if (skp.voucherDataCloud === false) {
      showToast("Campaign tidak dapat di-approve karena voucher masih dalam tahap prosesing", "error");
      return;
    }
  }

  skp.templateStatus = 'Approved'; skp.logs.push({ action: "Content Approved", user: "Admin Alfamart", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "approved", description: "WhatsApp content template di-approve oleh admin" });
  showToast('Template for "' + skp.name + '" approved!', 'success'); renderAdminPage();
}

function rejectTemplate(id) {
  const skp = skpStore.find(s => s.id === id); if (!skp) return;
  skp.templateStatus = 'Draft'; skp.logs.push({ action: "Content Rejected", user: "Admin Alfamart", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "rejected", description: "WhatsApp content template ditolak oleh admin" });
  showToast('Template for "' + skp.name + '" rejected.', 'error'); renderAdminPage();
}

function renderAdminStats() {
  const stats = document.getElementById('adminStats'); if (!stats) return;
  const total = skpStore.length, submitted = skpStore.filter(s => s.status === 'Submitted').length, approved = skpStore.filter(s => s.status === 'Approved').length, rejected = skpStore.filter(s => s.status === 'Rejected').length;
  stats.innerHTML = `<div class="stat-card"><div class="stat-icon total"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="stat-info"><div class="stat-value">${total}</div><div class="stat-label">Total SKP</div></div></div><div class="stat-card"><div class="stat-icon submitted"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="stat-info"><div class="stat-value">${submitted}</div><div class="stat-label">Pending Review</div></div></div><div class="stat-card"><div class="stat-icon approved"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="stat-info"><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div></div><div class="stat-card"><div class="stat-icon rejected"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div class="stat-info"><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div></div>`;
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody'); if (!tbody) return;
  const filterVal = document.getElementById('adminStatusFilter')?.value || 'all', searchVal = (document.getElementById('searchAdminInput')?.value || '').toLowerCase();
  let items = skpStore;
  if (filterVal !== 'all') items = items.filter(s => s.status === filterVal);
  if (searchVal) items = items.filter(s => s.name.toLowerCase().includes(searchVal));
  tbody.innerHTML = '';
  items.forEach((skp, idx) => {
    const badgeClass = skp.status === 'Approved' ? 'badge-approved' : skp.status === 'Rejected' ? 'badge-rejected' : 'badge-Submited';
    const displayType = skp.promotionType === 'campaign_Type' ? 'Targeted' : (skp.promotionType === 'affinity' ? 'Affinity' : skp.promotionType);
    const dateStr = skp.startDate ? new Date(skp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
    let actionsHTML = skp.status === 'Submitted' ? `<div class="admin-action-btns"><button class="btn-approve" onclick="approveSkp(${skp.id})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Approve</button><button class="btn-reject" onclick="rejectSkp(${skp.id})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button><button class="btn-view-detail" onclick="showDetailPage(${skp.id})">View</button></div>` : `<div class="admin-action-btns"><button class="btn-view-detail" onclick="showDetailPage(${skp.id})">View Detail</button></div>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx + 1}</td><td>${skp.name}</td><td>${skp.submittedBy}</td><td><span class="badge ${badgeClass}">${skp.status}</span></td><td style="text-transform:capitalize;">${displayType}</td><td>${dateStr}</td><td>${actionsHTML}</td>`;
    tbody.appendChild(tr);
  });
}

function approveSkp(id) {
  const skp = skpStore.find(s => s.id === id); if (!skp) return;
  skp.status = 'Approved'; skp.logs.push({ action: "Approved", user: "Admin Alfamart", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "approved", description: "SKP request di-approve oleh admin" });
  showToast('SKP "' + skp.name + '" berhasil di-approve!', 'success'); renderAdminPage(); renderListTable();
}

function rejectSkp(id) {
  const skp = skpStore.find(s => s.id === id); if (!skp) return;
  skp.status = 'Rejected'; skp.logs.push({ action: "Rejected", user: "Admin Alfamart", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "rejected", description: "SKP request ditolak oleh admin" });
  showToast('SKP "' + skp.name + '" ditolak.', 'error'); renderAdminPage(); renderListTable();
}

const searchCampaignInput = document.getElementById('searchCampaignInput');
if (searchCampaignInput) { searchCampaignInput.addEventListener('input', (e) => { const filter = e.target.value.toLowerCase(); document.querySelectorAll('#campaignTableBody tr').forEach(row => { row.style.display = (row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '').includes(filter) ? '' : 'none'; }); }); }

renderListTable();

// ===== WhatsApp Template (Detail Page) =====
const btnUseTemplate = document.getElementById("btnUseTemplate");

function fetchWhatsAppTemplates() {
  if (waTemplates.length > 0) return;
  if (waTemplateListEl) waTemplateListEl.innerHTML = "";
  if (waTemplateLoadingEl) waTemplateLoadingEl.style.display = "block";
  if (waTemplateErrorEl) waTemplateErrorEl.style.display = "none";
  const url = `https://graph.facebook.com/${WA_META_CONFIG.apiVersion}/${WA_META_CONFIG.wabaId}/message_templates?fields=name,status,category,language,components&limit=100`;
  fetch(url, { method: "GET", headers: { Authorization: `Bearer ${WA_META_CONFIG.token}`, "Content-Type": "application/json" } })
    .then((res) => { if (!res.ok) throw new Error("Gagal mengambil data dari Meta API"); return res.json(); })
    .then((data) => {
      if (waTemplateLoadingEl) waTemplateLoadingEl.style.display = "none";
      if (data && data.data) { waTemplates = data.data.filter((t) => t.status === "APPROVED" && t.category === "MARKETING"); filteredWaTemplates = [...waTemplates]; renderWaTemplates(); }
    })
    .catch((err) => { console.error("Meta API Error:", err); if (waTemplateLoadingEl) waTemplateLoadingEl.style.display = "none"; if (waTemplateErrorEl) waTemplateErrorEl.style.display = "block"; });
}

function renderWaTemplates() {
  if (!waTemplateListEl) return;
  if (filteredWaTemplates.length === 0) { waTemplateListEl.innerHTML = '<div style="padding:1rem;color:var(--gray-500);text-align:center;font-size:0.8rem;">No templates found.</div>'; return; }
  waTemplateListEl.innerHTML = filteredWaTemplates.map(tpl => {
    const isSelected = selectedWaTemplate && selectedWaTemplate.id === tpl.id;
    return `<div class="wa-dropdown-item ${isSelected ? 'selected' : ''}" data-id="${tpl.id}" style="cursor:pointer;padding:10px;border-bottom:1px solid #eee;"><div class="wa-dropdown-item-title" style="font-weight:600;color:#111827;font-size:0.85rem;">${tpl.name}</div><div class="wa-dropdown-item-meta" style="font-size:0.72rem;color:#6b7280;text-transform:uppercase;">${tpl.category || '-'} &bull; ${tpl.language || '-'}</div></div>`;
  }).join("");
}

const waImageUploadZone = document.getElementById('waImageUploadZone'), waFileInput = document.getElementById('waFileInput');
if (waImageUploadZone && waFileInput) {
  waImageUploadZone.onclick = () => waFileInput.click();
  waFileInput.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const base64 = re.target.result;
      const skp = skpStore.find(s => s.id === currentDetailId); if (skp) skp.templateImage = base64;
      const placeholder = document.getElementById("uploadPlaceholder"), preview = document.getElementById("uploadPreview"), uploadedImg = document.getElementById("waUploadedImage");
      const previewBanner = document.getElementById("waPreviewBanner"), previewBannerImg = document.getElementById("waPreviewBannerImg"), bannerPlaceholder = document.getElementById("bannerPlaceholder");
      if (placeholder) placeholder.style.display = "none"; if (preview) preview.style.display = "block"; if (uploadedImg) uploadedImg.src = base64;
      if (previewBanner) previewBanner.style.display = "block"; if (previewBannerImg) { previewBannerImg.src = base64; previewBannerImg.style.display = "block"; } if (bannerPlaceholder) bannerPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  };
}

const btnSubmitWaTemplate = document.getElementById('btnSubmitWaTemplate');
if (btnSubmitWaTemplate) {
  btnSubmitWaTemplate.onclick = () => {
    const skp = skpStore.find(s => s.id === currentDetailId);
    if (!skp || !skp.selectedWaTemplate) { showToast('Pilih template terlebih dahulu!', 'error'); return; }
    skp.templateStatus = 'Submitted';
    skp.logs.push({ action: "Template Submitted", user: "Rania Indofood", time: new Date().toISOString().slice(0, 16).replace('T', ' '), type: "submitted", description: "WhatsApp content template '" + skp.selectedWaTemplate.name + "' diajukan untuk review admin" });
    showToast('Template berhasil diajukan!', 'success'); showDetailPage(currentDetailId);
  };
}

const btnCancelWaSetup = document.getElementById('btnCancelWaSetup');
if (btnCancelWaSetup) btnCancelWaSetup.onclick = () => showDetailPage(currentDetailId);

function selectWaTemplateById(id) {
  selectedWaTemplate = waTemplates.find(t => t.id === id); if (!selectedWaTemplate) return;
  const bodyComponent = selectedWaTemplate.components?.find(c => c.type === 'BODY');
  const skp = skpStore.find(s => s.id === currentDetailId);
  if (skp) skp.selectedWaTemplate = { id: selectedWaTemplate.id, name: selectedWaTemplate.name, body: bodyComponent ? bodyComponent.text : '' };
  const waTemplateSelectedBodyDisplay = document.getElementById("waTemplateSelectedBodyDisplay");
  if (waTemplateSelectedBodyDisplay && bodyComponent) waTemplateSelectedBodyDisplay.textContent = bodyComponent.text;
  const waChatEmpty = document.getElementById("waChatEmpty"), waChatBubble = document.getElementById("waChatBubble"), waPreviewBody = document.getElementById("waTemplatePreviewBody");
  if (waChatEmpty) waChatEmpty.style.display = "none"; if (waChatBubble) waChatBubble.style.display = "block"; if (waPreviewBody && bodyComponent) waPreviewBody.textContent = bodyComponent.text;
  const previewBannerEl = document.getElementById("waPreviewBanner"), bannerPlaceholderEl = document.getElementById("bannerPlaceholder"), previewBannerImgEl = document.getElementById("waPreviewBannerImg");
  if (previewBannerEl) previewBannerEl.style.display = "block";
  if (skp && !skp.templateImage) { if (bannerPlaceholderEl) bannerPlaceholderEl.style.display = "flex"; if (previewBannerImgEl) { previewBannerImgEl.src = ""; previewBannerImgEl.style.display = "none"; } }
  else if (skp && skp.templateImage) { if (bannerPlaceholderEl) bannerPlaceholderEl.style.display = "none"; if (previewBannerImgEl) { previewBannerImgEl.src = skp.templateImage; previewBannerImgEl.style.display = "block"; } }
  const uploadSec = document.getElementById("waUploadSection"), bodySec = document.getElementById("waBodySection");
  if (uploadSec) { uploadSec.style.opacity = "1"; uploadSec.style.pointerEvents = "auto"; } if (bodySec) { bodySec.style.opacity = "1"; bodySec.style.pointerEvents = "auto"; }
  const waTemplateSearchInput = document.getElementById("waTemplateSearch"); if (waTemplateSearchInput) waTemplateSearchInput.value = selectedWaTemplate.name;
  const listArea = document.getElementById("waTemplateListArea"); if (listArea) listArea.style.display = "none";
}

const waTemplateSearchWrapper = document.getElementById("waTemplateSearchWrapper");
if (waTemplateSearchWrapper) {
  waTemplateSearchWrapper.addEventListener("click", () => {
    const listArea = document.getElementById("waTemplateListArea"); if (!listArea) return;
    if (listArea.style.display === "none") { listArea.style.display = "block"; fetchWhatsAppTemplates(); setTimeout(() => document.getElementById("waTemplateSearch")?.focus(), 50); }
    else listArea.style.display = "none";
  });
}

const waTemplateSearch = document.getElementById("waTemplateSearch");
if (waTemplateSearch) {
  waTemplateSearch.addEventListener("input", (e) => {
    const listArea = document.getElementById("waTemplateListArea"); if (listArea && listArea.style.display === "none") { listArea.style.display = "block"; fetchWhatsAppTemplates(); }
    const term = e.target.value.toLowerCase(); filteredWaTemplates = waTemplates.filter(t => t.name.toLowerCase().includes(term)); renderWaTemplates();
  });
  waTemplateSearch.addEventListener("click", (e) => {
    e.stopPropagation(); const listArea = document.getElementById("waTemplateListArea");
    if (listArea && listArea.style.display === "none") { listArea.style.display = "block"; fetchWhatsAppTemplates(); }
  });
}

if (waTemplateListEl) {
  waTemplateListEl.addEventListener("click", (e) => {
    const item = e.target.closest(".wa-dropdown-item"); if (item) { selectWaTemplateById(item.getAttribute("data-id")); renderWaTemplates(); }
  });
}

populateDropdownDC('dropdownDCSegment');
populateDropdownDC('dropdownDCHist');

// ===== Inline CSS for targeting rows =====
const style = document.createElement('style');
style.textContent = `
  .targeting-header { display: none !important; }
  #loyaltyRowsContainer, #nelRowsContainer, #histTargetingRowsContainer { margin-top: 15px; display: flex; flex-direction: column; gap: 8px; }
  .targeting-row { background: #f8fafc !important; border: 1px solid #f1f5f9 !important; border-radius: 14px; width: 100%; box-sizing: border-box; margin-bottom: 12px; position: relative; gap: 8px !important; padding: 16px 14px !important; align-items: flex-start !important; }
  .loyRow-row { grid-template-columns: 120px 0.6fr 0.6fr 4fr 44px !important; }
  .nelRow-row { grid-template-columns: 1fr 1fr 1.2fr 44px !important; }
  .histRow-row { grid-template-columns: 1fr 1fr 1fr 44px !important; }
  .targeting-row > div { background: transparent !important; border: none !important; box-shadow: none !important; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; padding: 0 !important; min-width: 0; position: relative; overflow: visible !important; height: auto !important; }
  .targeting-row > .col-action { justify-content: center; align-items: center; width: 44px !important; display: flex !important; }
  .col-header-label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; pointer-events: none; white-space: nowrap; min-height: 14px; line-height: 1; }
  .targeting-row .combobox-input-wrapper { height: 38px !important; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: 8px !important; width: 100% !important; padding: 0 12px !important; font-size: 0.8rem !important; color: #1e293b !important; font-weight: 600 !important; display: flex !important; align-items: center !important; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; box-sizing: border-box !important; padding-right: 28px !important; justify-content: flex-start !important; gap: 0 !important; }
  .targeting-row .form-select { height: 38px !important; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: 8px !important; width: 100% !important; max-width: 100% !important; padding: 0 12px !important; font-size: 0.8rem !important; color: #1e293b !important; font-weight: 600 !important; display: block !important; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; box-sizing: border-box !important; padding-right: 28px !important; }
  .targeting-row .col-period .form-select { border-left: 4px solid #4f46e5 !important; padding-left: 10px !important; }
  .targeting-row .form-select { appearance: none; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E") no-repeat right 10px center / 14px !important; }
  .targeting-row .searchable-combobox { width: 100%; height: 38px; display: flex; align-items: center; position: relative; }
  .targeting-row .searchable-combobox::after { content: ''; position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E") no-repeat center / contain; pointer-events: none; }
  .targeting-row .searchable-combobox.all-selected::after { opacity: 0 !important; pointer-events: none !important; }
  .targeting-row .searchable-combobox.all-selected .combobox-chip { background: transparent !important; border: none !important; color: #4f46e5 !important; font-weight: 700 !important; padding: 0 !important; box-shadow: none !important; }
  .targeting-row .searchable-combobox.all-selected .chip-remove { display: none !important; }
  .targeting-row .combobox-input { border: none !important; outline: none !important; background: transparent !important; height: 100% !important; padding: 0 4px 0 0 !important; text-align: left !important; margin: 0 !important; font-size: 0.78rem !important; color: #1e293b !important; font-weight: 600 !important; cursor: pointer; text-overflow: ellipsis; flex: 1 1 0% !important; }
  .targeting-row .combobox-input::placeholder { color: #94a3b8 !important; font-weight: 400 !important; opacity: 0.8; }
  .targeting-row .combobox-dropdown { position: absolute; top: 100%; left: 0 !important; width: 100% !important; min-width: 100% !important; z-index: 9999 !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; border-radius: 8px !important; max-height: 250px; overflow-y: auto; margin-top: 8px; }
  .targeting-row .combobox-chips { padding: 2px 0; display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 4px; align-items: center; scrollbar-width: none; flex: 1 !important; min-width: 0 !important; max-width: 95% !important; margin-right: 4px; height: 100%; flex-shrink: 0; }
  .targeting-row .combobox-chips:empty { display: none !important; }
  .targeting-row .combobox-chips::-webkit-scrollbar { display: none; }
  .targeting-row .combobox-chip { background: #eff6ff !important; color: #3b82f6 !important; padding: 1px 8px !important; border-radius: 6px !important; font-size: 0.72rem !important; font-weight: 700 !important; border: 1px solid #dbeafe !important; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; height: 24px; margin: 0 !important; }
  .targeting-row .combobox-chip .chip-remove { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0; line-height: 1; font-size: 1.1rem; font-weight: 400; }
  .targeting-row .combobox-chip .chip-remove:hover { color: #ef4444; }
  .btn-remove-target-outline { width: 38px; height: 38px; color: #94a3b8 !important; background: #ffffff !important; border: 1px solid #e2e8f0 !important; cursor: pointer; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
  .btn-remove-target-outline:hover { background: #f8fafc !important; color: #ef4444 !important; border-color: #cbd5e1 !important; }
  .btn-create[id^="btnAdd"] { width: 100%; height: 44px; background: #f8fafc !important; border: 2px dashed #e2e8f0 !important; border-radius: 10px; color: #64748b !important; font-weight: 600 !important; font-size: 0.82rem !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px; margin-top: 10px; }
  .btn-create[id^="btnAdd"]:hover { background: #ffffff !important; border-color: #3b82f6 !important; color: #2563eb !important; border-style: solid !important; }
`;
document.head.appendChild(style);

addLoyaltyRow();
addNelRow();
addHistoricalTargetRow();
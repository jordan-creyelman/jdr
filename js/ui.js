
import { $, $$, safeInt } from './utils.js';

const ATTRS = [
  ['force','Force'],['constitution','Constitution'],['dexterite','Dextérité'],['perception','Perception'],
  ['intelligence','Intelligence'],['esprit','Esprit'],['sociabilite','Sociabilité'],['volonte','Volonté'],['chance','Chance']
];

export const SLOT_OPTIONS = [
  ['casque','Casque'], ['amulette','Amulette'], ['cape','Cape / Épaulières'],
  ['armure','Armure / Robe'], ['gants','Gants'], ['jambieres','Jambières'],
  ['bottes','Bottes'], ['anneau1','Anneau 1'], ['anneau2','Anneau 2']
];

export function renderAll(model){
  renderCore(model);
  renderClasses(model);
  renderVitals(model);
  renderStats(model);
  renderSkills(model);
  renderInventory(model);
  renderEquipment(model);
  closeEquipModal();
  hideInlineConfirm();
}

export function renderCore(model){
  const s = model.state;
  $('#name').value = s.core.name;
  $('#race').value = s.core.race;
  $('#hp-current').value = s.core.hp.current;
  $('#hp-max').value = s.core.hp.max;
  $('#mana-current').value = s.core.mana.current;
  $('#mana-max').value = s.core.mana.max;
  $('#armor').value = s.core.armor;
}

export function renderVitals(model) {
  const s = model.state.core;
  const bonuses = model.getAllEquipmentBonuses ? model.getAllEquipmentBonuses() : {};

  // Valeurs de base + bonus
  const hpCur = s.hp.current || 0;
  const hpMax = (s.hp.max || 0) + (bonuses.hp || 0);
  const manaCur = s.mana.current || 0;
  const manaMax = (s.mana.max || 0) + (bonuses.mana || 0);
  const armorVal = (s.armor || 0) + (bonuses.armure || 0);

  // --- MàJ des champs numériques ---
  const hpCurEl = document.getElementById('hp-current');
  const hpMaxEl = document.getElementById('hp-max');
  const manaCurEl = document.getElementById('mana-current');
  const manaMaxEl = document.getElementById('mana-max');
  const armorEl = document.getElementById('armor');

  if (hpCurEl) hpCurEl.value = hpCur;
  if (hpMaxEl) hpMaxEl.value = hpMax;
  if (manaCurEl) manaCurEl.value = manaCur;
  if (manaMaxEl) manaMaxEl.value = manaMax;
  if (armorEl) armorEl.value = armorVal;

  // --- MàJ des barres visuelles ---
  const hpBar = document.getElementById('bar-hp');
  const manaBar = document.getElementById('bar-mana');

  if (hpBar && hpMax > 0) {
    const percent = Math.max(0, Math.min(100, (hpCur / hpMax) * 100));
    hpBar.style.width = `${percent}%`;
  }

  if (manaBar && manaMax > 0) {
    const percent = Math.max(0, Math.min(100, (manaCur / manaMax) * 100));
    manaBar.style.width = `${percent}%`;
  }
}


export function renderStats(model){
  const grid = $('#stats-grid'); grid.innerHTML='';
  ATTRS.forEach(([key, label])=>{
    const base = safeInt(model.state.stats[key]||0);
    const bonus = model.totalBonusFor(key);
    const box = document.createElement('div'); box.className = 'stat-box';
    box.innerHTML = `
      <div class="stat-label">${label}</div>
      <div class="stat-values">
        <div class="spin">
          <button class="spin-btn" data-stat="${key}" data-d="-1" type="button">−</button>
          <input type="number" min="0" step="1" class="stat-input" data-stat="${key}" value="${base}">
          <button class="spin-btn" data-stat="${key}" data-d="1" type="button">+</button>
        </div>
        <div class="stat-bonus">${bonus>0?`(+${bonus})`:'(+0)'}</div>
      </div>`;
    grid.appendChild(box);
  });
}

export function renderClasses(model){
  const wrap = $('#classes'); wrap.innerHTML='';
  const list = model.state.classes;
  if(!list.length){ wrap.appendChild(empty('Aucune classe')); return; }
  list.forEach((c,idx)=>{
    const row = document.createElement('div'); row.className='item'; row.dataset.idx=idx;
    row.innerHTML = `
      <input type="text" class="cls-name" placeholder="Nom de classe" value="${c.name||''}">
      <input type="number" min="0" step="1" class="cls-level" placeholder="Niveau" value="${c.level ?? 0}">
      <small>Niveau</small>
      <button class="icon-btn x-class" title="Supprimer" type="button">✕</button>`;
    wrap.appendChild(row);
  });
}

export function renderSkills(model){
  const wrap = $('#skills'); wrap.innerHTML='';
  const list = model.state.skills;
  if(!list.length){ wrap.appendChild(empty('Aucune compétence')); return; }
  list.forEach((s,idx)=>{
    const row = document.createElement('div'); row.className='item'; row.dataset.idx=idx;
    row.innerHTML = `
      <input type="text" class="sk-name" placeholder="Nom de compétence" value="${s.name||''}">
      <select class="sk-type">
        <option ${s.type==='Passive'?'selected':''}>Passive</option>
        <option ${s.type==='Active'?'selected':''}>Active</option>
      </select>
      <input type="number" min="0" step="1" class="sk-cost" placeholder="Coût PM" value="${safeInt(s.cost)}">
      <input type="text" class="sk-mana-left" value="" readonly title="Mana restant">
      <button class="icon-btn sm use-skill" title="Utiliser" data-idx="${idx}" type="button">▶</button>
      <button class="icon-btn sm red x-skill" title="Supprimer" type="button">✕</button>`;
    wrap.appendChild(row);
  });
}

export function renderInventory(model){
  const wrap = $('#inventory'); wrap.innerHTML='';
  const list = model.state.inventory;
  if(!list.length){ wrap.appendChild(empty('Inventaire vide')); return; }
  list.forEach((it,idx)=>{
    const row = document.createElement('div'); row.className='item inv'; row.dataset.idx=idx;
    row.innerHTML = `
      <input type="text" class="it-name" placeholder="Nom de l'objet" value="${it.name||''}">
      <input type="text" class="it-category" placeholder="Catégorie (ex: Arme, Potion)" value="${it.category||''}">
      <input type="number" min="0" step="1" class="it-qty" placeholder="Qté" value="${it.qty ?? 1}">
      <input type="text" class="it-notes" placeholder="Notes" value="${it.notes||''}">
      <button class="icon-btn sm equip-item" title="Équiper" type="button">⚙️</button>
      <button class="icon-btn sm red x-item" title="Supprimer" type="button">✕</button>`;
    wrap.appendChild(row);
  });
}

export function renderEquipment(model){
  const grid = $('#equip-grid'); grid.innerHTML='';
  const order = SLOT_OPTIONS;
  order.forEach(([key, label])=>{
    const data = model.state.equipment[key] || {name:'', bonus:[]};
    const slot = document.createElement('div'); slot.className = 'equip-slot'; slot.dataset.key = key;
    const bonusesHtml = (data.bonus||[]).map((b,i)=> bonusRowHTML(key,i,b.attr,b.value)).join('');
    slot.innerHTML = `
      <div class="equip-top"><div class="equip-title">${label}</div></div>
      <input type="text" class="equip-input" placeholder="Nom de l'équipement" value="${data.name||''}">
      <div class="bonus-wrap" data-key="${key}">${bonusesHtml}</div>
      <button class="btn add-bonus" data-key="${key}" type="button">+ Bonus</button>`;
    grid.appendChild(slot);
  });
}

function bonusRowHTML(key, idx, attr='', value=0){
  const opts = [
  ['force', 'Force'],
  ['constitution', 'Constitution'],
  ['dexterite', 'Dextérité'],
  ['perception', 'Perception'],
  ['intelligence', 'Intelligence'],
  ['esprit', 'Esprit'],
  ['sociabilite', 'Sociabilité'],
  ['volonte', 'Volonté'],
  ['chance', 'Chance'],
  ['hp', 'Vie (HP)'],
  ['mana', 'Mana'],
  ['armure', 'Armure']
].map(([k, lab]) => `<option value="${k}" ${k === attr ? 'selected' : ''}>${lab}</option>`).join('');return `<div class="bonus-row" data-key="${key}" data-idx="${idx}">
    <select class="bonus-attr">${opts}</select>
    <input type="number" min="0" step="1" class="bonus-val" value="${safeInt(value)}">
    <button class="icon-btn sm red x-bonus" title="Supprimer" type="button">✕</button>
  </div>`;
}

export function empty(text){
  const div = document.createElement('div');
  div.className = 'muted';
  div.textContent = text;
  div.style.padding = '8px 2px';
  return div;
}

/* ===== Modal (sélection de slot) ===== */
export function openEquipModal(payload){
  const modal = $('#equip-modal');
  const itemName = $('#modal-item-name');
  const slotSelect = $('#modal-slot');

  itemName.value = payload.itemName || '';
  modal.dataset.invIndex = String(payload.invIndex);
  slotSelect.innerHTML = SLOT_OPTIONS.map(([k,lab])=> `<option value="${k}">${lab}</option>`).join('');

  modal.classList.remove('hidden');
  modal.classList.add('show');
  slotSelect.focus();
}
export function closeEquipModal(){
  const modal = $('#equip-modal');
  modal.classList.add('hidden');
  modal.classList.remove('show');
  delete modal.dataset.invIndex;
}

/* ===== Inline confirmation (au-dessus de la grille) ===== */
let _confirmHandlers = {yes:null,no:null};
let _locked = false;
let _highlightKey = null;

export function showInlineConfirm(message, slotKey, onYes, onNo){
  // show banner with fade-in
  const box = $('#equip-inline-confirm');
  $('#equip-inline-message').textContent = message || '';
  _confirmHandlers.yes = onYes; _confirmHandlers.no = onNo;
  _locked = true;

  clearSlotHighlight();
  _highlightKey = slotKey;
  const slotEl = document.querySelector(`.equip-slot[data-key="${slotKey}"]`);
  if(slotEl){ slotEl.classList.add('slot-highlight'); }

  box.classList.remove('hidden');
  box.classList.add('show');
  // remove animation class after play so next time it re-triggers
  setTimeout(()=> box.classList.remove('show'), 180);
}
export function hideInlineConfirm(){
  const box = $('#equip-inline-confirm');
  box.classList.add('hidden');
  _confirmHandlers = {yes:null,no:null};
  _locked = false;
  clearSlotHighlight();
}
export function bindInlineConfirm(){
  const yes = $('#equip-inline-yes');
  const no = $('#equip-inline-no');
  yes.addEventListener('click', ()=>{ const cb=_confirmHandlers.yes; hideInlineConfirm(); if(cb) cb(); });
  no.addEventListener('click', ()=>{ const cb=_confirmHandlers.no; hideInlineConfirm(); if(cb) cb(); });
}
export function isLocked(){ return _locked; }
function clearSlotHighlight(){
  if(_highlightKey){
    const prev = document.querySelector(`.equip-slot[data-key="${_highlightKey}"]`);
    if(prev) prev.classList.remove('slot-highlight');
  }
  _highlightKey = null;
}

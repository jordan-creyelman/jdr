
import { $, $$, download, safeInt, clamp } from './utils.js';
import { SLOT_OPTIONS, renderAll, renderClasses, renderSkills, renderInventory, renderEquipment, openEquipModal, closeEquipModal, showInlineConfirm, hideInlineConfirm, bindInlineConfirm, isLocked } from './ui.js';

export function bindAll(model){
  bindCore(model);
  bindClasses(model);
  bindSkills(model);
  bindInventory(model);
  bindEquipment(model);
  bindModal(model);
  bindTopActions(model);
  bindInlineConfirm();
}

function bindCore(model){
  $('#name').addEventListener('input', e=>{ if(isLocked()) return; model.state.core.name = e.target.value; model.scheduleSave(); });
  $('#race').addEventListener('input', e=>{ if(isLocked()) return; model.state.core.race = e.target.value; model.scheduleSave(); });

  const hpCur = $('#hp-current'), hpMax = $('#hp-max');
  const mpCur = $('#mana-current'), mpMax = $('#mana-max');

  function syncHP(){ 
    model.state.core.hp.max = safeInt(hpMax.value);
    model.state.core.hp.current = clamp(safeInt(hpCur.value), 0, model.state.core.hp.max);
    hpCur.value = model.state.core.hp.current;
  }
  function syncMP(){ 
    model.state.core.mana.max = safeInt(mpMax.value);
    model.state.core.mana.current = clamp(safeInt(mpCur.value), 0, model.state.core.mana.max);
    mpCur.value = model.state.core.mana.current;
  }

  hpCur.addEventListener('input', ()=>{ if(isLocked()) return; syncHP(); model.scheduleSave(); });
  hpMax.addEventListener('input', ()=>{ if(isLocked()) return; syncHP(); model.scheduleSave(); });

  mpCur.addEventListener('input', ()=>{ if(isLocked()) return; syncMP(); model.scheduleSave(); });
  mpMax.addEventListener('input', ()=>{ if(isLocked()) return; syncMP(); model.scheduleSave(); });

  $('#armor').addEventListener('input', e=>{ if(isLocked()) return; model.state.core.armor = safeInt(e.target.value); model.scheduleSave(); });

  // Spin PV/Mana/Armure
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.spin-btn'); if(!btn) return;
    if(isLocked()) return;
    const path = btn.dataset.spin;
    const delta = parseInt(btn.dataset.d, 10);

    if(path === 'armor'){
      const next = Math.max(0, safeInt(model.state.core.armor) + delta);
      model.state.core.armor = next; $('#armor').value = next;
      model.scheduleSave(); return;
    } 
    if(path === 'hp.current' || path === 'hp.max'){
      const cur = path.endsWith('current');
      if(cur){
        const next = clamp(safeInt($('#hp-current').value) + delta, 0, safeInt($('#hp-max').value));
        model.state.core.hp.current = next; $('#hp-current').value = next;
      }else{
        const nextMax = Math.max(0, safeInt($('#hp-max').value) + delta);
        model.state.core.hp.max = nextMax;
        model.state.core.hp.current = clamp(model.state.core.hp.current, 0, nextMax);
        $('#hp-max').value = nextMax; $('#hp-current').value = model.state.core.hp.current;
      }
      model.scheduleSave(); return;
    } 
    if(path === 'mana.current' || path === 'mana.max'){
      const cur = path.endsWith('current');
      if(cur){
        const next = clamp(safeInt($('#mana-current').value) + delta, 0, safeInt($('#mana-max').value));
        model.state.core.mana.current = next; $('#mana-current').value = next;
      }else{
        const nextMax = Math.max(0, safeInt($('#mana-max').value) + delta);
        model.state.core.mana.max = nextMax;
        model.state.core.mana.current = clamp(model.state.core.mana.current, 0, nextMax);
        $('#mana-max').value = nextMax; $('#mana-current').value = model.state.core.mana.current;
      }
      model.scheduleSave(); return;
    }
  });

  // Attributs +/- avec anti-spam 100ms
  const lastClick = new Map(); // key -> timestamp
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.spin-btn[data-stat]'); if(!btn) return;
    if(isLocked()) return;
    const key = btn.dataset.stat;
    const delta = parseInt(btn.dataset.d, 10) || 0;
    const now = Date.now();
    const last = lastClick.get(key) || 0;
    if(now - last < 100) return; // anti-spam
    lastClick.set(key, now);

    const current = safeInt(model.state.stats[key] || 0);
    const next = Math.max(0, current + delta);
    model.state.stats[key] = next;

    const input = document.querySelector(`.stat-input[data-stat="${key}"]`);
    if(input) input.value = String(next);

    model.scheduleSave();
  });

  // Saisie directe d'attributs
  document.addEventListener('input', (e)=>{
    const input = e.target;
    if(input.classList.contains('stat-input')){
      if(isLocked()) return;
      const key = input.dataset.stat;
      model.state.stats[key] = Math.max(0, safeInt(input.value));
      model.scheduleSave();
    }
  });
}

function bindClasses(model){
  $('#add-class').addEventListener('click', ()=>{
    if(isLocked()) return;
    model.state.classes.push({name:'', level:0});
    renderClasses(model); 
    model.scheduleSave();
  });
  $('#classes').addEventListener('input', e=>{
    if(isLocked()) return;
    const row = e.target.closest('.item'); if(!row) return; const i = +row.dataset.idx;
    if(e.target.classList.contains('cls-name')) model.state.classes[i].name = e.target.value;
    if(e.target.classList.contains('cls-level')) model.state.classes[i].level = Math.max(0, safeInt(e.target.value));
    model.scheduleSave();
  });
  $('#classes').addEventListener('click', e=>{
    if(isLocked()) return;
    if(e.target.classList.contains('x-class')){
      const i = +e.target.closest('.item').dataset.idx; model.state.classes.splice(i,1);
      renderClasses(model); model.scheduleSave();
    }
  });
}

function bindSkills(model){
  $('#add-skill').addEventListener('click', ()=>{
    if(isLocked()) return;
    model.state.skills.push({name:'', type:'Passive', cost:0});
    renderSkills(model); model.scheduleSave();
  });

  $('#skills').addEventListener('input', e=>{
    if(isLocked()) return;
    const row = e.target.closest('.item'); if(!row) return; const i = +row.dataset.idx;
    if(e.target.classList.contains('sk-name')) model.state.skills[i].name = e.target.value;
    if(e.target.classList.contains('sk-type')) model.state.skills[i].type = e.target.value;
    if(e.target.classList.contains('sk-cost')) model.state.skills[i].cost = Math.max(0, safeInt(e.target.value));
    model.scheduleSave();
  });

  $('#skills').addEventListener('click', e=>{
    if(isLocked()) return;
    const useBtn = e.target.closest('.use-skill');
    if(useBtn){
      const idx = parseInt(useBtn.dataset.idx, 10);
      const s = model.state.skills[idx]; if(!s) return;
      const cost = Math.max(0, safeInt(s.cost));
      if(model.state.core.mana.current < cost){ return; }
      model.state.core.mana.current = Math.max(0, model.state.core.mana.current - cost);
      $('#mana-current').value = model.state.core.mana.current;
      model.scheduleSave();
      return;
    }
    const delBtn = e.target.closest('.x-skill');
    if(delBtn){
      const i = +delBtn.closest('.item').dataset.idx;
      model.state.skills.splice(i,1);
      renderSkills(model);
      model.scheduleSave();
      return;
    }
  });
}

function bindInventory(model){
  $('#add-item').addEventListener('click', ()=>{
    if(isLocked()) return;
    model.state.inventory.push({name:'', category:'', qty:1, notes:''});
    renderInventory(model); model.scheduleSave();
  });

  $('#inventory').addEventListener('input', e=>{
    if(isLocked()) return;
    const row = e.target.closest('.item'); if(!row) return; const i = +row.dataset.idx;
    if(e.target.classList.contains('it-name')) model.state.inventory[i].name = e.target.value;
    if(e.target.classList.contains('it-category')) model.state.inventory[i].category = e.target.value;
    if(e.target.classList.contains('it-qty')) model.state.inventory[i].qty = Math.max(0, safeInt(e.target.value));
    if(e.target.classList.contains('it-notes')) model.state.inventory[i].notes = e.target.value;
    model.scheduleSave();
  });

  $('#inventory').addEventListener('click', e=>{
    if(isLocked()) return;
    if(e.target.classList.contains('x-item')){
      const i = +e.target.closest('.item').dataset.idx; model.state.inventory.splice(i,1);
      renderInventory(model); model.scheduleSave();
      return;
    }
    const eqBtn = e.target.closest('.equip-item');
    if(eqBtn){
      const row = eqBtn.closest('.item'); const i = +row.dataset.idx;
      const item = model.state.inventory[i];
      if(!item || !item.name){ return; }
      openEquipModal({ itemName: item.name, invIndex: i });
    }
  });
}

function bindEquipment(model){
  $('#equip-grid').addEventListener('input', (e)=>{
    if(isLocked()) return;
    const slot = e.target.closest('.equip-slot'); if(!slot) return;
    const key = slot.dataset.key;
    if(e.target.classList.contains('equip-input')){
      model.state.equipment[key].name = e.target.value;
      model.scheduleSave();
    }
    if(e.target.classList.contains('bonus-val')){
      const row = e.target.closest('.bonus-row'); const idx = +row.dataset.idx;
      model.state.equipment[key].bonus[idx].value = Math.max(0, safeInt(e.target.value));
      model.scheduleSave();
    }
    if(e.target.classList.contains('bonus-attr')){
      const row = e.target.closest('.bonus-row'); const idx = +row.dataset.idx;
      model.state.equipment[key].bonus[idx].attr = e.target.value;
      model.scheduleSave();
    }
  });

  $('#equip-grid').addEventListener('click', (e)=>{
    if(isLocked()) return;
    const slot = e.target.closest('.equip-slot'); if(!slot) return;
    const key = slot.dataset.key;
    if(e.target.classList.contains('add-bonus')){
      model.state.equipment[key].bonus.push({attr:'force', value:1});
      renderEquipment(model); model.scheduleSave(); return;
    }
    if(e.target.classList.contains('x-bonus')){
      const row = e.target.closest('.bonus-row'); const idx = +row.dataset.idx;
      model.state.equipment[key].bonus.splice(idx,1);
      renderEquipment(model); model.scheduleSave(); return;
    }
  });
}

function bindModal(model){
  const modal = $('#equip-modal');
  $('#modal-confirm').addEventListener('click', ()=>{
    if(isLocked()) return;
    const invIndex = parseInt(modal.dataset.invIndex || '-1', 10);
    const item = model.state.inventory[invIndex];
    const slotKey = $('#modal-slot').value;
    if(invIndex < 0 || !item || !slotKey){ closeEquipModal(); return; }

    const currentName = model.state.equipment[slotKey]?.name || '';

    // Fermer la modale avant confirmation si nécessaire
    closeEquipModal();

    if(currentName){
      const msg = `Ce slot contient déjà "${currentName}". Remplacer par "${item.name}" ?`;
      showInlineConfirm(msg, slotKey, ()=>{
        model.state.equipment[slotKey].name = item.name;
        const newQty = Math.max(0, (item.qty||1) - 1);
        if(newQty === 0) model.state.inventory.splice(invIndex,1);
        else model.state.inventory[invIndex].qty = newQty;
        renderInventory(model);
        renderEquipment(model);
        model.scheduleSave();
      }, ()=>{});
    }else{
      model.state.equipment[slotKey].name = item.name;
      const newQty = Math.max(0, (item.qty||1) - 1);
      if(newQty === 0) model.state.inventory.splice(invIndex,1);
      else model.state.inventory[invIndex].qty = newQty;
      renderInventory(model);
      renderEquipment(model);
      model.scheduleSave();
    }
  });
  $('#modal-cancel').addEventListener('click', ()=>{ if(isLocked()) return; closeEquipModal(); });

  modal.addEventListener('click', (e)=>{
    const box = e.target.closest('.modal-box');
    if(!box){ if(isLocked()) return; closeEquipModal(); }
  });
}

function bindTopActions(model){
  const file = $('#file');
  $('#btn-import').addEventListener('click', ()=> { if(isLocked()) return; file.click(); });
  file.addEventListener('change', ()=>{
    const f = file.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(!data || !data.core) throw new Error('Format invalide');
        model.state = Object.assign(model.emptyState(), data);
        if(!model.state.id) model.state.id = Math.random().toString(36).slice(2,8).toUpperCase();
        if(!model.state.createdAt) model.state.createdAt = new Date().toISOString();
        model.normalize();
        renderAll(model); model.persist();
      }catch(err){ /* silencieux */ }
    };
    reader.readAsText(f); file.value = '';
  });

  $('#btn-export').addEventListener('click', ()=>{
    if(isLocked()) return;
    const json = JSON.stringify(model.state, null, 2);
    const base = (model.state.core.name || 'personnage') + '_' + model.state.id + '.json';
    download(base, json);
  });

  $('#btn-reset').addEventListener('click', ()=>{
    if(isLocked()) return;
    localStorage.removeItem(model.STORAGE_KEY);
    model.reset(); renderAll(model);
  });

  $('#btn-new').addEventListener('click', ()=>{
    if(isLocked()) return;
    model.reset(); renderAll(model);
  });

  window.addEventListener('beforeunload', ()=>{
    try{ model.persist(); }catch(_){}
    if(model.state.settings.autoDownloadOnExit){
      const ts = new Date().toLocaleString().replace(/[:/ ,]/g,'_');
      const json = JSON.stringify(model.state, null, 2);
      const base = (model.state.core.name || 'personnage') + '_' + model.state.id + '_backup_' + ts + '.json';
      try{ download(base, json); }catch(_e){} 
    }
  });
}

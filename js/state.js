
import { nowIso, safeInt, clamp } from './utils.js';

const EMPTY_EQUIP = () => ({
  casque:{ name:'', bonus:[] },
  amulette:{ name:'', bonus:[] },
  cape:{ name:'', bonus:[] },
  armure:{ name:'', bonus:[] },
  gants:{ name:'', bonus:[] },
  jambieres:{ name:'', bonus:[] },
  bottes:{ name:'', bonus:[] },
  anneau1:{ name:'', bonus:[] },
  anneau2:{ name:'', bonus:[] },
});


export class CharacterState
 {
  constructor(storageKey='rpg_char_v16'){
    this.STORAGE_KEY = storageKey;
    this.state = this.emptyState();
    this._timer = null;
  }

  defaultStats(){ return {force:0, constitution:0, dexterite:0, perception:0, intelligence:0, esprit:0, sociabilite:0, volonte:0, chance:0, hp:0, mana:0, armure:0 }; }

  emptyState(){
    return {
      id: Math.random().toString(36).slice(2,8).toUpperCase(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      settings: { autoDownloadOnExit: true },
      core: {
        name:'', race:'',
        hp: { current: 0, max: 0 },
        mana: { current: 0, max: 0 },
        armor: 0,
        armor:0, notes:''
      },
      stats: this.defaultStats(),
      classes: [],
      skills: [],
      inventory: [],
      equipment: EMPTY_EQUIP()
    };
  }

  normalize(){
    const c = this.state.core;
    c.hp.max = safeInt(c.hp.max); c.hp.current = clamp(safeInt(c.hp.current), 0, c.hp.max);
    c.mana.max = safeInt(c.mana.max); c.mana.current = clamp(safeInt(c.mana.current), 0, c.mana.max);
    this.state.skills = (this.state.skills||[]).map(s=>({name: s.name||'', type: s.type||'Passive', cost: Math.max(0, safeInt(s.cost||0))}));
    this.state.inventory = (this.state.inventory||[]).map(it=>({name: it.name||'', category: it.category||'', qty: Math.max(0,safeInt(it.qty||1)), notes: it.notes||''}));
    const eq = this.state.equipment || EMPTY_EQUIP();
    const upgraded = EMPTY_EQUIP();
    Object.keys(upgraded).forEach(k=>{
      const v = eq[k];
      if(typeof v === 'string'){
        upgraded[k] = { name: v, bonus: [] };
      } else if(v && typeof v === 'object'){
        upgraded[k] = { name: v.name||'', bonus: Array.isArray(v.bonus)? v.bonus.map(b=>({attr: String(b.attr||''), value: safeInt(b.value||0)})) : [] };
      }
    });
    this.state.equipment = upgraded;
  }

  totalBonusFor(attr){
    const eq = this.state.equipment || {};
    let sum = 0;
    Object.values(eq).forEach(slot=>{
      (slot.bonus||[]).forEach(b => { if(b.attr === attr) sum += safeInt(b.value||0); });
    });
    return sum;
  }

  persist(){
    try{
      this.state.updatedAt = nowIso();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }catch(e){ console.error('Persist error', e); }
  }

  scheduleSave(cbAfter){
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>{ this.persist(); if(cbAfter) cbAfter(); }, 200);
  }

  load(){
    try{
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if(raw){
        const data = JSON.parse(raw);
        this.state = Object.assign(this.emptyState(), data);
        this.normalize();
      }
    }catch(e){ console.error('Load error', e); }
  }

  reset(){
    this.state = this.emptyState();
    this.persist();
  }

  toJSON(){ return JSON.stringify(this.state, null, 2); }

  getAllEquipmentBonuses() {
    const bonuses = {
      hp: 0, mana: 0, armure: 0,
      force: 0, constitution: 0, dexterite: 0, perception: 0,
      intelligence: 0, esprit: 0, sociabilite: 0, volonte: 0, chance: 0
    };
    for (const slot of Object.values(this.state.equipment || {})) {
      if (!slot || !Array.isArray(slot.bonus)) continue;
      for (const b of slot.bonus) {
        const key = (b.stat || '').toLowerCase();
        const val = parseInt(b.value, 10) || 0;
        if (bonuses.hasOwnProperty(key)) bonuses[key] += val;
      }
    }
    return bonuses;
  }
}


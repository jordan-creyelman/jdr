
import { CharacterState } from './state.js';
import { renderAll } from './ui.js';
import { bindAll } from './actions.js';

const app = new CharacterState('rpg_char_v16');

function boot(){
  if (typeof renderVitals === 'function') renderVitals(model);
  app.load();
  bindAll(app);
  renderAll(app);
  app.persist();
}

document.addEventListener('DOMContentLoaded', boot);

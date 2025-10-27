
export const $ = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

export const nowIso = () => new Date().toISOString();
export const safeInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };
export const clamp = (v, min=0, max=Infinity) => Math.max(min, Math.min(max, v));

export function download(filename, data) {
  try {
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) { console.error('download error', e); }
}

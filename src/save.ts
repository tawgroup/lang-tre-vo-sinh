import type { SaveData } from "./gameState";

const SAVE_KEY = "vo-sinh-lang-tre-save-v2";

export function loadSave(): SaveData | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("game-saved"));
}

export function clearSave() {
  window.localStorage.removeItem(SAVE_KEY);
}

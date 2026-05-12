/**
 * Camada de persistência: lê/escreve no localStorage.
 * Toda a aplicação trabalha em cima de um objeto STORE em memória,
 * sincronizado com o navegador via saveStore().
 */
import { toast } from './ui.js';

const STORAGE_KEY = 'presenca_meet_v1';

/** Estrutura do STORE: { classes: { [id]: ClassData }, version: number } */
function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { classes: {}, version: 1 };
    return JSON.parse(raw);
  } catch (e) {
    return { classes: {}, version: 1 };
  }
}

/**
 * Persiste o STORE no localStorage.
 * Em caso de quota cheia, exibe toast de erro.
 */
export function saveStore(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    toast('Erro ao salvar — armazenamento cheio?', 'error');
  }
}

/** Gera um ID único curto para turmas. */
export function uid() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

/**
 * STORE global mutável.
 * Outros módulos importam e mutam este objeto diretamente;
 * chamar saveStore(STORE) propaga para o localStorage.
 */
export const STORE = loadStore();

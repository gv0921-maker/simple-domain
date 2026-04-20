// CRM-only backup/restore: exports/imports all CRM localStorage keys as JSON
// (optionally encrypted with AES-256-GCM derived from a passphrase).
import { getItem, setItem } from '@/lib/storage';

const CRM_KEYS = [
  'crm_companies',
  'crm_contacts',
  'crm_leads',
  'crm_opportunities',
  'crm_pipelines',
  'crm_activities',
  'crm_notes',
  'crm_tags',
  'crm_data_version',
];

export interface CRMBackup {
  version: 1;
  createdAt: string;
  app: 'GLF-CRM';
  data: Record<string, unknown>;
}

export function exportCRM(): CRMBackup {
  const data: Record<string, unknown> = {};
  for (const k of CRM_KEYS) {
    data[k] = getItem<unknown>(k, null);
  }
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    app: 'GLF-CRM',
    data,
  };
}

export function importCRM(backup: CRMBackup): { restored: number } {
  if (!backup || backup.app !== 'GLF-CRM') {
    throw new Error('Not a valid CRM backup file');
  }
  let restored = 0;
  for (const [k, v] of Object.entries(backup.data || {})) {
    if (v !== null && v !== undefined && CRM_KEYS.includes(k)) {
      setItem(k, v);
      restored++;
    }
  }
  return { restored };
}

// Browser-native AES-GCM encryption with PBKDF2 key derivation
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBackup(backup: CRMBackup, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(backup))
  );
  const payload = {
    encrypted: true,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    data: bufToB64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(payload);
}

export async function decryptBackup(payload: string, passphrase: string): Promise<CRMBackup> {
  const obj = JSON.parse(payload);
  if (!obj.encrypted) throw new Error('Not an encrypted backup');
  const salt = b64ToBuf(obj.salt);
  const iv = b64ToBuf(obj.iv);
  const data = b64ToBuf(obj.data);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, data as BufferSource);
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plain));
}

function bufToB64(buf: Uint8Array): string {
  let str = '';
  for (let i = 0; i < buf.length; i++) str += String.fromCharCode(buf[i]);
  return btoa(str);
}

function b64ToBuf(b64: string): Uint8Array {
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf;
}

export function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// AES-GCM encryption utilities for sensitive fields stored in Firestore
// Key is derived from a 256-bit passphrase. All operations are async (Web Crypto API).

const PASSPHRASE = 'LyfeUmbria$ecureVault!2024#Manager';

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = enc.encode(PASSPHRASE.slice(0, 32).padEnd(32, '_'));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(plainBuf);
  } catch {
    return '';
  }
}

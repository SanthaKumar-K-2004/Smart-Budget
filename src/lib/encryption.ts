const PBKDF2_ITERATIONS = 100000;

export async function encryptData(plaintext: string, passphrase: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("WebCrypto is not supported in this environment");
  }
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(plaintext)
  );
  
  const payload = {
    encrypted: true,
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
    ciphertext: bufToBase64(new Uint8Array(ciphertext)),
  };
  
  return JSON.stringify(payload);
}

export async function decryptData(encryptedJson: string, passphrase: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("WebCrypto is not supported in this environment");
  }
  const payload = JSON.parse(encryptedJson);
  if (!payload.encrypted || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error("Invalid encrypted vault format");
  }
  
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const salt = base64ToBuf(payload.salt);
  const iv = base64ToBuf(payload.iv);
  const ciphertext = base64ToBuf(payload.ciphertext);
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );
  
  return dec.decode(decrypted);
}

function bufToBase64(buf: Uint8Array): string {
  let binary = "";
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

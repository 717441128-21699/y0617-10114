const SALT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SHIFT = 7;
const SALT_LENGTH = 8;

function generateSalt(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SALT_CHARS.charAt(Math.floor(Math.random() * SALT_CHARS.length));
  }
  return result;
}

function shiftString(text: string, shift: number): string {
  return text.split('').map((char) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(code + shift);
  }).join('');
}

function unshiftString(text: string, shift: number): string {
  return text.split('').map((char) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(code - shift);
  }).join('');
}

export function encryptContent(text: string): string {
  const salt = generateSalt(SALT_LENGTH);
  const salted = salt + text;
  const shifted = shiftString(salted, SHIFT);
  const encoded = Buffer.from(shifted, 'utf-8').toString('base64');
  return `enc:${encoded}`;
}

export function decryptContent(encrypted: string): string {
  if (!encrypted.startsWith('enc:')) {
    return encrypted;
  }
  const encoded = encrypted.slice(4);
  const shifted = Buffer.from(encoded, 'base64').toString('utf-8');
  const salted = unshiftString(shifted, SHIFT);
  return salted.slice(SALT_LENGTH);
}

export function isEncrypted(text: string): boolean {
  return text.startsWith('enc:');
}

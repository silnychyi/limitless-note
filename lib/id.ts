function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  const cryptoApi = globalThis.crypto;

  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
    return bytes;
  }

  for (let index = 0; index < size; index += 1) {
    bytes[index] = (Math.random() * 256) | 0;
  }

  return bytes;
}

function toHex(byte: number): string {
  return (byte + 0x100).toString(16).slice(1);
}

export function createId(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, toHex).join("");
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}

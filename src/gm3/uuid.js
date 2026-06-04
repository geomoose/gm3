/**
 * Small shim over UUID generation.
 *
 * `crypto.randomUUID()` was used previously, but it is only exposed in
 * "secure contexts" (HTTPS). Internal sites are frequently deployed over
 * plain HTTP, where `crypto.randomUUID` is undefined and ID generation
 * would throw. `crypto.getRandomValues()`, however, is available in
 * insecure contexts as well, so we use it to build an RFC 4122 version 4
 * UUID by hand and fall back to `Math.random()` only when Web Crypto is
 * entirely unavailable.
 */

// Lookup table mapping a byte to its two-character hex representation.
const BYTE_TO_HEX = [];
for (let i = 0; i < 256; i++) {
  BYTE_TO_HEX.push((i + 0x100).toString(16).slice(1));
}

const getRandomBytes = (bytes) => {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    // Fallback for environments without Web Crypto. Not cryptographically
    // strong, but sufficient for generating unique element/source IDs.
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
};

export const uuid = () => {
  const bytes = getRandomBytes(new Uint8Array(16));

  // Set the version (4) and variant (RFC 4122) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return (
    BYTE_TO_HEX[bytes[0]] +
    BYTE_TO_HEX[bytes[1]] +
    BYTE_TO_HEX[bytes[2]] +
    BYTE_TO_HEX[bytes[3]] +
    "-" +
    BYTE_TO_HEX[bytes[4]] +
    BYTE_TO_HEX[bytes[5]] +
    "-" +
    BYTE_TO_HEX[bytes[6]] +
    BYTE_TO_HEX[bytes[7]] +
    "-" +
    BYTE_TO_HEX[bytes[8]] +
    BYTE_TO_HEX[bytes[9]] +
    "-" +
    BYTE_TO_HEX[bytes[10]] +
    BYTE_TO_HEX[bytes[11]] +
    BYTE_TO_HEX[bytes[12]] +
    BYTE_TO_HEX[bytes[13]] +
    BYTE_TO_HEX[bytes[14]] +
    BYTE_TO_HEX[bytes[15]]
  );
};

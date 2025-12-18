import type { Artifact } from '../types';

/**
 * Decodes a Base64 string into a Uint8Array.
 * @param base64 The Base64 encoded string.
 * @returns The decoded byte array.
 */
function base64ToBytes(base64: string): Uint8Array {
    const binString = atob(base64);
    const len = binString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}

export async function sealCertificate(artifact: Artifact) {
  let dataBytes: Uint8Array;

  // Convert the artifact data to a byte array, decoding from Base64 if necessary.
  if (artifact.encoding === 'base64') {
    dataBytes = base64ToBytes(artifact.data);
  } else {
    const encoder = new TextEncoder();
    dataBytes = encoder.encode(artifact.data);
  }

  const digest = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashBytes = Array.from(new Uint8Array(digest));
  const artifact_sha256 = hashBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const cert_id = crypto.randomUUID();
  const issued_at = new Date().toISOString();
  
  return { cert_id, artifact_sha256, issued_at };
}

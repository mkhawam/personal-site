
function checkSecureContext() {
    if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.subtle)) {
        throw new Error("Encryption requires HTTPS or localhost. If testing locally, use http://localhost:3000.");
    }
}

export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    checkSecureContext();
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data: object, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
    checkSecureContext();
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = enc.encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    );

    return {
        cipherText: bufferToBase64(encryptedContent),
        iv: bufferToBase64(iv)
    };
}

export async function decryptData(cipherText: string, iv: string, key: CryptoKey): Promise<any> {
    checkSecureContext();
    const dec = new TextDecoder();
    const encryptedContent = base64ToBuffer(cipherText);
    const ivBuffer = base64ToBuffer(iv);

    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer
        },
        key,
        encryptedContent
    );

    return JSON.parse(dec.decode(decryptedContent));
}

export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
    checkSecureContext();
    return window.crypto.subtle.exportKey("jwk", key);
}

export async function importJWK(jwk: JsonWebKey): Promise<CryptoKey> {
    checkSecureContext();
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Helpers
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

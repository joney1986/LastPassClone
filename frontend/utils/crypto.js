import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const PBKDF2_ITERATIONS = 100000; // A good number of iterations
const SALT_SIZE = 16; // 16 bytes is a good size
const KEY_SIZE = 32; // 32 bytes for AES-256

// Generates a new random key for the vault
export const generateRandomKey = async () => {
    const randomBytes = await Crypto.getRandomBytesAsync(KEY_SIZE);
    // Convert bytes to a hex string for storage/use
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Derives an encryption key from a user's master password and a salt
export const deriveKeyFromPassword = async (password, salt) => {
    const key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.PBKDF2,
        password,
        {
            hash: Crypto.CryptoHashAlgorithm.SHA256,
            iterations: PBKDF2_ITERATIONS,
            salt: salt,
            keySize: KEY_SIZE,
        }
    );
    return key;
};

// Encrypts data with a given key
export const encryptData = (data, key) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

// Decrypts data with a given key
export const decryptData = (ciphertext, key) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// Hashes the master password for authentication (not for key derivation)
export const hashPassword = async (password) => {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
    );
};

// Generates a new random salt
export const generateSalt = async () => {
    const randomBytes = await Crypto.getRandomBytesAsync(SALT_SIZE);
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

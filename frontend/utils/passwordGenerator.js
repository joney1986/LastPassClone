import * as Crypto from 'expo-crypto';

const CHARSETS = {
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NUMBERS: '0123456789',
  SYMBOLS: '!@#$%^&*()_+-=[]{}|;:\',./<>?',
};

// This function generates a random password based on the provided options.
export const generatePassword = async (options) => {
  const { length, useNumbers, useSymbols } = options;

  if (length < 4) {
    throw new Error('Password length must be at least 4 characters.');
  }

  let finalCharset = CHARSETS.LOWERCASE + CHARSETS.UPPERCASE;
  const requiredChars = [];

  // Always include at least one lowercase and one uppercase letter
  requiredChars.push(await getRandomChar(CHARSETS.LOWERCASE));
  requiredChars.push(await getRandomChar(CHARSETS.UPPERCASE));

  if (useNumbers) {
    finalCharset += CHARSETS.NUMBERS;
    requiredChars.push(await getRandomChar(CHARSETS.NUMBERS));
  }
  if (useSymbols) {
    finalCharset += CHARSETS.SYMBOLS;
    requiredChars.push(await getRandomChar(CHARSETS.SYMBOLS));
  }

  const remainingLength = length - requiredChars.length;
  const randomChars = [];

  if (remainingLength > 0) {
    const randomBytes = await Crypto.getRandomBytesAsync(remainingLength);
    for (let i = 0; i < remainingLength; i++) {
        // Map the random byte to a character in the charset
        const charIndex = randomBytes[i] % finalCharset.length;
        randomChars.push(finalCharset[charIndex]);
    }
  }

  // Combine the required characters with the random characters
  const passwordChars = [...requiredChars, ...randomChars];

  // Shuffle the array to ensure the required characters are not always at the start
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const randomBytes = await Crypto.getRandomBytesAsync(1);
    const j = randomBytes[0] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
};

// Helper to get a single random character from a given charset
const getRandomChar = async (charset) => {
    const randomBytes = await Crypto.getRandomBytesAsync(1);
    const charIndex = randomBytes[0] % charset.length;
    return charset[charIndex];
}

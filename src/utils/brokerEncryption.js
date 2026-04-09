import CryptoJS from "crypto-js";

/**
 * ======================================================
 * PHP Compatible Encryption / Decryption Utility
 * ------------------------------------------------------
 * PHP Logic:
 * - AES-256-CBC
 * - PBKDF2 (SHA1, 1000 iterations)
 * - Salt: "Ivan Medvedev"
 * - UTF-16LE Encoding
 * - Base64 Ciphertext
 * ======================================================
 */

const ENCRYPTION_KEY = "TradeThinker";

/**
 * Salt equivalent to PHP:
 * pack("C*", 0x49, 0x76, 0x61, 0x6e, 0x20,
 *      0x4d, 0x65, 0x64, 0x76, 0x65,
 *      0x64, 0x65, 0x76)
 */
const SALT_BYTES = [
  0x49, 0x76, 0x61, 0x6e, 0x20,
  0x4d, 0x65, 0x64, 0x76, 0x65,
  0x64, 0x65, 0x76,
];

const SALT = CryptoJS.lib.WordArray.create(SALT_BYTES);

/**
 * ======================================================
 * Derive Key & IV (PHP hash_pbkdf2 clone)
 * ======================================================
 */
function deriveKeyAndIV(password, salt, iterations = 1000) {
  const keyMaterial = CryptoJS.PBKDF2(password, salt, {
    keySize: 48 / 4, // 48 bytes total
    iterations,
    hasher: CryptoJS.algo.SHA1,
  });

  const hex = keyMaterial.toString(CryptoJS.enc.Hex);

  return {
    key: CryptoJS.enc.Hex.parse(hex.substring(0, 64)),  // 32 bytes
    iv: CryptoJS.enc.Hex.parse(hex.substring(64, 96)),  // 16 bytes
  };
}

/**
 * ======================================================
 * Base64 Validator (Prevents Invalid Base64 Errors)
 * ======================================================
 */
function isValidBase64(str) {
  if (typeof str !== "string") return false;

  const normalized = str.replace(/ /g, "+");

  const base64Regex =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  return base64Regex.test(normalized);
}

/**
 * ======================================================
 * DECRYPT (Exact PHP decryptString clone)
 * ======================================================
 */
export function decryptString(cipherText) {
  if (
    cipherText === null ||
    cipherText === undefined ||
    cipherText === "" ||
    typeof cipherText !== "string"
  ) {
    return cipherText;
  }

  if (!isValidBase64(cipherText)) {
    // Already plain text → return as-is
    return cipherText;
  }

  try {
    const normalized = cipherText.replace(/ /g, "+");
    const cipherBytes = CryptoJS.enc.Base64.parse(normalized);

    const { key, iv } = deriveKeyAndIV(ENCRYPTION_KEY, SALT);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherBytes },
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // PHP: mb_convert_encoding($decrypted, 'UTF-8', 'UTF-16LE')
    return CryptoJS.enc.Utf16LE.stringify(decrypted);
  } catch (err) {
    // Fail silently like PHP
    return cipherText;
  }
}

/**
 * ======================================================
 * Sensitive Fields List
 * ======================================================
 */
const SENSITIVE_FIELDS = [
  "SecratKey", "secratKey",
  "ApiKey", "apiKey",
  "ApiToken", "apiToken",
  "Password", "password",
  "RequestToken", "requestToken",
  "C_Password", "c_password",
  "AccessToken", "accessToken",
  "RefreshToken", "refreshToken",
  "TOTP", "totp",
  "OTP", "otp",
  "ClientCode", "clientCode",
  "AppSource", "appSource",
  "C_Mobileno", "c_mobileno",
];

/**
 * ======================================================
 * Decrypt Object / String (API se aane wale data ke liye)
 * ======================================================
 */
export function decryptBrokerData(data) {
  if (typeof data === "string") {
    return decryptString(data);
  }

  if (typeof data === "object" && data !== null) {
    const result = { ...data };

    for (const key in result) {
      if (
        SENSITIVE_FIELDS.includes(key) &&
        typeof result[key] === "string" &&
        result[key] !== ""
      ) {
        result[key] = decryptString(result[key]);
      }
    }
    return result;
  }

  return data;
}

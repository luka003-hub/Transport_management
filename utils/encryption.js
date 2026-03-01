const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const HMAC_ALGORITHM = "sha256";

// Ensure AES key is 32 bytes (AES-256)
const ENC_KEY = Buffer.from(process.env.AES_SECRET, "utf8");
if (ENC_KEY.length !== 32) {
  throw new Error("AES_SECRET must be exactly 32 bytes long.");
}

// Optional separate HMAC key (recommended)
// If not provided, derive from AES key
const HMAC_KEY = process.env.HMAC_SECRET
  ? Buffer.from(process.env.HMAC_SECRET, "utf8")
  : crypto.createHash("sha256").update(ENC_KEY).digest();

/**
 * Encrypt data securely
 * @param {string} plaintext
 * @returns {object} { iv, content, hmac }
 */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, ENC_KEY, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Generate HMAC for integrity
  const hmac = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_KEY)
    .update(iv.toString("hex") + encrypted)
    .digest("hex");

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    hmac
  };
}

/**
 * Decrypt data securely
 * @param {object} encryptedData
 * @returns {string} decrypted plaintext
 */
function decrypt(encryptedData) {
  const { iv, content, hmac } = encryptedData;

  // Verify HMAC before decrypting
  const recalculatedHmac = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_KEY)
    .update(iv + content)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(recalculatedHmac, "hex")
    )
  ) {
    throw new Error("Data integrity check failed. Possible tampering detected.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENC_KEY,
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
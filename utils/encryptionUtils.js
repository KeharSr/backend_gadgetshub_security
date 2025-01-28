const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "defaultkey12345678901234567890"; // 32 bytes key
const IV_LENGTH = 16; // For AES, this is always 16 bytes

// Encrypt a text
const encryptText = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

// Decrypt a text
const decryptText = (encryptedText) => {
  const [iv, encrypted] = encryptedText.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encryptText, decryptText };

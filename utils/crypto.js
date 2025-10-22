// utils/crypto.js
const crypto = require('crypto');

// Configuration
const algorithm = 'aes-256-cbc';
const keyString = process.env.ENCRYPTION_KEY; 
const ivLength = 16; 

let keyBuffer;
try {
    keyBuffer = Buffer.from(keyString, 'hex');
    
    if (keyBuffer.length !== 32) {
        throw new Error(`Expected 32 bytes (64 hex characters), but found ${keyBuffer.length} bytes.`);
    }
} catch (error) {
    console.error(`\n========================================================================`);
    console.error(`CRYPTOGRAPHY SETUP ERROR: Check your .env ENCRYPTION_KEY!`);
    console.error(`Error: ${error.message}`);
    console.error(`========================================================================\n`);
    keyBuffer = null; 
}

function encrypt(text) {
    if (!keyBuffer) return text; 
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv); 
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!keyBuffer || !text || !text.includes(':')) return text;

    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts.shift(), 'hex');
        const encryptedText = parts.join(':');
        
        const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv); 
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        // This catch block handles the decryption failure gracefully
        console.error("Decryption failed:", e.message);
        return ''; // Return an empty string if decryption fails
    }
}

module.exports = { encrypt, decrypt };
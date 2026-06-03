"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaveOnWrite = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
admin.initializeApp();
const SALT = process.env.CHECKSUM_SALT || 'smash_the_bugs_2026_FAANG_SECRET';
function sortObject(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(sortObject);
    const rec = obj;
    return Object.keys(rec)
        .sort()
        .reduce((acc, key) => {
        acc[key] = sortObject(rec[key]);
        return acc;
    }, {});
}
function generateChecksum(data) {
    const serialized = JSON.stringify(sortObject(data));
    return (0, crypto_1.createHash)('sha256')
        .update(serialized + SALT)
        .digest('hex');
}
/**
 * Validates save checksum before write (P1-07).
 */
exports.validateSaveOnWrite = functions.firestore
    .document('users/{userId}/private/saves')
    .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after?.data)
        return null;
    const payload = after.data;
    const checksum = after.checksum;
    if (!checksum) {
        throw new functions.https.HttpsError('invalid-argument', 'Save must include server-verifiable checksum');
    }
    const expected = generateChecksum(payload);
    if (expected !== checksum) {
        throw new functions.https.HttpsError('permission-denied', 'Save checksum mismatch — tampered data rejected');
    }
    return null;
});
//# sourceMappingURL=index.js.map
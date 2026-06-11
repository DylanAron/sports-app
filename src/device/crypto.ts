/**
 * AES-256-CBC 加密/解密工具
 * 使用 crypto-js 实现，兼容服务端 AES/CBC/PKCS5Padding
 * 密钥从 cryptoConfig 读取（与服务端写死的相同密钥）。
 *
 * 注意：crypto-js 默认使用 OpenSSL 格式（Salted__ 前缀），
 * 但服务端 Java 使用原始 Base64。因此加解密都需要手动处理 WordArray。
 */

import CryptoJS from 'crypto-js/core';
import 'crypto-js/cipher-core';
import 'crypto-js/aes';
import 'crypto-js/enc-base64';
import 'crypto-js/pad-pkcs7';
import { AES_KEY } from '../config/cryptoConfig';

/**
 * AES-256-CBC 加密（使用内置密钥）
 * 输出原始 Base64 密文（不含 OpenSSL 头），兼容 Java 服务端
 */
export function encryptAES(plainText: string, base64Key?: string): string {
  const key = base64Key || AES_KEY;
  if (!plainText || !key) return plainText;

  const keyWords = base64ToWordArray(key);
  const iv = CryptoJS.lib.WordArray.create(keyWords.words.slice(0, 4), 16);
  const plainWords = CryptoJS.enc.Utf8.parse(plainText);

  const encrypted = CryptoJS.AES.encrypt(plainWords, keyWords, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

/**
 * AES-256-CBC 解密（使用内置密钥）
 * 输入原始 Base64 密文（不含 OpenSSL 头），兼容 Java 服务端
 */
export function decryptAES(cipherText: string, base64Key?: string): string {
  const key = base64Key || AES_KEY;
  if (!cipherText || !key) return cipherText;

  const keyWords = base64ToWordArray(key);
  const iv = CryptoJS.lib.WordArray.create(keyWords.words.slice(0, 4), 16);
  const cipherWords = CryptoJS.enc.Base64.parse(cipherText);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherWords }, keyWords, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

function base64ToWordArray(base64: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(base64);
}

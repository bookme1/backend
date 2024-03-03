import { createCipheriv, createDecipheriv } from 'crypto';
import { getConfig } from 'src/config';
import { constants } from 'src/config/constants';

const config = getConfig();
const OUTPUT_FORMAT = 'hex';

export const encryptData = (data: any) => {
  const iv = Buffer.from(config.IV, OUTPUT_FORMAT);
  const encryptionKey = Buffer.from(config.ENCRYPTION_KEY, 'base64').slice(
    0,
    32,
  );

  const cipher = createCipheriv(constants.algorithm, encryptionKey, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString(OUTPUT_FORMAT) + ':' + encrypted.toString(OUTPUT_FORMAT);
};

export const decryptData = (data: any) => {
  const textParts = data.split(':');

  if (textParts.length < 2) throw new Error('data for decrypting is wrong');

  const iv = Buffer.from(textParts.shift(), OUTPUT_FORMAT);
  const encryptionKey = Buffer.from(config.ENCRYPTION_KEY, 'base64').slice(
    0,
    32,
  );

  const encryptedText = Buffer.from(textParts.join(':'), OUTPUT_FORMAT);
  const decipher = createDecipheriv(constants.algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

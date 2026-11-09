import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export const storage = {
  getUrl(filename) {
    return `/uploads/${filename}`;
  },

  async remove(filename) {
    const filePath = path.join(env.upload.dir, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // file may not exist
    }
  },

  async ensureDir() {
    await fs.mkdir(env.upload.dir, { recursive: true });
  },
};

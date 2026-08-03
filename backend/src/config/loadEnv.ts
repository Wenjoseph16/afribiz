import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const candidateBases = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  path.resolve(__dirname, '../../'),
  path.resolve(__dirname, '../'),
];

const candidateFiles = ['.env.local', '.env'];
const loadedPaths: string[] = [];

for (const base of candidateBases) {
  for (const fileName of candidateFiles) {
    const fullPath = path.resolve(base, fileName);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath });
      loadedPaths.push(fullPath);
    }
  }
}

export function getLoadedEnvPaths(): string[] {
  return loadedPaths;
}

export default loadedPaths;

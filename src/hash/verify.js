import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const verify = async () => {
  const checksumsPath = './workspace/checksums.json';
  
  if (!fs.existsSync(checksumsPath)) {
    console.error(`Error: ${checksumsPath} not found`);
    process.exit(1);
  }

  const checksumsData = JSON.parse(fs.readFileSync(checksumsPath, 'utf-8'));
  
  for (const [filePath, expectedHash] of Object.entries(checksumsData)) {
    const fullPath = path.join('./workspace', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`${filePath} — FAIL`);
      continue;
    }

    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(fullPath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    const calculatedHash = hash.digest('hex');
    const result = calculatedHash === expectedHash ? 'OK' : 'FAIL';
    console.log(`${filePath} — ${result}`);
  }
};

await verify();

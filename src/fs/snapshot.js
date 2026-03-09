import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspacePath = path.resolve(__dirname, '../../workspace');

const snapshot = async () => {
  const entries = [];
  
  const walk = async (dir, relativeBase = '') => {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      const relativePath = path.join(relativeBase, file.name).replace(/\\/g, '/');
      
      if (file.isDirectory()) {
        entries.push({
          path: relativePath,
          type: 'directory'
        });
        await walk(fullPath, relativePath);
      } else {
        const stats = await fs.promises.stat(fullPath);
        const content = await fs.promises.readFile(fullPath);
        entries.push({
          path: relativePath,
          type: 'file',
          size: stats.size,
          content: content.toString('base64')
        });
      }
    }
  };
  
  await walk(workspacePath);
  
  const snapshotData = {
    rootPath: workspacePath,
    entries
  };
  
  await fs.promises.writeFile(
    path.resolve(__dirname, '../../snapshot.json'),
    JSON.stringify(snapshotData, null, 2)
  );
};

await snapshot();

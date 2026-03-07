import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRestoredPath = path.resolve(__dirname, '../../workspace_restored');
const snapshotPath = path.resolve(__dirname, '../../snapshot.json');

const restore = async () => {
  const snapshotContent = await fs.promises.readFile(snapshotPath, 'utf-8');
  const snapshot = JSON.parse(snapshotContent);
  
  // Create workspace_restored directory
  await fs.promises.mkdir(workspaceRestoredPath, { recursive: true });
  
  // Process entries
  for (const entry of snapshot.entries) {
    const fullPath = path.join(workspaceRestoredPath, entry.path);
    
    if (entry.type === 'directory') {
      await fs.promises.mkdir(fullPath, { recursive: true });
    } else if (entry.type === 'file') {
      // Create parent directory if it doesn't exist
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Decode base64 content and write file
      const buffer = Buffer.from(entry.content, 'base64');
      await fs.promises.writeFile(fullPath, buffer);
    }
  }
};

await restore();

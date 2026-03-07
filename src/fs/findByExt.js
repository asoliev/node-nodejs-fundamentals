import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspacePath = path.resolve(__dirname, '../../workspace');

// Parse CLI arguments
const args = process.argv.slice(2);
let ext = '.txt'; // default

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ext' && args[i + 1]) {
    ext = args[i + 1].startsWith('.') ? args[i + 1] : '.' + args[i + 1];
  }
}

const findByExt = async () => {
  const results = [];
  
  const walk = async (dir) => {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        await walk(fullPath);
      } else if (path.extname(file.name) === ext) {
        results.push(fullPath);
      }
    }
  };
  
  try {
    await walk(workspacePath);
    console.log(results.join('\n'));
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

await findByExt();

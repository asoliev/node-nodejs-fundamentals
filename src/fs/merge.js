import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspacePath = path.resolve(__dirname, '../../workspace');
const partsPath = path.join(workspacePath, 'parts');

// Parse CLI arguments
const args = process.argv.slice(2);
let filesToMerge = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--files' && args[i + 1]) {
    filesToMerge = args[i + 1].split(',').map(f => f.trim());
  }
}

const merge = async () => {
  let files;
  
  if (filesToMerge) {
    // Use specific files in provided order
    files = filesToMerge;
  } else {
    // Read all .txt files from workspace/parts in alphabetical order
    try {
      const dirContents = await fs.promises.readdir(partsPath);
      files = dirContents
        .filter(f => path.extname(f) === '.txt')
        .sort();
    } catch (error) {
      console.error(`Error reading parts directory: ${error.message}`);
      return;
    }
  }
  
  // Concatenate content
  let mergedContent = '';
  
  for (const file of files) {
    const filePath = path.join(partsPath, file);
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      mergedContent += content;
    } catch (error) {
      console.error(`Error reading file ${file}: ${error.message}`);
    }
  }
  
  // Write to workspace/merged.txt
  const outputPath = path.join(workspacePath, 'merged.txt');
  await fs.promises.writeFile(outputPath, mergedContent);
  console.log(`Merged file written to ${outputPath}`);
};

await merge();

import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createBrotliCompress } from 'zlib';
import { Transform } from 'stream';

const compressDir = async () => {
  const sourceDir = './workspace/toCompress';
  const outDir = './workspace/compressed';
  const archivePath = path.join(outDir, 'archive.br');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: ${sourceDir} not found`);
    process.exit(1);
  }

  // Collect all files with their relative paths
  const files = [];
  const collectFiles = (dir, baseDir) => {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (fs.statSync(fullPath).isDirectory()) {
        collectFiles(fullPath, baseDir);
      } else {
        files.push({ path: fullPath, relative: relativePath });
      }
    }
  };
  
  collectFiles(sourceDir, sourceDir);

  // Create a tar-like format in a transform stream
  let fileIndex = 0;

  const archiveStream = new Transform({
    async transform(chunk, encoding, callback) {
      callback(null, chunk);
    }
  });

  const brotli = createBrotliCompress();
  const output = createWriteStream(archivePath);

  archiveStream.pipe(brotli).pipe(output);

  // Write file metadata first (count)
  archiveStream.write(Buffer.from(JSON.stringify({ count: files.length }) + '\n'));

  // Write each file
  for (const file of files) {
    const content = fs.readFileSync(file.path);
    const metadata = {
      path: file.relative,
      size: content.length
    };
    archiveStream.write(Buffer.from(JSON.stringify(metadata) + '\n'));
    archiveStream.write(content);
    archiveStream.write(Buffer.from('\n'));
  }

  archiveStream.end();

  await new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
    archiveStream.on('error', reject);
  });
};

await compressDir();

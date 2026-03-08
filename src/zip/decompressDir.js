import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createBrotliDecompress } from 'zlib';
import { Transform } from 'stream';

const decompressDir = async () => {
  const archivePath = './workspace/compressed/archive.br';
  const outDir = './workspace/decompressed';

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Check if archive exists
  if (!fs.existsSync(archivePath)) {
    console.error(`Error: ${archivePath} not found`);
    process.exit(1);
  }

  const brotli = createBrotliDecompress();
  const input = createReadStream(archivePath);

  let buffer = Buffer.alloc(0);
  let firstLine = true;
  let fileCount = 0;
  let currentFileIndex = 0;
  let currentFilePath = '';
  let currentFileSize = 0;
  let currentFileData = Buffer.alloc(0);
  let state = 'header'; // header, metadata, content

  const processStream = new Transform({
    transform(chunk, encoding, callback) {
      buffer = Buffer.concat([buffer, chunk]);
      processBuffer();
      callback();
    },
    flush(callback) {
      // Process any remaining data
      if (currentFileData.length > 0 && currentFilePath) {
        const dirPath = path.dirname(path.join(outDir, currentFilePath));
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(path.join(outDir, currentFilePath), currentFileData);
      }
      callback();
    }
  });

  const processBuffer = () => {
    if (state === 'header' && firstLine) {
      const newlineIdx = buffer.indexOf(0x0A);
      if (newlineIdx !== -1) {
        const headerStr = buffer.subarray(0, newlineIdx).toString('utf-8');
        buffer = buffer.subarray(newlineIdx + 1);
        const header = JSON.parse(headerStr);
        fileCount = header.count;
        currentFileIndex = 0;
        state = 'metadata';
        firstLine = false;
        processBuffer();
      }
    } else if (state === 'metadata') {
      if (currentFileIndex < fileCount) {
        const newlineIdx = buffer.indexOf(0x0A);
        if (newlineIdx !== -1) {
          const metadataStr = buffer.subarray(0, newlineIdx).toString('utf-8');
          buffer = buffer.subarray(newlineIdx + 1);
          const metadata = JSON.parse(metadataStr);
          currentFilePath = metadata.path;
          currentFileSize = metadata.size;
          currentFileData = Buffer.alloc(0);
          state = 'content';
          processBuffer();
        }
      }
    } else if (state === 'content') {
      if (currentFileData.length < currentFileSize) {
        const needed = currentFileSize - currentFileData.length;
        const take = Math.min(needed, buffer.length);
        const contentChunk = buffer.subarray(0, take);
        currentFileData = Buffer.concat([currentFileData, contentChunk]);
        buffer = buffer.subarray(take);

        if (currentFileData.length === currentFileSize) {
          // File complete, write it
          const dirPath = path.dirname(path.join(outDir, currentFilePath));
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          fs.writeFileSync(path.join(outDir, currentFilePath), currentFileData);

          // Skip the newline separator (single byte)
          if (buffer.length > 0 && buffer[0] === 0x0A) {
            buffer = buffer.subarray(1);
          }

          currentFileIndex++;
          state = 'metadata';
          processBuffer();
        }
      }
    }
  };

  input.pipe(brotli).pipe(processStream);

  await new Promise((resolve, reject) => {
    processStream.on('finish', resolve);
    processStream.on('error', reject);
    input.on('error', reject);
    brotli.on('error', reject);
  });
};

await decompressDir();

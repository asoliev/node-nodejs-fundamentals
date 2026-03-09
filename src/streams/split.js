import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';

const split = async () => {
  const args = process.argv.slice(2);
  let linesPerChunk = 10;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lines' && i + 1 < args.length) {
      linesPerChunk = parseInt(args[i + 1], 10);
      break;
    }
  }

  const sourcePath = './workspace/source.txt';
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: ${sourcePath} not found`);
    process.exit(1);
  }

  const outDir = './workspace';
  let chunkNumber = 1;
  let currentChunk = '';
  let currentLineCount = 0;
  let lineBuffer = '';

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split('\n');
      // If buffer doesn't end with \n, last element is an incomplete line — keep for next chunk
      if (!lineBuffer.endsWith('\n')) {
        lineBuffer = lines.pop() ?? '';
      } else {
        lineBuffer = '';
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (currentLineCount > 0 && currentLineCount % linesPerChunk === 0) {
          const fileName = `chunk_${chunkNumber}.txt`;
          const filePath = path.join(outDir, fileName);
          fs.writeFileSync(filePath, currentChunk);

          chunkNumber++;
          currentChunk = '';
          currentLineCount = 0;
        }

        if (i === lines.length - 1 && line === '') {
          // Trailing newline produced empty line — don't count as content
          break;
        }

        if (currentChunk !== '') {
          currentChunk += '\n';
        }
        currentChunk += line;
        currentLineCount++;
      }

      callback();
    },
    flush(callback) {
      // Flush any remaining buffered line (no trailing \n at EOF)
      if (lineBuffer !== '') {
        // If current chunk is already full, write it first so we don't exceed linesPerChunk
        if (currentLineCount > 0 && currentLineCount % linesPerChunk === 0) {
          const fileName = `chunk_${chunkNumber}.txt`;
          const filePath = path.join(outDir, fileName);
          fs.writeFileSync(filePath, currentChunk);
          chunkNumber++;
          currentChunk = '';
          currentLineCount = 0;
        }
        if (currentChunk !== '') currentChunk += '\n';
        currentChunk += lineBuffer;
        currentLineCount++;
      }
      if (currentChunk !== '') {
        const fileName = `chunk_${chunkNumber}.txt`;
        const filePath = path.join(outDir, fileName);
        fs.writeFileSync(filePath, currentChunk);
      }
      callback();
    }
  });

  fs.createReadStream(sourcePath).pipe(transformStream);
  
  await new Promise((resolve, reject) => {
    transformStream.on('finish', resolve);
    transformStream.on('error', reject);
  });
};

await split();

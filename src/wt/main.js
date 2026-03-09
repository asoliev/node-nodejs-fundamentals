import fs from 'fs';
import os from 'os';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const main = async () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataPath = './workspace/data.json';

  if (!fs.existsSync(dataPath)) {
    console.error(`Error: ${dataPath} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  if (!Array.isArray(data)) {
    console.error('Error: data.json must contain an array of numbers');
    process.exit(1);
  }

  const numWorkers = os.cpus().length;
  const chunkSize = Math.ceil(data.length / numWorkers);
  const chunks = [];

  // Split data into chunks
  for (let i = 0; i < numWorkers; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    if (start < data.length) {
      chunks.push(data.slice(start, end));
    }
  }

  // Create workers and send chunks
  const workerPromises = chunks.map(chunk => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'worker.js'));
      
      worker.on('message', (sortedChunk) => {
        worker.terminate();
        resolve(sortedChunk);
      });

      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      worker.postMessage(chunk);
    });
  });

  // Wait for all workers to complete
  const sortedChunks = await Promise.all(workerPromises);

  // K-way merge algorithm
  const merge = (arrays) => {
    const result = [];
    const heaps = arrays.map((arr, idx) => ({ value: arr[0], arrayIdx: idx, elemIdx: 1 }))
      .filter(item => item.value !== undefined)
      .sort((a, b) => a.value - b.value);

    while (heaps.length > 0) {
      const { value, arrayIdx, elemIdx } = heaps.shift();
      result.push(value);

      const nextValue = arrays[arrayIdx][elemIdx];
      if (nextValue !== undefined) {
        // Insert the next element from the same array
        let inserted = false;
        for (let i = 0; i < heaps.length; i++) {
          if (nextValue < heaps[i].value) {
            heaps.splice(i, 0, { value: nextValue, arrayIdx, elemIdx: elemIdx + 1 });
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          heaps.push({ value: nextValue, arrayIdx, elemIdx: elemIdx + 1 });
        }
      }
    }

    return result;
  };

  const sorted = merge(sortedChunks);
  console.log(sorted);
};

await main();

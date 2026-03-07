import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
  // Sort the array in ascending order
  const sorted = data.sort((a, b) => a - b);
  // Send sorted array back to main thread
  parentPort.postMessage(sorted);
});

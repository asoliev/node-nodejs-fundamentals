import { Transform } from 'stream';

const filter = () => {
  const args = process.argv.slice(2);
  let pattern = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pattern' && i + 1 < args.length) {
      pattern = args[i + 1];
      break;
    }
  }

  if (!pattern) {
    console.error('Error: --pattern argument required');
    process.exit(1);
  }

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const filtered = lines
        .filter(line => line.includes(pattern))
        .join('\n');
      
      if (filtered) {
        this.push(filtered);
        if (lines[lines.length - 1] !== '') {
          this.push('\n');
        }
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

filter();

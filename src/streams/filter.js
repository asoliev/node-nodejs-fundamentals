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
      this._lineBuffer = (this._lineBuffer ?? '') + chunk.toString();
      const lines = this._lineBuffer.split('\n');
      if (!this._lineBuffer.endsWith('\n')) {
        this._lineBuffer = lines.pop() ?? '';
      } else {
        this._lineBuffer = '';
      }

      const filtered = lines
        .filter(line => line.includes(pattern))
        .join('\n');

      if (filtered !== '') {
        this.push(filtered);
        if (!filtered.endsWith('\n')) this.push('\n');
      }
      callback();
    },
    flush(callback) {
      if ((this._lineBuffer ?? '') !== '' && this._lineBuffer.includes(pattern)) {
        this.push(this._lineBuffer);
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

filter();

import { Transform } from 'stream';

const lineNumberer = () => {
  let lineNumber = 1;

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const numbered = lines
        .map((line, index) => {
          if (line === '' && index === lines.length - 1) {
            return '';
          }
          const result = `${lineNumber} ${line}`;
          lineNumber++;
          return result;
        })
        .join('\n');
      
      this.push(numbered);
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

lineNumberer();

import { Transform } from 'stream';

const lineNumberer = () => {
  let lineNumber = 1;
  let lineBuffer = '';

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      lineBuffer += chunk.toString();
      const lines = lineBuffer.split('\n');
      if (!lineBuffer.endsWith('\n')) {
        lineBuffer = lines.pop() ?? '';
      } else {
        lineBuffer = '';
      }

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

      if (numbered !== '') {
        this.push(numbered);
        if (!numbered.endsWith('\n')) this.push('\n');
      }
      callback();
    },
    flush(callback) {
      if (lineBuffer !== '') {
        this.push(`${lineNumber} ${lineBuffer}`);
        lineNumber++;
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

lineNumberer();

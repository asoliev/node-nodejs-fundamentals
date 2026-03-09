import readline from 'readline';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  // print prompt
  rl.prompt();

  rl.on('line', (line) => {
    const cmd = line.trim();

    switch (cmd) {
      case 'uptime':
        console.log(process.uptime());
        break;
      case 'cwd':
        console.log(process.cwd());
        break;
      case 'date':
        console.log(new Date().toString());
        break;
      case 'exit':
        rl.close();
        return; // don't prompt again
      default:
        if (cmd.length > 0) {
          console.log(`Unknown command: ${cmd}`);
        }
        break;
    }
    rl.prompt();
  });

  // handle Ctrl+C
  rl.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Exiting.');
    rl.close();
  });

  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
};

interactive();

import { spawn } from 'child_process';

const execCommand = () => {
  const command = process.argv[2];
  
  if (!command) {
    console.error('No command provided');
    process.exit(1);
  }
  
  // Spawn child process with shell to execute command string
  const child = spawn(command, {
    env: process.env,
    stdio: 'inherit',
    shell: true
  });
  
  // Exit with same code as child
  child.on('exit', (code) => {
    process.exit(code);
  });
};

execCommand();

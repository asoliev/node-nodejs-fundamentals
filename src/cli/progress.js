const progress = () => {
  let percent = 0;
  const totalBlocks = 20; // width of the bar in characters
  const step = 2; // percent increase per tick (50 ticks -> 5 seconds)

  const interval = setInterval(() => {
    percent += step;
    if (percent > 100) percent = 100;

    const filled = Math.round((percent / 100) * totalBlocks);
    const empty = totalBlocks - filled;
    const bar = `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percent}%`;

    process.stdout.write(`\r${bar}`);

    if (percent === 100) {
      clearInterval(interval);
      process.stdout.write('\n');
    }
  }, 100);
};

progress();

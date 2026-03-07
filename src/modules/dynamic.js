const dynamic = async () => {
  const pluginName = process.argv[2];
  
  if (!pluginName) {
    console.error('Error: Plugin name required as CLI argument');
    process.exit(1);
  }

  try {
    const module = await import(`./plugins/${pluginName}.js`);
    const result = module.run();
    console.log(result);
  } catch (error) {
    console.error(`Error: Plugin '${pluginName}' not found`);
    process.exit(1);
  }
};

await dynamic();

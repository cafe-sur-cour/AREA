export function setupSignal() {
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await executionService.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await executionService.stop();
    process.exit(0);
  });
}

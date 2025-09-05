const app = require('./app');

console.log('✅ App loads successfully with new controller');

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`🚀 Test server running on port ${port}`);

  setTimeout(() => {
    server.close();
    console.log('✅ Server test completed successfully');
    process.exit(0);
  }, 1000);
});

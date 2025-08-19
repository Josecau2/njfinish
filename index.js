const app = require('./app');
require('dotenv').config();
const http = require('http');


const httpServer = http.createServer((req, res) => {
  // Redirect HTTP request to HTTPS
  // const redirectUrl = `https://${req.headers.host}${req.url}`;
  // res.writeHead(301, { Location: redirectUrl });
  // res.end();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

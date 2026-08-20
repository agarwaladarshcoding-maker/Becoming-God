const http = require('http');

http.get('http://localhost:3000/sse', (res) => {
  res.on('data', (chunk) => {
    const data = chunk.toString();
    console.log("SSE GET chunk:", data);
    
    // Extract sessionId
    const match = data.match(/sessionId=([a-zA-Z0-9-]+)/);
    if (match) {
      const sessionId = match[1];
      console.log("Found session ID:", sessionId);
      
      // Make POST request
      const req = http.request('http://localhost:3000/message?sessionId=' + sessionId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (postRes) => {
        console.log("POST response status:", postRes.statusCode);
        postRes.on('data', c => console.log("POST chunk:", c.toString()));
        process.exit(0);
      });
      req.write(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "ping",
        params: {}
      }));
      req.end();
    }
  });
});

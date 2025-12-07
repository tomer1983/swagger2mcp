
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'mcp_server_retry', 'dist', 'index.js');
console.log(`Starting server at: ${serverPath}`);

const child = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'] // Capture stderr too
});

child.on('error', (err) => {
  console.error('Failed to start subprocess:', err);
});

child.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});

// Send initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "validator", version: "1.0" }
  }
};

console.log('Sending initialize request...');
child.stdin.write(JSON.stringify(initRequest) + '\n');

setTimeout(() => {
  console.log('Sending tools/list request...');
  const listRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  child.stdin.write(JSON.stringify(listRequest) + '\n');
}, 500);

// Wait 2 seconds then kill
setTimeout(() => {
  console.log('Timeout reached, killing process...');
  child.kill();
}, 2000);

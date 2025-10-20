#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('🚀 Starting Healthcare Web App Server...');

// Function to kill processes on port 5000
function killPort5000() {
  return new Promise((resolve) => {
    exec('lsof -ti:5000', (error, stdout) => {
      if (stdout.trim()) {
        console.log('🔧 Killing existing processes on port 5000...');
        exec(`kill -9 ${stdout.trim()}`, (killError) => {
          if (killError) {
            console.log('⚠️  Could not kill existing processes, continuing...');
          } else {
            console.log('✅ Port 5000 cleared');
          }
          resolve();
        });
      } else {
        console.log('✅ Port 5000 is available');
        resolve();
      }
    });
  });
}

// Function to start the server
async function startServer() {
  try {
    await killPort5000();
    
    console.log('🔄 Starting server...');
    
    const server = spawn('npm', ['start'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });

    server.on('close', (code) => {
      console.log(`🛑 Server process exited with code ${code}`);
      if (code !== 0) {
        console.log('🔄 Restarting server in 3 seconds...');
        setTimeout(startServer, 3000);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      server.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();

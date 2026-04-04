const WebSocket = require('ws');
const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  io.on("connection", (socket) => {
    console.log(`[VOICE] Client connected: ${socket.id}`);
    
    let dgSocket;
    let isConnected = false;
    let pendingChunks = []; // 🛠️ BUFFER to store audio (crucial for headers)

    socket.on("start-transcription", (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[VOICE] Starting Deepgram: ${model} (${socket.id})`);

      // 🛠️ Simple URL - let Deepgram auto-detect from the buffered header
      const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true&interim_results=true`;
      
      dgSocket = new WebSocket(url, { headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` } });

      dgSocket.on('open', () => {
        console.log(`[VOICE] Socket Open. Flushing ${pendingChunks.length} chunks (including header).`);
        isConnected = true;
        socket.emit("transcription-started");
        
        // 🚀 FLUSH BUFFER (Sends the critical header first!)
        while (pendingChunks.length > 0) {
          const chunk = pendingChunks.shift();
          if (dgSocket.readyState === WebSocket.OPEN) dgSocket.send(chunk);
        }
      });

      dgSocket.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            console.log(`[DEEPGRAM] "${transcript}"`);
            socket.emit("transcript-result", { transcript, isFinal: response.is_final });
          }
        } catch (e) {}
      });

      dgSocket.on('error', (err) => console.error("[VOICE] Socket Error:", err.message));

      dgSocket.on('close', (code, reason) => {
        console.log(`[VOICE] Socket Closed. Code: ${code}`);
        isConnected = false;
        pendingChunks = [];
      });
    });

    socket.on("audio-chunk", (data) => {
      if (isConnected && dgSocket && dgSocket.readyState === WebSocket.OPEN) {
        dgSocket.send(data);
      } else {
        // 📥 BUFFERING (Store the header until it's open!)
        pendingChunks.push(data);
        if (pendingChunks.length % 20 === 0) {
          console.log(`[VOICE] Buffering... (Count: ${pendingChunks.length})`);
        }
      }
    });

    socket.on("stop-transcription", () => {
      if (dgSocket) { dgSocket.close(); dgSocket = null; }
      isConnected = false;
      pendingChunks = [];
    });

    socket.on("disconnect", () => {
      if (dgSocket) dgSocket.close();
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

module.exports = { setupVoiceToPrescription };

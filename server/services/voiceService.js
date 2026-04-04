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

    socket.on("start-transcription", (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[VOICE] Starting RAW Deepgram Session (${model}, ${language})`);

      // 🛠️ Adding explicit encoding and container for WebM (standard browser format)
      // This tells Deepgram exactly how to decode the incoming binary stream
      const url = `wss://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true&interim_results=true&encoding=opus&container=webm&sample_rate=48000`;
      
      dgSocket = new WebSocket(url, {
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
        },
      });

      dgSocket.on('open', () => {
        console.log("[VOICE] RAW Deepgram Connection OPENED");
        isConnected = true;
        socket.emit("transcription-started");
      });

      dgSocket.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          
          if (transcript) {
            console.log(`[VOICE] Transcript Received: "${transcript}"`);
            socket.emit("transcript-result", {
              transcript,
              isFinal: response.is_final
            });
          }
        } catch (e) {
          console.error("[VOICE] Error parsing:", e.message);
        }
      });

      dgSocket.on('error', (err) => {
        console.error("[VOICE] RAW Deepgram ERROR:", err.message);
      });

      dgSocket.on('close', (code, reason) => {
        console.log(`[VOICE] RAW Deepgram CLOSED. Code: ${code}, Reason: ${reason}`);
        isConnected = false;
      });
    });

    let chunkCount = 0;
    socket.on("audio-chunk", (data) => {
      if (dgSocket && isConnected && dgSocket.readyState === WebSocket.OPEN) {
        chunkCount++;
        if (chunkCount % 50 === 0) {
          console.log(`[VOICE] Streaming binary audio to Deepgram... (Chunk #${chunkCount}, Size: ${data.length} bytes)`);
        }
        // Send binary data directly
        dgSocket.send(data);
      }
    });

    socket.on("stop-transcription", () => {
      if (dgSocket) {
        dgSocket.close();
        dgSocket = null;
      }
      isConnected = false;
    });

    socket.on("disconnect", () => {
      if (dgSocket) dgSocket.close();
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

module.exports = { setupVoiceToPrescription };

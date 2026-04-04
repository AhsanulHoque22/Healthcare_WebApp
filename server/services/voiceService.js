const { DeepgramClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey.includes('your_deepgram_api_key')) {
    console.warn('[VOICE] WARNING: Deepgram API Key is missing or using placeholder value!');
  }

  // Deepgram SDK v5 uses the DeepgramClient class
  const deepgram = new DeepgramClient(apiKey);

  io.on("connection", (socket) => {
    console.log(`[VOICE] Client connected. Socket ID: ${socket.id}`);

    let dgConnection;
    let keepAlive;
    let isDeepgramOpen = false;

    socket.on("start-transcription", async (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[BACKEND] Starting Deepgram v5 session: model=${model}, lang=${language}`);

      if (dgConnection) {
        dgConnection.finish();
        if (keepAlive) clearInterval(keepAlive);
        isDeepgramOpen = false;
      }

      try {
        console.log(`[BACKEND] Initializing Deepgram live connection...`);
        
        // In v5, listen.live is the correct method
        dgConnection = deepgram.listen.live({
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
          container: 'webm',
          encoding: 'opus'
        });

        // Use string events for maximum compatibility in v5
        dgConnection.on("Open", () => {
          console.log("[DEEPGRAM] Connection successfully established (v5)");
          isDeepgramOpen = true;
          socket.emit("transcription-started");
          
          keepAlive = setInterval(() => {
            if (dgConnection && isDeepgramOpen) {
              dgConnection.keepAlive();
            }
          }, 10000);
        });

        dgConnection.on("Results", (data) => {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript) {
            console.log(`[DEEPGRAM] Result: "${transcript}"`);
            socket.emit("transcript-result", {
              transcript,
              isFinal: data.is_final,
            });
          }
        });

        dgConnection.on("Error", (error) => {
          console.error("[DEEPGRAM] Connection error detail:", error);
          socket.emit("transcription-error", error.message || "Deepgram Error");
        });

        dgConnection.on("Close", () => {
          console.log("[DEEPGRAM] Connection closed");
          isDeepgramOpen = false;
          socket.emit("transcription-stopped");
          if (keepAlive) clearInterval(keepAlive);
        });

      } catch (error) {
        console.error("[BACKEND] Failed to initialize Deepgram:", error);
        socket.emit("transcription-error", error.message);
      }
    });

    let chunkCount = 0;
    socket.on("audio-chunk", (data) => {
      chunkCount++;
      if (chunkCount % 20 === 0) {
        console.log(`[BACKEND] Heartbeat: Received ${chunkCount} audio chunks from client (deepgramOpen=${isDeepgramOpen})`);
      }
      
      if (dgConnection && isDeepgramOpen) {
        try {
          dgConnection.send(Buffer.from(data));
        } catch (err) {
          console.error("[BACKEND] Audio send error:", err.message);
        }
      }
    });

    socket.on("stop-transcription", () => {
      console.log("[BACKEND] User stopped transcription");
      if (dgConnection) {
        dgConnection.finish();
        dgConnection = null;
      }
      isDeepgramOpen = false;
      if (keepAlive) clearInterval(keepAlive);
    });

    socket.on("disconnect", () => {
      console.log("[BACKEND] Socket disconnected");
      if (dgConnection) {
        dgConnection.finish();
        dgConnection = null;
      }
      isDeepgramOpen = false;
      if (keepAlive) clearInterval(keepAlive);
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

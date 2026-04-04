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
      
      console.log(`[BACKEND] Initializing Voice-AI session. Model: ${model}, Prefix: ${apiKey ? apiKey.substring(0, 4) : "NONE"}`);

      if (dgConnection) {
        try {
          if (dgConnection.requestClose) dgConnection.requestClose();
          else if (dgConnection.finish) dgConnection.finish();
        } catch (e) {}
      }

      try {
        console.log(`[BACKEND] Connecting to Deepgram...`);
        
        // V5 SDK: Stable method is .live()
        // We use a safe accessor to handle potential property moves in sub-versions
        const liveService = deepgram.listen.live || (deepgram.listen.v1 ? deepgram.listen.v1.connect : null);
        
        if (!liveService) {
           throw new Error("Could not find Deepgram live connection method");
        }

        dgConnection = await liveService.call(deepgram.listen, {
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
        });

        // Event naming is the most common cause of "hanging"
        const onOpen = () => {
          console.log("[DEEPGRAM] Connection is now formally OPEN and ACTIVE");
          isDeepgramOpen = true;
          socket.emit("transcription-started");
        };

        dgConnection.on("Open", onOpen);
        dgConnection.on("open", onOpen);
        dgConnection.on("connected", onOpen);

        dgConnection.on("Results", (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            console.log(`[DEEPGRAM] Result: "${transcript}"`);
            socket.emit("transcript-result", { transcript, isFinal: data.is_final });
          }
        });
        
        dgConnection.on("results", (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            socket.emit("transcript-result", { transcript, isFinal: data.is_final });
          }
        });

        dgConnection.on("Error", (e) => console.error("[DEEPGRAM] ERROR:", e));
        dgConnection.on("error", (e) => console.error("[DEEPGRAM] error:", e));

        if (dgConnection.waitForOpen) {
          console.log("[BACKEND] Waiting for handshake to complete (Up to 10s)...");
          // Re-adding a GENEROUS 10 second timeout for Railway
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Handshake Timeout")), 10000));
          await Promise.race([dgConnection.waitForOpen(), timeoutPromise]);
          console.log("[DEEPGRAM] Connection warming complete");
          isDeepgramOpen = true;
        }

      } catch (err) {
        console.error(`[BACKEND] Connection failure:`, err.message);
        socket.emit("transcription-error", err.message);
      }
    });

    let chunkCount = 0;
    socket.on("audio-chunk", (data) => {
      chunkCount++;
      if (chunkCount % 20 === 0) {
        console.log(`[BACKEND] Heartbeat: Chunks=${chunkCount} (Open=${isDeepgramOpen})`);
      }
      
      if (dgConnection && isDeepgramOpen) {
        try {
          dgConnection.send(Buffer.from(data));
        } catch (err) {
          // Only log send error once to avoid spam
          if (chunkCount % 100 === 0) console.error("[BACKEND] Send error:", err.message);
        }
      }
    });

    const safeClose = () => {
      console.log("[BACKEND] Safely closing Deepgram connection");
      if (dgConnection) {
        try {
          if (dgConnection.requestClose) dgConnection.requestClose();
          else if (dgConnection.finish) dgConnection.finish();
        } catch (e) {}
        dgConnection = null;
      }
      isDeepgramOpen = false;
      if (keepAlive) clearInterval(keepAlive);
    };

    socket.on("stop-transcription", () => safeClose());
    socket.on("disconnect", () => safeClose());
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

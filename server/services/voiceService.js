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
      
      console.log(`[BACKEND] Starting Deepgram session. Model: ${model}, Lang: ${language}`);

      if (dgConnection) {
        try {
          if (dgConnection.requestClose) dgConnection.requestClose();
          else if (dgConnection.finish) dgConnection.finish();
        } catch (e) {}
        if (keepAlive) clearInterval(keepAlive);
        isDeepgramOpen = false;
      }

      try {
        console.log(`[BACKEND] Connecting to Deepgram...`);
        
        dgConnection = await deepgram.listen.v1.connect({
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

        // Listen for all event variations to ensure we catch the open state
        const handleOpen = () => {
          console.log("[DEEPGRAM] Connection is now formally OPEN");
          isDeepgramOpen = true;
          socket.emit("transcription-started");
          
          if (keepAlive) clearInterval(keepAlive);
          keepAlive = setInterval(() => {
            if (dgConnection && isDeepgramOpen) {
              dgConnection.keepAlive();
            }
          }, 10000);
        };

        dgConnection.on("Open", handleOpen);
        dgConnection.on("open", handleOpen);

        const handleTranscript = (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            console.log(`[DEEPGRAM] Result: "${transcript}"`);
            socket.emit("transcript-result", {
              transcript,
              isFinal: data.is_final,
            });
          }
        };

        dgConnection.on("Results", handleTranscript);
        dgConnection.on("results", handleTranscript);

        dgConnection.on("Error", (error) => {
          console.error("[DEEPGRAM] Connection error:", error);
          socket.emit("transcription-error", error.message || "Deepgram Error");
        });
        dgConnection.on("error", (error) => {
          console.error("[DEEPGRAM] Connection error (lc):", error);
        });

        dgConnection.on("close", () => {
          console.log("[DEEPGRAM] Connection closed");
          isDeepgramOpen = false;
          if (keepAlive) clearInterval(keepAlive);
        });

        if (dgConnection.waitForOpen) {
          await dgConnection.waitForOpen();
          console.log("[DEEPGRAM] waitForOpen completed");
          isDeepgramOpen = true;
        }

      } catch (error) {
        console.error("[BACKEND] Failed to initialize Deepgram:", error);
        socket.emit("transcription-error", "Initialization failed");
      }
    });

    let chunkCount = 0;
    socket.on("audio-chunk", (data) => {
      chunkCount++;
      if (chunkCount % 20 === 0) {
        console.log(`[BACKEND] Heartbeat: Combined chunks=${chunkCount} (isDeepgramOpen=${isDeepgramOpen})`);
      }
      
      if (dgConnection && isDeepgramOpen) {
        try {
          dgConnection.send(Buffer.from(data));
        } catch (err) {
          console.error("[BACKEND] Audio send error:", err.message);
        }
      }
    });

    const safeClose = () => {
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

    socket.on("stop-transcription", () => {
      console.log("[BACKEND] User stopped transcription");
      safeClose();
    });

    socket.on("disconnect", () => {
      console.log("[BACKEND] User disconnected");
      safeClose();
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

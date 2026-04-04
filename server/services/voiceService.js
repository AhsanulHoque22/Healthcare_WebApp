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
      // Fallback model logic
      const models = language === "en" ? ["nova-2-medical", "nova-2"] : ["nova-2"];
      
      console.log(`[BACKEND] Starting Deepgram. Key prefix: ${apiKey ? apiKey.substring(0, 4) : "NONE"}, Len: ${apiKey ? apiKey.length : 0}`);

      const startWithModel = async (modelName) => {
        console.log(`[BACKEND] Attempting connection with model: ${modelName}`);
        
        if (dgConnection) {
          try {
            if (dgConnection.requestClose) dgConnection.requestClose();
            else if (dgConnection.finish) dgConnection.finish();
          } catch (e) {}
        }

        try {
          dgConnection = await deepgram.listen.v1.connect({
            model: modelName,
            language: language,
            smart_format: true,
            interim_results: true,
            utterance_end_ms: 1000,
            vad_events: true,
            endpointing: 300,
            // Removed strict container/encoding to allow auto-detection
          });

          const handleOpen = () => {
            console.log(`[DEEPGRAM] Connection formally OPEN with model: ${modelName}`);
            isDeepgramOpen = true;
            socket.emit("transcription-started");
          };

          dgConnection.on("Open", handleOpen);
          dgConnection.on("open", handleOpen);

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
              console.log(`[DEEPGRAM] Result (lc): "${transcript}"`);
              socket.emit("transcript-result", { transcript, isFinal: data.is_final });
            }
          });

          if (dgConnection.waitForOpen) {
            // Wait with a 3-second timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
            await Promise.race([dgConnection.waitForOpen(), timeoutPromise]);
            console.log("[DEEPGRAM] waitForOpen completed");
            isDeepgramOpen = true;
            return true;
          }
           return true;
        } catch (err) {
          console.error(`[DEEPGRAM] Failed to connect with ${modelName}:`, err.message);
          return false;
        }
      };

      // Try medical first, then fallback
      const success = await startWithModel(models[0]);
      if (!success && models.length > 1) {
        console.log("[BACKEND] Retrying with standard model...");
        await startWithModel(models[1]);
      } else if (!success) {
        socket.emit("transcription-error", "Failed to connect to Deepgram service");
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

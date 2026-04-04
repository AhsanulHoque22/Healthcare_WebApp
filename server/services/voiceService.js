const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
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

  const deepgram = createClient(apiKey);

  io.on("connection", (socket) => {
    console.log("Client connected to Voice-to-Prescription WebSocket");

    let dgConnection;
    let keepAlive;
    let isDeepgramOpen = false;

    socket.on("start-transcription", async (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[BACKEND] Starting Deepgram session: model=${model}, lang=${language}`);

      if (dgConnection) {
        dgConnection.finish();
        if (keepAlive) clearInterval(keepAlive);
        isDeepgramOpen = false;
      }

      try {
        dgConnection = deepgram.listen.live({
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
          // Explicitly handle common web audio formats
          container: 'webm',
          encoding: 'opus'
        });

        dgConnection.on(LiveTranscriptionEvents.Open, () => {
          console.log("[DEEPGRAM] Connection opened");
          isDeepgramOpen = true;
          socket.emit("transcription-started");
          
          keepAlive = setInterval(() => {
            if (dgConnection && isDeepgramOpen) {
              dgConnection.keepAlive();
            }
          }, 10000);
        });

        dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript) {
            socket.emit("transcript-result", {
              transcript,
              isFinal: data.is_final,
            });
          }
        });

        dgConnection.on(LiveTranscriptionEvents.Error, (error) => {
          console.error("[DEEPGRAM] Error:", error);
          socket.emit("transcription-error", error.message || "Deepgram connection error");
        });

        dgConnection.on(LiveTranscriptionEvents.Close, () => {
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

    socket.on("audio-chunk", (data) => {
      if (dgConnection && isDeepgramOpen) {
        try {
          dgConnection.send(Buffer.from(data));
        } catch (err) {
          console.error("[BACKEND] Error sending audio to Deepgram:", err.message);
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

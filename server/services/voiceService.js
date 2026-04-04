const { createClient } = require("@deepgram/sdk");
const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  io.on("connection", (socket) => {
    console.log(`[VOICE] New Client: ${socket.id}`);
    
    let dgConnection;
    let isConnected = false;

    socket.on("start-transcription", async (options) => {
      console.log(`[VOICE] Requested transcription (${options.language})`);
      
      try {
        // Simple, clean initialization
        dgConnection = deepgram.listen.live({
          model: options.language === "en" ? "nova-2-medical" : "nova-2",
          language: options.language || "en",
          smart_format: true,
          interim_results: true,
        });

        dgConnection.on("open", () => {
          console.log("[VOICE] Deepgram Socket OPEN");
          isConnected = true;
          socket.emit("transcription-started");
        });

        dgConnection.on("results", (data) => {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript) {
            socket.emit("transcript-result", {
              transcript,
              isFinal: data.is_final
            });
          }
        });

        dgConnection.on("error", (err) => {
          console.error("[VOICE] Deepgram Error:", err);
          socket.emit("transcription-error", err.message);
        });

        dgConnection.on("close", () => {
          console.log("[VOICE] Deepgram Socket CLOSED");
          isConnected = false;
        });

      } catch (err) {
        console.error("[VOICE] Setup Error:", err);
      }
    });

    socket.on("audio-chunk", (data) => {
      if (dgConnection && isConnected) {
        dgConnection.send(Buffer.from(data));
      }
    });

    socket.on("stop-transcription", () => {
      if (dgConnection) {
        try { dgConnection.requestClose(); } catch (e) {}
        dgConnection = null;
      }
      isConnected = false;
    });

    socket.on("disconnect", () => {
      if (dgConnection) {
        try { dgConnection.requestClose(); } catch (e) {}
      }
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

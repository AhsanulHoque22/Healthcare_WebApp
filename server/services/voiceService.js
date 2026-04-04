const { createClient } = require("@deepgram/sdk");
const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const apiKey = process.env.DEEPGRAM_API_KEY;
  const deepgram = createClient(apiKey);

  io.on("connection", (socket) => {
    let dgConnection;
    let keepAlive;
    let isDeepgramOpen = false;
    let pendingChunks = []; // 🛠️ BUFFER to store audio while connecting

    socket.on("start-transcription", async (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[VOICE] Connecting: ${model} (${socket.id})`);

      if (dgConnection) {
        try { dgConnection.requestClose(); } catch (e) {}
      }

      try {
        // v5.x connection
        dgConnection = deepgram.listen.live({
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
        });

        const onOpen = () => {
          console.log(`[DEEPGRAM] Connection OPEN. Flushing ${pendingChunks.length} buffered chunks.`);
          isDeepgramOpen = true;
          socket.emit("transcription-started");
          
          // 🚀 FLUSH BUFFER
          while (pendingChunks.length > 0) {
            const chunk = pendingChunks.shift();
            dgConnection.send(chunk);
          }
          
          keepAlive = setInterval(() => {
            if (dgConnection && isDeepgramOpen) dgConnection.keepAlive();
          }, 10000);
        };

        dgConnection.on("open", onOpen);
        dgConnection.on("Open", onOpen);

        dgConnection.on("results", (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            socket.emit("transcript-result", { transcript, isFinal: data.is_final });
          }
        });

        dgConnection.on("error", (err) => {
          console.error("[DEEPGRAM] Error:", err.message);
          socket.emit("transcription-error", err.message);
        });

        dgConnection.on("close", () => {
          console.log("[DEEPGRAM] Closed");
          isDeepgramOpen = false;
          if (keepAlive) clearInterval(keepAlive);
        });

      } catch (err) {
        console.error(`[VOICE] Init Fail:`, err.message);
        socket.emit("transcription-error", err.message);
      }
    });

    socket.on("audio-chunk", (data) => {
      const chunk = Buffer.from(data);
      if (isDeepgramOpen && dgConnection) {
        dgConnection.send(chunk);
      } else {
        // 📥 BUFFERING mode
        pendingChunks.push(chunk);
        if (pendingChunks.length % 20 === 0) {
          console.log(`[VOICE] Buffered ${pendingChunks.length} chunks (Waiting for Open...)`);
        }
        // Safety: Don't overflow buffer if connection fails forever
        if (pendingChunks.length > 200) pendingChunks.shift();
      }
    });

    const safeClose = () => {
      if (dgConnection) {
        try { dgConnection.requestClose(); } catch (e) {}
        dgConnection = null;
      }
      isDeepgramOpen = false;
      pendingChunks = [];
      if (keepAlive) clearInterval(keepAlive);
    };

    socket.on("stop-transcription", () => safeClose());
    socket.on("disconnect", () => safeClose());
  });
  return io;
};

module.exports = { setupVoiceToPrescription };

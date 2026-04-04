const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  io.on("connection", (socket) => {
    console.log("Client connected to Voice-to-Prescription WebSocket");

    let dgConnection;

    socket.on("start-transcription", async (options) => {
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`Starting Deepgram transcription session (model: ${model}, lang: ${language})`);

      try {
        dgConnection = deepgram.listen.live({
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
        });

        dgConnection.on(LiveTranscriptionEvents.Open, () => {
          console.log("Deepgram connection opened");
          socket.emit("transcription-started");
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
          console.error("Deepgram error:", error);
          socket.emit("transcription-error", error.message);
        });

        dgConnection.on(LiveTranscriptionEvents.Close, () => {
          console.log("Deepgram connection closed");
          socket.emit("transcription-stopped");
        });

        dgConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
          console.log("Deepgram metadata:", metadata);
        });

      } catch (error) {
        console.error("Failed to connect to Deepgram:", error);
        socket.emit("transcription-error", error.message);
      }
    });

    socket.on("audio-chunk", (data) => {
      if (dgConnection && dgConnection.getReadyState() === 1) {
        dgConnection.send(data);
      }
    });

    socket.on("stop-transcription", () => {
      console.log("Stopping transcription session");
      if (dgConnection) {
        dgConnection.finish();
        dgConnection = null;
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      if (dgConnection) {
        dgConnection.finish();
        dgConnection = null;
      }
    });
  });

  return io;
};

module.exports = { setupVoiceToPrescription };

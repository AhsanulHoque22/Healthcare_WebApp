const { Server } = require("socket.io");

const setupVoiceToPrescription = (server) => {
  console.log('[VOICE] Initializing WebSocket subsystem...');
  
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  let deepgram;
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) throw new Error("DEEPGRAM_API_KEY is missing from environment");
    
    // Support all versions of the v5 JS SDK initialization
    const sdk = require("@deepgram/sdk");
    if (sdk.DeepgramClient) {
      deepgram = new sdk.DeepgramClient(apiKey);
      console.log('[VOICE] Deepgram initialized with DeepgramClient class');
    } else if (sdk.createClient) {
      deepgram = sdk.createClient(apiKey);
      console.log('[VOICE] Deepgram initialized with createClient factory');
    } else {
      throw new Error("Could not find a valid Deepgram initialization method in SDK");
    }
  } catch (err) {
    console.error('[VOICE] CRITICAL SDK FAIL:', err.message);
  }

  io.on("connection", (socket) => {
    let dgConnection;
    let keepAlive;
    let isDeepgramOpen = false;
    let pendingChunks = []; // 🛠️ BUFFER to store audio while connecting

    socket.on("start-transcription", async (options) => {
      if (!deepgram) {
        console.error('[VOICE] start-transcription failed: client not initialized');
        return socket.emit("transcription-error", "Deepgram not initialized on server");
      }
      
      const language = options.language || "en";
      const model = language === "en" ? "nova-2-medical" : "nova-2";
      
      console.log(`[VOICE] Connecting: ${model} (${socket.id})`);

      if (dgConnection) {
        try { dgConnection.requestClose(); } catch (e) {}
      }

      try {
        console.log(`[VOICE] Full Discovery - Keys: ${Object.keys(deepgram).join(', ')}`);
        
        // Polyfill to find the live connection method regardless of SDK version
        let connectMethod = null;
        let binding = null;

        if (deepgram.listen) {
          if (typeof deepgram.listen.live === 'function') { connectMethod = deepgram.listen.live; binding = deepgram.listen; }
          else if (deepgram.listen.v1) {
            if (typeof deepgram.listen.v1.connect === 'function') { connectMethod = deepgram.listen.v1.connect; binding = deepgram.listen.v1; }
            else if (typeof deepgram.listen.v1.live === 'function') { connectMethod = deepgram.listen.v1.live; binding = deepgram.listen.v1; }
          }
        }
        
        // Fallback to legacy v3 structure if listen is empty
        if (!connectMethod && deepgram.transcription) {
          if (typeof deepgram.transcription.live === 'function') { connectMethod = deepgram.transcription.live; binding = deepgram.transcription; }
        }

        if (!connectMethod) {
          const listenKeys = Object.keys(deepgram.listen || {});
          throw new Error(`CRITICAL: No connect method found! (listen: ${listenKeys.join(',')})`);
        }

        console.log('[VOICE] Method found. Connecting...');
        dgConnection = connectMethod.call(binding, {
          model: model,
          language: language,
          smart_format: true,
          interim_results: true,
          utterance_end_ms: 1000,
          vad_events: true,
          endpointing: 300,
        });

        if (dgConnection instanceof Promise) {
           dgConnection = await dgConnection;
        }

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

/**
 * Custom Next.js server with Socket.IO for real-time voice streaming.
 *
 * Architecture:
 * Browser (Web Audio API) ↔ Socket.IO (WebSocket) ↔ This Server ↔ Bedrock Nova 2 Sonic
 *
 * Run with: node server.mjs (after `npm run build`)
 * Or in dev: npx tsx server.ts
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { SonicSession } from "./src/lib/aws/sonic.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7, // 10MB for audio chunks
  });

  // Track active sessions
  const sessions = new Map<string, SonicSession>();

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // ─── Start Voice Session ───
    socket.on(
      "voice:start",
      async (data: { systemPrompt: string; voiceId?: string }) => {
        console.log(`[Socket.IO] Starting voice session for ${socket.id}`);

        // Clean up any existing session
        const existing = sessions.get(socket.id);
        if (existing) {
          await existing.endSession().catch(() => {});
          sessions.delete(socket.id);
        }

        const session = new SonicSession({
          onAudioOutput: (audioBase64) => {
            socket.emit("voice:audio", { audio: audioBase64 });
          },
          onTextOutput: (text, role) => {
            socket.emit("voice:transcript", { text, role });
          },
          onError: (error) => {
            console.error(`[Sonic] Error for ${socket.id}:`, error);
            socket.emit("voice:error", { error });
          },
          onSessionEnd: () => {
            console.log(`[Sonic] Session ended for ${socket.id}`);
            socket.emit("voice:ended");
            sessions.delete(socket.id);
          },
        });

        sessions.set(socket.id, session);

        try {
          await session.startSession(
            data.systemPrompt,
            data.voiceId || "matthew"
          );
          socket.emit("voice:started");
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Failed to start session";
          socket.emit("voice:error", { error: msg });
          sessions.delete(socket.id);
        }
      }
    );

    // ─── Receive Audio Chunks from Browser ───
    socket.on("voice:audioChunk", async (data: { audio: string }) => {
      const session = sessions.get(socket.id);
      if (session) {
        await session.sendAudioChunk(data.audio).catch((err) => {
          console.error(`[Sonic] Audio chunk error:`, err);
        });
      }
    });

    // ─── End Voice Session ───
    socket.on("voice:stop", async () => {
      console.log(`[Socket.IO] Stopping voice session for ${socket.id}`);
      const session = sessions.get(socket.id);
      if (session) {
        await session.endSession().catch(() => {});
        sessions.delete(socket.id);
      }
    });

    // ─── Disconnect ───
    socket.on("disconnect", async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const session = sessions.get(socket.id);
      if (session) {
        await session.endSession().catch(() => {});
        sessions.delete(socket.id);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> FutureLens ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO voice streaming enabled`);
  });
});

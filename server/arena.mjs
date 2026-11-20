import http from "node:http";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { createArena, stepArena, finishArena, freshArenaInput, validArenaInput } from "../src/game/arenaSimulation.js";

export function createArenaServer({ origins = [], roomLimit = 32, now = Date.now } = {}) {
  const rooms = new Map(), clients = new Set();
  const allowed = origin => origins.includes(origin) || origin === "https://geovictoria-intranet-peru.web.app" ||
    /^https:\/\/geovictoria-intranet-peru--[a-z0-9-]+\.web\.app$/.test(origin || "") ||
    process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
  const server = http.createServer((req, res) => {
    res.writeHead(req.url === "/health" ? 200 : 404, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(JSON.stringify(req.url === "/health" ? { ok: true, version: 1 } : { error: "Not found" }));
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2048, perMessageDeflate: false });
  server.on("upgrade", (req, socket, head) => {
    if (req.url !== "/arena" || !allowed(req.headers.origin) || clients.size >= 128) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n"); return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws));
  });
  const send = (ws, data) => { if (ws?.readyState === WebSocket.OPEN) {
    if (ws.bufferedAmount > 262144) return ws.close(1013, "Connection too slow");
    ws.send(JSON.stringify(data));
  } };
  const snapshot = room => ({ t: "state", code: room.code, round: room.round,
    players: room.players.map(p => p ? { name: p.name, character: p.character, ready: p.ready, connected: p.ws?.readyState === WebSocket.OPEN } : null),
    game: room.game });
  const broadcast = room => { const data = snapshot(room); for (const p of room.players) send(p?.ws, data); };
  const fail = (ws, message) => send(ws, { t: "error", message });
  const join = (ws, room, side, player) => {
    ws.room = room; ws.side = side; player.ws = ws; player.disconnectedAt = null;
    player.input = freshArenaInput(); player.input.aimX = side === 0 ? 1 : -1;
    send(ws, { t: "joined", code: room.code, side, token: player.token, nextSeq: player.seq + 1, round: room.round }); broadcast(room);
  };
  wss.on("connection", ws => {
    clients.add(ws); ws.alive = true; ws.window = now(); ws.messages = 0;
    const joinTimeout = setTimeout(() => { if (!ws.room) ws.close(1008, "Join timed out"); }, 10000); joinTimeout.unref();
    ws.on("pong", () => { ws.alive = true; });
    ws.on("error", () => {});
    ws.on("message", bytes => {
      if (now() - ws.window > 1000) { ws.window = now(); ws.messages = 0; }
      if (++ws.messages > 100) return ws.close(1008, "Too many messages");
      let message; try { message = JSON.parse(bytes.toString()); } catch { return ws.close(1008, "Invalid message"); }
      if (!message || typeof message !== "object") return ws.close(1008, "Invalid message");
      if (!ws.room) {
        if (message.t === "resume") {
          const room = rooms.get(message.code), side = room?.players.findIndex(p => p?.token === message.token);
          if (!room || side < 0 || room.players[side].ws?.readyState === WebSocket.OPEN || room.players[side].disconnectedAt === null || now() - room.players[side].disconnectedAt > 15000) return fail(ws, "No se pudo recuperar la sala. Vuelve a entrar con su código.");
          return join(ws, room, side, room.players[side]);
        }
        if (!["create", "join"].includes(message.t)) return fail(ws, "Crea una sala o utiliza su código.");
        const name = typeof message.name === "string" ? message.name.trim() : "";
        const ids = ["tecnoia", "conectia", "ordenia", "balance", "norte", "cierreia", "festivia", "aliania", "prisma", "armonia", "radaria", "agilia"];
        if (name.length < 2 || name.length > 24 || [...name].some(c => c.codePointAt(0) < 32) || !ids.includes(message.character)) return fail(ws, "Escribe un alias de 2 a 24 caracteres y elige un guardián.");
        let room, side;
        if (message.t === "create") {
          if (rooms.size >= roomLimit) return fail(ws, "Todas las salas están ocupadas. Intenta de nuevo en unos minutos.");
          let code; do { code = randomBytes(5).toString("hex").slice(0, 8).toUpperCase(); } while (rooms.has(code));
          room = { code, players: [null, null], game: null, round: null, createdAt: now(), finishedAt: null }; rooms.set(code, room); side = 0;
        } else {
          room = rooms.get(message.code);
          if (!room || room.game || room.players[1]) return fail(ws, "La sala no existe, está llena o ya comenzó.");
          side = 1;
        }
        const player = { name, character: message.character, ready: false, token: randomBytes(32).toString("hex"), seq: -1, ws, disconnectedAt: null };
        room.players[side] = player; return join(ws, room, side, player);
      }
      const room = ws.room, p = room.players[ws.side];
      if (!p || p.ws !== ws || !rooms.has(room.code)) return;
      if (message.t === "ready" && typeof message.ready === "boolean" && (!room.game || room.game.phase === "finished")) {
        p.ready = message.ready;
        if (room.players.every(p => p?.ready && p.ws?.readyState === WebSocket.OPEN)) {
          room.round = randomBytes(8).toString("hex"); room.game = createArena(); room.finishedAt = null;
          for (const p of room.players) { p.ready = false; p.seq = -1; p.input = freshArenaInput(); }
        }
        return broadcast(room);
      }
      if (message.t === "input") {
        if (!room.game || room.game.phase === "finished" || message.round !== room.round || !Number.isSafeInteger(message.seq) || message.seq <= p.seq || !validArenaInput(message.input)) return;
        p.seq = message.seq; p.input = { ...message.input, dash: p.input.dash || message.input.dash }; p.lastInput = now();
      } else if (message.t === "ping") send(ws, { t: "pong", at: message.at });
      else if (message.t === "leave") ws.close(1000, "Left room");
    });
    ws.on("close", () => {
      clearTimeout(joinTimeout);
      clients.delete(ws);
      const p = ws.room?.players[ws.side];
      if (p?.ws === ws) { p.ws = null; p.ready = false; p.input = freshArenaInput(); p.disconnectedAt = now(); broadcast(ws.room); }
    });
  });
  let frame = 0, previous = now(), accumulator = 0;
  const timer = setInterval(() => {
    const time = now(); accumulator += Math.min(250, time - previous); previous = time;
    let steps = 0;
    while (accumulator >= 1000 / 60 && steps++ < 15) {
      accumulator -= 1000 / 60;
      for (const room of rooms.values()) if (room.game && room.game.phase !== "finished") {
        for (const p of room.players) if (p && (!p.ws || time - (p.lastInput || 0) > 250)) p.input = freshArenaInput();
        stepArena(room.game, room.players.map(p => p?.input || freshArenaInput()));
      }
    }
    frame++;
    for (const [code, room] of rooms) {
      for (let side = 0; side < 2; side++) {
        const p = room.players[side];
        if (p && !p.ws && p.disconnectedAt !== null && time - p.disconnectedAt > 15000) {
          if (room.game && room.game.phase !== "finished") finishArena(room.game, room.players[1 - side]?.ws ? 1 - side : null, "disconnect");
          else if (!room.game && side === 1) room.players[1] = null;
          else if (!room.game && side === 0) room.finishedAt = time - 120001;
        }
      }
      if (room.game?.phase === "finished") room.finishedAt ??= time;
      if ((!room.game && time - room.createdAt > 600000) || room.finishedAt && time - room.finishedAt > 120000 || room.players.every(p => !p?.ws) && time - Math.max(...room.players.map(p => p?.disconnectedAt || 0)) > 15000) {
        for (const p of room.players) { send(p?.ws, { t: "expired" }); p?.ws?.close(1000, "Room expired"); } rooms.delete(code); continue;
      }
      if (frame % (room.game && room.game.phase !== "finished" ? 3 : 60) === 0) broadcast(room);
    }
  }, 1000 / 60);
  const heartbeat = setInterval(() => { for (const ws of clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } } }, 20000);
  return { server, rooms, close: async () => { clearInterval(timer); clearInterval(heartbeat); for (const ws of clients) ws.terminate(); await new Promise(resolve => wss.close(resolve)); if (server.listening) await new Promise(resolve => server.close(resolve)); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { server } = createArenaServer({ origins: (process.env.ARENA_ALLOWED_ORIGINS || "").split(",").filter(Boolean) });
  server.listen(Number(process.env.PORT || 8787), "0.0.0.0", () => console.log("Arena server ready"));
}

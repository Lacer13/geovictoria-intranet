export function arenaEndpoint() {
  const configured = import.meta.env.VITE_ARENA_URL;
  if (configured) {
    try { const url = new URL(configured); if (!["wss:", ...(import.meta.env.DEV ? ["ws:"] : [])].includes(url.protocol)) return null; return url.href.replace(/\/$/, "") + "/arena"; }
    catch { return null; }
  }
  if (import.meta.env.DEV) return "ws://127.0.0.1:8787/arena";
  return null;
}

export function connectArena({ url, onMessage, onStatus, credential = null }) {
  let socket, closed = false, attempt = 0, reconnectTimer, sendTimer, pingTimer, pending = null;
  let seq = 0, round = null, credentials = credential, reconnectAt = null, joined = false;
  const open = () => {
    if (closed) return;
    onStatus(attempt ? "reconnecting" : "connecting");
    socket = new WebSocket(url);
    joined = false;
    socket.onopen = () => {
      onStatus("connected"); attempt = 0; reconnectAt = null;
      if (credentials) socket.send(JSON.stringify({ t: "resume", ...credentials }));
      else if (pending) { socket.send(JSON.stringify(pending)); pending = null; }
    };
    socket.onmessage = event => {
      let data; try { data = JSON.parse(event.data); } catch { return; }
      if (data.t === "joined") { joined = true; credentials = { code: data.code, token: data.token }; seq = data.nextSeq || 0; round = data.round; }
      if (data.t === "error" && credentials && !joined) {
        credentials = null; closed = true; socket.close(1000); onStatus("offline");
        onMessage({ ...data, recoveryFailed: true }); return;
      }
      if (data.t === "state" && data.round !== round) { round = data.round; seq = 0; }
      if (data.t === "pong") { onMessage({ t: "latency", ms: Math.max(0, Date.now() - data.at) }); return; }
      onMessage(data);
    };
    socket.onerror = () => {};
    socket.onclose = () => {
      if (closed) return;
      reconnectAt ??= Date.now();
      const canRetry = credentials ? Date.now() - reconnectAt < 14000 : pending && Date.now() - reconnectAt < 75000;
      if (canRetry) { onStatus(credentials ? "reconnecting" : "connecting"); attempt++; reconnectTimer = setTimeout(open, credentials ? 1000 : 4000); }
      else onStatus("offline");
    };
  };
  const send = data => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); else if (["create", "join"].includes(data.t)) pending = data; };
  open();
  pingTimer = setInterval(() => send({ t: "ping", at: Date.now() }), 3000);
  return {
    send,
    startInputs(getInput) { clearInterval(sendTimer); sendTimer = setInterval(() => {
      if (!round || socket?.readyState !== WebSocket.OPEN) return;
      const input = getInput(); send({ t: "input", round, seq: seq++, input });
    }, 1000 / 30); },
    close() { closed = true; clearTimeout(reconnectTimer); clearInterval(sendTimer); clearInterval(pingTimer); credentials = null; socket?.close(1000); },
  };
}

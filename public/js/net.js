// WebSocket ulanishi: uzilib qolsa avtomatik qayta ulanadi

export function createNet({ onOpen, onClose, onMessage }) {
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  let ws = null;
  let attempt = 0;
  let timer = null;
  let queue = [];

  function connect() {
    clearTimeout(timer);
    timer = null;
    if (ws && ws.readyState <= 1) return;
    try {
      ws = new WebSocket(url);
    } catch {
      schedule();
      return;
    }
    ws.onopen = () => {
      attempt = 0;
      onOpen();
      const pending = queue;
      queue = [];
      pending.forEach(send);
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      onMessage(msg);
    };
    ws.onclose = () => {
      ws = null;
      onClose();
      schedule();
    };
    ws.onerror = () => {};
  }

  function schedule() {
    if (timer) return;
    const delay = Math.min(8000, 400 * 2 ** attempt++) + Math.random() * 300;
    timer = setTimeout(connect, delay);
  }

  function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    else if (queue.length < 5) queue.push(msg);
  }

  // Telefon uxlab qolib, qaytib kelganda darhol qayta ulanamiz
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!ws || ws.readyState > 1)) {
      attempt = 0;
      connect();
    }
  });
  window.addEventListener('online', () => {
    attempt = 0;
    connect();
  });

  connect();
  return { send, isOpen: () => ws?.readyState === WebSocket.OPEN };
}

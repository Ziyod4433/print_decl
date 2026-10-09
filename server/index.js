import { createGameServer } from './app.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const game = createGameServer();
await game.listen(port, host);
console.log(`Bojxona Ustasi ishga tushdi: http://localhost:${port}`);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await game.close();
    process.exit(0);
  });
}

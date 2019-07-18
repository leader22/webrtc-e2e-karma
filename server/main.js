const http = require("https");
const fs = require("fs");
const debug = require("debug")("main");
const Server = require("./server");

(async () => {
  debug("process started");

  // DEV: logging
  process.on("uncaughtException", err => {
    debug("uncaughtException", err);
  });
  process.on("unhandledRejection", (reason, p) => {
    debug("unhandledRejection", reason, p);
  });

  const httpServer = http.createServer({
    key: fs.readFileSync("./certs/key.pem", "utf8"),
    cert: fs.readFileSync("./certs/cert.pem", "utf8")
  });
  const server = new Server();

  await server.run(httpServer, 9001).catch(err => {
    debug("server.run() error", err);
  });

  // DEV: logging
  setInterval(() => {
    const { channels } = server.getState();

    for (const channel of channels) {
      debug(`${channel.mode}/${channel.id}: ${channel.size} peer(s)`);
    }
  }, 2000);
})();

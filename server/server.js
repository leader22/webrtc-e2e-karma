const WebSocket = require("ws");
const debug = require("debug")("server");
const Peer = require("./peer");
const Channel = require("./channel");

class Server {
  constructor() {
    this._state = {
      channels: {
        uni: new Map(),
        mlt: new Map()
      }
    };
  }

  async run(httpServer, port) {
    const wsServer = new WebSocket.Server({ server: httpServer });

    // channel.connect() called in client
    wsServer.on("connection", (socket, req) => {
      const searchParams = new URLSearchParams(req.url.split("?")[1]);

      const channelMode = searchParams.get("channelMode");
      const channelId = searchParams.get("channelId");
      const peerId = searchParams.get("peerId");

      debug(`on:connection for ${channelMode}/${channelId}, ${peerId}`);

      const peer = new Peer(peerId, socket);

      // TODO: check more strict...
      // if required params are missing, reject websocket handshake itself
      if (!(channelMode && channelId && peerId)) {
        debug("connectionrequest.reject(): Parameter is missing!");
        peer.send("@enter/reject", "Parameter is missing!");
      }

      // TODO: should handle this in serial queue
      (async () => {
        const channel = this._getOrCreateChannel(channelMode, channelId);
        const data = await channel.enter(peer);
        peer.send("@enter/accept", data);
      })().catch(err => {
        debug("channel create or enter error", err);
        peer.send("@enter/reject", err.toString());
      });
    });

    await new Promise(resolve => httpServer.listen(port, resolve));
    debug("started on", wsServer.address());
  }

  getState() {
    const { channels } = this._state;

    const res = [];
    for (const channel of channels.uni.values()) {
      res.push({
        mode: "uni",
        id: channel.id,
        size: channel.size
      });
    }
    for (const channel of channels.mlt.values()) {
      res.push({
        mode: "mlt",
        id: channel.id,
        size: channel.size
      });
    }

    return {
      channels: res
    };
  }

  _getOrCreateChannel(channelMode, channelId) {
    const channels = this._state.channels[channelMode];

    let channel = channels.get(channelId);

    // get
    if (channel) {
      return channel;
    }

    // or create
    // TODO: should create specific instance in the future
    channel = new Channel({
      id: channelId,
      mode: channelMode
    });
    channel.on("@close", () => channels.delete(channel.id));
    channels.set(channel.id, channel);

    return channel;
  }
}

module.exports = Server;

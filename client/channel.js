import EventEmitter from "eventemitter3";
import _debug from "debug";

const debug = _debug("channel");

class Channel extends EventEmitter {
  constructor(serverUrl) {
    super();

    this._serverUrl = serverUrl;
    this._socket = null;
  }

  async connect() {
    debug("connect()");
    if (this._socket !== null) {
      throw new Error("Do not need to reconnect!");
    }

    this._socket = new WebSocket(this._serverUrl);
    return new Promise((resolve, reject) => {
      // open -> message
      this._socket.addEventListener(
        "message",
        ev => {
          const { type, data } = JSON.parse(ev.data);

          if (type === "@enter/reject") {
            debug("connect() fail");
            return reject(data);
          }

          if (type === "@enter/accept") {
            debug("connect() success");
            this._handleSocket();
            return resolve(data);
          }
        },
        { once: true }
      );
      // TODO: handle failure case to reject()
    });
  }

  disconnect() {
    debug("disconnect()");

    if (this._socket === null) {
      throw new Error("Can not disconnect before connect!");
    }

    this._socket.close();
    this._socket = null;
  }

  destroy() {
    debug("destroy()");

    if (this._socket === null) {
      throw new Error("Can not destroy before connect!");
    }

    this.disconnect();

    this.emit("destroy");
    this.removeAllListeners();
  }

  send(data) {
    this._socket.send(
      JSON.stringify({
        type: "@message",
        data
      })
    );
  }

  _handleSocket() {
    this._socket.addEventListener("message", ev => {
      const { type, data } = JSON.parse(ev.data);
      debug(`on(${type})`, data);

      switch (type) {
        case "@message":
          return this.emit("message", data);
        case "@channel/ready":
          return this.emit("channelReady", data);
        case "@peer/join":
          return this.emit("peerJoin", data);
        case "@peer/leave":
          return this.emit("peerLeave", data);
      }
    });
  }
}

export default Channel;

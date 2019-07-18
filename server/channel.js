const EventEmitter = require("eventemitter3");
const debug = require("debug")("channel");

class Channel extends EventEmitter {
  constructor({ id, mode }) {
    super();

    this._id = id;
    this._mode = mode;
    this._maxSize = mode === "uni" ? 2 : Infinity;
    this._peers = new Set();
  }

  get id() {
    return this._id;
  }

  get size() {
    return this._peers.size;
  }

  async enter(peer) {
    debug(`enter(${peer.id})`);

    if (this._peers.has(peer)) {
      throw new Error(`Id ${peer.id} is already exists!`);
    }
    if (this._peers.size >= this._maxSize) {
      throw new Error("This channel is full!");
    }

    this._peers.add(peer);
    this._handlePeer(peer);

    // notify members
    setImmediate(() =>
      this._forEachRemotePeers(peer.id, remotePeer => {
        remotePeer.send("@peer/join", { id: peer.id });
      })
    );
    // notify unicast ready
    if (this._mode === "uni" && this._peers.size === 2) {
      setImmediate(() =>
        this._forEachRemotePeers("", remotePeer => {
          remotePeer.send("@channel/ready", {});
        })
      );
    }

    const peers = [...this._peers].filter(p => p.id !== peer.id).map(p => p.id);
    return { id: peer.id, peers };
  }

  _close() {
    debug("close()");

    this._peers.clear();
    this.emit("@close");
  }

  _handlePeer(peer) {
    // channel.disconnect() or destroy() called in client
    peer.socket.on("close", () => {
      debug(`peer: ${peer.id} closed`);

      this._peers.delete(peer);

      setImmediate(() =>
        this._forEachRemotePeers(peer.id, remotePeer => {
          remotePeer.send("@peer/leave", { id: peer.id });
        })
      );

      if (this._peers.size === 0) {
        debug(`close empty room: ${this._id}`);
        this._close();
      }
    });

    peer.socket.on("message", ev => {
      const { type, data } = JSON.parse(ev);
      switch (type) {
        case "@message": {
          this._forEachRemotePeers(peer.id, remotePeer =>
            remotePeer.send("@message", data)
          );
        }
      }
    });
  }

  _forEachRemotePeers(myId, fn) {
    for (const remotePeer of this._peers) {
      // skip myself
      if (remotePeer.id !== myId) {
        fn(remotePeer);
      }
    }
  }
}

module.exports = Channel;

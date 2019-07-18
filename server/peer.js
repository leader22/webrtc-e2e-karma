class Peer {
  constructor(id, socket) {
    this._id = id;
    this._socket = socket;
  }

  get id() {
    return this._id;
  }

  get socket() {
    return this._socket;
  }

  send(type, data) {
    this._socket.send(JSON.stringify({ type, data }));
  }
}

module.exports = Peer;

import _debug from "debug";
import Channel from "./channel";

const debug = _debug("signaling");
// TODO: use some lib
const uuid = () => String(Math.random()).slice(2, 10);

class Signaling {
  constructor({ serverUrl }) {
    this._serverUrl = serverUrl;
  }

  createUnicastChannel(channelId) {
    debug(`createUnicastChannel(${channelId})`);
    return this._createChannel("uni", channelId);
  }

  createMulticastChannel(channelId) {
    debug(`createMulticastChannel(${channelId})`);
    return this._createChannel("mlt", channelId);
  }

  _createChannel(mode, channelId) {
    // TODO: fix rule and validate channelId
    if (!/[\w-]{8,}/.test(channelId)) {
      throw new Error("Invalid channelId!");
    }

    const url = new URL(this._serverUrl);
    url.searchParams.set("peerId", `p:${uuid()}`);
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("channelMode", mode);

    // TODO: should create specific instance in the future
    return new Channel(url.toString());
  }
}

export default Signaling;

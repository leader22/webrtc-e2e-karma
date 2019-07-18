import { Signaling } from "../client";
import { connectPCandDC } from "./utils";

describe("P2P", () => {
  it("should work", async done => {
    const sign = new Signaling({
      serverUrl: `wss://${location.hostname}:9001`
    });
    const uniCh = sign.createUnicastChannel("test-p2p");

    const { peers } = await uniCh.connect();
    await new Promise(r => uniCh.once("channelReady", r));

    const side = peers.length === 1 ? "offer" : "answer";

    const { dc } = await connectPCandDC({ side, uniCh });

    dc.onmessage = ev => {
      expect(ev.data).toBe("fine");
      done();
    };
    dc.send("fine");
  });
});

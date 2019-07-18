import { promised } from "enhanced-datachannel";
import { createSign, connectPCandDC } from "./utils";

describe("enhanced-datachannel", () => {
  it("should work", async done => {
    const sign = createSign();
    const uniCh = sign.createUnicastChannel("test-p2p");

    const { peers } = await uniCh.connect();
    await new Promise(r => uniCh.once("channelReady", r));

    const side = peers.length === 1 ? "offer" : "answer";

    const { dc } = await connectPCandDC({ side, uniCh });
    const pdc = promised(dc);

    pdc.on("message", (data, resolve) => {
      expect(data).toEqual({ hello: "world" });
      resolve();
    });

    await pdc.send({ hello: "world" });
    done();
  });
});

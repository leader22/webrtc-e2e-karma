import { createSign } from "./utils";

describe("signaling", () => {
  it("should work", async done => {
    const sign = createSign();
    const uniCh = sign.createUnicastChannel("test-p2p");

    await uniCh.connect();
    uniCh.once("channelReady", () => {
      expect(1).toBe(1);
      done();
    });
  });
});

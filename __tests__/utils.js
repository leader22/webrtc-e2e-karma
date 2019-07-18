import { Signaling } from "../client";

export function createSign() {
  const sign = new Signaling({
    serverUrl: `wss://${location.hostname}:9001`
  });
  return sign;
}
export async function connectPCandDC({ uniCh, side }) {
  const pc = new RTCPeerConnection();
  const dc = pc.createDataChannel("sign", { negotiated: true, id: 1 });

  pc.onicecandidate = ev => {
    if (ev.candidate === null || ev.candidate.candidate === "") return;
    uniCh.send({ type: "candidate", data: ev.candidate });
  };

  uniCh.on("message", async ({ type, data }) => {
    if (type === "candidate") {
      await pc.addIceCandidate(data);
    }
    if (type === "offer" && side === "answer") {
      await pc.setRemoteDescription(data);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      uniCh.send({ type: "answer", data: answer });
    }
    if (type === "answer" && side === "offer") {
      await pc.setRemoteDescription(data);
    }
  });

  if (side === "offer") {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    uniCh.send({ type: "offer", data: offer });
  }

  await new Promise(r => (dc.onopen = r));
  return { pc, dc };
}

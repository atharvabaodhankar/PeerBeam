import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

export default function ConnectionPanel({ onFileSend }) {
  const [roomID, setRoomID] = useState("");
  const [status, setStatus] = useState("");
  const [otherUserID, setOtherUserID] = useState(null);
  const peerRef = useRef(null); // useRef instead of let

  useEffect(() => {
    socket.on("other-user", (userID) => {
      setOtherUserID(userID);
      setStatus("Other user in room. You're the initiator.");
      initPeer(true, userID); // initiator
    });

    socket.on("user-joined", (userID) => {
      setOtherUserID(userID);
      setStatus("You joined second. Waiting for signal...");
      // Don’t initPeer yet. Wait until offer is received.
    });

    socket.on("receive-signal", ({ signal, senderID }) => {
      if (!peerRef.current) {
        initPeer(false, senderID); // non-initiator creates peer on receiving offer
      }

      try {
        peerRef.current.signal(signal);
      } catch (err) {
        console.error("Signal error:", err);
      }
    });

    socket.on("peer-connected", () => {
      setStatus("✅ Peer connection established!");
    });

    return () => {
      socket.off("other-user");
      socket.off("user-joined");
      socket.off("receive-signal");
      socket.off("peer-connected");
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, []);

  function initPeer(initiator, targetID) {
    const peer = new Peer({ initiator, trickle: false });

    peer.on("signal", (signalData) => {
      socket.emit("send-signal", {
        targetID,
        signal: signalData,
      });
    });

    peer.on("connect", () => {
      setStatus("🎉 Connected to peer");
      socket.emit("peer-connected", { targetID });
    });

    peer.on("data", (data) => {
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "received-file";
      a.click();
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      setStatus(`Peer error: ${err.message}`);
    });

    peerRef.current = peer;

    onFileSend(() => (file) => {
      if (peerRef.current && peerRef.current.connected) {
        peerRef.current.send(file);
      } else {
        alert("Peer not connected");
      }
    });
  }

  function joinRoom() {
    if (roomID) {
      socket.emit("join-room", roomID);
      setStatus(`Joined room: ${roomID}`);
    }
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        value={roomID}
        onChange={(e) => setRoomID(e.target.value)}
        placeholder="Enter room ID"
      />
      <button onClick={joinRoom}>Join Room</button>
      {status && <p>{status}</p>}
      {otherUserID && <p>Connected to: {otherUserID}</p>}
    </div>
  );
}

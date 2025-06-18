import { useState, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

let peer = null;

export default function ConnectionPanel({ onFileSend }) {
  const [roomID, setRoomID] = useState("");
  const [otherUserID, setOtherUserID] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    socket.on("other-user", (userID) => {
      setOtherUserID(userID);
      setStatus("Other user joined. You are the initiator.");
      initPeer(true, userID); // Initiator sends offer
    });

    socket.on("user-joined", (newUserID) => {
      setOtherUserID(newUserID);
      setStatus("User joined. You are the responder.");
      initPeer(false, newUserID); // Responder receives offer
    });

    socket.on("receive-signal", ({ signal, senderID }) => {
      if (peer) {
        peer.signal(signal);
      } else {
        console.warn("Peer not ready yet, cannot signal.");
      }
    });

    return () => {
      socket.off("other-user");
      socket.off("user-joined");
      socket.off("receive-signal");
      if (peer) {
        peer.destroy();
        peer = null;
      }
    };
  }, []);

  function initPeer(initiator, userID) {
    peer = new Peer({
      initiator,
      trickle: false,
    });

    peer.on("signal", (data) => {
      socket.emit("send-signal", {
        targetID: userID,
        signal: data,
      });
    });

    peer.on("connect", () => {
      setStatus("Peer connection established!");
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

    onFileSend(() => (file) => {
      if (peer && peer.connected) {
        peer.send(file);
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

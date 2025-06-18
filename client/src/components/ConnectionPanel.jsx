import { useState, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000");

let peer;

export default function ConnectionPanel({ onFileSend }) {
  const [roomID, setRoomID] = useState("");
  const [otherUserID, setOtherUserID] = useState(null);

  useEffect(() => {
    socket.on("other-user", (userID) => {
      setOtherUserID(userID);
      initPeer(true, userID); // if you are initiator
    });

    socket.on("receive-signal", ({ signal, senderID }) => {
      if (!peer) {
        initPeer(false, senderID);
      }
      peer.signal(signal);
    });
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
      console.log("Peer connection established!");
    });

    peer.on("data", (data) => {
      // Receive file data
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "received-file";
      a.click();
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
    </div>
  );
}

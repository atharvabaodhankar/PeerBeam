// src/App.jsx
import { useState } from "react";
import Dropzone from "./components/Dropzone";
import ConnectionPanel from "./components/ConnectionPanel";

function App() {
  const [sendFile, setSendFile] = useState(() => () => {});

  return (
    <div style={{ padding: "2rem" }}>
      <h1>PeerBeam 🚀</h1>
      <ConnectionPanel onFileSend={setSendFile} />
      <Dropzone onFileDrop={sendFile} />
    </div>
  );
}

export default App;

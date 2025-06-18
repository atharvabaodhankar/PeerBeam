import { useDropzone } from "react-dropzone";

export default function Dropzone({ onFileDrop }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        onFileDrop(reader.result); // send buffer to peer
      };
      reader.readAsArrayBuffer(file);
    },
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: "2px dashed gray",
        padding: "2rem",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <input {...getInputProps()} />
      <p>Drag & drop a file here, or click to select one</p>
    </div>
  );
}

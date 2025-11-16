import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const Overlay = () => {
  const [text, setText] = useState("");

  useEffect(() => {
    window.overlayAPI.onUpdate((message) => {
      setText(message);
    });
  }, []);

  return (
    <div
      style={{
        padding: "16px",
        color: "white",
        fontSize: "20px",
        backdropFilter: "blur(10px)",
      }}
    >
      {text}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("overlay-root")!).render(
  <Overlay />
);

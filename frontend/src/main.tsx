import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BoardScreen } from "./features/board/screens/BoardScreen";
import "./styles/global.css";
import "./styles/board.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <BoardScreen />
  </StrictMode>,
);

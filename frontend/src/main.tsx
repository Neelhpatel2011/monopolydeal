import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameDeckView from "./components/cards/GameDeckView";
import { BoardScreen } from "./features/board/screens/BoardScreen";
import "./styles/cards.css";
import "./styles/global.css";
import "./styles/board.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    {window.location.pathname.startsWith("/cards") ? <GameDeckView /> : <BoardScreen />}
  </StrictMode>,
);

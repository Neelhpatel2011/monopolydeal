import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GameDeckView from "./components/cards/GameDeckView";
import { BoardScreen } from "./features/board/screens/BoardScreen";
import { HomeScreen } from "./features/home/screens/HomeScreen";
import "./styles/cards.css";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/board.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    {window.location.pathname.startsWith("/cards") ? (
      <GameDeckView />
    ) : window.location.pathname.startsWith("/game") ? (
      <BoardScreen />
    ) : (
      <HomeScreen />
    )}
  </StrictMode>,
);

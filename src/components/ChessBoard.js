import React, { useEffect, useRef, useState } from "react";
import Chessground from "@react-chess/chessground";
import "@react-chess/chessground/dist/styles/chessground.css";
import { Chess } from "chess.js";
import stockfish from "stockfish";

const ChessBoard = () => {
  const boardRef = useRef(null);
  const groundRef = useRef(null);
  const gameRef = useRef(new Chess());
  const stockfishRef = useRef(null);
  const [drawShapes, setDrawShapes] = useState([]);
  const [botType, setBotType] = useState("random"); // Default Bot type

  useEffect(() => {
    groundRef.current = Chessground(boardRef.current, {
      movable: {
        color: "both",
        free: false,
        events: {
          after: onMove,
        },
      },
      drawable: {
        enabled: true,
        shapes: drawShapes,
      },
    });

    // Initialize Stockfish
    stockfishRef.current = stockfish();
    stockfishRef.current.onmessage = (event) => {
      if (event && typeof event === "string" && event.startsWith("bestmove")) {
        const bestMove = event.split(" ")[1];
        gameRef.current.move({
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
        });
        groundRef.current.set({ fen: gameRef.current.fen() });
      }
    };
  }, [drawShapes]);

  const onMove = (orig, dest) => {
    const move = gameRef.current.move({ from: orig, to: dest });
    if (move === null) return;
    groundRef.current.set({ fen: gameRef.current.fen() });

    if (botType === "random") {
      makeRandomMove();
    } else if (botType === "greedy") {
      makeGreedyMove();
    } else if (botType === "stockfish") {
      stockfishRef.current.postMessage(`position fen ${gameRef.current.fen()}`);
      stockfishRef.current.postMessage("go movetime 1000");
    }
  };

  const makeRandomMove = () => {
    const possibleMoves = gameRef.current.moves();
    if (possibleMoves.length === 0) return;
    const move =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    gameRef.current.move(move);
    groundRef.current.set({ fen: gameRef.current.fen() });
  };

  const makeGreedyMove = () => {
    const moves = gameRef.current.moves({ verbose: true });
    let bestMove = null;
    let bestValue = -9999;

    moves.forEach((move) => {
      gameRef.current.move(move.san);
      const boardValue = evaluateBoard(gameRef.current.board());
      gameRef.current.undo();

      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    });

    gameRef.current.move(bestMove.san);
    groundRef.current.set({ fen: gameRef.current.fen() });
  };

  const evaluateBoard = (board) => {
    let totalEvaluation = 0;
    for (let row of board) {
      for (let piece of row) {
        if (piece) {
          totalEvaluation += getPieceValue(piece);
        }
      }
    }
    return totalEvaluation;
  };

  const getPieceValue = (piece) => {
    const values = {
      p: 10,
      r: 50,
      n: 30,
      b: 30,
      q: 90,
      k: 900,
    };
    return (piece.color === "w" ? 1 : -1) * values[piece.type];
  };

  const addArrow = () => {
    setDrawShapes([...drawShapes, { orig: "e2", dest: "e4", brush: "green" }]);
  };

  const addCircle = () => {
    setDrawShapes([...drawShapes, { orig: "d4", brush: "red" }]);
  };

  return (
    <div>
      <div ref={boardRef} style={{ width: "400px", height: "400px" }} />
      <button onClick={addArrow}>Add Arrow</button>
      <button onClick={addCircle}>Add Circle</button>
      <div>
        <label>Select Bot: </label>
        <select onChange={(e) => setBotType(e.target.value)} value={botType}>
          <option value="random">Random Bot</option>
          <option value="greedy">Greedy Bot</option>
          <option value="stockfish">Stockfish Bot</option>
        </select>
      </div>
    </div>
  );
};

export default ChessBoard;

# ♟️ Chess Tactics Grandmaster

<p align="center">
  <strong>Tactical chess puzzle trainer, Minimax AI engine opponent, and pass-and-play board for Gamility.</strong>
</p>

---

## 🌟 Overview

**Chess Tactics Grandmaster** is a standalone, lightweight, zero-dependency HTML5 chess application built with pure Vanilla JavaScript and CSS.

Features include:
- **🧩 Daily Tactical Puzzles**: Master essential mating motifs (Back-Rank Mate, Smothered Mate, Anastasias Mate, Bodens Mate, Knight Forks, Skewers, Pins).
- **🤖 Minimax AI Engine**: Built-in computer opponent with Alpha-Beta pruning, piece-square evaluation tables, and 3 selectable skill levels (Novice, Club, Master).
- **👥 2-Player Pass & Play**: Local offline chess match mode.
- **⚡ Smooth Board Experience**: Drag-and-drop piece manipulation, click-to-move input, legal move indicators, last move highlights, check alarms, and full algebraic notation (SAN).
- **🔊 Web Audio API SFX**: Synthesized move, capture, check, and victory chimes without external media downloads.
- **📱 Responsive & PWA Ready**: Mobile-first touch board, Web Manifest, and standalone navigation.

---

## 🕹️ Controls

- **Drag & Drop**: Drag your piece and drop it onto a highlighted square.
- **Click-to-Move**: Click a piece to display legal moves, then click the destination.
- **Shortcuts**:
  - `H`: Tactical Hint
  - `F`: Flip Board perspective
  - `Ctrl+Z`: Undo Move
  - `N`: Next Puzzle / New Match

---

## 📁 File Structure

```
chess-tactics-grandmaster/
├── index.html          # Main standalone game interface
├── style.css           # Modern slate & cyberpunk luxury styling
├── game.js             # Pure JavaScript chess engine, Minimax AI & puzzles
├── favicon.svg         # Knight emblem vector icon
├── .gitignore          # Git exclusion rules
└── README.md           # Game documentation
```

---

## 📜 Copyright & Terms
Copyright © 2026 [Gamility](https://mahesh-yennam.github.io/Gamility/). All rights reserved.  
Part of the [Gamility Platform](https://mahesh-yennam.github.io/Gamility/).

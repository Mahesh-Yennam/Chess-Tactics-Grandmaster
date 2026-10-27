/**
 * CHESS TACTICS GRANDMASTER — Engine & Interface
 * Complete rule validation, AI Minimax Engine, Tactics Puzzle Trainer, and Web Audio SFX
 */

(function () {
  'use strict';

  // --- Web Audio SFX Synthesizer ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playMove() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playCapture() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playCheck() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      [580, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.07 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.15);
      });
    }

    playVictory() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.25);
      });
    }

    playError() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    }
  }

  const soundMgr = new SoundManager();

  // --- SVG Piece Renderers ---
  const PIECE_SVGS = {
    P: `<svg viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    N: `<svg viewBox="0 0 45 45"><path d="M22 10c-3.5 0-6 2.5-6 6 0 1.5.5 3 1.5 4-3 .5-5 2-6 5s0 7 2 9l2 2s1.5 3 2.5 3.5h14c1-.5 1-2 1-3.5 0-2.5-1-4.5-2.5-6.5 2-2 3-5 3-8 0-4.5-3-9-8-12z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/><circle cx="18" cy="19" r="1.5" fill="#1e293b"/><path d="M26 18c1 2 2 4 1 7" stroke="#1e293b" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    B: `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M22.5 21v10" stroke="#1e293b" stroke-width="1.5"/></svg>`,
    R: `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM14 29.5v-13h17v13H14zM11 14h23v2.5H11V14z"/><path d="M11 9h4v3h-4V9zM17 9h3v3h-3V9zM22 9h3v3h-3V9zM27 9h3v3h-3V9zM32 9h4v3h-4V9z"/></g></svg>`,
    Q: `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 27.5 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    K: `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M22.5 11.63V6M20 8h5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-8 2-8 2s-3-7-8-7-8 7-8 7-4-3-8-2c-3 6 6 10.5 6 10.5v7z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,

    p: `<svg viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    n: `<svg viewBox="0 0 45 45"><path d="M22 10c-3.5 0-6 2.5-6 6 0 1.5.5 3 1.5 4-3 .5-5 2-6 5s0 7 2 9l2 2s1.5 3 2.5 3.5h14c1-.5 1-2 1-3.5 0-2.5-1-4.5-2.5-6.5 2-2 3-5 3-8 0-4.5-3-9-8-12z" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"/><circle cx="18" cy="19" r="1.5" fill="#a5b4fc"/><path d="M26 18c1 2 2 4 1 7" stroke="#a5b4fc" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    b: `<svg viewBox="0 0 45 45"><g fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M22.5 21v10" stroke="#a5b4fc" stroke-width="1.5"/></svg>`,
    r: `<svg viewBox="0 0 45 45"><g fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM14 29.5v-13h17v13H14zM11 14h23v2.5H11V14z"/><path d="M11 9h4v3h-4V9zM17 9h3v3h-3V9zM22 9h3v3h-3V9zM27 9h3v3h-3V9zM32 9h4v3h-4V9z"/></g></svg>`,
    q: `<svg viewBox="0 0 45 45"><g fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 27.5 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    k: `<svg viewBox="0 0 45 45"><g fill="#1e1b4b" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round"><path d="M22.5 11.63V6M20 8h5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-8 2-8 2s-3-7-8-7-8 7-8 7-4-3-8-2c-3 6 6 10.5 6 10.5v7z"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`
  };

  // --- Curated Tactical Puzzles Library ---
  const PUZZLES = [
    {
      id: 1,
      name: "Opera House Mate",
      theme: "Mate in 2",
      rating: 1250,
      turn: 'w',
      fen: "4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1",
      objective: "White to move: Paul Morphy's classic mating combination!",
      hint: "Sacrifice on d7 with the Rook, then finish with the Queen and Bishop.",
      moves: ["Bxd7+", "Nxd7", "Qb8+", "Nxb8", "Rd8#"]
    },
    {
      id: 2,
      name: "Smothered Mate Trap",
      theme: "Smothered Mate",
      rating: 1320,
      turn: 'w',
      fen: "6k1/5ppp/8/8/8/5N2/5PPP/4Q1K1 w - - 0 1",
      setupFen: "6k1/4Nppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
      // Smothered mate mini
      actualFen: "r1b2rk1/pp3ppp/2n5/1B1p4/3N4/4q3/PPP3PP/R2Q1R1K w - - 0 1",
      puzzle: {
        fen: "6k1/5Npp/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
        moves: ["Qe8#"]
      }
    },
    {
      id: 3,
      name: "Back-Rank Tactical Blow",
      theme: "Back-Rank Mate",
      rating: 1180,
      turn: 'w',
      fen: "3r2k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1",
      objective: "White to move and execute back rank victory",
      hint: "Infiltrate with the Queen to the 8th rank.",
      moves: ["Qe8+", "Rxe8", "Rxe8#"]
    },
    {
      id: 4,
      name: "Royal Knight Fork",
      theme: "Knight Fork",
      rating: 1290,
      turn: 'w',
      fen: "r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
      actualFen: "r1b1k2r/pppp1Npp/8/4q3/4n3/8/PPP2PPP/RNBQKB1R w KQkq - 0 1",
      puzzle: {
        fen: "r3k2r/ppp2ppp/2n5/4q3/4N3/8/PPP2PPP/R1BQK2R w KQkq - 0 1",
        moves: ["Qe2"]
      }
    },
    {
      id: 5,
      name: "Anastasia's Mate",
      theme: "King Hunt",
      rating: 1450,
      turn: 'w',
      fen: "5rk1/1p3ppp/8/2N5/8/8/5PPP/R5K1 w - - 0 1",
      puzzle: {
        fen: "1r3rk1/5ppp/8/2N5/8/8/1R3PPP/6K1 w - - 0 1",
        moves: ["Rxb8", "Rxb8"]
      }
    },
    {
      id: 6,
      name: "Greek Gift Follow-Up",
      theme: "Attacking King",
      rating: 1380,
      turn: 'w',
      fen: "r1bq1rk1/pp1n1ppp/2pbpn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 1",
      puzzle: {
        fen: "r1bq1rk1/pp3ppp/2n5/3p4/3N4/4Q3/PPP2PPP/R3KB1R w KQ - 0 1",
        moves: ["Nxc6", "bxc6"]
      }
    },
    {
      id: 7,
      name: "Absolute Pin Exploitation",
      theme: "Pin",
      rating: 1220,
      turn: 'w',
      fen: "r4rk1/ppp2ppp/2n5/3qp3/1b4b1/3P1NP1/PPP2PBP/R1BQR1K1 w - - 0 1",
      puzzle: {
        fen: "r4rk1/ppp2ppp/8/4q3/1b4b1/3P1NP1/PPP2PBP/R1BQR1K1 w - - 0 1",
        moves: ["Rxe5"]
      }
    },
    {
      id: 8,
      name: "Queen & Bishop Battery Mate",
      theme: "Mate in 1",
      rating: 1100,
      turn: 'w',
      fen: "r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
      objective: "Scholar's Tactical Finish: Mate in 1!",
      hint: "Strike directly at the weak f7 pawn with your Queen.",
      moves: ["Qxf7#"]
    },
    {
      id: 9,
      name: "Decoy & Double Attack",
      theme: "Decoy",
      rating: 1340,
      turn: 'w',
      fen: "r1b2rk1/pp3ppp/8/3p4/8/1P1B4/P1P2PPP/R3R1K1 w - - 0 1",
      puzzle: {
        fen: "3r2k1/pp3ppp/8/8/3N4/8/PPP2PPP/4R1K1 w - - 0 1",
        moves: ["Re7"]
      }
    },
    {
      id: 10,
      name: "Skewer on the Diagonal",
      theme: "Skewer",
      rating: 1280,
      turn: 'w',
      fen: "8/8/2k5/8/8/8/1B6/4K2q w - - 0 1",
      puzzle: {
        fen: "8/8/2k5/8/8/1B6/8/4K2q w - - 0 1",
        moves: ["Bd5+", "Kxd5", "Qxh1"]
      }
    },
    {
      id: 11,
      name: "Boden's Criss-Cross Mate",
      theme: "Boden's Mate",
      rating: 1420,
      turn: 'w',
      fen: "2kr1b1r/pp1n1ppp/2p1pn2/8/3P4/2NB1Q1P/PPP2PP1/R3K2R w KQ - 0 1",
      puzzle: {
        fen: "2kr1b1r/pp1n1ppp/2p1pn2/8/8/2NB1Q2/PPP2PPP/R3K2R w KQ - 0 1",
        moves: ["Qxc6+", "bxc6", "Ba6#"]
      }
    },
    {
      id: 12,
      name: "Discovered Check Battery",
      theme: "Discovered Attack",
      rating: 1310,
      turn: 'w',
      fen: "r1b1k2r/pppp1ppp/8/4q3/1b2B3/8/PPP2PPP/RNBQK2R w KQkq - 0 1",
      puzzle: {
        fen: "r1b1k2r/pppp1ppp/8/4q3/4B3/8/PPP2PPP/RNBQK2R w KQkq - 0 1",
        moves: ["Qe2"]
      }
    },
    {
      id: 13,
      name: "Arabian Mate (Rook & Knight)",
      theme: "Arabian Mate",
      rating: 1360,
      turn: 'w',
      fen: "7k/5R2/6N1/8/8/8/8/6K1 w - - 0 1",
      puzzle: {
        fen: "7k/R7/6N1/8/8/8/8/6K1 w - - 0 1",
        moves: ["Rh7#"]
      }
    },
    {
      id: 14,
      name: "Deflection Sacrifice",
      theme: "Deflection",
      rating: 1390,
      turn: 'w',
      fen: "r4rk1/pp1b1ppp/8/2qp4/8/2P5/PPQN1PPP/R3R1K1 w - - 0 1",
      puzzle: {
        fen: "r4rk1/pp1b1ppp/8/2q5/8/2P5/PPQ2PPP/R3R1K1 w - - 0 1",
        moves: ["Re5"]
      }
    },
    {
      id: 15,
      name: "Endgame Pawn Breakthrough",
      theme: "Pawn Endgame",
      rating: 1480,
      turn: 'w',
      fen: "8/8/p1p1p3/P1P1P3/8/5K2/8/4k3 w - - 0 1",
      puzzle: {
        fen: "8/5p2/8/5P2/8/8/8/k6K w - - 0 1",
        moves: ["f6"]
      }
    }
  ];

  // Standard Starting FEN
  const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // --- Chess Engine Core Class ---
  class ChessGame {
    constructor() {
      this.board = Array(64).fill(null);
      this.turn = 'w';
      this.castling = { K: true, Q: true, k: true, q: true };
      this.enPassant = null; // target square index e.g. 16..23 or 40..47
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;
      this.moveHistory = [];
      this.capturedPieces = { w: [], b: [] };
      this.loadFen(STARTING_FEN);
    }

    reset() {
      this.loadFen(STARTING_FEN);
      this.moveHistory = [];
      this.capturedPieces = { w: [], b: [] };
    }

    loadFen(fen) {
      this.board = Array(64).fill(null);
      const parts = fen.trim().split(/\s+/);
      const rows = parts[0].split('/');

      for (let r = 0; r < 8; r++) {
        let c = 0;
        for (let ch of rows[r]) {
          if (/\d/.test(ch)) {
            c += parseInt(ch, 10);
          } else {
            this.board[r * 8 + c] = ch;
            c++;
          }
        }
      }

      this.turn = parts[1] || 'w';

      const castlingStr = parts[2] || '-';
      this.castling = {
        K: castlingStr.includes('K'),
        Q: castlingStr.includes('Q'),
        k: castlingStr.includes('k'),
        q: castlingStr.includes('q')
      };

      if (parts[3] && parts[3] !== '-') {
        this.enPassant = ChessGame.algebraicToSquare(parts[3]);
      } else {
        this.enPassant = null;
      }

      this.halfmoveClock = parseInt(parts[4] || '0', 10);
      this.fullmoveNumber = parseInt(parts[5] || '1', 10);
    }

    static squareToAlgebraic(sq) {
      if (sq < 0 || sq > 63) return '-';
      const file = String.fromCharCode('a'.charCodeAt(0) + (sq % 8));
      const rank = 8 - Math.floor(sq / 8);
      return `${file}${rank}`;
    }

    static algebraicToSquare(alg) {
      if (!alg || alg.length < 2) return -1;
      const file = alg.charCodeAt(0) - 'a'.charCodeAt(0);
      const rank = 8 - parseInt(alg[1], 10);
      return rank * 8 + file;
    }

    isWhite(piece) {
      return piece && piece === piece.toUpperCase();
    }

    isBlack(piece) {
      return piece && piece === piece.toLowerCase();
    }

    isPieceColor(piece, color) {
      if (!piece) return false;
      return color === 'w' ? this.isWhite(piece) : this.isBlack(piece);
    }

    getPieceValue(piece) {
      if (!piece) return 0;
      const vals = { P: 1, N: 3, B: 3.2, R: 5, Q: 9, K: 1000 };
      return vals[piece.toUpperCase()] || 0;
    }

    clone() {
      const cloned = new ChessGame();
      cloned.board = [...this.board];
      cloned.turn = this.turn;
      cloned.castling = { ...this.castling };
      cloned.enPassant = this.enPassant;
      cloned.halfmoveClock = this.halfmoveClock;
      cloned.fullmoveNumber = this.fullmoveNumber;
      cloned.capturedPieces = { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] };
      return cloned;
    }

    findKing(color) {
      const target = color === 'w' ? 'K' : 'k';
      return this.board.indexOf(target);
    }

    isSquareAttacked(targetSq, byColor) {
      // Check knight attacks
      const knightOffsets = [-17, -15, -10, -6, 6, 10, 15, 17];
      const targetR = Math.floor(targetSq / 8);
      const targetC = targetSq % 8;

      for (let off of knightOffsets) {
        const sq = targetSq + off;
        if (sq >= 0 && sq < 64) {
          const r = Math.floor(sq / 8);
          const c = sq % 8;
          if (Math.abs(r - targetR) <= 2 && Math.abs(c - targetC) <= 2) {
            const p = this.board[sq];
            if (p && (byColor === 'w' ? p === 'N' : p === 'n')) return true;
          }
        }
      }

      // Check pawn attacks
      const pawnDir = byColor === 'w' ? 1 : -1; // Pawns attacking from bottom or top
      const pawnCaptures = [-1, 1];
      for (let dc of pawnCaptures) {
        const pR = targetR + pawnDir;
        const pC = targetC + dc;
        if (pR >= 0 && pR < 8 && pC >= 0 && pC < 8) {
          const sq = pR * 8 + pC;
          const p = this.board[sq];
          if (p && (byColor === 'w' ? p === 'P' : p === 'p')) return true;
        }
      }

      // Check ray attacks (Rooks, Queens, Bishops)
      const orthogonal = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const diagonal = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

      // Orthogonal rays (Rook / Queen)
      for (let [dr, dc] of orthogonal) {
        let currR = targetR + dr;
        let currC = targetC + dc;
        while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
          const sq = currR * 8 + currC;
          const p = this.board[sq];
          if (p) {
            if (this.isPieceColor(p, byColor)) {
              const u = p.toUpperCase();
              if (u === 'R' || u === 'Q') return true;
            }
            break; // Ray blocked
          }
          currR += dr;
          currC += dc;
        }
      }

      // Diagonal rays (Bishop / Queen)
      for (let [dr, dc] of diagonal) {
        let currR = targetR + dr;
        let currC = targetC + dc;
        while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
          const sq = currR * 8 + currC;
          const p = this.board[sq];
          if (p) {
            if (this.isPieceColor(p, byColor)) {
              const u = p.toUpperCase();
              if (u === 'B' || u === 'Q') return true;
            }
            break; // Ray blocked
          }
          currR += dr;
          currC += dc;
        }
      }

      // King adjacent attacks
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const kR = targetR + dr;
          const kC = targetC + dc;
          if (kR >= 0 && kR < 8 && kC >= 0 && kC < 8) {
            const sq = kR * 8 + kC;
            const p = this.board[sq];
            if (p && (byColor === 'w' ? p === 'K' : p === 'k')) return true;
          }
        }
      }

      return false;
    }

    inCheck(color = this.turn) {
      const kingSq = this.findKing(color);
      if (kingSq === -1) return false;
      const enemyColor = color === 'w' ? 'b' : 'w';
      return this.isSquareAttacked(kingSq, enemyColor);
    }

    // Pseudo-legal moves generation
    getPseudoLegalMoves(fromSq) {
      const piece = this.board[fromSq];
      if (!piece) return [];
      const isWhite = this.isWhite(piece);
      const enemyColor = isWhite ? 'b' : 'w';
      const r = Math.floor(fromSq / 8);
      const c = fromSq % 8;
      const type = piece.toUpperCase();
      const moves = [];

      // 1. Pawn moves
      if (type === 'P') {
        const forward = isWhite ? -1 : 1;
        const startRank = isWhite ? 6 : 1;
        const promoRank = isWhite ? 0 : 7;

        // 1 step forward
        const nextR = r + forward;
        if (nextR >= 0 && nextR < 8) {
          const forwardSq = nextR * 8 + c;
          if (!this.board[forwardSq]) {
            if (nextR === promoRank) {
              ['Q', 'R', 'B', 'N'].forEach(promo => {
                moves.push({ from: fromSq, to: forwardSq, promo: isWhite ? promo : promo.toLowerCase() });
              });
            } else {
              moves.push({ from: fromSq, to: forwardSq });
            }

            // 2 steps forward from start rank
            if (r === startRank) {
              const doubleSq = (r + forward * 2) * 8 + c;
              if (!this.board[doubleSq]) {
                moves.push({ from: fromSq, to: doubleSq, isDoublePawn: true });
              }
            }
          }
        }

        // Diagonal captures
        for (let dc of [-1, 1]) {
          const capC = c + dc;
          const capR = r + forward;
          if (capC >= 0 && capC < 8 && capR >= 0 && capR < 8) {
            const capSq = capR * 8 + capC;
            const targetP = this.board[capSq];
            if (targetP && this.isPieceColor(targetP, enemyColor)) {
              if (capR === promoRank) {
                ['Q', 'R', 'B', 'N'].forEach(promo => {
                  moves.push({ from: fromSq, to: capSq, promo: isWhite ? promo : promo.toLowerCase(), capture: targetP });
                });
              } else {
                moves.push({ from: fromSq, to: capSq, capture: targetP });
              }
            } else if (this.enPassant === capSq) {
              // En passant capture
              const capturedPawnSq = r * 8 + capC;
              moves.push({ from: fromSq, to: capSq, isEnPassant: true, capture: this.board[capturedPawnSq] });
            }
          }
        }
      }

      // 2. Knight moves
      else if (type === 'N') {
        const knightOffsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (let [dr, dc] of knightOffsets) {
          const nR = r + dr;
          const nC = c + dc;
          if (nR >= 0 && nR < 8 && nC >= 0 && nC < 8) {
            const toSq = nR * 8 + nC;
            const target = this.board[toSq];
            if (!target) {
              moves.push({ from: fromSq, to: toSq });
            } else if (this.isPieceColor(target, enemyColor)) {
              moves.push({ from: fromSq, to: toSq, capture: target });
            }
          }
        }
      }

      // 3. Bishop, Rook, Queen rays
      else if (type === 'B' || type === 'R' || type === 'Q') {
        const directions = [];
        if (type === 'B' || type === 'Q') directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        if (type === 'R' || type === 'Q') directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);

        for (let [dr, dc] of directions) {
          let nR = r + dr;
          let nC = c + dc;
          while (nR >= 0 && nR < 8 && nC >= 0 && nC < 8) {
            const toSq = nR * 8 + nC;
            const target = this.board[toSq];
            if (!target) {
              moves.push({ from: fromSq, to: toSq });
            } else {
              if (this.isPieceColor(target, enemyColor)) {
                moves.push({ from: fromSq, to: toSq, capture: target });
              }
              break;
            }
            nR += dr;
            nC += dc;
          }
        }
      }

      // 4. King moves & Castling
      else if (type === 'K') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nR = r + dr;
            const nC = c + dc;
            if (nR >= 0 && nR < 8 && nC >= 0 && nC < 8) {
              const toSq = nR * 8 + nC;
              const target = this.board[toSq];
              if (!target) {
                moves.push({ from: fromSq, to: toSq });
              } else if (this.isPieceColor(target, enemyColor)) {
                moves.push({ from: fromSq, to: toSq, capture: target });
              }
            }
          }
        }

        // Castling checks (cannot castle out of, through, or into check)
        if (!this.inCheck(isWhite ? 'w' : 'b')) {
          if (isWhite && r === 7 && c === 4) {
            // White Kingside: e1 -> g1
            if (this.castling.K && !this.board[61] && !this.board[62]) {
              if (!this.isSquareAttacked(61, 'b') && !this.isSquareAttacked(62, 'b')) {
                moves.push({ from: 60, to: 62, isCastle: 'K' });
              }
            }
            // White Queenside: e1 -> c1
            if (this.castling.Q && !this.board[59] && !this.board[58] && !this.board[57]) {
              if (!this.isSquareAttacked(59, 'b') && !this.isSquareAttacked(58, 'b')) {
                moves.push({ from: 60, to: 58, isCastle: 'Q' });
              }
            }
          } else if (!isWhite && r === 0 && c === 4) {
            // Black Kingside: e8 -> g8
            if (this.castling.k && !this.board[5] && !this.board[6]) {
              if (!this.isSquareAttacked(5, 'w') && !this.isSquareAttacked(6, 'w')) {
                moves.push({ from: 4, to: 6, isCastle: 'k' });
              }
            }
            // Black Queenside: e8 -> c8
            if (this.castling.q && !this.board[3] && !this.board[2] && !this.board[1]) {
              if (!this.isSquareAttacked(3, 'w') && !this.isSquareAttacked(2, 'w')) {
                moves.push({ from: 4, to: 2, isCastle: 'q' });
              }
            }
          }
        }
      }

      return moves;
    }

    // Filter pseudo-legal moves into strictly legal moves
    getLegalMoves(fromSq) {
      const piece = this.board[fromSq];
      if (!piece || !this.isPieceColor(piece, this.turn)) return [];
      const pseudo = this.getPseudoLegalMoves(fromSq);
      const legal = [];

      for (let m of pseudo) {
        const testBoard = this.clone();
        testBoard.makeMoveInternal(m);
        if (!testBoard.inCheck(this.turn)) {
          legal.push(m);
        }
      }
      return legal;
    }

    getAllLegalMoves(color = this.turn) {
      const allMoves = [];
      const origTurn = this.turn;
      this.turn = color;

      for (let sq = 0; sq < 64; sq++) {
        const p = this.board[sq];
        if (p && this.isPieceColor(p, color)) {
          const moves = this.getLegalMoves(sq);
          allMoves.push(...moves);
        }
      }

      this.turn = origTurn;
      return allMoves;
    }

    makeMoveInternal(move) {
      const { from, to, promo, isCastle, isEnPassant } = move;
      let piece = this.board[from];

      // Handle captured piece tracking
      if (isEnPassant) {
        const capSq = Math.floor(from / 8) * 8 + (to % 8);
        const capturedPawn = this.board[capSq];
        if (capturedPawn) {
          const capColor = this.isWhite(capturedPawn) ? 'w' : 'b';
          this.capturedPieces[capColor].push(capturedPawn);
          this.board[capSq] = null;
        }
      } else if (this.board[to]) {
        const capP = this.board[to];
        const capColor = this.isWhite(capP) ? 'w' : 'b';
        this.capturedPieces[capColor].push(capP);
      }

      // Handle Castling Rook movements
      if (isCastle === 'K') {
        this.board[61] = this.board[63]; // Move rook to f1
        this.board[63] = null;
      } else if (isCastle === 'Q') {
        this.board[59] = this.board[56]; // Move rook to d1
        this.board[56] = null;
      } else if (isCastle === 'k') {
        this.board[5] = this.board[7]; // Move rook to f8
        this.board[7] = null;
      } else if (isCastle === 'q') {
        this.board[3] = this.board[0]; // Move rook to d8
        this.board[0] = null;
      }

      // Move piece
      this.board[from] = null;
      this.board[to] = promo ? promo : piece;

      // Update En Passant availability
      if (move.isDoublePawn) {
        const direction = this.isWhite(piece) ? -1 : 1;
        this.enPassant = from + direction * 8;
      } else {
        this.enPassant = null;
      }

      // Update Castling Rights
      if (piece === 'K') { this.castling.K = false; this.castling.Q = false; }
      if (piece === 'k') { this.castling.k = false; this.castling.q = false; }
      if (from === 63 || to === 63) this.castling.K = false;
      if (from === 56 || to === 56) this.castling.Q = false;
      if (from === 7 || to === 7) this.castling.k = false;
      if (from === 0 || to === 0) this.castling.q = false;

      // Switch turn
      this.turn = this.turn === 'w' ? 'b' : 'w';
    }

    makeMove(move) {
      const movedPiece = this.board[move.from];
      const san = this.formatSAN(move, movedPiece);
      this.makeMoveInternal(move);
      this.moveHistory.push({ ...move, san, piece: movedPiece });
      return san;
    }

    formatSAN(move, piece) {
      if (move.isCastle === 'K' || move.isCastle === 'k') return 'O-O';
      if (move.isCastle === 'Q' || move.isCastle === 'q') return 'O-O-O';

      const type = piece.toUpperCase();
      const targetAlg = ChessGame.squareToAlgebraic(move.to);
      const isCapture = !!this.board[move.to] || move.isEnPassant;

      let san = '';
      if (type === 'P') {
        if (isCapture) {
          const fromFile = String.fromCharCode('a'.charCodeAt(0) + (move.from % 8));
          san = `${fromFile}x${targetAlg}`;
        } else {
          san = targetAlg;
        }
        if (move.promo) {
          san += `=${move.promo.toUpperCase()}`;
        }
      } else {
        san = `${type}${isCapture ? 'x' : ''}${targetAlg}`;
      }

      // Check test
      const testBoard = this.clone();
      testBoard.makeMoveInternal(move);
      const enemy = testBoard.turn;
      if (testBoard.inCheck(enemy)) {
        if (testBoard.isCheckmate()) {
          san += '#';
        } else {
          san += '+';
        }
      }

      return san;
    }

    isCheckmate() {
      if (!this.inCheck(this.turn)) return false;
      const legal = this.getAllLegalMoves(this.turn);
      return legal.length === 0;
    }

    isStalemate() {
      if (this.inCheck(this.turn)) return false;
      const legal = this.getAllLegalMoves(this.turn);
      return legal.length === 0;
    }

    getMaterialBalance() {
      let whiteScore = 0;
      let blackScore = 0;
      for (let p of this.board) {
        if (!p) continue;
        const val = this.getPieceValue(p);
        if (this.isWhite(p)) whiteScore += val;
        else blackScore += val;
      }
      return whiteScore - blackScore;
    }
  }

  // --- AI Minimax Engine with Positional PST Tables ---
  const PST_PAWN = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ];

  const PST_KNIGHT = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ];

  function evaluateBoard(game) {
    if (game.isCheckmate()) {
      return game.turn === 'w' ? -99999 : 99999;
    }
    if (game.isStalemate()) return 0;

    let score = 0;
    for (let sq = 0; sq < 64; sq++) {
      const p = game.board[sq];
      if (!p) continue;
      const u = p.toUpperCase();
      const isW = game.isWhite(p);
      const pieceVal = game.getPieceValue(p) * 100;
      let posVal = 0;

      const idx = isW ? sq : (7 - Math.floor(sq / 8)) * 8 + (sq % 8);
      if (u === 'P') posVal = PST_PAWN[idx];
      else if (u === 'N') posVal = PST_KNIGHT[idx];

      if (isW) {
        score += pieceVal + posVal;
      } else {
        score -= pieceVal + posVal;
      }
    }
    return score;
  }

  function minimax(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.isCheckmate() || game.isStalemate()) {
      return { score: evaluateBoard(game) };
    }

    const moves = game.getAllLegalMoves(game.turn);
    if (moves.length === 0) return { score: evaluateBoard(game) };

    let bestMove = moves[0];

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let m of moves) {
        const clone = game.clone();
        clone.makeMoveInternal(m);
        const evalScore = minimax(clone, depth - 1, alpha, beta, false).score;
        if (evalScore > maxEval) {
          maxEval = evalScore;
          bestMove = m;
        }
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cut-off
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (let m of moves) {
        const clone = game.clone();
        clone.makeMoveInternal(m);
        const evalScore = minimax(clone, depth - 1, alpha, beta, true).score;
        if (evalScore < minEval) {
          minEval = evalScore;
          bestMove = m;
        }
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cut-off
      }
      return { score: minEval, move: bestMove };
    }
  }

  // --- UI Controller & Game Loop ---
  class ChessApp {
    constructor() {
      this.game = new ChessGame();
      this.mode = 'tactics'; // 'tactics' | 'ai' | 'pass'
      this.flipped = false;
      this.selectedSq = null;
      this.legalMovesForSelected = [];
      this.lastMove = null;
      this.aiDifficulty = 'Club'; // 'Novice' (depth 1), 'Club' (depth 2), 'Master' (depth 3)
      this.isThinkingAI = false;

      // Tactics State
      this.puzzleIndex = 0;
      this.puzzleMoveStep = 0;
      this.currentPuzzle = null;
      this.tacticsRating = parseInt(localStorage.getItem('chess_tactics_rating') || '1200', 10);
      this.solvedCount = parseInt(localStorage.getItem('chess_tactics_solved') || '0', 10);
      this.streakCount = parseInt(localStorage.getItem('chess_tactics_streak') || '0', 10);

      // Pending Promotion
      this.pendingPromoMove = null;

      this.cacheDOMElements();
      this.initEvents();
      this.loadTacticsPuzzle(this.puzzleIndex);
    }

    cacheDOMElements() {
      this.boardEl = document.getElementById('chessboard');
      this.ratingValEl = document.getElementById('ratingVal');
      this.streakValEl = document.getElementById('streakVal');
      this.solvedValEl = document.getElementById('solvedVal');
      this.turnValEl = document.getElementById('turnVal');
      this.modeSubtitleEl = document.getElementById('modeSubtitle');

      this.modeTacticsBtn = document.getElementById('modeTacticsBtn');
      this.modeAiBtn = document.getElementById('modeAiBtn');
      this.modePassBtn = document.getElementById('modePassBtn');

      this.newGameBtn = document.getElementById('newGameBtn');
      this.newGameBtnText = document.getElementById('newGameBtnText');
      this.hintBtn = document.getElementById('hintBtn');
      this.undoBtn = document.getElementById('undoBtn');
      this.flipBoardBtn = document.getElementById('flipBoardBtn');
      this.difficultyBtn = document.getElementById('difficultyBtn');
      this.diffLabel = document.getElementById('diffLabel');
      this.muteBtn = document.getElementById('muteBtn');
      this.rulesBtn = document.getElementById('rulesBtn');

      this.topCapturedBox = document.getElementById('topCapturedBox');
      this.bottomCapturedBox = document.getElementById('bottomCapturedBox');
      this.topMaterialLead = document.getElementById('topMaterialLead');
      this.bottomMaterialLead = document.getElementById('bottomMaterialLead');
      this.topPlayerName = document.getElementById('topPlayerName');
      this.topPlayerTag = document.getElementById('topPlayerTag');
      this.bottomPlayerName = document.getElementById('bottomPlayerName');
      this.bottomPlayerTag = document.getElementById('bottomPlayerTag');

      this.tacticsCategory = document.getElementById('tacticsCategory');
      this.tacticsDifficulty = document.getElementById('tacticsDifficulty');
      this.tacticsObjective = document.getElementById('tacticsObjective');
      this.tacticsInstruction = document.getElementById('tacticsInstruction');
      this.gameAlertBox = document.getElementById('gameAlertBox');
      this.alertIcon = document.getElementById('alertIcon');
      this.alertMessage = document.getElementById('alertMessage');

      this.moveHistoryList = document.getElementById('moveHistoryList');
      this.moveCountBadge = document.getElementById('moveCountBadge');
      this.puzzleNavBox = document.getElementById('puzzleNavBox');
      this.puzzleIndexIndicator = document.getElementById('puzzleIndexIndicator');
      this.prevPuzzleBtn = document.getElementById('prevPuzzleBtn');
      this.nextPuzzleBtn = document.getElementById('nextPuzzleBtn');

      // Modals
      this.promotionModal = document.getElementById('promotionModal');
      this.promotionChoices = document.getElementById('promotionChoices');
      this.gameOverModal = document.getElementById('gameOverModal');
      this.modalResultTitle = document.getElementById('modalResultTitle');
      this.modalResultDesc = document.getElementById('modalResultDesc');
      this.modalResultIcon = document.getElementById('modalResultIcon');
      this.modalRatingDelta = document.getElementById('modalRatingDelta');
      this.modalStreakCount = document.getElementById('modalStreakCount');
      this.modalAccuracy = document.getElementById('modalAccuracy');
      this.modalActionBtn = document.getElementById('modalActionBtn');
      this.modalReviewBtn = document.getElementById('modalReviewBtn');

      this.rulesModal = document.getElementById('rulesModal');
      this.rulesCloseBtn = document.getElementById('rulesCloseBtn');
    }

    initEvents() {
      // Mode switches
      this.modeTacticsBtn.addEventListener('click', () => this.switchMode('tactics'));
      this.modeAiBtn.addEventListener('click', () => this.switchMode('ai'));
      this.modePassBtn.addEventListener('click', () => this.switchMode('pass'));

      // Toolbar buttons
      this.newGameBtn.addEventListener('click', () => {
        if (this.mode === 'tactics') {
          this.nextPuzzle();
        } else {
          this.resetMatch();
        }
      });

      this.hintBtn.addEventListener('click', () => this.showHint());
      this.undoBtn.addEventListener('click', () => this.undoMove());
      this.flipBoardBtn.addEventListener('click', () => {
        this.flipped = !this.flipped;
        this.renderBoard();
      });

      this.difficultyBtn.addEventListener('click', () => this.cycleDifficulty());

      this.muteBtn.addEventListener('click', () => {
        soundMgr.muted = !soundMgr.muted;
        this.muteBtn.querySelector('#soundIcon').textContent = soundMgr.muted ? '🔇' : '🔊';
      });

      this.rulesBtn.addEventListener('click', () => this.rulesModal.classList.add('open'));
      this.rulesCloseBtn.addEventListener('click', () => this.rulesModal.classList.remove('open'));
      this.rulesModal.addEventListener('click', (e) => {
        if (e.target === this.rulesModal) this.rulesModal.classList.remove('open');
      });

      // Puzzle navigation
      this.prevPuzzleBtn.addEventListener('click', () => this.prevPuzzle());
      this.nextPuzzleBtn.addEventListener('click', () => this.nextPuzzle());

      // Modal action
      this.modalActionBtn.addEventListener('click', () => {
        this.gameOverModal.classList.remove('open');
        if (this.mode === 'tactics') {
          this.nextPuzzle();
        } else {
          this.resetMatch();
        }
      });
      this.modalReviewBtn.addEventListener('click', () => {
        this.gameOverModal.classList.remove('open');
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.key === 'h' || e.key === 'H') this.showHint();
        if (e.key === 'f' || e.key === 'F') {
          this.flipped = !this.flipped;
          this.renderBoard();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          this.undoMove();
        }
      });
    }

    switchMode(newMode) {
      this.mode = newMode;
      [this.modeTacticsBtn, this.modeAiBtn, this.modePassBtn].forEach(b => b.classList.remove('active'));

      if (newMode === 'tactics') {
        this.modeTacticsBtn.classList.add('active');
        this.modeSubtitleEl.textContent = "Tactics Puzzles • Tactical Trainer";
        this.newGameBtnText.textContent = "Next Puzzle";
        this.puzzleNavBox.style.display = 'flex';
        this.topPlayerName.textContent = "Tactics Trainer";
        this.topPlayerTag.textContent = "Puzzle Engine";
        this.bottomPlayerName.textContent = "You (Grandmaster)";
        this.loadTacticsPuzzle(this.puzzleIndex);
      } else if (newMode === 'ai') {
        this.modeAiBtn.classList.add('active');
        this.modeSubtitleEl.textContent = `Play vs AI Engine • ${this.aiDifficulty} Level`;
        this.newGameBtnText.textContent = "New Match";
        this.puzzleNavBox.style.display = 'none';
        this.topPlayerName.textContent = `AI Bot (${this.aiDifficulty})`;
        this.topPlayerTag.textContent = "Minimax Engine";
        this.bottomPlayerName.textContent = "You (White)";
        this.resetMatch();
      } else {
        this.modePassBtn.classList.add('active');
        this.modeSubtitleEl.textContent = "2-Player Local Pass & Play";
        this.newGameBtnText.textContent = "New Game";
        this.puzzleNavBox.style.display = 'none';
        this.topPlayerName.textContent = "Player 2 (Black)";
        this.topPlayerTag.textContent = "Local Opponent";
        this.bottomPlayerName.textContent = "Player 1 (White)";
        this.resetMatch();
      }
    }

    cycleDifficulty() {
      const diffs = ['Novice', 'Club', 'Master'];
      const nextIdx = (diffs.indexOf(this.aiDifficulty) + 1) % diffs.length;
      this.aiDifficulty = diffs[nextIdx];
      this.diffLabel.textContent = `AI: ${this.aiDifficulty}`;
      if (this.mode === 'ai') {
        this.topPlayerName.textContent = `AI Bot (${this.aiDifficulty})`;
        this.modeSubtitleEl.textContent = `Play vs AI Engine • ${this.aiDifficulty} Level`;
      }
    }

    resetMatch() {
      this.game.reset();
      this.selectedSq = null;
      this.legalMovesForSelected = [];
      this.lastMove = null;
      this.isThinkingAI = false;
      this.tacticsCategory.textContent = this.mode === 'ai' ? "AI Duel" : "Friendly Match";
      this.tacticsDifficulty.textContent = this.mode === 'ai' ? `Engine: ${this.aiDifficulty}` : "Standard Board";
      this.tacticsObjective.textContent = "Classic Chess Match";
      this.tacticsInstruction.textContent = "Play standard chess rules: Checkmate the opponent King to win.";
      this.setAlert("Your turn! Make the opening move.", "info");
      this.renderBoard();
      this.updateHUD();
    }

    loadTacticsPuzzle(idx) {
      if (idx < 0) idx = PUZZLES.length - 1;
      if (idx >= PUZZLES.length) idx = 0;
      this.puzzleIndex = idx;
      this.puzzleMoveStep = 0;

      const p = PUZZLES[idx];
      this.currentPuzzle = p;
      this.game = new ChessGame();
      this.game.loadFen(p.fen);

      this.flipped = (p.turn === 'b');
      this.selectedSq = null;
      this.legalMovesForSelected = [];
      this.lastMove = null;

      this.tacticsCategory.textContent = p.theme;
      this.tacticsDifficulty.textContent = `Rating: ${p.rating}`;
      this.tacticsObjective.textContent = p.objective || `${p.turn === 'w' ? 'White' : 'Black'} to move and win!`;
      this.tacticsInstruction.textContent = p.hint ? `Tip: ${p.hint}` : "Execute the winning tactic.";
      this.puzzleIndexIndicator.textContent = `Puzzle ${idx + 1} / ${PUZZLES.length}`;

      this.setAlert(`${p.turn === 'w' ? 'White' : 'Black'} to move! Find the best tactical continuation.`, "info");
      this.renderBoard();
      this.updateHUD();
    }

    prevPuzzle() {
      this.loadTacticsPuzzle(this.puzzleIndex - 1);
    }

    nextPuzzle() {
      this.loadTacticsPuzzle(this.puzzleIndex + 1);
    }

    // --- Chessboard Rendering ---
    renderBoard() {
      this.boardEl.innerHTML = '';
      const inCheckSq = this.game.inCheck() ? this.game.findKing(this.game.turn) : -1;

      for (let displayRow = 0; displayRow < 8; displayRow++) {
        for (let displayCol = 0; displayCol < 8; displayCol++) {
          const r = this.flipped ? 7 - displayRow : displayRow;
          const c = this.flipped ? 7 - displayCol : displayCol;
          const sq = r * 8 + c;
          const piece = this.game.board[sq];

          const sqEl = document.createElement('div');
          sqEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
          sqEl.dataset.sq = sq;

          // Add Rank coordinate on file 'a'
          if (c === (this.flipped ? 7 : 0)) {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'coord-rank';
            rankLabel.textContent = 8 - r;
            sqEl.appendChild(rankLabel);
          }

          // Add File coordinate on rank 1
          if (r === (this.flipped ? 0 : 7)) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'coord-file';
            fileLabel.textContent = String.fromCharCode('a'.charCodeAt(0) + c);
            sqEl.appendChild(fileLabel);
          }

          // Highlight selections
          if (this.selectedSq === sq) {
            sqEl.classList.add('selected');
          }
          if (this.lastMove && (this.lastMove.from === sq || this.lastMove.to === sq)) {
            sqEl.classList.add('last-move');
          }
          if (inCheckSq === sq) {
            sqEl.classList.add('in-check');
          }

          // Piece rendering
          if (piece) {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'chess-piece';
            pieceEl.innerHTML = PIECE_SVGS[piece] || '';
            pieceEl.draggable = true;

            pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(e, sq));
            sqEl.appendChild(pieceEl);
          }

          // Legal Move Indicators
          const legalMove = this.legalMovesForSelected.find(m => m.to === sq);
          if (legalMove) {
            if (piece) {
              const ring = document.createElement('div');
              ring.className = 'move-capture-indicator';
              sqEl.appendChild(ring);
            } else {
              const dot = document.createElement('div');
              dot.className = 'move-dest-indicator';
              sqEl.appendChild(dot);
            }
          }

          // Square Events: Click & Drag/Drop
          sqEl.addEventListener('click', () => this.handleSquareClick(sq));
          sqEl.addEventListener('dragover', (e) => e.preventDefault());
          sqEl.addEventListener('drop', (e) => this.handleDrop(e, sq));

          this.boardEl.appendChild(sqEl);
        }
      }
    }

    handleDragStart(e, sq) {
      if (this.isThinkingAI) {
        e.preventDefault();
        return;
      }
      const piece = this.game.board[sq];
      if (!piece || !this.game.isPieceColor(piece, this.game.turn)) {
        e.preventDefault();
        return;
      }
      this.selectedSq = sq;
      this.legalMovesForSelected = this.game.getLegalMoves(sq);
      e.dataTransfer.setData('text/plain', sq);
      this.renderBoard();
    }

    handleDrop(e, targetSq) {
      e.preventDefault();
      if (this.selectedSq === null) return;
      this.attemptMove(this.selectedSq, targetSq);
    }

    handleSquareClick(sq) {
      if (this.isThinkingAI) return;

      const piece = this.game.board[sq];

      // If a piece was already selected and clicked target is legal move
      if (this.selectedSq !== null) {
        const move = this.legalMovesForSelected.find(m => m.to === sq);
        if (move) {
          this.attemptMove(this.selectedSq, sq);
          return;
        }
      }

      // Select piece
      if (piece && this.game.isPieceColor(piece, this.game.turn)) {
        this.selectedSq = sq;
        this.legalMovesForSelected = this.game.getLegalMoves(sq);
        this.renderBoard();
      } else {
        this.selectedSq = null;
        this.legalMovesForSelected = [];
        this.renderBoard();
      }
    }

    attemptMove(fromSq, toSq) {
      const legalMoves = this.game.getLegalMoves(fromSq);
      const moveCandidates = legalMoves.filter(m => m.to === toSq);

      if (moveCandidates.length === 0) {
        soundMgr.playError();
        this.selectedSq = null;
        this.legalMovesForSelected = [];
        this.renderBoard();
        return;
      }

      // Check if Pawn Promotion
      const promoMove = moveCandidates.find(m => m.promo);
      if (promoMove) {
        this.showPromotionModal(fromSq, toSq);
        return;
      }

      this.executeUserMove(moveCandidates[0]);
    }

    showPromotionModal(fromSq, toSq) {
      const isWhite = this.game.turn === 'w';
      this.pendingPromoMove = { from: fromSq, to: toSq };
      this.promotionChoices.innerHTML = '';

      const pieces = ['Q', 'R', 'B', 'N'];
      pieces.forEach(type => {
        const pieceCode = isWhite ? type : type.toLowerCase();
        const btn = document.createElement('button');
        btn.className = 'promotion-btn';
        btn.innerHTML = `
          <div style="width: 44px; height: 44px;">${PIECE_SVGS[pieceCode]}</div>
          <span>${type}</span>
        `;
        btn.addEventListener('click', () => {
          this.promotionModal.classList.remove('open');
          const finalMove = { from: fromSq, to: toSq, promo: pieceCode };
          this.executeUserMove(finalMove);
        });
        this.promotionChoices.appendChild(btn);
      });

      this.promotionModal.classList.add('open');
    }

    executeUserMove(move) {
      const wasCapture = !!this.game.board[move.to] || move.isEnPassant;
      const san = this.game.makeMove(move);
      this.lastMove = move;
      this.selectedSq = null;
      this.legalMovesForSelected = [];

      // Audio trigger
      if (this.game.inCheck()) {
        soundMgr.playCheck();
      } else if (wasCapture) {
        soundMgr.playCapture();
      } else {
        soundMgr.playMove();
      }

      this.renderBoard();
      this.updateHUD();

      // Check Tactics Progression
      if (this.mode === 'tactics') {
        this.handleTacticsMove(san);
        return;
      }

      // Check Match Finish
      if (this.checkGameEnd()) return;

      // AI Bot Turn Trigger
      if (this.mode === 'ai' && this.game.turn === 'b') {
        this.triggerAiTurn();
      }
    }

    handleTacticsMove(san) {
      const p = this.currentPuzzle;
      if (!p || !p.moves) {
        this.setAlert("Great tactical move!", "success");
        return;
      }

      const expectedMove = p.moves[this.puzzleMoveStep];

      // Compare SAN (strip trailing check markers + or # for loose matching if needed)
      const cleanSan = san.replace(/[+#]/g, '');
      const cleanExpected = expectedMove ? expectedMove.replace(/[+#]/g, '') : '';

      if (cleanSan === cleanExpected) {
        this.puzzleMoveStep++;

        if (this.puzzleMoveStep >= p.moves.length) {
          // Solved!
          soundMgr.playVictory();
          this.streakCount++;
          this.solvedCount++;
          this.tacticsRating += 15;
          localStorage.setItem('chess_tactics_streak', this.streakCount);
          localStorage.setItem('chess_tactics_solved', this.solvedCount);
          localStorage.setItem('chess_tactics_rating', this.tacticsRating);
          this.updateHUD();

          this.showVictoryModal("Puzzle Solved!", "Masterpiece! You found the full tactical combination.", "+15");
        } else {
          // Opponent replies with script move
          const opponentMoveSan = p.moves[this.puzzleMoveStep];
          this.puzzleMoveStep++;
          this.setAlert("Correct! Opponent responds...", "success");

          setTimeout(() => {
            this.playSanMove(opponentMoveSan);
            this.setAlert("Now deliver the final tactical blow!", "info");
          }, 450);
        }
      } else {
        soundMgr.playError();
        this.streakCount = 0;
        localStorage.setItem('chess_tactics_streak', 0);
        this.updateHUD();
        this.setAlert(`"${san}" is not the best move. Try a sharper tactic!`, "error");
      }
    }

    playSanMove(targetSan) {
      const legal = this.game.getAllLegalMoves(this.game.turn);
      const cleanTarget = targetSan.replace(/[+#]/g, '');

      for (let m of legal) {
        const testGame = this.game.clone();
        const san = testGame.makeMove(m);
        if (san.replace(/[+#]/g, '') === cleanTarget) {
          this.game.makeMove(m);
          this.lastMove = m;
          soundMgr.playMove();
          this.renderBoard();
          this.updateHUD();
          return;
        }
      }
    }

    triggerAiTurn() {
      this.isThinkingAI = true;
      this.setAlert("AI is calculating permutations...", "info");

      const depthMap = { Novice: 1, Club: 2, Master: 3 };
      const depth = depthMap[this.aiDifficulty] || 2;

      setTimeout(() => {
        const result = minimax(this.game, depth, -Infinity, Infinity, false);
        this.isThinkingAI = false;

        if (result && result.move) {
          const wasCap = !!this.game.board[result.move.to] || result.move.isEnPassant;
          this.game.makeMove(result.move);
          this.lastMove = result.move;

          if (this.game.inCheck()) {
            soundMgr.playCheck();
          } else if (wasCap) {
            soundMgr.playCapture();
          } else {
            soundMgr.playMove();
          }

          this.renderBoard();
          this.updateHUD();
          this.checkGameEnd();
        }
      }, 350);
    }

    checkGameEnd() {
      if (this.game.isCheckmate()) {
        soundMgr.playVictory();
        const winner = this.game.turn === 'w' ? 'Black' : 'White';
        this.setAlert(`Checkmate! ${winner} wins the match.`, "success");
        this.showVictoryModal(`Checkmate!`, `${winner} achieves checkmate victory!`, "+25");
        return true;
      }
      if (this.game.isStalemate()) {
        this.setAlert("Game drawn by Stalemate!", "info");
        this.showVictoryModal("Draw by Stalemate", "Neither player can make a legal move.", "0");
        return true;
      }
      return false;
    }

    showVictoryModal(title, desc, delta) {
      this.modalResultTitle.textContent = title;
      this.modalResultDesc.textContent = desc;
      this.modalRatingDelta.textContent = delta;
      this.modalStreakCount.textContent = `${this.streakCount} 🔥`;
      this.modalAccuracy.textContent = "100%";
      this.gameOverModal.classList.add('open');
    }

    showHint() {
      if (this.mode === 'tactics') {
        const p = this.currentPuzzle;
        if (p && p.moves && p.moves[this.puzzleMoveStep]) {
          const expectedSan = p.moves[this.puzzleMoveStep];
          this.setAlert(`💡 Tactical Hint: Look for move ${expectedSan[0]}...`, "info");
        }
      } else {
        const legal = this.game.getAllLegalMoves(this.game.turn);
        if (legal.length > 0) {
          const best = minimax(this.game, 2, -Infinity, Infinity, this.game.turn === 'w').move || legal[0];
          const alg = ChessGame.squareToAlgebraic(best.from);
          this.setAlert(`💡 Hint: Consider moving the piece on ${alg}.`, "info");
        }
      }
    }

    undoMove() {
      if (this.game.moveHistory.length === 0) return;
      if (this.mode === 'ai' && this.game.moveHistory.length >= 2) {
        this.game.moveHistory.pop();
        this.game.moveHistory.pop();
      } else {
        this.game.moveHistory.pop();
      }
      // Replay from start
      const history = [...this.game.moveHistory];
      this.game.reset();
      for (let h of history) {
        this.game.makeMove(h);
      }
      this.lastMove = history.length > 0 ? history[history.length - 1] : null;
      this.selectedSq = null;
      this.legalMovesForSelected = [];
      this.renderBoard();
      this.updateHUD();
      this.setAlert("Took back last move.", "info");
    }

    updateHUD() {
      this.ratingValEl.textContent = this.tacticsRating;
      this.streakValEl.textContent = `${this.streakCount} 🔥`;
      this.solvedValEl.textContent = `${this.solvedCount} / ${PUZZLES.length}`;
      this.turnValEl.textContent = this.game.turn === 'w' ? 'White' : 'Black';

      // Captured pieces tray
      this.topCapturedBox.innerHTML = '';
      this.bottomCapturedBox.innerHTML = '';

      const whiteCaps = this.game.capturedPieces.w;
      const blackCaps = this.game.capturedPieces.b;

      whiteCaps.forEach(p => {
        const el = document.createElement('span');
        el.className = 'captured-piece-mini';
        el.innerHTML = PIECE_SVGS[p] || '';
        this.topCapturedBox.appendChild(el);
      });

      blackCaps.forEach(p => {
        const el = document.createElement('span');
        el.className = 'captured-piece-mini';
        el.innerHTML = PIECE_SVGS[p] || '';
        this.bottomCapturedBox.appendChild(el);
      });

      // Material balance
      const balance = this.game.getMaterialBalance();
      if (balance > 0) {
        this.bottomMaterialLead.textContent = `+${balance}`;
        this.topMaterialLead.textContent = '';
      } else if (balance < 0) {
        this.topMaterialLead.textContent = `+${Math.abs(balance)}`;
        this.bottomMaterialLead.textContent = '';
      } else {
        this.topMaterialLead.textContent = '';
        this.bottomMaterialLead.textContent = '';
      }

      // Notation table
      this.renderMoveHistory();
    }

    renderMoveHistory() {
      const history = this.game.moveHistory;
      this.moveCountBadge.textContent = `${history.length} moves`;

      if (history.length === 0) {
        this.moveHistoryList.innerHTML = `<div class="empty-history-note">No moves played yet. Start by moving your piece!</div>`;
        return;
      }

      this.moveHistoryList.innerHTML = '';
      for (let i = 0; i < history.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = history[i];
        const blackMove = history[i + 1];

        const row = document.createElement('div');
        row.className = 'move-pair-row';
        row.innerHTML = `
          <span class="move-num">${moveNum}.</span>
          <span class="move-san ${i === history.length - 1 ? 'active-step' : ''}">${whiteMove ? whiteMove.san : ''}</span>
          <span class="move-san ${i + 1 === history.length - 1 ? 'active-step' : ''}">${blackMove ? blackMove.san : ''}</span>
        `;
        this.moveHistoryList.appendChild(row);
      }
      this.moveHistoryList.scrollTop = this.moveHistoryList.scrollHeight;
    }

    setAlert(msg, type = "info") {
      this.alertMessage.textContent = msg;
      this.gameAlertBox.className = `alert-box ${type}`;
      this.alertIcon.textContent = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : '🎯');
    }
  }

  // --- Bootstrap on Load ---
  document.addEventListener('DOMContentLoaded', () => {
    new ChessApp();
  });
})();

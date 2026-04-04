import { query } from '../config/db';
import { Server } from 'socket.io';

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: number;
}

interface TriviaState {
  gameId: string;
  player1: number;
  player1Name: string;
  player2: number;
  player2Name: string;
  score1: number;
  score2: number;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  p1Answered: boolean;
  p2Answered: boolean;
  roundWinner: number | null; // ID of who scored first this round
  countdown: number;
  gameOver: boolean;
  interval?: NodeJS.Timeout;
}

export class TriviaService {
  private games: Map<string, TriviaState> = new Map();
  
  private readonly DEFAULT_QUESTIONS: TriviaQuestion[] = [
    { question: "Which protocol is used for real-time web gaming?", options: ["HTTP", "WebSockets", "FTP", "SMTP"], answer: 1 },
    { question: "What does 'SSR' stand for in web dev?", options: ["Server Side Rendering", "Simple State Router", "Static Site Registry", "Secure Shell Runtime"], answer: 0 },
    { question: "Which language powers the Logic Layer of Gaming Plus?", options: ["Python", "PHP", "TypeScript", "C++"], answer: 2 },
    { question: "Who designed the original Pong game?", options: ["Steve Jobs", "Nolan Bushnell", "Bill Gates", "Shigeru Miyamoto"], answer: 1 },
    { question: "What is the maximum frequency of a 60FPS game loop?", options: ["60Hz", "120Hz", "30Hz", "10Hz"], answer: 0 },
    { question: "Which layer handles direct operator voice link?", options: ["TCP/IP", "WebRTC", "HTTP/3", "QUIC"], answer: 1 },
    { question: "Standard neural sync time (countdown) is set to?", options: ["1s", "3s", "5s", "10s"], answer: 2 }
  ];

  createGame(gameId: string, player1Id: number, player1Name: string, player2Id: number, player2Name: string, io: Server): TriviaState {
    const state: TriviaState = {
      gameId,
      player1: player1Id,
      player1Name,
      player2: player2Id,
      player2Name,
      score1: 0,
      score2: 0,
      currentQuestionIndex: 0,
      questions: [...this.DEFAULT_QUESTIONS].sort(() => Math.random() - 0.5),
      p1Answered: false,
      p2Answered: false,
      roundWinner: null,
      countdown: 5,
      gameOver: false
    };

    state.interval = setInterval(() => this.tick(gameId, io), 1000 / 10);
    this.games.set(gameId, state);
    return state;
  }

  private tick(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    if (state.countdown > 0) {
      state.countdown -= 0.1;
      this.broadcastState(gameId, io);
    }
  }

  submitAnswer(gameId: string, userId: number, answerIndex: number, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver || state.countdown > 0) return;

    const isP1 = userId === state.player1;
    const currentQ = state.questions[state.currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.answer;

    if (isP1) {
      if (state.p1Answered) return;
      state.p1Answered = true;
      if (isCorrect && state.roundWinner === null) {
        state.score1 += 10;
        state.roundWinner = userId;
      }
    } else {
      if (state.p2Answered) return;
      state.p2Answered = true;
      if (isCorrect && state.roundWinner === null) {
        state.score2 += 10;
        state.roundWinner = userId;
      }
    }

    if (state.p1Answered && state.p2Answered) {
      setTimeout(() => this.nextQuestion(gameId, io), 1500); 
      this.broadcastState(gameId, io);
    } else {
      this.broadcastState(gameId, io);
    }
  }

  private nextQuestion(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    state.currentQuestionIndex++;
    state.p1Answered = false;
    state.p2Answered = false;
    state.roundWinner = null;

    if (state.currentQuestionIndex >= state.questions.length) {
      state.gameOver = true;
      this.endGame(gameId, io);
    } else {
      this.broadcastState(gameId, io);
    }
  }

  private broadcastState(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    const q = state.questions[state.currentQuestionIndex];
    io.to(gameId).emit('trivia-state', {
      question: { question: q.question, options: q.options },
      score1: state.score1,
      score2: state.score2,
      player1Name: state.player1Name,
      player2Name: state.player2Name,
      currentQuestionIndex: state.currentQuestionIndex,
      totalQuestions: state.questions.length,
      p1Answered: state.p1Answered,
      p2Answered: state.p2Answered,
      roundWinner: state.roundWinner,
      countdown: Math.max(0, Math.ceil(state.countdown)),
      gameOver: state.gameOver
    });
  }

  private async endGame(gameId: string, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;
    if (state.interval) clearInterval(state.interval);

    // Ensure winnerId is treated as a number for DB query compatibility
    const winnerIdNum = state.score1 > state.score2 ? Number(state.player1) : (state.score2 > state.score1 ? Number(state.player2) : null);
    
    try {
      if (winnerIdNum !== null) {
        await query('UPDATE leaderboards SET score = score + 10 WHERE user_id = $1 AND game_type = $2', [winnerIdNum, 'trivia']);
      }
      io.to(gameId).emit('game-ended', { winner: winnerIdNum, score1: state.score1, score2: state.score2 });
    } catch (err) { console.error(err); }
  }
}

export default new TriviaService();

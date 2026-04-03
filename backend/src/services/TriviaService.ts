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
  player2: number;
  score1: number;
  score2: number;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  p1Answered: boolean;
  p2Answered: boolean;
  gameOver: boolean;
}

export class TriviaService {
  private games: Map<string, TriviaState> = new Map();
  
  private readonly DEFAULT_QUESTIONS: TriviaQuestion[] = [
    { question: "Which protocol is used for real-time web gaming?", options: ["HTTP", "WebSockets", "FTP", "SMTP"], answer: 1 },
    { question: "What does 'SSR' stand for in web dev?", options: ["Server Side Rendering", "Simple State Router", "Static Site Registry", "Secure Shell Runtime"], answer: 0 },
    { question: "Which language powers the Logic Layer of Gaming Plus?", options: ["Python", "PHP", "TypeScript", "C++"], answer: 2 },
    { question: "Who designed the original Pong game?", options: ["Steve Jobs", "Nolan Bushnell", "Bill Gates", "Shigeru Miyamoto"], answer: 1 },
    { question: "What is the maximum frequency of a 60FPS game loop?", options: ["60Hz", "120Hz", "30Hz", "10Hz"], answer: 0 }
  ];

  createGame(gameId: string, player1: number, player2: number, io: Server): TriviaState {
    const state: TriviaState = {
      gameId,
      player1,
      player2,
      score1: 0,
      score2: 0,
      currentQuestionIndex: 0,
      questions: [...this.DEFAULT_QUESTIONS].sort(() => Math.random() - 0.5),
      p1Answered: false,
      p2Answered: false,
      gameOver: false
    };

    this.games.set(gameId, state);
    this.broadcastState(gameId, io);
    return state;
  }

  submitAnswer(gameId: string, userId: number, answerIndex: number, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver) return;

    const isP1 = userId === state.player1;
    if (isP1) {
      if (state.p1Answered) return;
      state.p1Answered = true;
      if (answerIndex === state.questions[state.currentQuestionIndex].answer) state.score1 += 10;
    } else {
      if (state.p2Answered) return;
      state.p2Answered = true;
      if (answerIndex === state.questions[state.currentQuestionIndex].answer) state.score2 += 10;
    }

    if (state.p1Answered && state.p2Answered) {
      this.nextQuestion(gameId, io);
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
    io.to(`game-${gameId}`).emit('trivia-state', {
      question: { question: q.question, options: q.options },
      score1: state.score1,
      score2: state.score2,
      currentQuestionIndex: state.currentQuestionIndex,
      totalQuestions: state.questions.length,
      p1Answered: state.p1Answered,
      p2Answered: state.p2Answered
    });
  }

  private async endGame(gameId: string, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;

    const winnerId = state.score1 > state.score2 ? state.player1 : (state.score2 > state.score1 ? state.player2 : null);
    
    try {
      if (winnerId) {
        await query('UPDATE leaderboards SET score = score + 10 WHERE user_id = $1 AND game_type = $2', [winnerId, 'trivia']);
      }
      io.to(`game-${gameId}`).emit('game-ended', { winner: winnerId, score1: state.score1, score2: state.score2 });
    } catch (err) {
      console.error('Failed to persist trivia results:', err);
    }

    this.games.delete(gameId);
  }
}

export default new TriviaService();

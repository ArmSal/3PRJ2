<template>
  <div class="trivia-container glass-card">
    <div class="header">
      <button @click="$router.push('/games')" class="btn-back">⬅ Back to Games</button>
      <h2>Trivia Battle 🧠</h2>
    </div>
    
    <div v-if="!gameStarted" class="lobby">
      <h3>Ready to test your knowledge?</h3>
      <button @click="startGame" class="btn-primary">Start Game</button>
    </div>

    <div v-else-if="!gameOver" class="game-area">
      <div class="score-panel">
        <span>Score: {{ score }}</span>
        <span>Question {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
      </div>
      
      <div class="question-card glass-card">
        <h3>{{ currentQuestion.question }}</h3>
        
        <div class="options-grid">
          <button 
            v-for="(option, index) in currentQuestion.options" 
            :key="index"
            class="option-btn"
            @click="selectOption(index)"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="game-over">
      <h2>Game Over!</h2>
      <p>Your Final Score: <span class="final-score">{{ score }}</span></p>
      <button @click="resetGame" class="btn-primary">Play Again</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      gameStarted: false,
      gameOver: false,
      score: 0,
      currentQuestionIndex: 0,
      questions: [
        { question: "Quelle est la capitale de la France?", options: ["Londres", "Berlin", "Paris", "Madrid"], answer: 2 },
        { question: "En quelle annee a ete cree le Web?", options: ["1989", "1995", "2000", "1985"], answer: 0 },
        { question: "Quel langage est utilise pour styliser les pages web?", options: ["JavaScript", "Python", "HTML", "CSS"], answer: 3 },
        { question: "Quelle est la planete la plus proche du Soleil?", options: ["Venus", "Mars", "Mercure", "Terre"], answer: 2 },
        { question: "Combien de bits dans un octet?", options: ["4", "8", "16", "32"], answer: 1 }
      ]
    };
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentQuestionIndex];
    }
  },
  methods: {
    startGame() {
      this.gameStarted = true;
      this.gameOver = false;
      this.score = 0;
      this.currentQuestionIndex = 0;
    },
    selectOption(index) {
      if (index === this.currentQuestion.answer) {
        this.score += 10;
      }
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
      } else {
        this.gameOver = true;
      }
    },
    resetGame() {
      this.gameStarted = false;
    }
  }
};
</script>

<style scoped>
.trivia-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 40px;
  border-radius: 24px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.btn-back {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-back:hover {
  background: rgba(255,255,255,0.1);
}

.lobby, .game-over {
  text-align: center;
}

.score-panel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 18px;
}

.question-card {
  padding: 30px;
  text-align: center;
  background: rgba(20,20,30,0.6);
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.option-btn {
  padding: 16px;
  background: rgba(0,0,0,0.3);
  border: 2px solid var(--border-glass);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.option-btn:hover {
  border-color: var(--neon-blue);
  background: rgba(0,212,255,0.1);
}

.final-score {
  color: var(--neon-pink);
  font-size: 32px;
  font-weight: bold;
}
</style>

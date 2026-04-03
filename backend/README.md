# Backend - Gaming Platform

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- MySQL 8 (local) ou PostgreSQL (cloud)

### Installation

```bash
cd backend
npm install
```

### Configuration

Créer un fichier `.env`:
```env
# Local MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=gaming_platform
JWT_SECRET=your_secret_key_here

# OU pour Render (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_secret_key_here
```

### Démarrage

```bash
# Mode développement avec auto-reload
npm run dev

# Mode production
npm start
```

Le serveur démarre sur le port **3000**.

---

## 🧪 Test

```bash
# Test de l'API
node test-api.js
```

---

## 📚 API Documentation

Voir [API.md](./API.md) pour la documentation complète.

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/register` | Créer un compte |
| POST | `/api/login` | Connexion |
| GET | `/api/profile` | Profil utilisateur |
| GET | `/api/guilds` | Liste des guildes |
| POST | `/api/guilds` | Créer une guilde |
| GET | `/api/tournaments` | Liste des tournois |
| GET | `/api/leaderboard/:type` | Classement |

### Socket.IO Events

- `authenticate` - Authentification
- `join-channel` - Rejoindre un canal
- `send-message` - Envoyer un message
- `create-game` - Créer une partie
- `join-game` - Rejoindre une partie
- `pong-move` - Mouvement raquette Pong
- `snake-move` - Direction Snake

---

## 🎮 Systèmes de jeu

### Pong
- 2 joueurs, 60 FPS
- Physique balle temps réel
- Score max: 10 points
- Spectateurs supportés

### Snake
- 2 joueurs, grille 20x20
- Score max: 15 points
- Collision mur/serpent

### Trivia
- Questions aléatoires
- Scoring par bonnes réponses
- Multi-joueurs

---

## 🏆 Tournois Inter-Campus

Système de bracket à élimination directe:
1. Créer tournoi (campus1 vs campus2)
2. Inscriptions avec affiliation campus
3. Démarrage = génération bracket
4. Matchs automatiques

---

## 🔧 Structure

```
backend/
├── server.js       # Serveur principal
├── package.json    # Dépendances
├── Dockerfile      # Config Docker
├── API.md          # Documentation API
├── test-api.js     # Tests API
└── README.md       # Ce fichier
```

---

## 🐛 Debugging

Logs des événements Socket.IO visibles en console.

---

## 📦 Déploiement

### Render (Recommandé)
1. Connecter repo GitHub
2. Service Web: `npm start`
3. Ajouter variables d'environnement
4. Déployer

### Docker Local
```bash
docker-compose up
```

---

## 👥 Équipe

- **Backend**: Babikir IBRAHIM AL KHALIL (moi)
- **Frontend**: Fedi Khaldi
- **Fullstack/Jeux**: Abid RAKHIS AHMAT
- **DevOps**: Armend SALIHU

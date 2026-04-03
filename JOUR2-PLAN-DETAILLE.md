# JOUR 2 - Plan Détaillé Heure par Heure
## Discord-Gaming Plus - AI Accelerated Development

---

## 🎯 OBJECTIF JOUR 2 : MVP 100% FONCTIONNEL
**Avec IA** : Chat temps réel + Pong 2 joueurs + Guildes + Déploiement stable

---

## MATIN : 9h00 - 13h00 (4h)

### 9h00 - 9h15 (15min) : STANDUP RAPIDE
**Lieu** : Bureau / Discord vocal
**Agenda** :
- Armen : Verifie URLs prod + logs Render
- Babikir : Présente endpoints prêts
- Fedi : Montre maquette UI
- Abid : Montre Canvas Pong basique

**Output** : Chacun commit son état actuel sur `main`

---

### 9h15 - 10h30 (1h15) : CORE BACKEND + AUTH

#### BABIKIR (Backend) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-20min** : Stabiliser login/register
   - Test POST `/api/register` sur prod
   - Test POST `/api/login` sur prod  
   - Fix JWT secret si erreur
   ```javascript
   // Vérifie ce code fonctionne
   app.post('/api/register', async (req, res) => {
     const { username, email, password } = req.body;
     const hash = await bcrypt.hash(password, 10);
     await query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
       [username, email, hash]);
     res.json({ success: true });
   });
   ```

2. **20-45min** : Socket.io auth middleware
   ```javascript
   io.use((socket, next) => {
     const token = socket.handshake.auth.token;
     if (!token) return next(new Error('No token'));
     try {
       socket.user = jwt.verify(token, process.env.JWT_SECRET);
       next();
     } catch { next(new Error('Invalid token')); }
   });
   ```

3. **45-75min** : Events Socket.io chat
   - `chat:message` - Recevoir/envoyer message
   - `chat:history` - Charger 50 derniers messages
   - `user:online` - Liste utilisateurs connectés
   
**Commit** : `git commit -m "Backend: auth + socket.io chat core"`

#### FEDI (Frontend) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-30min** : Login/Register pages fonctionnelles
   - Formulaire login connecté à `/api/login`
   - Formulaire register connecté à `/api/register`
   - Stocker JWT dans `localStorage`
   - Redirection vers `/chat` après login
   ```vue
   // Utilise ce template
   <template>
     <div class="auth-container">
       <form @submit.prevent="login">
         <input v-model="username" placeholder="Username" />
         <input v-model="password" type="password" placeholder="Password" />
         <button type="submit">Login</button>
       </form>
     </div>
   </template>
   ```

2. **30-75min** : Chat interface Discord-like
   - Sidebar : liste guildes (appel API `/api/guilds`)
   - Main : liste messages (utilise Socket.io)
   - Input : envoyer message (emit `chat:message`)
   - CSS : flexbox, scrollable, dark theme
   
**Commit** : `git commit -m "Frontend: auth pages + chat UI"`

#### ABID (Games) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-30min** : Canvas Pong basique
   ```javascript
   // Canvas setup
   const canvas = document.getElementById('pong');
   const ctx = canvas.getContext('2d');
   canvas.width = 800;
   canvas.height = 400;
   
   // Game objects
   const ball = { x: 400, y: 200, dx: 5, dy: 5, radius: 10 };
   const paddle1 = { x: 20, y: 150, width: 10, height: 100 };
   const paddle2 = { x: 770, y: 150, width: 10, height: 100 };
   
   // Game loop
   function gameLoop() {
     update(); // positions
     draw();   // render
     requestAnimationFrame(gameLoop);
   }
   ```

2. **30-75min** : Mouvement paddles + balle physique
   - Keyboard : W/S pour paddle gauche, ↑/↓ pour paddle droit
   - Collision balle/murs
   - Collision balle/paddles
   - Score quand balle sort
   
**Commit** : `git commit -m "Games: Pong canvas avec physics"`

#### ARMEN (DevOps) - Supervise
**Tâches** :
- **0-15min** : Vérifier logs Render (pas d'erreur 500)
- **15-30min** : Test API en prod
  ```bash
  curl -X POST https://gaming-backend-wj18.onrender.com/api/register \
    -H "Content-Type: application/json" \
    -d '{"username":"test","email":"test@test.com","password":"test123"}'
  ```
- **30-45min** : Créer utilisateurs test dans DB
- **45-60min** : Vérifier tout le monde a push

---

### 10h30 - 10h45 (15min) : PAUSE CAFÉ ☕

---

### 10h45 - 12h00 (1h15) : INTÉGRATION CHAT + PONG

#### BABIKIR (Backend) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-30min** : Endpoints guildes
   - GET `/api/guilds` - Liste toutes les guildes
   - POST `/api/guilds` - Créer guilde (auth requis)
   - GET `/api/channels/:guildId` - Channels d'une guilde
   - POST `/api/channels` - Créer channel
   ```sql
   -- Tables nécessaires
   CREATE TABLE guilds (id SERIAL PRIMARY KEY, name VARCHAR(100), description TEXT, created_by INT);
   CREATE TABLE channels (id SERIAL PRIMARY KEY, guild_id INT, name VARCHAR(100), type VARCHAR(20));
   ```

2. **30-75min** : Socket.io rooms pour Pong
   - `game:create` - Créer partie
   - `game:join` - Rejoindre partie
   - `game:move` - Envoyer mouvement paddle
   - `game:state` - Broadcast état jeu (balle, scores)
   
**Commit** : `git commit -m "Backend: guilds API + game rooms socket.io"`

#### FEDI (Frontend) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-45min** : Connecter Socket.io chat
   ```javascript
   import { io } from 'socket.io-client';
   
   const socket = io('https://gaming-backend-wj18.onrender.com', {
     auth: { token: localStorage.getItem('token') }
   });
   
   socket.on('chat:message', (msg) => {
     this.messages.push(msg);
   });
   
   sendMessage() {
     socket.emit('chat:message', { content: this.message, channelId: this.currentChannel });
   }
   ```

2. **45-75min** : Liste utilisateurs en ligne
   - Sidebar droite : avatars + statuts
   - Socket event `users:online` pour update liste
   - Indicateur vert/rouge (online/offline)
   
**Commit** : `git commit -m "Frontend: socket.io integration + online users"`

#### ABID (Games) - **Windsurf Agent (Kimi 2.5)**
**Tâches** :
1. **0-45min** : Connecter Socket.io au Pong
   ```javascript
   const socket = io('https://gaming-backend-wj18.onrender.com');
   
   // Envoyer mouvement
   document.addEventListener('keydown', (e) => {
     if (e.key === 'w') socket.emit('game:move', { paddle: 1, direction: 'up' });
     if (e.key === 's') socket.emit('game:move', { paddle: 1, direction: 'down' });
   });
   
   // Recevoir état
   socket.on('game:state', (state) => {
     ball.x = state.ball.x;
     ball.y = state.ball.y;
     paddle1.y = state.paddle1.y;
     paddle2.y = state.paddle2.y;
     score1 = state.score1;
     score2 = state.score2;
   });
   ```

2. **45-75min** : Lobby matchmaking
   - Bouton "Create Game" → emit `game:create`
   - Liste parties en attente → emit `game:list`
   - Bouton "Join" → emit `game:join`
   - Lancer Pong quand 2 joueurs
   
**Commit** : `git commit -m "Games: Pong multiplayer avec socket.io"`

#### ARMEN (DevOps)
**Tâches** :
- **0-30min** : Documenter API dans `API.md`
- **30-60min** : Test end-to-end : Register → Login → Chat → Create Game
- **60-75min** : Résoudre blocages équipe (merge conflicts, déploiement)

---

### 12h00 - 13h00 (1h) : STANDUP + DÉJEUNER

**STANDUP 12h00 (15min)** - Chacun présente :
- Ce qui marche ✅
- Ce qui bloque ❌
- Ce qu'il reste pour l'après-midi

**DÉCISION** : Si retard > 2h sur plan, couper features P1

---

## APRÈS-MIDI : 14h00 - 17h00 (3h)

### 14h00 - 15h30 (1h30) : PONG 2 JOUEURS + SPECTATEUR

#### BABIKIR (Backend)
**Tâches** :
1. **0-45min** : Game state server-side
   ```javascript
   // Game loop serveur
   const games = new Map();
   
   setInterval(() => {
     games.forEach((game, gameId) => {
       updateBall(game); // Physics côté serveur
       io.to(`game-${gameId}`).emit('game:state', game.state);
     });
   }, 1000/60); // 60 FPS
   ```

2. **45-90min** : Mode spectateur
   - `game:spectate` - Rejoindre en spectateur
   - Unlimited spectators
   - Chat spectateurs séparé
   
**Commit** : `git commit -m "Backend: game server loop + spectator mode"`

#### FEDI (Frontend)
**Tâches** :
1. **0-45min** : UI game selection
   - Card pour chaque jeu (Pong, Snake - si temps)
   - Bouton "Play Now" → go lobby
   - Indicateur "2/2 players" ou "Waiting..."

2. **45-90min** : Spectateur UI
   - Regarder partie sans jouer
   - Chat spectateurs
   - Liste spectateurs
   
**Commit** : `git commit -m "Frontend: game lobby + spectator UI"`

#### ABID (Games)
**Tâches** :
1. **0-60min** : Sync parfaite Pong
   - Interpolation pour lag
   - Prédiction mouvement
   - Anti-cheat simple (validation serveur)

2. **60-90min** : Snake basique (si Pong OK)
   - Canvas Snake
   - Socket.io pour multiplayer
   - Score + leaderboard
   
**Commit** : `git commit -m "Games: Pong sync + Snake basique"`

#### ARMEN (DevOps)
**Tâches** :
- Test Pong 2 joueurs en prod
- Monitor lag/latency
- Hotfix urgent si besoin

---

### 15h30 - 15h45 (15min) : PAUSE ☕

---

### 15h45 - 17h00 (1h15) : POLISH + INTÉGRATION FINALE

#### TOUS LES DÉVELOPPEURS

**Tâches communes** :

1. **15h45-16h15 (30min)** : Bug fixes critiques
   - Crash app ?
   - Socket déconnecte ?
   - API 500 error ?
   - UI cassée mobile ?

2. **16h15-16h45 (30min)** : Test scénario démo
   ```
   Scénario test :
   1. Inscription nouvel utilisateur
   2. Login
   3. Créer guilde "Hackathon2024"
   4. Envoyer message dans chat
   5. Créer partie Pong
   6. 2ème joueur rejoint
   7. Jouer 1 point
   8. Spectateur rejoint et regarde
   ```

3. **16h45-17h00 (15min)** : Standup final
   - Qu'est-ce qui marche ✅
   - Qu'est-ce qu'on montre pas ❌
   - Préparation démo Jour 3

---

## FIN JOUR 2 - CHECKLIST ✅

### Doit être 100% fonctionnel :
- [ ] Login/Register sans bug
- [ ] Chat temps réel (messages instantanés)
- [ ] Pong 2 joueurs online (jouable)
- [ ] Guildes créables/joignables
- [ ] Interface responsive (mobile OK)
- [ ] Déploiement prod stable

### Nice to have (si temps) :
- [ ] Snake game
- [ ] Spectateur mode
- [ ] Avatar utilisateurs
- [ ] Typing indicator chat

---

## COMMANDS UTILES POUR CHAQUE HEURE

### Git (toutes les 2h minimum) :
```bash
git add .
git commit -m "feat: description de ce que tu as fait"
git pull origin main  # Avant de push
git push origin main
```

### Test local :
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev

# Docker (optionnel)
docker-compose up
```

### Test prod :
```bash
curl https://gaming-backend-wj18.onrender.com/api/guilds
curl https://gaming-frontend-gtzd.onrender.com
```

---

## RÈGLES D'OR AVEC IA

1. **Cursor/GPT pour boilerplate** : Génère le code de base rapidement
2. **Tu modifies** : L'IA donne l'idée, tu adaptes à ton projet
3. **Test immédiat** : Dès que tu as du code, tu testes
4. **Commit fréquent** : Toutes les 30-45min, pas à la fin
5. **Demande aide** : Si blocage > 20min, tag Armen immédiatement

---

## CONTACTS URGENCE

- **Babikir** : Backend, Socket.io, API
- **Fedi** : Frontend, Vue.js, CSS  
- **Abid** : Canvas, Jeux, Socket.io games
- **Armen** : DevOps, Merge, Déploiement, Blockages

**Discord Urgent** : Tag @everyone si app cassée en prod

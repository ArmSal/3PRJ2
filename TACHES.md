# TÂCHES DÉTAILLÉES - JOUR 2 (9h-17h)
## Objectif : Tout terminer en 1 jour avec bonus Kubernetes

---

## 🕘 9h00 - START

### Babikir (Backend) - Priorité P0
**[ ] Tâche 1 : Auth stable (9h00-10h00)**
- Tester /api/login et /api/register sur prod
- Fixer bugs éventuels
- Créer compte test : `demo/demo123`

**[ ] Tâche 2 : Socket.io chat (10h00-12h00)**
- Event `chat:message` : recevoir + sauvegarder DB + broadcaster
- Event `chat:history` : envoyer 50 derniers messages
- Room par `channel-id`

**[ ] Tâche 3 : Socket.io Pong (12h00-13h00)**
- Event `game:join` : créer room game
- Event `game:move` : paddle up/down
- Event `game:state` : broadcast balle position 60fps

**[ ] Tâche 4 : Endpoints guildes (13h00-13h30)**
- POST /api/guilds (créer)
- GET /api/guilds (liste)
- POST /api/guilds/:id/join (rejoindre)

---

### Fedi (Frontend) - Priorité P0
**[ ] Tâche 1 : Auth connect (9h00-10h30)**
- Connecter Login.vue à /api/login
- Connecter Register.vue à /api/register
- Stocker JWT localStorage
- Redirection /chat après login

**[ ] Tâche 2 : Chat UI Discord (10h30-12h30)**
- Sidebar : liste guildes + channels
- Zone messages : bulles style Discord
- Input : envoyer message (Socket.io)
- Avatar + username

**[ ] Tâche 3 : Responsive (12h30-13h00)**
- Mobile : sidebar cachable (hamburger)
- Desktop : layout 3 colonnes
- Test sur téléphone

**[ ] Tâche 4 : Game launcher (13h00-13h30)**
- Bouton "Jouer à Pong" dans channel
- Modal/overlay pour jeu
- Spectator mode (regarder sans jouer)

---

### Abid (Games) - Priorité P0
**[ ] Tâche 1 : Canvas Pong solo (9h00-11h00)**
- 2 paddles (gauche/droite)
- Balle physique (rebonds)
- Scores
- Controls : W/S (P1) + Flèches (P2)

**[ ] Tâche 2 : Socket.io intégration (11h00-13h00)**
- Recevoir `game:state` du serveur
- Afficher position adversaire
- Envoyer `game:move` au serveur
- Sync balle entre 2 écrans

**[ ] Tâche 3 : Snake bonus (13h00-13h30)**
- Si Pong terminé : Snake solo
- Sinon : aider Fedi sur CSS

---

### Armend  - DevOps + Bonus K8s
**[ ] Tâche 1 : Monitor 9h-17h (continu)**
- Vérifier logs Render toutes les heures
- Redeploy si crash
- Hotfix urgent si prod down

**[ ] Tâche 2 : Kubernetes YAML (9h00-12h00)** **BONUS +20%**
Créer dossier `k8s/` avec :
- `namespace.yaml` : créer namespace gaming
- `postgres-deployment.yaml` : PostgreSQL
- `postgres-service.yaml` : ClusterIP
- `postgres-pvc.yaml` : volume persistant
- `backend-deployment.yaml` : Node.js replicas: 2
- `backend-service.yaml` : ClusterIP
- `frontend-deployment.yaml` : Nginx replicas: 2  
- `frontend-service.yaml` : ClusterIP
- `ingress.yaml` : routes /api → backend, / → frontend

**[ ] Tâche 3 : CI/CD GitHub (12h00-13h00)**
- Workflow build + push Docker Hub
- Ou auto-deploy Render via webhook

**[ ] Tâche 4 : Documentation API (13h00-13h30)**
- Fichier `API.md` avec tous endpoints
- Exemples curl pour tester

---

## 🕐 13h00 - STANDUP OBLIGATOIRE

Chacun dit :
- Qu'est-ce qui marche ?
- Qu'est-ce qui bloque ?
- Besoin d'aide ?

**Décision** : Couper quoi si retard ?
Options : Snake, responsive mobile, K8s bonus

---

## 🕑 14h00 - REPRISE

### Babikir (Backend) - P0 finalisation
**[ ] Tâche 5 : Polish backend (14h00-16h00)**
- Gestion erreurs Socket.io
- Déconnexion propre
- Validation données

**[ ] Tâche 6 : Tests (16h00-17h00)**
- Test 2 clients simultanés
- Test déco/reco
- Vérifier pas de fuite mémoire

---

### Fedi (Frontend) - P0 finalisation
**[ ] Tâche 5 : Intégration Pong (14h00-15h30)**
- Component Pong.vue
- Bouton "Lancer partie" visible
- Afficher "En attente d'adversaire"

**[ ] Tâche 6 : UX polish (15h30-17h00)**
- Loading states
- Erreurs (toast notifications)
- Animations CSS subtiles
- Dark modeDiscord-like

---

### Abid (Games) - P0 + P1
**[ ] Tâche 4 : Pong 2 joueurs stable (14h00-15h30)**
- Fixer sync balle
- Gestion lag
- Fin partie (3 points)

**[ ] Tâche 5 : Snake si temps (15h30-16h30)**
- Canvas Snake solo
- High scores

**[ ] Tâche 6 : Aider équipe (16h30-17h00)**
- Testeur QA : trouver bugs
- Aider sur blocages

---

### Armend (Toi) - K8s + Déploiement
**[ ] Tâche 5 : K8s déploiement test (14h00-16h00)**
- Test local avec minikube/kind
- Ou tester sur cluster école si dispo

**[ ] Tâche 6 : Prod monitoring (16h00-17h00)**
- URL prod : https://gaming-frontend-gtzd.onrender.com
- Vérifier tout marche
- Screenshot pour démo
- Créer compte démo : `jury/jury2024`

---

## 🕔 17h00 - FIN JOUR 2

### Checklist validation :
- [ ] Login/register marche sur prod
- [ ] Chat temps réel (2 onglets test)
- [ ] Pong 2 joueurs (2 onglets test)
- [ ] UI responsive (test mobile)
- [ ] K8s YAMLs créés (bonus)
- [ ] Pas de crash serveur

### Si tout marche = SUCCESS 🎉
### Si retard = Couper Snake, responsive, ou K8s

---

## JOUR 3 : Juste polish + démo (pas de nouvelle feature)


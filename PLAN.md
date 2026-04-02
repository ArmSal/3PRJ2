# Plan Hackathon 3PRJ2 - 3 Jours (7h/jour)

## Horaires : 9h-13h / 14h-17h

---

## JOUR 1 (aujourd'hui) ✅ TERMINÉ

### Matin 9h-13h
- ✅ Équipes formées
- ✅ Sujet choisi (Discord Gaming Plus)
- ✅ Architecture définie

### Après-midi 14h-17h
- ✅ GitHub repo créé
- ✅ Docker configuré
- ✅ Backend déployé : https://gaming-backend-wj18.onrender.com
- ✅ Frontend déployé : https://gaming-frontend-gtzd.onrender.com

---

## JOUR 2 (demain)

### Matin 9h-13h - CORE FEATURES

**Babikir (Backend)** :
- [ ] Stabiliser login/register
- [ ] Socket.io chat temps réel
- [ ] Endpoints guildes/channels

**Fedi (Frontend)** :
- [ ] Connecter auth au backend
- [ ] UI chat (Discord-like)
- [ ] Liste utilisateurs en ligne

**Abid (Games)** :
- [ ] Canvas Pong basique
- [ ] Mouvement paddles
- [ ] Balle physique simple

**Toi (DevOps)** :
- [ ] Vérifier logs Render
- [ ] Test end-to-end
- [ ] Documenter API

**Standup 13h** : Décider si on coupe des features

### Après-midi 14h-17h - PONG MULTIPLAYER

**Objectif** : Pong 2 joueurs en ligne

**Babikir** :
- [ ] Socket.io room pour games
- [ ] Events : game:join, game:move, game:state

**Abid** :
- [ ] Intégrer Socket.io au Pong
- [ ] Sync balle entre 2 clients

**Fedi** :
- [ ] Lobby de matchmaking
- [ ] UI game selection

**Toi** :
- [ ] Monitor performance
- [ ] Hotfix si déploiement casse

---

## JOUR 3 (après-demain) - DÉMO

### Matin 9h-13h - INTEGRATION

**Objectif** : Tout doit marcher ensemble

- [ ] Test complet : Login → Chat → Lancer Pong → Jouer
- [ ] Bug fixes
- [ ] UI polish (responsive, animations)
- [ ] Ajouter Snake si temps (sinon skip)

**Standup 13h** : Freeze des features, plus rien de nouveau

### Après-midi 14h-17h - PRÉPARATION DÉMO

**14h-15h** : Finalisation
- [ ] Derniers tests
- [ ] Données de démo (comptes test)
- [ ] URL de prod vérifiée

**15h-16h** : Préparation présentation
- [ ] Script démo (3 min)
- [ ] Slides (architecture + choix techniques)
- [ ] Q&A anticipation

**16h-17h** : Rehearsal
- [ ] Run complet de la démo
- [ ] Timing
- [ ] Backup plan si bug live

---

## PRIORITÉS STRICTES

### P0 (Doit avoir pour la démo)
1. Login/Register
2. Chat temps réel
3. Pong 2 joueurs
4. Interface responsive

### P1 (Nice to have)
5. Snake game
6. Spectator mode
7. Kubernetes bonus

### P2 (Skip si manque temps)
8. Voice chat
9. Tournois
10. Trivia

---

## RÈGLES

1. **13h** : Standup obligatoire, décision P0/P1/P2
2. **Pas de nouvelle feature après Jour 3 13h**
3. **Git push toutes les 2h minimum**
4. **Blocage > 30min** → Tag équipe Discord
5. **Déploiement prod** → Toi seul gère

---

## URLS PROD

- Frontend : https://gaming-frontend-gtzd.onrender.com
- Backend : https://gaming-backend-wj18.onrender.com
- GitHub : https://github.com/ArmSal/3PRJ2

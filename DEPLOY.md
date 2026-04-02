# DevOps Setup Guide

## Prérequis

- Docker Desktop installé et running
- Docker Compose (inclus avec Docker Desktop)
- Git
- Compte GitHub avec accès au repo https://github.com/ArmSal/3PRJ2

## Lancer le projet localement

```bash
# Cloner le repo
git clone https://github.com/ArmSal/3PRJ2.git
cd 3PRJ2

# Méthode 1: Avec Make (recommandé)
make up-build

# Méthode 2: Directement avec docker-compose
docker-compose up --build -d
```

## Vérifier que tout fonctionne

```bash
# Test rapide
make test

# Ou manuellement:
curl http://localhost          # Frontend
curl http://localhost:3000     # Backend API
curl http://localhost:3000/api/guilds  # API endpoint (avec auth)
```

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `make up` | Démarrer les services |
| `make down` | Arrêter les services |
| `make logs` | Voir les logs en temps réel |
| `make shell-be` | Shell dans le container backend |
| `make shell-db` | Accès MySQL CLI |
| `make clean` | Nettoyer tout (volumes inclus) |

## Structure des containers

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│    MySQL    │
│   :80       │     │   :3000     │     │   :3306     │
│  (Nginx)    │     │  (Node.js)  │     │  (v8.0)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Variables d'environnement

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DB_HOST` | mysql | Nom du service MySQL |
| `DB_USER` | root | Utilisateur MySQL |
| `DB_PASSWORD` | password | Mot de passe MySQL |
| `DB_NAME` | gaming_platform | Nom de la base |
| `JWT_SECRET` | your-secret-key-change-this | Clé JWT |

## Dépannage

### Port 80 déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :80
# Ou changer le port dans docker-compose.yml
ports:
  - "8080:80"  # Au lieu de "80:80"
```

### MySQL ne démarre pas
```bash
# Vérifier les logs
make logs
# Ou
docker-compose logs mysql

# Réinitialiser la base
docker-compose down -v
docker-compose up -d
```

### Container backend en restart loop
```bash
# Vérifier les dépendances
make shell-be
npm install
# Vérifier que server.js existe
ls -la
```

## CI/CD Pipeline

Le workflow GitHub Actions est dans `.github/workflows/deploy.yml`.

### Secrets GitHub requis:
- `VM_HOST` - IP ou domaine du serveur
- `VM_USER` - Utilisateur SSH
- `VM_SSH_KEY` - Clé SSH privée

### Déploiement automatique:
1. Push sur `main` → Build des images
2. Déploiement sur VM via SSH
3. `docker-compose up -d` sur le serveur

## Kubernetes (Bonus +20%)

Pour le bonus, créer des fichiers dans `k8s/`:
- `deployment.yaml` - Pods backend/frontend
- `service.yaml` - Services ClusterIP/LoadBalancer
- `ingress.yaml` - Ingress controller
- `configmap.yaml` - Variables d'environnement
- `secret.yaml` - JWT_SECRET, DB_PASSWORD
- `pvc.yaml` - Persistance MySQL

## Checklist Day 1 PM - DevOps

- [ ] `docker-compose up --build` fonctionne localement
- [ ] Les 3 containers sont UP et healthy
- [ ] Frontend accessible sur http://localhost
- [ ] Backend répond sur http://localhost:3000
- [ ] MySQL accepte les connexions
- [ ] GitHub Actions workflow configuré
- [ ] Secrets GitHub ajoutés (si VM disponible)
- [ ] Push sur main déclenche la pipeline
- [ ] Documentation partagée avec l'équipe

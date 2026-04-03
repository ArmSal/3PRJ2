-- Seed data for Gaming Platform
-- Run this after init.sql to populate the database with test data

-- Insert test users (password: 'password123' for all)
INSERT INTO users (username, email, password_hash) VALUES
('alice_campus', 'alice@campus.fr', '$2a$10$YourHashedPasswordHere'),
('bob_campus', 'bob@campus.fr', '$2a$10$YourHashedPasswordHere'),
('charlie_campus', 'charlie@campus.fr', '$2a$10$YourHashedPasswordHere'),
('diana_campus', 'diana@campus.fr', '$2a$10$YourHashedPasswordHere');

-- Note: In production, use proper bcrypt hash. For testing:
-- Run this Node.js code to generate hashes:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('password123', 10));

-- Insert user profiles with campuses
INSERT INTO user_profiles (user_id, campus, bio, level, xp) VALUES
(1, 'Paris Campus', 'Gamer passionné de Pong', 5, 500),
(2, 'Lyon Campus', 'Expert en Snake', 3, 300),
(3, 'Paris Campus', 'Développeur frontend', 2, 150),
(4, 'Lyon Campus', 'Fullstack developer', 4, 400);

-- Insert guilds
INSERT INTO guilds (name, description, created_by) VALUES
('Paris Gamers', 'Communauté gaming du campus Paris', 1),
('Lyon eSports', 'Club eSports Lyon - Compétitions et fun', 2),
('Développeurs Web', 'Guild pour les devs frontend/backend', 3);

-- Insert guild memberships
INSERT INTO guild_members (user_id, guild_id, role) VALUES
(1, 1, 'admin'),
(2, 2, 'admin'),
(3, 3, 'admin'),
(1, 2, 'member'),
(2, 1, 'member'),
(4, 1, 'member'),
(4, 2, 'member');

-- Insert channels
INSERT INTO channels (guild_id, name, type) VALUES
(1, 'general', 'text'),
(1, 'gaming', 'text'),
(1, 'voice-chat', 'voice'),
(2, 'general', 'text'),
(2, 'tournois', 'text'),
(2, 'voice-chat', 'voice'),
(3, 'general', 'text'),
(3, 'coding-help', 'text');

-- Insert sample messages
INSERT INTO messages (channel_id, user_id, content) VALUES
(1, 1, 'Salut tout le monde! Qui veut jouer au Pong?'),
(1, 2, 'Je suis chaud! Crée une partie'),
(1, 3, 'Je regarde, je suis en train de coder'),
(1, 4, 'Je peux faire le spectateur 😄'),
(2, 1, 'Partie de Pong lancée! Rejoignez-moi'),
(4, 2, 'Bienvenue sur Lyon eSports!'),
(4, 4, 'Quand est le prochain tournoi?'),
(7, 3, 'N\'hésitez pas à poser vos questions dev ici');

-- Insert game scores (leaderboard data)
INSERT INTO game_scores (user_id, game_type, score, games_played, games_won) VALUES
(1, 'pong', 150, 20, 15),
(2, 'pong', 120, 18, 12),
(4, 'pong', 100, 15, 10),
(2, 'snake', 200, 25, 20),
(1, 'snake', 180, 22, 18),
(4, 'snake', 150, 20, 15),
(3, 'trivia', 300, 30, 25),
(1, 'trivia', 250, 25, 20),
(2, 'trivia', 200, 20, 15);

-- Insert tournaments
INSERT INTO tournaments (name, description, game_type, campus1, campus2, status, max_participants, created_by, starts_at) VALUES
('Tournoi Pong Paris vs Lyon', 'Compétition inter-campus de Pong', 'pong', 'Paris Campus', 'Lyon Campus', 'registration', 16, 1, DATE_ADD(NOW(), INTERVAL 7 DAY)),
('Championnat Snake 2024', 'Le grand championnat de Snake', 'snake', 'Paris Campus', 'Lyon Campus', 'ongoing', 8, 2, DATE_ADD(NOW(), INTERVAL 1 DAY)),
('Trivia Challenge', 'Testez vos connaissances générales', 'trivia', 'Paris Campus', 'Lyon Campus', 'finished', 20, 3, DATE_SUB(NOW(), INTERVAL 7 DAY));

-- Insert tournament participants
INSERT INTO tournament_participants (tournament_id, user_id, campus) VALUES
(1, 1, 'Paris Campus'),
(1, 3, 'Paris Campus'),
(1, 2, 'Lyon Campus'),
(1, 4, 'Lyon Campus'),
(2, 1, 'Paris Campus'),
(2, 2, 'Lyon Campus'),
(2, 4, 'Lyon Campus'),
(3, 1, 'Paris Campus'),
(3, 2, 'Lyon Campus'),
(3, 3, 'Paris Campus'),
(3, 4, 'Lyon Campus');

-- Insert finished games
INSERT INTO games (channel_id, game_type, status, player1_id, player2_id, winner_id, score1, score2, created_at, ended_at) VALUES
(2, 'pong', 'finished', 1, 2, 1, 10, 5, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 'pong', 'finished', 3, 4, 4, 8, 10, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR)),
(5, 'snake', 'finished', 2, 1, 2, 12, 15, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR));

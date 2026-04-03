import { query } from './db';
import bcrypt from 'bcryptjs';

const initDb = async (): Promise<void> => {
  try {
    console.log('🔄 INITIALIZING NEURAL DATABASE PROTOCOLS...');

    // Users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        count_elo INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Guilds
    await query(`
      CREATE TABLE IF NOT EXISTS guilds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Channels
    await query(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        guild_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leaderboards
    await query(`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_type VARCHAR(50),
        score INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournaments
    await query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        game_type VARCHAR(50) NOT NULL,
        campus1 VARCHAR(50),
        campus2 VARCHAR(50),
        max_participants INTEGER DEFAULT 16,
        status VARCHAR(20) DEFAULT 'waiting',
        created_by INTEGER REFERENCES users(id),
        starts_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournament Participants
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        campus VARCHAR(50),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tournament_id, user_id)
      )
    `);

    // Tournament Matches
    await query(`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        player1_id INTEGER REFERENCES users(id),
        player2_id INTEGER REFERENCES users(id),
        winner_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure a default guild exists for immediate communication
    const guildCheck = await query('SELECT count(*) FROM guilds');
    if (parseInt(guildCheck.rows[0].count) === 0) {
      console.log('🌱 SEEDING: Creating default Public Arena...');
      const guildRes = await query(
        'INSERT INTO guilds (name, description) VALUES ($1, $2) RETURNING id',
        ['The Nexus', 'Official Public Arena for all players.']
      );
      const publicGuildId = guildRes.rows[0].id;
      
      await query(
        'INSERT INTO channels (guild_id, name, type) VALUES ($1, $2, $3)',
        [publicGuildId, 'general', 'text']
      );
    }

    // Ensure test users exist
    const testUsers = await query('SELECT count(*) FROM users');
    if (parseInt(testUsers.rows[0].count) < 2) {
      console.log('🌱 SEEDING: Creating test users...');
      
      // armsal:armsal
      const armsalHash = await bcrypt.hash('armsal', 10);
      await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        ['armsal', 'armsal@test.com', armsalHash]
      );
      
      // fedi:fedi
      const fediHash = await bcrypt.hash('fedi', 10);
      await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        ['fedi', 'fedi@test.com', fediHash]
      );
      
      console.log('✅ Test users created: armsal:armsal, fedi:fedi');
    }

    console.log('✅ DATABASE OPERATIONAL: All schemas synchronized.');
    
  } catch (err) {
    console.error('❌ DATABASE FAILURE: Schema initialization aborted.', err);
    process.exit(1);
  }
};

if (require.main === module) {
  initDb();
}

export default initDb;

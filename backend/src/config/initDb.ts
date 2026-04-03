import { query } from './db';
import bcrypt from 'bcryptjs';

const initDb = async (): Promise<void> => {
  try {
    console.log('🔄 INITIALIZING NEURAL DATABASE PROTOCOLS...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        count_elo INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure password_hash column exists (migration fix)
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
      console.log('✅ password_hash column verified');
    } catch (e) {
      console.log('ℹ️ password_hash column already exists');
    }

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
    } else {
      // DATA INTEGRITY: Ensure every existing guild has at least one channel
      console.log('🔍 DATA INTEGRITY: Checking tactical channels for existing guilds...');
      const allGuilds = await query('SELECT id, name FROM guilds');
      for (const guild of allGuilds.rows) {
        const chanCheck = await query('SELECT count(*) FROM channels WHERE guild_id = $1', [guild.id]);
        if (parseInt(chanCheck.rows[0].count) === 0) {
          console.log(`🛠️ REPAIRING: Adding #general to existing guild [${guild.name}]`);
          await query(
            'INSERT INTO channels (guild_id, name, type) VALUES ($1, $2, $3)',
            [guild.id, 'general', 'text']
          );
        }
      }
    }

    // Ensure test users exist (always check individually)
    console.log('🌱 SEEDING: Checking test users...');
    
    // armsal:armsal
    const armsalCheck = await query('SELECT username FROM users WHERE username = $1', ['armsal']);
    if (armsalCheck.rows.length === 0) {
      console.log('🌱 Creating armsal user...');
      const armsalHash = await bcrypt.hash('armsal', 10);
      await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        ['armsal', 'armsal@test.com', armsalHash]
      );
      console.log('✅ armsal created');
    }
    
    // fedi:fedi
    const fediCheck = await query('SELECT username FROM users WHERE username = $1', ['fedi']);
    if (fediCheck.rows.length === 0) {
      console.log('🌱 Creating fedi user...');
      const fediHash = await bcrypt.hash('fedi', 10);
      await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        ['fedi', 'fedi@test.com', fediHash]
      );
      console.log('✅ fedi created');
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

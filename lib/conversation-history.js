const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

/**
 * Conversation History Manager
 * Stores all prompts and responses with metadata
 */
class ConversationHistory {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(os.homedir(), '.cache', 'claude-enhancer', 'history.db');
    this.db = null;
    this.initialize();
  }

  /**
   * Initialize database with tables
   */
  initialize() {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    fs.mkdir(dir, { recursive: true }).catch(() => {});
    
    // Open database
    this.db = new Database(this.dbPath);
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        prompt TEXT NOT NULL,
        enhanced TEXT NOT NULL,
        mode TEXT,
        provider TEXT,
        model TEXT,
        use_ai BOOLEAN,
        tokens_used INTEGER,
        response_time INTEGER,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        title TEXT,
        description TEXT
      );
      
      CREATE TABLE IF NOT EXISTS session_interactions (
        session_id TEXT,
        interaction_id INTEGER,
        position INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id),
        FOREIGN KEY (interaction_id) REFERENCES interactions(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_timestamp ON interactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_mode ON interactions(mode);
      CREATE INDEX IF NOT EXISTS idx_provider ON interactions(provider);
      CREATE INDEX IF NOT EXISTS idx_session ON session_interactions(session_id);
    `);
    
    // Prepare statements
    this.statements = {
      saveInteraction: this.db.prepare(`
        INSERT INTO interactions (prompt, enhanced, mode, provider, model, use_ai, tokens_used, response_time, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      
      getRecent: this.db.prepare(`
        SELECT * FROM interactions
        ORDER BY timestamp DESC
        LIMIT ?
      `),
      
      getById: this.db.prepare(`
        SELECT * FROM interactions
        WHERE id = ?
      `),
      
      search: this.db.prepare(`
        SELECT * FROM interactions
        WHERE prompt LIKE ? OR enhanced LIKE ?
        ORDER BY timestamp DESC
        LIMIT ?
      `),
      
      getStats: this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT prompt) as unique_prompts,
          mode,
          COUNT(*) as mode_count
        FROM interactions
        GROUP BY mode
        ORDER BY mode_count DESC
      `),
      
      getMostUsedMode: this.db.prepare(`
        SELECT mode, COUNT(*) as count
        FROM interactions
        GROUP BY mode
        ORDER BY count DESC
        LIMIT 1
      `),
      
      getSessionInteractions: this.db.prepare(`
        SELECT i.*
        FROM interactions i
        JOIN session_interactions si ON i.id = si.interaction_id
        WHERE si.session_id = ?
        ORDER BY si.position
      `),
      
      createSession: this.db.prepare(`
        INSERT INTO sessions (session_id, title, description)
        VALUES (?, ?, ?)
      `),
      
      updateSession: this.db.prepare(`
        UPDATE sessions
        SET updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `),
      
      addToSession: this.db.prepare(`
        INSERT INTO session_interactions (session_id, interaction_id, position)
        VALUES (?, ?, ?)
      `)
    };
  }

  /**
   * Save an interaction to history
   */
  async saveInteraction(prompt, enhanced, options = {}) {
    try {
      const metadata = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...options.metadata
      });
      
      const result = this.statements.saveInteraction.run(
        prompt,
        enhanced,
        options.mode || 'balanced',
        options.provider || 'unknown',
        options.model || null,
        options.useAI ? 1 : 0,
        options.tokensUsed || null,
        options.responseTime || null,
        metadata
      );
      
      // Add to current session if exists
      if (this.currentSession) {
        const position = this.getSessionLength(this.currentSession) + 1;
        this.statements.addToSession.run(this.currentSession, result.lastInsertRowid, position);
        this.statements.updateSession.run(this.currentSession);
      }
      
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Failed to save interaction:', error.message);
      return null;
    }
  }

  /**
   * Get recent interactions
   */
  async getRecent(limit = 10) {
    try {
      const rows = this.statements.getRecent.all(limit);
      return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to get recent interactions:', error.message);
      return [];
    }
  }

  /**
   * Get last interaction
   */
  async getLastInteraction() {
    const recent = await this.getRecent(1);
    return recent[0] || null;
  }

  /**
   * Search interactions
   */
  async search(query, limit = 20) {
    try {
      const searchTerm = `%${query}%`;
      const rows = this.statements.search.all(searchTerm, searchTerm, limit);
      return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to search interactions:', error.message);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    try {
      const stats = this.statements.getStats.all();
      const mostUsed = this.statements.getMostUsedMode.get();
      
      const total = stats.reduce((sum, stat) => sum + stat.total, 0);
      const unique = stats[0]?.unique_prompts || 0;
      
      return {
        total,
        unique,
        mostUsedMode: mostUsed?.mode || 'none',
        modeBreakdown: stats.reduce((acc, stat) => {
          acc[stat.mode] = stat.mode_count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Failed to get stats:', error.message);
      return {
        total: 0,
        unique: 0,
        mostUsedMode: 'none',
        modeBreakdown: {}
      };
    }
  }

  /**
   * Create a new session
   */
  createSession(title = null, description = null) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.statements.createSession.run(
        sessionId,
        title || `Session ${new Date().toLocaleString()}`,
        description
      );
      
      this.currentSession = sessionId;
      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error.message);
      return null;
    }
  }

  /**
   * Get session interactions
   */
  getSessionInteractions(sessionId) {
    try {
      const rows = this.statements.getSessionInteractions.all(sessionId);
      return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
      }));
    } catch (error) {
      console.error('Failed to get session interactions:', error.message);
      return [];
    }
  }

  /**
   * Get session length
   */
  getSessionLength(sessionId) {
    const interactions = this.getSessionInteractions(sessionId);
    return interactions.length;
  }

  /**
   * Export history to JSON
   */
  async exportToJSON(filePath) {
    try {
      const all = this.db.prepare('SELECT * FROM interactions ORDER BY timestamp').all();
      const data = {
        exported: new Date().toISOString(),
        version: '1.0',
        interactions: all.map(row => ({
          ...row,
          metadata: row.metadata ? JSON.parse(row.metadata) : {}
        }))
      };
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export history:', error.message);
      return false;
    }
  }

  /**
   * Import history from JSON
   */
  async importFromJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const stmt = this.db.prepare(`
        INSERT INTO interactions (timestamp, prompt, enhanced, mode, provider, model, use_ai, tokens_used, response_time, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const importMany = this.db.transaction((interactions) => {
        for (const interaction of interactions) {
          stmt.run(
            interaction.timestamp,
            interaction.prompt,
            interaction.enhanced,
            interaction.mode,
            interaction.provider,
            interaction.model,
            interaction.use_ai,
            interaction.tokens_used,
            interaction.response_time,
            typeof interaction.metadata === 'string' ? interaction.metadata : JSON.stringify(interaction.metadata)
          );
        }
      });
      
      importMany(data.interactions);
      return true;
    } catch (error) {
      console.error('Failed to import history:', error.message);
      return false;
    }
  }

  /**
   * Get conversation context
   */
  async getContext(limit = 5) {
    const recent = await this.getRecent(limit);
    return recent.reverse().map(interaction => ({
      prompt: interaction.prompt,
      response: interaction.enhanced,
      timestamp: interaction.timestamp
    }));
  }

  /**
   * Clear all history
   */
  async clear() {
    try {
      this.db.exec('DELETE FROM interactions');
      this.db.exec('DELETE FROM sessions');
      this.db.exec('DELETE FROM session_interactions');
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error.message);
      return false;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = ConversationHistory;
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'procurement.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  // Migrations: add columns if missing
  try { db.run("SELECT item_code FROM items LIMIT 0"); } catch (e) {
    db.run("ALTER TABLE items ADD COLUMN item_code TEXT");
    console.log('Migration: added item_code to items');
  }

  // Save after schema creation
  save();

  console.log('Database initialized successfully');
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function save() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: run a write query and auto-save. Returns the last_insert_rowid for INSERT statements.
function runAndSave(sql, params = []) {
  db.run(sql, params);
  // Capture last_insert_rowid BEFORE save (db.export() resets it)
  const stmtId = db.prepare('SELECT last_insert_rowid() as id');
  let insertId = null;
  if (stmtId.step()) {
    insertId = stmtId.getAsObject().id;
  }
  stmtId.free();
  save();
  return insertId;
}

// Helper: get multiple rows
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: get single row
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  let row = null;
  if (params.length > 0) {
    stmt.bind(params);
  }
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

module.exports = { initDb, getDb, save, runAndSave, queryAll, queryOne };

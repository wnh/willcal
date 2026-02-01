export function testDatabase() {
  console.log('Initializing SQLite...');

  const { Database } = require('node-sqlite3-wasm');
  console.log('SQLite module loaded');

  const db = new Database(':memory:');
  console.log('Database opened');

  db.exec(`
    CREATE TABLE test (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
  `);

  db.run('INSERT INTO test (name) VALUES (?)', ['Hello']);
  db.run('INSERT INTO test (name) VALUES (?)', ['World']);

  console.log('Test table created and populated');

  const results = db.all('SELECT * FROM test');
  console.log('Query results:', results);

  db.close();
  console.log('Database closed');
}

const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '172.18.0.2',
      user: 'admin',
      password: 'admin123',
      database: 'CatalogoProductos',
      port: 7001
    });

    const [rows] = await conn.query('SELECT COUNT(*) total FROM Productos');
    console.log(rows);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
}

test();
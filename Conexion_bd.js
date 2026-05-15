
const sql = require('mssql')

// ── CONFIGURACIÓN ──
const config = {
  user: 'sa',
  password: 'OfiHaguas$',
  server: '192.168.10.19', 
  database: 'OfiHotel001',
  port: 1433, 
  options: {
    encrypt: false, 
    trustServerCertificate: true, 

    cryptoCredentialsDetails: {
      minVersion: 'TLSv1'
    }
  }
};

// ── POOL ──
let pool = null

async function getPool() {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect()
    console.log('Conectado a SQL Server ✓')
  }

  return pool
}

module.exports = {
  sql,
  getPool
}










// // ══════════════════════════════════════════
// //  DB.JS — Conexión y consultas SQL Server
// // ══════════════════════════════════════════

// const sql = require('mssql')

// ── CONFIGURACIÓN ──
// const config = {
//   user: 'sa',
//   password: 'OfiHaguas$',
//   server: '192.168.10.19', 
//   database: 'OfiHotel001',
//   port: 1433, 
//   options: {
//     encrypt: false, 
//     trustServerCertificate: true, 

//     cryptoCredentialsDetails: {
//       minVersion: 'TLSv1'
//     }
//   }
// };

// ── Pool de conexión  ──
// let pool = null

// async function getPool() {
//   if (!pool) {
//     pool = await new sql.ConnectionPool(config).connect()
//     console.log('Conectado a SQL Server ✓')
//   }
//   return pool
// }






// backend/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

// Configuración de RDS (MySQL local en Floci)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'CatalogoProductos',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// Configuración de AWS apuntando a Floci (LocalStack / endpoint local en puerto 4566)
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
  s3ForcePathStyle: true, // Necesario para S3 emulado localmente
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports = { pool, s3, dynamodb, lambda };
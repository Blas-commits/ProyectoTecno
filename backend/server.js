const express = require('express');
const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de Multer para la recepción de archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Configuración de AWS SDK para LocalStack
const s3 = new AWS.S3({
    endpoint: 'http://localhost:4566',
    s3ForcePathStyle: true,
    region: 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test'
});

const lambda = new AWS.Lambda({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test'
});

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test'
});

// Conexión a RDS (MySQL)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'CatalogoProductos',
    port: process.env.DB_PORT || 3306
});

// ========================================
// ENDPOINT: Obtener Categorías
// ========================================
app.get('/categorias', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT categoria_id, nombre FROM Categorias');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// ========================================
// ENDPOINT: Registrar Producto (RDS + DynamoDB)
// ========================================
app.post('/productos', async (req, res) => {
    try {
        const { codigo, nombre, descripcion, precio, categoria_id, atributos } = req.body;
        const producto_id = uuidv4();
        const estado = 'PENDIENTE';

        // 1. Insertar en RDS
        await pool.query(
            `INSERT INTO Productos (producto_id, codigo, nombre, descripcion, precio, categoria_id, estado, fecha_registro) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [producto_id, codigo, nombre, descripcion, precio, categoria_id, estado]
        );

        // 2. Insertar atributos dinámicos en DynamoDB
        await dynamodb.put({
            TableName: process.env.DYNAMO_TABLE || 'ProductosMetadata',
            Item: {
                producto_id: producto_id.toString(),
                atributos: atributos || {}
            }
        }).promise();

        res.status(201).json({
            mensaje: "Producto registrado exitosamente en RDS y DynamoDB",
            producto_id,
            estado
        });

    } catch (error) {
        console.error("Error al registrar producto:", error);
        res.status(500).json({ error: error.message || "Error al registrar el producto" });
    }
});

// ========================================
// ENDPOINT: Listar todos los productos
// ========================================
app.get('/productos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.producto_id, p.codigo, p.nombre, p.descripcion, p.precio, p.estado, 
                   c.nombre AS categoria_nombre 
            FROM Productos p
            LEFT JOIN Categorias c ON p.categoria_id = c.categoria_id
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error al listar productos:", error);
        res.status(500).json({ error: "Error al obtener el catálogo" });
    }
});

// ========================================
// ENDPOINT: Obtener detalle de un producto (RDS + DynamoDB)
// ========================================
app.get('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM Productos p
            LEFT JOIN Categorias c ON p.categoria_id = c.categoria_id
            WHERE p.producto_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const producto = rows[0];

        let atributos = {};
        try {
            const dynamoData = await dynamodb.get({
                TableName: process.env.DYNAMO_TABLE || 'ProductosMetadata',
                Key: { producto_id: id.toString() }
            }).promise();

            if (dynamoData.Item && dynamoData.Item.atributos) {
                atributos = dynamoData.Item.atributos;
            }
        } catch (dynamoErr) {
            console.warn("No se pudieron cargar los atributos de DynamoDB:", dynamoErr);
        }

        res.json({
            ...producto,
            atributos
        });

    } catch (error) {
        console.error("Error al obtener detalle:", error);
        res.status(500).json({ error: "Error al obtener el detalle del producto" });
    }
});

// ========================================
// ENDPOINT: Subir Imagen, S3, Lambda y Publicar
// ========================================
app.post('/productos/:id/imagen', upload.single('imagen'), async (req, res) => {
    try {
        const { id: producto_id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
        }

        const originalKey = `originals/${producto_id}-${file.originalname}`;
        
        // 1. Subir imagen original a S3
        await s3.putObject({
            Bucket: process.env.S3_BUCKET_ORIGINALS || 'catalogo-originales',
            Key: originalKey,
            Body: file.buffer,
            ContentType: file.mimetype
        }).promise();

        // 2. Invocar la función Lambda para procesar la imagen
        const lambdaPayload = {
            producto_id,
            original_key: originalKey
        };

        const lambdaResponse = await lambda.invoke({
            FunctionName: 'procesar-imagen',
            Payload: JSON.stringify(lambdaPayload)
        }).promise();

        let lambdaResult;
        try {
            lambdaResult = JSON.parse(lambdaResponse.Payload);
        } catch (e) {
            lambdaResult = lambdaResponse.Payload;
        }

        const dataLambda = typeof lambdaResult === 'string' ? JSON.parse(lambdaResult) : lambdaResult;
        const miniaturaKey = dataLambda.miniatura_key || 'miniatures/dummy-miniatura.jpg';
        console.log("Lambda Response:");
        console.log(lambdaResponse);

        console.log("Lambda Result:");
        console.log(dataLambda);

        // 3. Actualizar metadatos en DynamoDB
        await dynamodb.update({
            TableName: process.env.DYNAMO_TABLE || 'ProductosMetadata',
            Key: { producto_id: producto_id.toString() },
            UpdateExpression: 'set imagen_original_key = :o, miniatura_key = :m, estado_procesamiento = :e',
            ExpressionAttributeValues: {
                ':o': originalKey,
                ':m': miniaturaKey,
                ':e': 'LISTA'
            }
        }).promise();

        // 4. Cambiar estado a PUBLICADO en RDS
        await pool.query("UPDATE Productos SET estado = 'PUBLICADO' WHERE producto_id = ?", [producto_id]);

        res.json({
            mensaje: "Producto publicado exitosamente",
            estado: "PUBLICADO"
        });

    } catch (error) {
        console.error("Error en la cadena de servicios:", error);
        res.status(500).json({ error: "Fallo en la cadena de servicios (S3/Lambda/RDS)", details: error.message });
    }
});

// ========================================
// ENDPOINT: Obtener/Descargar Imagen de S3
// ========================================
app.get('/productos/:id/imagen', async (req, res) => {
    try {

        const { id: producto_id } = req.params;

        const dynamoData = await dynamodb.get({
            TableName: process.env.DYNAMO_TABLE || 'ProductosMetadata',
            Key: {
                producto_id: producto_id.toString()
            }
        }).promise();

        if (!dynamoData.Item) {
            return res.status(404).json({
                error: "Metadatos no encontrados"
            });
        }

        const imageKey =
            dynamoData.Item.imagen_original_key;

        const objeto = await s3.getObject({
            Bucket: 'catalogo-originales',
            Key: imageKey
        }).promise();

        res.setHeader(
            'Content-Type',
            objeto.ContentType
        );

        res.send(objeto.Body);

    } catch (error) {

        console.error(error);

        res.status(404).json({
            error: 'Imagen no encontrada'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
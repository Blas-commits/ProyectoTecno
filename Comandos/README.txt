PROYECTO TECNO
INSTALACIÓN Y EJECUCIÓN

========================================
1. REQUISITOS
========================================

- Docker Desktop
- AWS CLI
- PowerShell
- Floci

========================================
2. LEVANTAR FLOCI
========================================

Ubicarse en la carpeta del proyecto:

cd ProyectoTecno

Ejecutar:

docker compose up -d

Verificar:

docker ps

Debe aparecer:

floci

========================================
3. VERIFICAR FLOCI
========================================

curl http://localhost:4566

Debe responder correctamente.

========================================
4. CREAR RDS
========================================

aws rds create-db-instance `
  --db-instance-identifier catalogo-db `
  --engine mysql `
  --master-username admin `
  --master-user-password admin123 `
  --db-instance-class db.t3.micro `
  --allocated-storage 20 `
  --endpoint-url http://localhost:4566

Verificar:

aws rds describe-db-instances `
  --endpoint-url http://localhost:4566

========================================
5. CONECTARSE A MYSQL
========================================

docker exec -it floci-rds-db-XXXXXXXX mysql -u admin -p

Contraseña:

admin123

========================================
6. CREAR BASE DE DATOS
========================================

CREATE DATABASE CatalogoProductos;

USE CatalogoProductos;

========================================
7. CREAR TABLAS
========================================

Ejecutar el script:

crear_tablas.sql

========================================
8. CARGAR DATOS
========================================

Ejecutar el script:

carga_productos.sql

Se cargarán:

- 3 categorías
- 20 productos

========================================
9. PRUEBAS DE VALIDACIÓN
========================================

Código duplicado:

Resultado esperado:
ERROR 1062

Precio negativo:

Resultado esperado:
ERROR 3819

Categoría inexistente:

Resultado esperado:
ERROR 1452

========================================
10. CREAR DYNAMODB
========================================

aws dynamodb create-table `
  --table-name ProductosMetadata `
  --attribute-definitions AttributeName=producto_id,AttributeType=S `
  --key-schema AttributeName=producto_id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --endpoint-url http://localhost:4566

Verificar:

aws dynamodb list-tables `
  --endpoint-url http://localhost:4566

========================================
11. INSERTAR METADATA
========================================

aws dynamodb put-item `
  --table-name ProductosMetadata `
  --item file://producto1.json `
  --endpoint-url http://localhost:4566

aws dynamodb put-item `
  --table-name ProductosMetadata `
  --item file://producto2.json `
  --endpoint-url http://localhost:4566

Consultar:

aws dynamodb scan `
  --table-name ProductosMetadata `
  --endpoint-url http://localhost:4566

========================================
12. CREAR BUCKETS S3
========================================

Bucket originales:

aws s3 mb s3://catalogo-originales `
  --endpoint-url http://localhost:4566

Bucket miniaturas:

aws s3 mb s3://catalogo-miniaturas `
  --endpoint-url http://localhost:4566

Verificar:

aws s3 ls `
  --endpoint-url http://localhost:4566

========================================
13. CREAR LAMBDA
========================================

Crear ZIP:

Compress-Archive `
  -Path app.py `
  -DestinationPath function.zip `
  -Force

Crear Lambda:

aws lambda create-function `
  --function-name procesar-imagen `
  --runtime python3.12 `
  --role arn:aws:iam::000000000000:role/lambda-role `
  --handler app.lambda_handler `
  --zip-file fileb://function.zip `
  --endpoint-url http://localhost:4566

Verificar:

aws lambda list-functions `
  --endpoint-url http://localhost:4566

========================================
14. INVOCAR LAMBDA
========================================

aws lambda invoke `
  --function-name procesar-imagen `
  --payload "{}" `
  salida.json `
  --endpoint-url http://localhost:4566

Ver resultado:

type salida.json

========================================
15. ESTRUCTURA DEL PROYECTO
========================================

ProyectoTecno

├── docker-compose.yml
├── README.txt
├── crear_tablas.sql
├── carga_productos.sql
├── pruebas.sql
├── producto1.json
├── producto2.json
├── app.py
├── function.zip
├── evento.json
└── evidencias

========================================
16. AUTOR
========================================

Jhojan Blas Flores Condori

Parte completada:

- P3 Persistencia (RDS y DynamoDB)
- P4 Almacenamiento y Procesamiento (S3 y Lambda)
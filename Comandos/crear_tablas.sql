CREATE DATABASE IF NOT EXISTS CatalogoProductos;

USE CatalogoProductos;

-- =====================================
-- TABLA CATEGORIAS
-- =====================================

CREATE TABLE Categorias(
    categoria_id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- =====================================
-- TABLA PRODUCTOS
-- =====================================

CREATE TABLE Productos(
    producto_id VARCHAR(36) PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT NOT NULL,
    fecha_registro DATETIME,
    estado VARCHAR(20),

    CONSTRAINT chk_precio
    CHECK(precio >= 0),

    FOREIGN KEY(categoria_id)
    REFERENCES Categorias(categoria_id)
);

-- =====================================
-- CARGA DE CATEGORIAS
-- =====================================

INSERT INTO Categorias VALUES
(1,'Teclados'),
(2,'Monitores'),
(3,'Mouse');
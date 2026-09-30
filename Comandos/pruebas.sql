USE CatalogoProductos;

-- =====================================
-- PRUEBA 1: CODIGO DUPLICADO
-- =====================================

INSERT INTO Productos VALUES(
'P100',
'TEC001',
'Duplicado',
'Prueba',
100,
1,
NOW(),
'ACTIVO'
);

-- Resultado esperado:
-- ERROR 1062 (23000)
-- Duplicate entry 'TEC001'


-- =====================================
-- PRUEBA 2: PRECIO NEGATIVO
-- =====================================

INSERT INTO Productos VALUES(
'P101',
'TST101',
'Producto Prueba',
'Prueba',
-50,
1,
NOW(),
'ACTIVO'
);

-- Resultado esperado:
-- ERROR 3819 (HY000)
-- Check constraint 'chk_precio' is violated


-- =====================================
-- PRUEBA 3: CATEGORIA INEXISTENTE
-- =====================================

INSERT INTO Productos VALUES(
'P102',
'TST102',
'Producto Prueba',
'Prueba',
100,
999,
NOW(),
'ACTIVO'
);

-- Resultado esperado:
-- ERROR 1452 (23000)
-- Foreign key constraint fails
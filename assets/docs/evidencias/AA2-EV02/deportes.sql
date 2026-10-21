-- =============================================================
-- GA6-220501096-AA2-EV02
-- Creación de la estructura de la BD y aplicación de restricciones
-- Base de datos: deportes
-- Motor: MySQL 8 · InnoDB
-- =============================================================

-- 1. Crear la base de datos -----------------------------------
CREATE DATABASE deportes;
USE deportes;

-- 2. Crear las tablas -----------------------------------------
CREATE table Users(
    id_user INT PRIMARY KEY AUTO_INCREMENT,
    NOmnbre VARCHAR(100) NOT NULL,
    Edad int NOT NULL,
    Correo VARCHAR(10) NOT NULL,
    Passwords VARCHAR(100) NOT NULL
);

CREATE TABLE pedido(
    Id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_user INT NOT NULL,
    Fecha DATE NOT NULL,
    FOREIGN KEY (id_user) REFERENCES Users(id_user)
);

CREATE TABLE productos(
    Id_producto INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL
);


CREATE TABLE detalle_pedido (
    Id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    Id_pedido INT NOT NULL,
    Id_producto INT NOT NULL,
    Cantidad INT NOT NULL,
    FOREIGN KEY (Id_pedido) REFERENCES pedido(Id_pedido),
    FOREIGN KEY (Id_producto) REFERENCES productos(Id_producto)
);

-- 3. Verificar la estructura ----------------------------------
SHOW TABLES;
DESCRIBE Users;
DESCRIBE pedido;
DESCRIBE productos;
DESCRIBE detalle_pedido;

-- Restricciones creadas (4 llaves primarias y 3 foráneas)
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'deportes'
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;

-- 4. Datos de prueba (Correo admite máximo 10 caracteres) ------
INSERT INTO Users (NOmnbre, Edad, Correo, Passwords) VALUES
  ('Laura Gómez', 24, 'lg@mail.co', 'Lg#2026'),
  ('Andrés Rojas', 31, 'ar@mail.co', 'Ar#2026');

INSERT INTO productos (Nombre, Precio, Stock) VALUES
  ('Balón de fútbol N.º 5', 89900.00, 30),
  ('Raqueta de tenis', 245000.00, 12),
  ('Camiseta deportiva', 59900.00, 50);

INSERT INTO pedido (id_user, Fecha) VALUES
  (1, '2026-10-20'),
  (2, '2026-10-21');

INSERT INTO detalle_pedido (Id_pedido, Id_producto, Cantidad) VALUES
  (1, 1, 2),
  (1, 3, 3),
  (2, 2, 1);

SELECT p.Id_pedido, u.NOmnbre AS cliente, p.Fecha,
       pr.Nombre AS producto, d.Cantidad
FROM pedido p
JOIN Users u          ON u.id_user = p.id_user
JOIN detalle_pedido d ON d.Id_pedido = p.Id_pedido
JOIN productos pr     ON pr.Id_producto = d.Id_producto
ORDER BY p.Id_pedido;

-- 5. Pruebas de las restricciones ------------------------------
-- Cada sentencia debe FALLAR. Ejecútalas una por una (Ctrl + Enter)
-- y captura el mensaje de error para el documento.

-- PRIMARY KEY duplicada → Error 1062 Duplicate entry '1' for key 'users.PRIMARY'
-- INSERT INTO Users (id_user, NOmnbre, Edad, Correo, Passwords) VALUES (1, 'Repetido', 20, 'x@mail.co', 'x');

-- NOT NULL → Error 1048 Column 'Nombre' cannot be null
-- INSERT INTO productos (Nombre, Precio, Stock) VALUES (NULL, 1000, 1);

-- FOREIGN KEY: usuario inexistente → Error 1452 Cannot add or update a child row
-- INSERT INTO pedido (id_user, Fecha) VALUES (99, '2026-10-21');

-- FOREIGN KEY: producto inexistente → Error 1452 Cannot add or update a child row
-- INSERT INTO detalle_pedido (Id_pedido, Id_producto, Cantidad) VALUES (1, 99, 1);

-- FOREIGN KEY: borrar usuario con pedidos → Error 1451 Cannot delete or update a parent row
-- DELETE FROM Users WHERE id_user = 1;

-- Longitud de VARCHAR(10) → Error 1406 Data too long for column 'Correo'
-- INSERT INTO Users (NOmnbre, Edad, Correo, Passwords) VALUES ('Camila', 19, 'camila.torres@correo.com', 'x');

// ========================================
// CONFIGURACIÓN DE LA API
// ========================================

// IMPORTANTE:
// Por ahora coloca aquí la dirección donde está funcionando
// tu API de la Etapa 4.

const API_URL = "http://localhost:3000";


// ========================================
// CAMBIO DE VISTAS
// ========================================

function mostrarVista(vista) {

    document.getElementById("vista-registro").style.display = "none";
    document.getElementById("vista-catalogo").style.display = "none";
    document.getElementById("vista-detalle").style.display = "none";

    if (vista === "registro") {
        document.getElementById("vista-registro").style.display = "block";
    }

    if (vista === "catalogo") {
        document.getElementById("vista-catalogo").style.display = "block";

        cargarProductos();
    }

    if (vista === "detalle") {
        document.getElementById("vista-detalle").style.display = "block";
    }
}


// ========================================
// CARGAR CATEGORÍAS
// ========================================

async function cargarCategorias() {

    const select = document.getElementById("categoria");

    try {

        const respuesta = await fetch(`${API_URL}/categorias`);

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }

        const categorias = await respuesta.json();

        console.log("Categorías recibidas:", categorias);

        select.innerHTML = `
            <option value="">
                Seleccionar categoría
            </option>
        `;

        categorias.forEach(categoria => {

            const option = document.createElement("option");

            option.value = categoria.categoria_id;
            option.textContent = categoria.nombre;

            select.appendChild(option);

        });

    } catch (error) {

        console.error("Error cargando categorías:", error);

        select.innerHTML = `
            <option value="">
                Error al cargar categorías
            </option>
        `;
    }
}


// ========================================
// CARGAR PRODUCTOS
// ========================================

async function cargarProductos() {

    const contenedor = document.getElementById("catalogo");

    contenedor.innerHTML = "Cargando productos...";

    try {

        const respuesta = await fetch(
            `${API_URL}/productos`
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }

        const productos = await respuesta.json();

        console.log("Productos recibidos:", productos);

        contenedor.innerHTML = "";

        if (productos.length === 0) {

            contenedor.innerHTML = `
                <p>
                    No hay productos publicados.
                </p>
            `;

            return;
        }

        productos.forEach(producto => {

            const tarjeta = document.createElement("div");

            tarjeta.className = "producto";

            tarjeta.innerHTML = `
                <img
                    src="${API_URL}/productos/${producto.producto_id}/imagen"
                    alt="${producto.nombre}"
                >

                <div class="producto-contenido">

                    <h3>
                        ${producto.nombre}
                    </h3>

                    <p>
                        ${producto.categoria_nombre ?? ""}
                    </p>

                    <p class="precio">
                        $${producto.precio}
                    </p>

                    <button
                        onclick="verDetalle('${producto.producto_id}')"
                    >
                        Ver detalle
                    </button>

                </div>
            `;

            console.log(tarjeta.innerHTML);
            contenedor.appendChild(tarjeta);

        });

    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

        contenedor.innerHTML = `
            <p>
                No se pudo conectar con la API.
            </p>
        `;
    }
}


// ========================================
// VER DETALLE
// ========================================

async function verDetalle(id) {

    mostrarVista("detalle");

    const contenedor = document.getElementById("detalle");

    contenedor.innerHTML = "Cargando producto...";

    try {

        const respuesta = await fetch(
            `${API_URL}/productos/${id}`
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP: ${respuesta.status}`
            );
        }

        const producto = await respuesta.json();

        console.log(
            "Detalle recibido:",
            producto
        );

        contenedor.innerHTML = `
            <h2>
                ${producto.nombre}
            </h2>

            <img
                src="${API_URL}/productos/${producto.producto_id}/imagen"
                alt="${producto.nombre}"
                style="max-width:300px;"
            >

            <p>
                <strong>Código:</strong>
                ${producto.codigo}
            </p>

            <p>
                <strong>Precio:</strong>
                $${producto.precio}
            </p>

            <p>
                <strong>Descripción:</strong>
                ${producto.descripcion}
            </p>

            <p>
                <strong>Categoría:</strong>
                ${producto.categoria_nombre ?? ""}
            </p>

            <h3>Atributos</h3>

<ul>
    ${Object.entries(producto.atributos || {})
                .map(([clave, valor]) =>
                    `<li><strong>${clave}:</strong> ${valor}</li>`
                )
                .join("")
            }
</ul>
        `;

    } catch (error) {

        console.error(
            "Error cargando detalle:",
            error
        );

        contenedor.innerHTML = `
            <p>
                No se pudo obtener el producto.
            </p>
        `;
    }
}


// ========================================
// INICIO
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarCategorias();

        document
            .getElementById("form-producto")
            .addEventListener(
                "submit",
                registrarProducto
            );

    }
);

async function registrarProducto(event) {

    event.preventDefault();

    const mensaje = document.getElementById("mensaje");

    mensaje.innerHTML = "Procesando...";

    try {

        const codigo = document.getElementById("codigo").value;
        const nombre = document.getElementById("nombre").value;
        const descripcion = document.getElementById("descripcion").value;
        const precio = Number(
            document.getElementById("precio").value
        );

        const categoria_id = Number(
            document.getElementById("categoria").value
        );

        const imagen =
            document.getElementById("imagen").files[0];

        const atributos = {};

        document
            .querySelectorAll(".atributo-row")
            .forEach(row => {

                const clave =
                    row.querySelector(
                        ".atributo-clave"
                    ).value.trim();

                const valor =
                    row.querySelector(
                        ".atributo-valor"
                    ).value.trim();

                if (clave && valor) {
                    atributos[clave] = valor;
                }

            });

        console.log("Enviando producto...");

        const respuestaProducto = await fetch(
            `${API_URL}/productos`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    codigo,
                    nombre,
                    descripcion,
                    precio,
                    categoria_id,
                    atributos
                })
            }
        );

        console.log(
            "Status producto:",
            respuestaProducto.status
        );

        const datosProducto =
            await respuestaProducto.json();

        console.log(datosProducto);

        if (!respuestaProducto.ok) {

            mensaje.innerHTML = `
                <p style="color:red">
                    ${datosProducto.error ||
                "Error al registrar"
                }
                </p>
            `;

            return;
        }

        if (imagen) {

            const formData = new FormData();

            formData.append(
                "imagen",
                imagen
            );

            const respuestaImagen =
                await fetch(
                    `${API_URL}/productos/${datosProducto.producto_id}/imagen`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            console.log(
                "Status imagen:",
                respuestaImagen.status
            );

            if (!respuestaImagen.ok) {

                const texto =
                    await respuestaImagen.text();

                mensaje.innerHTML = `
                    <p style="color:orange">
                        Producto creado pero la imagen falló.
                    </p>
                    <pre>${texto}</pre>
                `;

                return;
            }
        }

        mensaje.innerHTML = `
            <p style="color:green">
                ✅ Producto registrado correctamente.
                ID: ${datosProducto.producto_id}
            </p>
        `;

        document
            .getElementById("form-producto")
            .reset();

    } catch (error) {

        console.error(error);

        mensaje.innerHTML = `
            <p style="color:red">
                Error:
                ${error.message}
            </p>
        `;
    }
}

function agregarAtributo() {

    const contenedor =
        document.getElementById(
            "atributos-container"
        );

    const fila =
        document.createElement("div");

    fila.className = "atributo-row";

    fila.innerHTML = `
        <input
            type="text"
            class="atributo-clave"
            placeholder="Nombre del atributo"
        >

        <input
            type="text"
            class="atributo-valor"
            placeholder="Valor"
        >
    `;

    contenedor.appendChild(fila);

}
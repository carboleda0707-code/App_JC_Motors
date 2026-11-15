/**
 * JC Motors - Controlador del Panel Administrativo (5 Secciones)
 */

function cambiarTab(tabId, btn) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.admin-tab').forEach(b => {
        b.classList.remove('bg-red-600', 'text-white');
        b.classList.add('text-gray-600');
    });
    
    if (btn) {
        btn.classList.add('bg-red-600', 'text-white');
        btn.classList.remove('text-gray-600');
        localStorage.setItem('adminActiveTab', tabId);
    }
}

// Al cargar el panel, mantener la última pestaña seleccionada e inicializar datos
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarVehiculosAdmin();
    cargarFooter();
    cargarRegistrosParaMantenimiento('categoria');

    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
        const btnSelector = document.querySelector(`button[onclick*="${savedTab}"]`);
        if (btnSelector) {
            cambiarTab(savedTab, btnSelector);
        }
    }
});

// --- SUBIDA DE ARCHIVOS A CLOUDFLARE R2 ---
async function subirArchivoR2(inputFile, targetInputId) {
    if (!inputFile.files.length) return;
    const formData = new FormData();
    formData.append('file', inputFile.files[0]);

    try {
        const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
            document.getElementById(targetInputId).value = data.url;
            alert('Archivo subido a Cloudflare R2 correctamente.');
        }
    } catch (err) {
        alert('Error subiendo archivo a R2');
    }
}

// --- GESTIÓN GALERÍA VEHÍCULO (4 FOTOS INDIVIDUALES + 1 VIDEO) ---
let galeriaArrayUrls = ["", "", "", "", ""];

async function subirFotoIndividualR2(input, indice) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const statusEl = document.getElementById('galeriaStatus');
    statusEl.innerText = `Subiendo Imagen ${indice + 1}...`;

    try {
        const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
            galeriaArrayUrls[indice] = data.url;
            actualizarGaleriaFinal();
            statusEl.innerText = `✅ Imagen ${indice + 1} subida correctamente.`;
        }
    } catch (err) {
        console.error("Error subiendo archivo:", err);
        statusEl.innerText = "Error al subir la imagen.";
    }
}

async function subirVideoR2(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const statusEl = document.getElementById('galeriaStatus');
    statusEl.innerText = "Subiendo video promocional...";

    try {
        const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
            galeriaArrayUrls[4] = data.url;
            actualizarGaleriaFinal();
            statusEl.innerText = "✅ Video subido correctamente.";
        }
    } catch (err) {
        console.error("Error subiendo video:", err);
        statusEl.innerText = "Error al subir el video.";
    }
}

function actualizarGaleriaFinal() {
    const filtrados = galeriaArrayUrls.filter(u => u !== "");
    document.getElementById('vehGaleriaUrls').value = JSON.stringify(filtrados);
}

// --- SECCIÓN 1: SLIDER ---
async function guardarSlide(e) {
    e.preventDefault();
    const payload = {
        orden: parseInt(document.getElementById('slideOrden').value),
        tiempo_segundos: parseInt(document.getElementById('slideTiempo').value),
        nombre: document.getElementById('slideNombre').value,
        link_disparo: document.getElementById('slideLink').value,
        descripcion: document.getElementById('slideDesc').value,
        imagen_url: document.getElementById('slideImgUrl').value
    };
    const res = await fetch('/api/admin/cms/slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.mensaje);
}

// --- SECCIÓN 2: CATEGORÍAS, VEHÍCULOS Y SKU ---
async function cargarCategorias() {
    try {
        const res = await fetch('/api/admin/cms/categorias');
        const cats = await res.json();
        const select = document.getElementById('vehCategoria');

        if (!select) return;

        select.innerHTML = '<option value="">Seleccione Categoría...</option>';
        cats.forEach(c => {
            select.innerHTML += `<option value="${c.id}" data-cod="${c.codigo}">${c.nombre} (${c.codigo})</option>`;
        });
        autocompletarCodigos();
    } catch (err) {
        console.error("Error al cargar categorías de la base de datos:", err);
    }
}

async function crearCategoria(e) {
    e.preventDefault();
    const payload = {
        codigo: document.getElementById('catCodigo').value.toUpperCase(),
        nombre: document.getElementById('catNombre').value
    };
    await fetch('/api/admin/cms/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    document.getElementById('catCodigo').value = '';
    document.getElementById('catNombre').value = '';
    cargarCategorias();
}

function autocompletarCodigos() {
    const catSelect = document.getElementById('vehCategoria');
    const catCod = catSelect.options[catSelect.selectedIndex]?.dataset?.cod || 'SUV';
    const marca = (document.getElementById('vehMarca').value || 'MAR').substring(0, 3).toUpperCase();
    const modelo = (document.getElementById('vehModelo').value || 'MOD').substring(0, 3).toUpperCase();
    const anio = document.getElementById('vehAnio').value || '2026';
    const color = (document.getElementById('vehColor').value || 'STD').substring(0, 4).toUpperCase();
    const traccion = document.getElementById('veh4x4').checked ? '4X4' : '4X2';
    const motor = document.getElementById('vehHib').checked ? 'HYB' : 'GAS';
    const blindaje = document.getElementById('vehBli').checked ? 'BLI' : 'STD';

    document.getElementById('vehSkuGenerado').value = `${catCod}-${marca}-${modelo}-${anio}-${traccion}-${motor}-${blindaje}-${color}`;
}

async function guardarVehiculo(e) {
    e.preventDefault();
    const marca = document.getElementById('vehMarca').value;
    const modelo = document.getElementById('vehModelo').value;
    const skuCodigo = document.getElementById('vehSkuGenerado').value;
    const categoriaId = document.getElementById('vehCategoria').value;

    if (!categoriaId) {
        alert("Por favor selecciona una categoría válida.");
        return;
    }

    const payload = {
        categoria_id: parseInt(categoriaId),
        marca: marca,
        marca_cod: marca.substring(0, 3).toUpperCase(),
        modelo: modelo,
        modelo_cod: modelo.substring(0, 3).toUpperCase(),
        anio: parseInt(document.getElementById('vehAnio').value),
        precio_contado: parseFloat(document.getElementById('vehPrecio').value),
        destacado: document.getElementById('vehDestacado').checked,
        galeria_urls: JSON.parse(document.getElementById('vehGaleriaUrls').value || '[]'),
        variantes: [{
            sku_codigo: skuCodigo,
            color: document.getElementById('vehColor').value.toUpperCase(),
            traccion: document.getElementById('veh4x4').checked ? '4X4' : '4X2',
            motor: document.getElementById('vehHib').checked ? 'HYB' : 'GAS',
            blindaje: document.getElementById('vehBli').checked ? 'BLI' : 'STD',
            stock: 1
        }]
    };

    try {
        const res = await fetch('/api/admin/cms/vehiculos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert(data.mensaje || "Vehículo registrado correctamente.");
        cargarVehiculosAdmin();
    } catch (err) {
        console.error("Error al guardar el vehículo:", err);
        alert("Ocurrió un error al registrar el vehículo.");
    }
}

async function cargarVehiculosAdmin() {
    try {
        const res = await fetch('/api/admin/cms/vehiculos');
        const lista = await res.json();
        const tbody = document.getElementById('tablaVehiculosAdmin');
        if (!tbody) return;
        tbody.innerHTML = '';

        lista.forEach(v => {
            tbody.innerHTML += `
                <tr>
                    <td class="py-3 font-bold">${v.marca} ${v.modelo}</td>
                    <td class="py-3">${v.anio}</td>
                    <td class="py-3 font-bold text-red-600">$${v.precio_contado.toLocaleString()}</td>
                    <td class="py-3 font-mono text-xs">${v.skus.join(', ')}</td>
                    <td class="py-3">
                        <button onclick="toggleDestacado(${v.id})" class="px-3 py-1 rounded-full text-xs font-bold ${v.destacado ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}">
                            ${v.destacado ? '★ Destacado' : 'Normal'}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error cargando vehículos administrativos:", err);
    }
}

async function toggleDestacado(id) {
    await fetch(`/api/admin/cms/vehiculos/${id}/destacado`, { method: 'PATCH' });
    cargarVehiculosAdmin();
}

// --- SECCIÓN 3: HISTORIAS ---
async function guardarHistoria(e) {
    e.preventDefault();
    const payload = {
        cliente_titulo: document.getElementById('histTitulo').value,
        red_social: document.getElementById('histRed').value,
        comentario: document.getElementById('histComentario').value,
        media_url: document.getElementById('histMediaUrl').value,
        link_post: document.getElementById('histLink').value
    };
    const res = await fetch('/api/admin/cms/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.mensaje);
}

// --- SECCIÓN 4: PUBLICIDAD ---
async function guardarPublicidad(e) {
    e.preventDefault();
    const payload = {
        posicion: parseInt(document.getElementById('pubPosicion').value),
        tipo_media: document.getElementById('pubTipo').value,
        titulo: document.getElementById('pubTitulo').value,
        link_destino: document.getElementById('pubLink').value,
        media_url: document.getElementById('pubMediaUrl').value
    };
    const res = await fetch('/api/admin/cms/publicidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.mensaje);
}

// --- SECCIÓN 5: FOOTER ---
async function cargarFooter() {
    try {
        const res = await fetch('/api/admin/cms/footer');
        const data = await res.json();
        document.getElementById('footDesc').value = data.descripcion_empresa || '';
        document.getElementById('footDir').value = data.direccion || '';
        document.getElementById('footTel').value = data.telefono_whatsapp || '';
        document.getElementById('footEmail').value = data.email_contacto || '';
        document.getElementById('footIg').value = data.url_instagram || '';
    } catch (err) {
        console.error("Error cargando footer:", err);
    }
}

async function guardarFooter(e) {
    e.preventDefault();
    const payload = {
        descripcion_empresa: document.getElementById('footDesc').value,
        direccion: document.getElementById('footDir').value,
        telefono_whatsapp: document.getElementById('footTel').value,
        email_contacto: document.getElementById('footEmail').value,
        url_instagram: document.getElementById('footIg').value
    };
    const res = await fetch('/api/admin/cms/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.mensaje);
}

// --- MANTENIMIENTO DINÁMICO (CATEGORÍA - MARCA - MODELO) ---
let entidadActualMant = 'categoria';

function cambiarEntidadMantenimiento(tipo) {
    entidadActualMant = tipo;
    const inputCod = document.getElementById('mantCodigo');
    const inputNom = document.getElementById('mantNombre');
    const selectPadre = document.getElementById('mantMarcaPadre');
    const selectExistente = document.getElementById('mantRegistroExistente');
    const btnGuardar = document.getElementById('btnGuardarMant');

    if (inputCod) {
        inputCod.value = '';
        inputCod.classList.remove('hidden');
        inputCod.required = true;
    }
    if (inputNom) inputNom.value = '';
    if (selectExistente) selectExistente.innerHTML = '<option value="">-- Nuevo Registro --</option>';

    if (tipo === 'categoria') {
        if (selectPadre) {
            selectPadre.classList.add('hidden');
            selectPadre.required = false;
        }
        if (inputCod) inputCod.placeholder = 'CÓDIGO (Ej: SUV)';
        if (inputNom) inputNom.placeholder = 'Nombre Categoría (Ej: SUV / Todoterreno)';
        if (btnGuardar) btnGuardar.innerText = 'Guardar Categoría';
    } else if (tipo === 'marca') {
        if (selectPadre) {
            selectPadre.classList.add('hidden');
            selectPadre.required = false;
        }
        if (inputCod) inputCod.placeholder = 'CÓD (Ej: TOY)';
        if (inputNom) inputNom.placeholder = 'Nombre Marca (Ej: Toyota)';
        if (btnGuardar) btnGuardar.innerText = 'Guardar Marca';
    } else if (tipo === 'modelo') {
        if (selectPadre) {
            selectPadre.classList.remove('hidden');
            selectPadre.required = true;
        }
        if (inputCod) {
            inputCod.classList.add('hidden');
            inputCod.required = false;
        }
        if (inputNom) inputNom.placeholder = 'Nombre Modelo (Ej: RAV4 Limited)';
        if (btnGuardar) btnGuardar.innerText = 'Guardar Modelo';
    }

    cargarRegistrosParaMantenimiento(tipo);
}

async function cargarRegistrosParaMantenimiento(tipo) {
    const selectExistente = document.getElementById('mantRegistroExistente');
    if (!selectExistente) return;

    selectExistente.innerHTML = '<option value="">-- Nuevo Registro --</option>';

    try {
        let endpoint = '/api/admin/cms/categorias';
        if (tipo === 'marca') endpoint = '/api/admin/cms/marcas';
        if (tipo === 'modelo') endpoint = '/api/admin/cms/modelos';

        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();

        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id || item.codigo || item.nombre;
            opt.textContent = tipo === 'modelo' ? `${item.marca || ''} - ${item.nombre}` : `${item.codigo ? item.codigo + ' - ' : ''}${item.nombre}`;
            opt.dataset.codigo = item.codigo || '';
            opt.dataset.nombre = item.nombre || '';
            opt.dataset.marcaId = item.marca_id || '';
            selectExistente.appendChild(opt);
        });
    } catch (err) {
        console.error(`Error cargando registros de ${tipo}:`, err);
    }
}

function cargarDatosEdicion() {
    const select = document.getElementById('mantRegistroExistente');
    const opcion = select.options[select.selectedIndex];
    const btnGuardar = document.getElementById('btnGuardarMant');
    const inputCod = document.getElementById('mantCodigo');
    const inputNom = document.getElementById('mantNombre');
    const selectPadre = document.getElementById('mantMarcaPadre');

    if (!select.value) {
        if (inputCod) inputCod.value = '';
        if (inputNom) inputNom.value = '';
        if (selectPadre) selectPadre.value = '';
        if (btnGuardar) btnGuardar.innerText = `Guardar ${entidadActualMant.charAt(0).toUpperCase() + entidadActualMant.slice(1)}`;
        return;
    }

    if (inputCod) inputCod.value = opcion.dataset.codigo || '';
    if (inputNom) inputNom.value = opcion.dataset.nombre || '';
    if (selectPadre && opcion.dataset.marcaId) selectPadre.value = opcion.dataset.marcaId;
    if (btnGuardar) btnGuardar.innerText = `Actualizar ${entidadActualMant.charAt(0).toUpperCase() + entidadActualMant.slice(1)}`;
}

async function guardarMantenimiento(e) {
    e.preventDefault();
    const idEdicion = document.getElementById('mantRegistroExistente').value;
    const codigo = document.getElementById('mantCodigo')?.value.trim().toUpperCase() || '';
    const nombre = document.getElementById('mantNombre').value.trim();
    const marcaPadre = document.getElementById('mantMarcaPadre')?.value || '';

    let endpoint = '/api/admin/cms/categorias';
    if (entidadActualMant === 'marca') endpoint = '/api/admin/cms/marcas';
    if (entidadActualMant === 'modelo') endpoint = '/api/admin/cms/modelos';

    const payload = {
        codigo: codigo,
        nombre: nombre,
        marca_id: marcaPadre ? parseInt(marcaPadre) : null
    };

    try {
        const method = idEdicion ? 'PUT' : 'POST';
        const url = idEdicion ? `${endpoint}/${idEdicion}` : endpoint;

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert(data.mensaje || "Operación realizada con éxito.");
        
        document.getElementById('formMantenimientoUnificado').reset();
        cambiarEntidadMantenimiento(entidadActualMant);
        cargarCategorias();
    } catch (err) {
        console.error("Error al guardar mantenimiento:", err);
        alert("Ocurrió un error al procesar la solicitud.");
    }
}
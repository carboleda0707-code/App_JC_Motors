/**
 * JC Motors - Controlador del Panel Administrativo (5 Secciones)
 */

function cambiarTab(tabId, btn) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.admin-tab').forEach(b => {
        b.classList.remove('bg-red-600', 'text-white');
        b.classList.add('text-gray-600');
    });
    btn.classList.add('bg-red-600', 'text-white');
    btn.classList.remove('text-gray-600');
}

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

// --- GESTIÓN GALERÍA VEHÍCULO (4 FOTOS + 1 VIDEO) ---
let urlsFotosTemp = [];
let urlVideoTemp = "";

async function subirGaleriaFotosR2(inputFiles) {
    if (!inputFiles.files.length) return;
    if (inputFiles.files.length > 4) {
        alert("Por favor selecciona máximo 4 fotos (gráficos).");
        return;
    }
    
    urlsFotosTemp = [];
    document.getElementById('galeriaStatus').innerText = 'Subiendo fotos a R2...';

    for (const file of inputFiles.files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) urlsFotosTemp.push(data.url);
    }
    actualizarGaleriaFinal();
}

async function subirVideoR2(inputFile) {
    if (!inputFile.files.length) return;
    const file = inputFile.files[0];
    
    document.getElementById('galeriaStatus').innerText = 'Subiendo video a R2...';
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
            urlVideoTemp = data.url;
        }
    } catch (err) {
        alert('Error subiendo video a R2');
    }
    actualizarGaleriaFinal();
}

function actualizarGaleriaFinal() {
    const galeriaCompleta = [...urlsFotosTemp];
    if (urlVideoTemp) {
        galeriaCompleta.push(urlVideoTemp);
    }
    document.getElementById('vehGaleriaUrls').value = JSON.stringify(galeriaCompleta);
    document.getElementById('galeriaStatus').innerText = `✅ Galería lista: ${urlsFotosTemp.length} foto(s) y ${urlVideoTemp ? '1 video' : '0 videos'} subidos.`;
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
    const res = await fetch('/api/admin/cms/categorias');
    const cats = await res.json();
    const select = document.getElementById('vehCategoria');
    const lista = document.getElementById('listaCategorias');

    select.innerHTML = '';
    lista.innerHTML = '';
    cats.forEach(c => {
        select.innerHTML += `<option value="${c.id}" data-cod="${c.codigo}">${c.nombre} (${c.codigo})</option>`;
        lista.innerHTML += `<span class="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-xs font-bold">${c.codigo} - ${c.nombre}</span>`;
    });
    autocompletarCodigos();
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

    const payload = {
        categoria_id: parseInt(document.getElementById('vehCategoria').value),
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

    const res = await fetch('/api/admin/cms/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    alert(data.mensaje);
    cargarVehiculosAdmin();
}

async function cargarVehiculosAdmin() {
    const res = await fetch('/api/admin/cms/vehiculos');
    const lista = await res.json();
    const tbody = document.getElementById('tablaVehiculosAdmin');
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
    const res = await fetch('/api/admin/cms/footer');
    const data = await res.json();
    document.getElementById('footDesc').value = data.descripcion_empresa || '';
    document.getElementById('footDir').value = data.direccion || '';
    document.getElementById('footTel').value = data.telefono_whatsapp || '';
    document.getElementById('footEmail').value = data.email_contacto || '';
    document.getElementById('footIg').value = data.url_instagram || '';
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

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarVehiculosAdmin();
    cargarFooter();
});
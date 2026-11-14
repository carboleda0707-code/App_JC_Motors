/**
 * JC Motors - Controlador Dinámico de la Tienda Pública
 */

let slidesData = [];
let slideIndex = 0;
let slideTimer = null;
let vehiculosActuales = [];
let telefonoWhatsappGlobal = "593999999999";

async function inicializarTienda() {
    try {
        const res = await fetch('/api/tienda/inicio');
        const data = await res.json();

        // 1. Cargar categorías en el selector de filtros
        const selectCat = document.getElementById('filtroTipo');
        if (selectCat && data.categorias && data.categorias.length > 0) {
            selectCat.innerHTML = `<option value="ALL">Todas las Categorías</option>`;
            data.categorias.forEach(c => {
                selectCat.innerHTML += `<option value="${c.codigo}">${c.nombre}</option>`;
            });
        }

        // 2. Renderizar Slider (Sección 1)
        if (data.slider && data.slider.length > 0) {
            slidesData = data.slider;
            iniciarSlider();
        }

        // 3. Renderizar Vehículos Destacados por defecto (Sección 2)
        vehiculosActuales = data.destacados || [];
        renderizarVehiculos(vehiculosActuales, true);

        // 4. Renderizar Historias de Autos Vendidos (Sección 3)
        renderizarHistorias(data.historias || []);

        // 5. Renderizar 3 Espacios Publicitarios (Sección 4)
        renderizarPublicidad(data.publicidad || []);

        // 6. Renderizar Pie de Página (Sección 5)
        if (data.footer) {
            renderizarFooter(data.footer);
        }
    } catch (error) {
        console.error("Error cargando datos de la tienda:", error);
    }
}

// --- SECCIÓN 1: SLIDER AUTOMÁTICO CON TIEMPO CONFIGURABLE ---
function iniciarSlider() {
    mostrarSlide(0);
}

function mostrarSlide(index) {
    if (!slidesData.length) return;
    slideIndex = index % slidesData.length;
    const slide = slidesData[slideIndex];

    const imgEl = document.getElementById('sliderImg');
    const titEl = document.getElementById('sliderTitulo');
    const descEl = document.getElementById('sliderDescripcion');
    const linkEl = document.getElementById('sliderLink');

    if (imgEl) imgEl.src = slide.imagen_url;
    if (titEl) titEl.innerText = slide.nombre;
    if (descEl) descEl.innerText = slide.descripcion || '';
    if (linkEl) linkEl.href = slide.link_disparo || '#categorias';

    const dotsContainer = document.getElementById('sliderDots');
    if (dotsContainer) {
        dotsContainer.innerHTML = slidesData.map((_, i) => `
            <button onclick="mostrarSlide(${i})" class="h-2 rounded-full transition-all ${i === slideIndex ? 'w-8 bg-red-600' : 'w-2 bg-white/40'}"></button>
        `).join('');
    }

    clearTimeout(slideTimer);
    const ms = (slide.tiempo_segundos || 5) * 1000;
    slideTimer = setTimeout(() => mostrarSlide(slideIndex + 1), ms);
}

// --- SECCIÓN 2: FILTRADO Y RENDERIZADO DE CATÁLOGO ---
function actualizarSKUPreview() {
    const tipo = document.getElementById('filtroTipo')?.value || 'ALL';
    const marca = document.getElementById('filtroMarca')?.value || 'ALL';
    const anio = document.getElementById('filtroAnio')?.value || 'ALL';
    const traccion = document.getElementById('filtro4x4')?.checked ? '4X4' : '4X2';
    const hibrido = document.getElementById('filtroHibrido')?.checked ? 'HYB' : 'GAS';
    const blindado = document.getElementById('filtroBlindado')?.checked ? 'BLI' : 'STD';

    const previewEl = document.getElementById('skuPreview');
    if (previewEl) {
        previewEl.innerText = `${tipo}-${marca}-${anio === '' ? 'ALL' : anio}-${traccion}-${hibrido}-${blindado}`;
    }
}

async function aplicarFiltrosTienda() {
    actualizarSKUPreview();

    const params = new URLSearchParams({
        categoria_cod: document.getElementById('filtroTipo')?.value || 'ALL',
        marca_cod: document.getElementById('filtroMarca')?.value || 'ALL',
        es_4x4: document.getElementById('filtro4x4')?.checked || false,
        es_hibrido: document.getElementById('filtroHibrido')?.checked || false,
        es_blindado: document.getElementById('filtroBlindado')?.checked || false
    });

    const anio = document.getElementById('filtroAnio')?.value;
    if (anio) params.append('anio', anio);

    try {
        const res = await fetch(`/api/tienda/vehiculos?${params.toString()}`);
        vehiculosActuales = await res.json();
        renderizarVehiculos(vehiculosActuales, false);
    } catch (err) {
        console.error("Error filtrando vehículos:", err);
    }
}

async function resetearFiltros() {
    if (document.getElementById('filtroTipo')) document.getElementById('filtroTipo').value = 'ALL';
    if (document.getElementById('filtroMarca')) document.getElementById('filtroMarca').value = 'ALL';
    if (document.getElementById('filtroAnio')) document.getElementById('filtroAnio').value = '';
    if (document.getElementById('filtro4x4')) document.getElementById('filtro4x4').checked = false;
    if (document.getElementById('filtroHibrido')) document.getElementById('filtroHibrido').checked = false;
    if (document.getElementById('filtroBlindado')) document.getElementById('filtroBlindado').checked = false;
    
    actualizarSKUPreview();

    try {
        const res = await fetch('/api/tienda/vehiculos?solo_destacados=true');
        vehiculosActuales = await res.json();
        renderizarVehiculos(vehiculosActuales, true);
    } catch (err) {
        console.error("Error reseteando filtros:", err);
    }
}

function renderizarVehiculos(lista, esDestacado) {
    const grid = document.getElementById('gridVehiculos');
    if (!grid) return;

    const sub = document.getElementById('catalogoSubtitulo');
    const tit = document.getElementById('catalogoTitulo');
    const cont = document.getElementById('contadorResultados');

    if (sub) sub.innerText = esDestacado ? 'Vitrina Exclusiva' : 'Resultados de Búsqueda';
    if (tit) tit.innerText = esDestacado ? 'Vehículos Destacados' : 'Inventario Filtrado';
    if (cont) cont.innerText = `${lista.length} vehículo(s) disponible(s)`;

    if (!lista.length) {
        grid.innerHTML = `<div class="col-span-3 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">No se encontraron vehículos con esos filtros.</div>`;
        return;
    }

    grid.innerHTML = lista.map((v, idx) => {
        const imgPortada = (v.galeria_urls && v.galeria_urls.length > 0)
            ? v.galeria_urls[0]
            : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
        const primerSku = (v.variantes && v.variantes.length > 0) ? v.variantes[0].sku_codigo : 'SIN-SKU';

        return `
            <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col justify-between group">
                <div class="relative overflow-hidden h-56 bg-gray-100">
                    <img src="${imgPortada}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <span class="absolute top-3 right-3 bg-black/75 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-lg">${v.anio}</span>
                </div>
                <div class="p-6">
                    <span class="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">${v.marca}</span>
                    <h3 class="text-xl font-bold mt-2 text-gray-900">${v.marca} ${v.modelo}</h3>
                    <p class="text-xs text-gray-400 font-mono mt-1">SKU: ${primerSku}</p>
                    <div class="mt-6 flex justify-between items-center border-t border-gray-100 pt-4">
                        <div>
                            <span class="text-xs text-gray-400 block">Precio Contado</span>
                            <span class="text-2xl font-black text-gray-900">$${v.precio_contado.toLocaleString()}</span>
                        </div>
                        <button onclick="abrirModalVehiculo(${idx})" class="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1.5">
                            Ver Detalle <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- MODAL DETALLE VEHÍCULO Y VARIANTES SKU ---
function abrirModalVehiculo(index) {
    const v = vehiculosActuales[index];
    if (!v) return;

    const titEl = document.getElementById('modalTituloVehiculo');
    if (titEl) titEl.innerText = `${v.marca} ${v.modelo} (${v.anio})`;

    const galeria = (v.galeria_urls && v.galeria_urls.length > 0)
        ? v.galeria_urls
        : ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'];

    cambiarVisor(galeria[0]);
    const thumbs = document.getElementById('modalMiniaturas');
    if (thumbs) {
        thumbs.innerHTML = galeria.map(url => {
            const esVideo = url.match(/\.(mp4|webm|mov)$/i);
            return `
                <div onclick="cambiarVisor('${url}')" class="cursor-pointer rounded-xl overflow-hidden h-16 border-2 border-gray-200 hover:border-red-600 bg-black relative flex items-center justify-center">
                    ${esVideo ? '<i class="fa-solid fa-play text-white text-sm"></i>' : `<img src="${url}" class="w-full h-full object-cover">`}
                </div>
            `;
        }).join('');
    }

    const selectVar = document.getElementById('selectVarianteModal');
    if (selectVar && v.variantes) {
        selectVar.innerHTML = v.variantes.map((s, i) => `
            <option value="${i}">${s.color} • ${s.traccion} • ${s.motor} (${s.sku_codigo})</option>
        `).join('');
        selectVar.dataset.vehiculoIdx = index;
    }
    seleccionarVarianteModal();

    const modalEl = document.getElementById('modalVehiculo');
    if (modalEl) modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function seleccionarVarianteModal() {
    const selectVar = document.getElementById('selectVarianteModal');
    if (!selectVar) return;

    const v = vehiculosActuales[selectVar.dataset.vehiculoIdx];
    if (!v || !v.variantes) return;

    const s = v.variantes[selectVar.value];
    if (!s) return;

    const badge = document.getElementById('modalSkuBadge');
    const precio = document.getElementById('modalPrecioFinal');
    const info = document.getElementById('detalleVarianteInfo');
    const btnWp = document.getElementById('btnCotizarWhatsapp');

    if (badge) badge.innerText = `SKU: ${s.sku_codigo}`;
    if (precio) precio.innerText = `$${s.precio.toLocaleString()}`;
    if (info) {
        info.innerHTML = `
            <p><b>Color:</b> ${s.color}</p>
            <p><b>Tracción:</b> ${s.traccion} | <b>Motor:</b> ${s.motor}</p>
            <p><b>Blindaje:</b> ${s.blindaje} | <b>Disponibles:</b> ${s.stock} unid.</p>
        `;
    }

    if (btnWp) {
        const msg = encodeURIComponent(`Hola JC Motors, me interesa cotizar el ${v.marca} ${v.modelo} ${v.anio} con SKU: ${s.sku_codigo} ($${s.precio.toLocaleString()}).`);
        btnWp.href = `https://wa.me/${telefonoWhatsappGlobal}?text=${msg}`;
    }
}

function cambiarVisor(url) {
    const imgEl = document.getElementById('imgPrincipal');
    const videoEl = document.getElementById('videoPrincipal');
    if (!imgEl || !videoEl) return;

    const esVideo = url.match(/\.(mp4|webm|mov)$/i);
    if (esVideo) {
        imgEl.classList.add('hidden');
        videoEl.src = url;
        videoEl.classList.remove('hidden');
        videoEl.play();
    } else {
        videoEl.pause();
        videoEl.classList.add('hidden');
        imgEl.src = url;
        imgEl.classList.remove('hidden');
    }
}

function cerrarModalVehiculo() {
    const videoEl = document.getElementById('videoPrincipal');
    if (videoEl) videoEl.pause();
    const modalEl = document.getElementById('modalVehiculo');
    if (modalEl) modalEl.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// --- SECCIÓN 3: HISTORIAS DE AUTOS VENDIDOS ---
function renderizarHistorias(historias) {
    const grid = document.getElementById('gridHistorias');
    if (!grid) return;

    if (!historias.length) {
        grid.innerHTML = `<p class="text-sm text-gray-400 col-span-4">Próximamente nuevas entregas de clientes.</p>`;
        return;
    }

    grid.innerHTML = historias.map(h => `
        <div class="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 flex flex-col justify-between">
            <div class="h-48 bg-black relative">
                <img src="${h.media_url}" class="w-full h-full object-cover">
                <span class="absolute top-2.5 left-2.5 bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">${h.red_social}</span>
            </div>
            <div class="p-4">
                <h4 class="font-bold text-gray-900 text-sm">${h.cliente_titulo}</h4>
                <p class="text-xs text-gray-500 mt-1">${h.comentario || ''}</p>
                ${h.link_post ? `<a href="${h.link_post}" target="_blank" class="text-xs text-red-600 font-bold mt-3 inline-block hover:underline">Ver publicación →</a>` : ''}
            </div>
        </div>
    `).join('');
}

// --- SECCIÓN 4: PUBLICIDAD (3 BANNERS O VIDEOS) ---
function renderizarPublicidad(items) {
    const grid = document.getElementById('gridPublicidad');
    if (!grid) return;

    if (!items.length) return;

    grid.innerHTML = items.map(p => `
        <a href="${p.link_destino || '#financiamiento'}" class="group block rounded-2xl overflow-hidden shadow-md border border-gray-200 relative h-64 bg-gray-900">
            ${p.tipo_media === 'video'
                ? `<video src="${p.media_url}" autoplay muted loop playsinline class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition"></video>`
                : `<img src="${p.media_url}" class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition">`
            }
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-5">
                <h3 class="text-white font-black text-lg">${p.titulo}</h3>
            </div>
        </a>
    `).join('');
}

// --- SECCIÓN 5: PIE DE PÁGINA ---
function renderizarFooter(f) {
    if (f.descripcion_empresa && document.getElementById('footerDescripcion')) {
        document.getElementById('footerDescripcion').innerText = f.descripcion_empresa;
    }
    if (f.direccion && document.getElementById('footerDireccion')) {
        document.getElementById('footerDireccion').innerText = f.direccion;
    }
    if (f.telefono_whatsapp) {
        if (document.getElementById('footerTelefono')) {
            document.getElementById('footerTelefono').innerText = f.telefono_whatsapp;
        }
        telefonoWhatsappGlobal = f.telefono_whatsapp.replace(/\D/g, '');
    }
    if (f.email_contacto && document.getElementById('footerEmail')) {
        document.getElementById('footerEmail').innerText = f.email_contacto;
    }
    if (f.url_instagram && document.getElementById('footerIg')) {
        document.getElementById('footerIg').href = f.url_instagram;
    }
    if (f.url_facebook && document.getElementById('footerFb')) {
        document.getElementById('footerFb').href = f.url_facebook;
    }
    if (f.url_tiktok && document.getElementById('footerTk')) {
        document.getElementById('footerTk').href = f.url_tiktok;
    }
}

function abrirCarrito() {
    window.open(`https://wa.me/${telefonoWhatsappGlobal}?text=${encodeURIComponent('Hola JC Motors, deseo solicitar una cotización.')}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarSKUPreview();
    inicializarTienda();
});
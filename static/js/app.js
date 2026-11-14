/**
 * JC Motors - Lógica y Control de la Tienda Web y Modales
 * Arquitectura modular sin código quemado
 */

function actualizarSKUDinamico() {
    const tipo = document.getElementById('filtroTipo')?.value || 'SUV';
    const marca = document.getElementById('filtroMarca')?.value || 'TOY';
    const anio = document.getElementById('filtroAnio')?.value || '2026';
    const traccion = document.getElementById('filtro4x4')?.checked ? '4X4' : '4X2';
    const hibrido = document.getElementById('filtroHibrido')?.checked ? 'HYB' : 'GAS';
    const blindado = document.getElementById('filtroBlindado')?.checked ? 'BLI' : 'STD';

    const sku = `${tipo}-${marca}-${anio}-${traccion}-${hibrido}-${blindado}`;
    const previewEl = document.getElementById('skuPreview');
    if (previewEl) {
        previewEl.innerText = sku;
    }
}

function abrirModalVehiculo(nombreVehiculo) {
    const tituloEl = document.getElementById('modalTituloVehiculo');
    if (tituloEl) {
        tituloEl.innerText = nombreVehiculo;
    }
    const modalEl = document.getElementById('modalVehiculo');
    if (modalEl) {
        modalEl.classList.remove('hidden');
    }
    document.body.style.overflow = 'hidden';
    actualizarSKUModal();
}

function cerrarModalVehiculo() {
    const modalEl = document.getElementById('modalVehiculo');
    if (modalEl) {
        modalEl.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
}

function cambiarVisor(tipo, source, elementoMiniatura) {
    const imgEl = document.getElementById('imgPrincipal');
    const videoEl = document.getElementById('videoPrincipal');

    if (!imgEl || !videoEl) return;

    document.querySelectorAll('.thumbnail-item').forEach(el => {
        el.classList.remove('border-red-600');
        el.classList.add('border-transparent');
    });
    
    if (elementoMiniatura) {
        elementoMiniatura.classList.remove('border-transparent');
        elementoMiniatura.classList.add('border-red-600');
    }

    if (tipo === 'imagen') {
        videoEl.pause();
        videoEl.classList.add('hidden');
        imgEl.src = source;
        imgEl.classList.remove('hidden');
    } else {
        imgEl.classList.add('hidden');
        videoEl.src = source;
        videoEl.classList.remove('hidden');
        videoEl.play();
    }
}

function actualizarSKUModal() {
    const marcaSelect = document.getElementById('varMarca');
    const modeloSelect = document.getElementById('varModelo');
    const anioSelect = document.getElementById('varAnio');
    const colorSelect = document.getElementById('varColor');

    if (!marcaSelect || !modeloSelect || !anioSelect || !colorSelect) return;

    const marca = marcaSelect.value;
    const modelo = modeloSelect.value;
    const anio = anioSelect.value;
    const color = colorSelect.value;

    const skuVariante = `SUV-${marca}-${modelo}-${anio}-${color}-HYB`;
    const skuBadge = document.getElementById('modalSkuBadge');
    if (skuBadge) {
        skuBadge.innerText = `SKU Variante: ${skuVariante}`;
    }
}

function abrirCarrito() {
    alert("El cotizador y carrito se encuentra disponible.");
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarSKUDinamico();
});
document.addEventListener("DOMContentLoaded", function () {
    menuUser();
    phoneMenu();
    initMobileScroll();
    rolSwitch();
    optionsBar();
    tabSelected();

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('search')) {
        loadFromUrl();
        loadCmpDetail();
    }

    requestDropdown();
    updateXmlVisibility();
    initTableResize();
    initUpload();
    buttonTC();
    cancelButton();

    const sendBtn = document.querySelector('.button.send');
    if(sendBtn) sendBtn.addEventListener('click', enviarComprobacion);

    const saveBtn = document.querySelector('.button.save');
    if(saveBtn) saveBtn.addEventListener('click', guardarComprobacion);
});


/* ============================== VARIABLES ============================== */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
// const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';

// API Banxico
const exchangeRateCache = {};

// Facturas
let selectedPDF = null;
let selectedXML = null;
let selectedIMG = null;

let facturasCargadas = [];
let uploadFactura = false;
let nextButton = null;
let currentMoneda = null;
let currentMonto = null;

// Table
let pendingEditRow = null;
let pendingTempData = null;

// Date
let globalStartDate = null;

const CURRENCY_COUNTRY = {
    EUR: 'eu', USD: 'us', GBP: 'gb', AUD: 'au', CAD: 'ca',
    CHF: 'ch', CNY: 'cn', JPY: 'jp', MXN: 'mx', BRL: 'br',
    INR: 'in', KRW: 'kr', SGD: 'sg', HKD: 'hk', NOK: 'no',
    SEK: 'se', DKK: 'dk', NZD: 'nz', ZAR: 'za', RUB: 'ru',
    ARS: 'ar', CLP: 'cl', COP: 'co', PEN: 'pe', VES: 've',
    AED: 'ae', SAR: 'sa', QAR: 'qa', KWD: 'kw', EGP: 'eg',
    TRY: 'tr', PLN: 'pl', CZK: 'cz', HUF: 'hu', RON: 'ro',
    TWD: 'tw', THB: 'th', MYR: 'my', IDR: 'id', PHP: 'ph',
    PKR: 'pk', BDT: 'bd', VND: 'vn', ILS: 'il', NGN: 'ng',
};


/* ================================ FUNCTIONS ================================ */
function updateXmlVisibility() {
    const xmlColumn = document.querySelector('#facturado-container .second-column');
    const button = document.querySelector('.button-receipt');

    if(!xmlColumn || !button) return;

    if(pendingEditRow) {
        pendingEditRow.remove();
        pendingEditRow = null;
        pendingTempData = null;
    }

    const isFacturado = document.querySelector('.tab.factura.selected') !== null;
    if(isFacturado) {
        xmlColumn.style.display = 'flex';
        button.innerHTML = 'CARGAR';
    } else
        button.innerHTML = 'LLENAR DATOS';
}

function clearPendingEdit() {
    if(pendingEditRow) {
        pendingEditRow.remove();
        if(pendingTempData) {
            const index = facturasCargadas.findIndex(f => f.tempId === pendingTempData.tempId);
            if(index !== -1) facturasCargadas.splice(index, 1);
        }
        pendingEditRow = null;
        pendingTempData = null;

        const isFacturado = document.querySelector('.tab.factura.selected') !== null;
        const xmlColumn = document.querySelector('#facturado-container .second-column');
        const isXmlVisible = xmlColumn && window.getComputedStyle(xmlColumn).display !== 'none';
        const button = document.querySelector('.button-receipt');
        if(button) {
            if(isFacturado && isXmlVisible)
                button.innerHTML = 'CARGAR';
            else
                button.innerHTML = 'LLENAR DATOS';
        }
    }
}

function resetAllFacturas() {
    const tbody = document.querySelector('.table-body');
    if (tbody) tbody.innerHTML = '';
    facturasCargadas = [];    
    clearPendingEdit();
}

function formatMoney(value, code) {
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    const symbol = obtenerSimboloMoneda(code);

    if(isNaN(num)) return `${symbol}0.00`;
    const formatted = Math.abs(num).toFixed(2);
    return num < 0 ? `- ${symbol}${formatted}` : `${symbol}${formatted}`;
}

function obtenerSimboloMoneda(code) {
    try {
        const parts = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'narrowSymbol'
        }).formatToParts(0);
        return parts.find(p => p.type === 'currency')?.value || code;
    } catch {
        return code;
    }
}

function getFlagUrl(code) {
    const country = CURRENCY_COUNTRY[code] || code.slice(0, 2).toLowerCase();
    return `https://flagcdn.com/w40/${country}.png`;
}


/* ================================= LOADER ================================= */
function showLoader() {
    document.querySelector('.loader-overlay').style.display = 'flex';
}

function hideLoader() {
    document.querySelector('.loader-overlay').style.display = 'none';
}


/* ============================== MENU NAME ============================== */
function menuUser() {
    const user = document.querySelector('.option-bar .name p');
    if(!user) return;

    function capitalizarNombre(nombreCompleto) {
        if(!nombreCompleto) return '';
        return nombreCompleto
            .trim()
            .toLowerCase()
            .split(' ')
            .map(palabra => {
                if(palabra.length === 0) return '';
                return palabra[0].toUpperCase() + palabra.slice(1);
            })
            .join(' ');
    }

    const name = capitalizarNombre(logoUser);
    user.innerHTML = name;
}


/* ============================== PHONE MENU ============================== */
function phoneMenu() {
    const container = document.querySelector('.mobile-nav');
    const hamburger = document.getElementById('hamburger');
    const optionBar = document.getElementById('optionBar');
    const checkBox = hamburger.querySelector('input');

    if (!container || !hamburger || !optionBar || !checkBox) return;

    checkBox.addEventListener('change', function (e) {
        e.stopPropagation();

        container.classList.toggle('bar', checkBox.checked);
        hamburger.classList.toggle('active', checkBox.checked);
        optionBar.classList.toggle('active', checkBox.checked);
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !optionBar.contains(e.target)) {
            checkBox.checked = false;
            container.classList.remove('bar');
            hamburger.classList.remove('active');
            optionBar.classList.remove('active');
        }
    });

    // Cerrar al hacer click en un enlace del menú
    const menuLinks = optionBar.querySelectorAll('.option');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            checkBox.checked = false;
            container.classList.remove('bar');
            hamburger.classList.remove('active');
            optionBar.classList.remove('active');
        });
    });

    // Touch events
    hamburger.addEventListener('touchstart', function (e) {
        e.stopImmediatePropagation();
    }, { passive: true });
}

function initMobileScroll() {
    const nav = document.querySelector('.mobile-nav');
    const scrollContainer = document.querySelector('.content-container');

    if (!nav || !scrollContainer) return;

    function handleMobileScroll() {
        const scrollTop = scrollContainer.scrollTop;
        if (scrollTop > 30)
            nav.classList.add('scrolled');
        else
            nav.classList.remove('scrolled');
    }

    scrollContainer.addEventListener('scroll', handleMobileScroll, { passive: true });
    handleMobileScroll();
}


/* ============================== OPTIONS BAR ============================== */
function rolSwitch() {
    const rolDiv = document.querySelector('.rol');
    const normalBtn = document.querySelector('.rol .normal');
    const specialBtn = document.querySelector('.rol .special');
    if(!rolDiv || !normalBtn || !specialBtn) return;

    const rol = Session.getRol();
    const esJefe = Session.getJefe();

    if(rol !== 'Jefe' && rol !== 'Tesorería' && !esJefe) {
        rolDiv.style.display = 'none';
        return;
    }

    const vistaJefe = rol === 'Jefe' || esJefe;

    specialBtn.textContent = rol === 'Tesorería' ? 'TESORERÍA' : 'JEFE'; 
    rolDiv.classList.add(rol === 'Tesorería' ? 'tes' : 'jefe');

    const colab = window.location.pathname.includes('crear-comprobacion') ||
                  window.location.pathname.includes('editar-comprobacion');
    if(colab) {
        normalBtn.classList.add('current');
        specialBtn.classList.remove('current');
    } else {
        specialBtn.classList.add('current');
        normalBtn.classList.remove('current');
        rolDiv.classList.add('special-active');
    }

    rolDiv.style.display = 'grid';

    specialBtn.addEventListener('click', () => {
        if(specialBtn.classList.contains('current')) return;
        window.location.href = vistaJefe ? 'jefe-dashboard.html' : 'tes-dashboard.html';
    });

    normalBtn.addEventListener('click', () => {
        if(normalBtn.classList.contains('current')) return;
        window.location.href = 'colab-dashboard.html';
    });
}

async function logoutReset() {
    try {
        await fetch(`${API}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        Session.clearAll();
        window.location.href = 'index.html';
    }
}

function optionsBar() {
    const dashboard = document.querySelector('.option.dashboard');
    const request = document.querySelector('.option.requests');
    const expenses = document.querySelector('.option.expenses');
    const liquidations = document.querySelector('.option.liquidation');
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;

        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if (currentPath.includes('colab-dashboard.html'))
            dashboard.classList.add('active');
        else if (currentPath.includes('colab-solicitudes.html') || currentPath.includes('crear-solicitud.html') || currentPath.includes('editar-solicitud.html'))
            request.classList.add('active');
        else if (currentPath.includes('colab-comprobaciones.html') || currentPath.includes('crear-comprobacion.html') || currentPath.includes('editar-comprobacion.html'))
            expenses.classList.add('active');
        else if (currentPath.includes('colab-liquidaciones.html'))
            liquidations.classList.add('active');
    }

    setActiveOption();

    dashboard.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-dashboard.html';
    });

    request.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-solicitudes.html';
    });

    expenses.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-comprobaciones.html';
    });

    liquidations.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-liquidaciones.html';
    });

    logout.addEventListener('click', async (e) => {
        e.stopPropagation();
        logoutReset();
    });
}


/* ============================== FACTURA TABS ============================== */
// Reset
function resetFacturado() {
    const pdfContainer = document.querySelector('#facturado-container .first-column .receipt-container');
    const xmlContainer = document.querySelector('#facturado-container .second-column .receipt-container');

    selectedPDF = null;
    selectedXML = null;

    if(pdfContainer) {
        pdfContainer.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Selecciona o arrastra tu factura PDF</p>
        `;

        pdfContainer.style.backgroundImage = '';
        pdfContainer.classList.remove('has-image');
        pdfContainer.dataset.file = '';
    }

    if(xmlContainer) {
        xmlContainer.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Selecciona o arrastra tu factura XML</p>
        `;

        xmlContainer.style.backgroundImage = '';
        xmlContainer.classList.remove('has-image');
        xmlContainer.dataset.file = '';
    }

    updateXmlVisibility();
}

function resetNoFacturado() {
    const imgContainer = document.querySelector('#no-facturado-container .receipt-container');

    selectedIMG = null;

    if(imgContainer) {
        imgContainer.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Selecciona o arrastra tu comprobante (JPG o PNG)</p>
        `;

        imgContainer.style.backgroundImage = '';
        imgContainer.classList.remove('has-image');
        imgContainer.dataset.file = '';
    }
}

function tabSelected() {
    const tabs = document.querySelectorAll('.tab');
    const facturadoContainer = document.getElementById('facturado-container');
    const noFacturadoContainer = document.getElementById('no-facturado-container');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            clearPendingEdit();

            tabs.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');

            const isFacturado = this.classList.contains('factura');

            if (isFacturado) {
                facturadoContainer.style.display = 'flex';
                noFacturadoContainer.style.display = 'none';
                resetFacturado();
                updateXmlVisibility();
            } else {
                facturadoContainer.style.display = 'none';
                noFacturadoContainer.style.display = 'grid';
                resetNoFacturado();

                const button = document.querySelector('.button-receipt');
                if(button) button.innerHTML = 'LLENAR DATOS';
            }
        });
    });
}


/* ============================= REQUEST DROPDOWN ============================= */
async function requestDropdown() {
    const selector = document.querySelector('.request-selector');
    const back = selector.querySelector('.request-back');
    const dropdown = document.querySelector('.request-dropdown');
    const textElement = back.querySelector('p');
    const xmlColumn = document.querySelector('#facturado-container .second-column');
    const pdfColumn = document.querySelector('#facturado-container .first-column');

    if(!selector || !dropdown || !textElement) return;

    // Cargar solicitudes desde el backend
    async function loadRequests() {
        try {
            const response = await fetch(`${API}/api/solicitudes/aprobadas-pendientes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if(!response.ok) throw new Error('Error al cargar solicitudes');
            
            const data = await response.json();
            if(!data.length) 
                dropdown.innerHTML = '<div class="request-option">No hay solicitudes aprobadas</div>';
            else {
                dropdown.innerHTML = '';
                data.forEach(item => {
                    const option = document.createElement('div');
                    option.classList.add('request-option');
                    option.textContent = item.folio;
                    option.dataset.moneda = item.moneda;

                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        clearPendingEdit();
                        resetAllFacturas();
                        
                        textElement.textContent = item.folio;
                        dropdown.classList.remove('show');
                        selector.dataset.selectedFolio = item.folio;
                        currentMoneda = item.moneda;
                        currentMonto = item.monto;
                        updateXmlVisibility();
                        updatePayment(item.monto, item.moneda);
                        hideComp();
                    });
                    dropdown.appendChild(option);
                });

                // Selección automática desde URL
                const urlParams = new URLSearchParams(window.location.search);
                const folioParam = urlParams.get('folio');
                
                if(folioParam) {
                    const opciones = dropdown.querySelectorAll('.request-option');
                    for(let opt of opciones) {
                        if(opt.textContent.trim() === folioParam) {
                            opt.click();
                            break;
                        }
                    }
                }
            }
        } catch(error) {
            Toast('ERROR', 'No se pudieron cargar las solicitudes');
        } finally {
            dropdown.classList.remove('show');
        }
    }

    await loadRequests();

    back.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if(!selector.contains(e.target))
            dropdown.classList.remove('show');
    });
}

// Update Anticipo
function updatePayment(monto, moneda) {
    const anticipo = document.querySelector('.anticipo');
    const anticipoDiv = document.querySelector('.anticipo .monto-content');
    if(!anticipo || !anticipoDiv) return;

    const img = anticipoDiv.querySelector('img');
    const p = anticipoDiv.querySelector('p');
    
    const flagUrl = getFlagUrl(moneda);
    const symbol = obtenerSimboloMoneda(moneda);
    const montoFormateado = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(monto);

    if(img) {
        img.src = flagUrl;
        img.alt = moneda;
    }
    if(p) p.innerHTML = `${symbol}${montoFormateado}`;
    anticipo.classList.add('visible');
}

// Update Comp
function hideComp() {
    const comprobadoDiv = document.querySelector('.comprobado');
    if(comprobadoDiv) comprobadoDiv.style.display = 'none';
}

function updateComp() {
    if(!currentMoneda) return;

    const monedaSolicitud = currentMoneda;
    let totalComprobado = 0;

    for(const factura of facturasCargadas) {
        if(factura.tipoEdicion && !factura.folio) continue;

        const total = parseFloat(String(factura.total).replace(/[^0-9.-]/g, '')) || 0;
        const tc = parseFloat(String(factura.tipoCambio).replace(/[^0-9.-]/g, '')) || 1;
        const monedaFactura = factura.moneda || 'MXN';

        if(monedaFactura === 'MXN' && monedaSolicitud === 'MXN')
            totalComprobado += total;
        else if(monedaFactura !== 'MXN' && monedaSolicitud === 'MXN')
            totalComprobado += total * tc;
        else if(monedaFactura === monedaSolicitud)
            totalComprobado += total;
        else if(monedaFactura === 'MXN' && monedaSolicitud !== 'MXN')
            totalComprobado += total / tc;
        else
            totalComprobado += total;
    }

    const comprobado = document.querySelector('.comprobado');
    const comprobadoDiv = document.querySelector('.comprobado .monto-content');
    const saldoEl = document.querySelector('.saldo');
    const saldoDiv = document.querySelector('.saldo .monto-content');
    if(!comprobado || !comprobadoDiv || !saldoEl || !saldoDiv) return;

    if(totalComprobado > 0) {
        comprobado.style.display = 'flex';
        saldoEl.style.display = 'flex';

        const imgComp = comprobadoDiv.querySelector('img');
        const pComp = comprobadoDiv.querySelector('p');

        const imgSal = saldoDiv.querySelector('img');
        const pSal = saldoDiv.querySelector('p');

        const flagUrl = getFlagUrl(monedaSolicitud);
        const symbol = obtenerSimboloMoneda(monedaSolicitud);
        const montoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(totalComprobado);

        if(imgComp) {
            imgComp.src = flagUrl;
            imgComp.alt = monedaSolicitud;
        }
        if(pComp) pComp.innerHTML = `${symbol}${montoFormateado}`;

        const anticipo = parseFloat(currentMonto) || 0;
        const saldoNum = anticipo - totalComprobado;
        const saldoAbs = Math.abs(saldoNum);
        const signo = saldoNum < 0 ? '- ' : '';
        const saldoFormat = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(saldoAbs);
        
        if(imgSal) {
            imgSal.src = flagUrl;
            imgSal.alt = monedaSolicitud;
        }
        if(pSal) pSal.innerHTML = `${signo}${symbol}${saldoFormat}`;
    } else {
        comprobado.style.display = 'none';
        saldoEl.style.display = 'none';
    }
}


/* ================================== TABLE =================================== */
function initTableResize() {
    const table = document.querySelector('.table-container table');
    const headers = table.querySelectorAll('.table-head th');

    headers.forEach(th => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle');
        th.appendChild(handle);

        let startX, startWidth;

        handle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = th.offsetWidth;
            handle.classList.add('resizing');

            const onMouseMove = (e) => {
                const newWidth = Math.max(60, startWidth + (e.clientX - startX));
                th.style.width = newWidth + 'px';
                th.style.minWidth = newWidth + 'px';
            };

            const onMouseUp = () => {
                handle.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });
    });
}

// Add XML row
function addFactura(datos) {
    const tbody = document.querySelector('.table-body');
    const nuevaFila = document.createElement('tr');
    const moneda = datos.moneda;

    let fileButtonsHTML = '';

    // Servidor
    if(datos.rutaPDF)
        fileButtonsHTML += `<i class="fa-solid fa-file-pdf preview-btn-cmp" data-url="${datos.rutaPDF}" data-type="pdf"></i>`;
    if(datos.rutaXML)
        fileButtonsHTML += `<i class="fa-solid fa-file-code preview-btn-cmp" data-url="${datos.rutaXML}" data-type="xml"></i>`;
    if(!datos.rutaPDF && !datos.rutaXML && datos.rutaIMG)
        fileButtonsHTML += `<i class="fa-solid fa-file-image preview-btn-cmp" data-url="${datos.rutaIMG}" data-type="img"></i>`;

    // Locales
    if(!datos.rutaPDF && datos.pdfFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-pdf preview-btn-cmp" data-type="pdf"></i>`;
    if(!datos.rutaXML && datos.xmlFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-code preview-btn-cmp" data-type="xml"></i>`;
    if(!datos.rutaIMG && datos.imgFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-image preview-btn-cmp" data-type="img"></i>`;

    nuevaFila.innerHTML = `
        <td>${datos.folio || ''}</td>
        <td>${datos.fecha || ''}</td>
        <td>${(datos.proveedor).toUpperCase() || ''}</td>
        <td>${datos.concepto || ''}</td>
        <td>${(datos.descripcion).toUpperCase() || ''}</td>
        <td>${formatMoney(datos.importe, moneda)}</td>
        <td>${formatMoney(datos.iva, moneda)}</td>
        <td>${formatMoney(datos.otros, moneda)}</td>
        <td>${formatMoney(datos.total, moneda)}</td>
        <td>${datos.moneda || ''}</td>
        <td>${datos.tipoCambio || '1.0000'}</td>
        <td class="delete-row">
            <div class="actions">
                ${fileButtonsHTML}
                <i class="fa-solid fa-trash-can"></i>
            </div>
        </td>
    `;
    tbody.appendChild(nuevaFila);
    updateComp();

    // Botones archivos
    nuevaFila.querySelectorAll('.preview-btn-cmp').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            const url = btn.dataset.url

            let file = null;

            if(type === 'pdf') file = datos.pdfFile;
            else if(type === 'xml') file = datos.xmlFile;
            else if(type === 'img') file = datos.imgFile;

            if(file instanceof File) {
                // Local
                const blobUrl = URL.createObjectURL(file);
                window.open(blobUrl, '_blank');
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            } else if(url) {
                // Servidor
                window.open(`${API}/${url}`, '_blank');
            }
        });
    });
    
    // Eliminar
    const deleteBtn = nuevaFila.querySelector('.fa-trash-can');
    deleteBtn.addEventListener('click', () => {
        const index = facturasCargadas.findIndex(f => 
            f.folio === datos.folio && 
            f.fecha === datos.fecha && 
            f.proveedor === datos.proveedor
        );
        if(index !== -1) facturasCargadas.splice(index, 1);
        nuevaFila.remove();
        updateComp();
        Toast('FACTURA ELIMINADA', 'Se ha eliminado exitosamente la factura de la lista');
    });
}

// Add PDF or IMG row
function addFacturaEditable(datosBase) {
    const tbody = document.querySelector('.table-body');
    const nuevaFila = document.createElement('tr');
    nuevaFila.setAttribute('data-temp-id', datosBase.tempId);
    const monedaSolicitud = currentMoneda || 'MXN';
    const monedaIni = monedaSolicitud;

    nuevaFila.innerHTML = `
        <td><input type="text" class="editable-folio" placeholder="12345"></td>
        
        <td>
            <div class="fecha-container">
                <input type="text" class="editable-fecha" placeholder="AAAA-MM-DD">
                <i class="fa-regular fa-calendar"></i>
            </div>
        </td>

        <td><input type="text" class="editable-proveedor" placeholder="Empresa S.A."></td>
        <td><input type="text" class="editable-concepto" placeholder="90101500" value="-"></td>
        <td><input type="text" class="editable-descripcion" placeholder="Hospedaje"></td>
        <td><input type="text" class="editable-importe" placeholder="0.00"></td>
        <td><input type="text" class="editable-iva" placeholder="0.00"></td>
        <td><input type="text" class="editable-others" placeholder="0.00" value="0.00"></td>
        <td class="editable-total">$0.00</td>

        <td>
            <div class="currency-mini-selector" data-value="${monedaIni}">
                <div class="currency-mini-back">
                    <p>${monedaIni}</p>
                    <i class="fa-solid fa-angle-down"></i>
                </div>
                <div class="currency-mini-dropdown">
                    <div class="currency-mini-option" data-value="MXN">MXN</div>
                    <div class="currency-mini-option" data-value="USD">USD</div>
                    <div class="currency-mini-option" data-value="EUR">EUR</div>
                </div>
            </div>
        </td>

        <td>
            <div class="tc-container">
                <input type="text" class="editable-tipoCambio" 
                    placeholder="Ej. 0.0000" 
                    value="1.0000"
                    ${monedaIni === 'MXN' && monedaSolicitud === 'MXN' ? 'readonly' : ''}>
                <i class="fa-solid fa-circle-info"></i>
            </div>
        </td>
        
        <td class="delete-row"><div class="actions"><i class="fa-solid fa-trash-can"></i></div></td>
    `;
    tbody.appendChild(nuevaFila);

    initCalendar();
    setupCalendar();

    const fechaInput = nuevaFila.querySelector('.editable-fecha');
    const tipoCambioInput = nuevaFila.querySelector('.editable-tipoCambio');
    const currencySelect = nuevaFila.querySelector('.editable-currency');
    const importeInput = nuevaFila.querySelector('.editable-importe');
    const ivaInput = nuevaFila.querySelector('.editable-iva');
    const otrosInput = nuevaFila.querySelector('.editable-others');
    const totalCell = nuevaFila.querySelector('.editable-total');

    // ====== Currency mini selector ======
    const miniSelector = nuevaFila.querySelector('.currency-mini-selector');
    const miniBack = miniSelector.querySelector('.currency-mini-back');
    const miniBackText = miniSelector.querySelector('.currency-mini-back p');
    const miniDropdown = miniSelector.querySelector('.currency-mini-dropdown');

    miniBack.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = miniDropdown.classList.contains('show');

        // Cerrar otros dropdowns de moneda abiertos
        document.querySelectorAll('.currency-mini-dropdown.show').forEach(d => {
            d.classList.remove('show');
            d.closest('.currency-mini-selector')?.classList.remove('open');
        });

        if(!isOpen) {
            const valorActual = miniSelector.dataset.value;
            miniSelector.querySelectorAll('.currency-mini-option').forEach(opt => {
                opt.style.display = opt.dataset.value === valorActual ? 'none' : 'block';
            });

            miniDropdown.classList.add('show');
            miniSelector.classList.add('open');

            // Posicionar
            const rect = miniBack.getBoundingClientRect();
            miniDropdown.style.position = 'fixed';
            miniDropdown.style.top = `${rect.bottom + 4}px`;
            miniDropdown.style.left = `${rect.left}px`;
            miniDropdown.style.width = `${rect.width}px`;
            miniDropdown.style.zIndex = '9999';
        }
    });

    miniSelector.querySelectorAll('.currency-mini-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const valorAnterior = miniSelector.dataset.value;
            const valorNuevo = opt.dataset.value;

            miniBackText.textContent = valorNuevo;
            miniSelector.dataset.value = valorNuevo;
            miniDropdown.classList.remove('show');
            miniSelector.classList.remove('open');

            miniSelector.querySelectorAll('.currency-mini-option').forEach(o => {
                o.style.display = o.dataset.value === valorNuevo ? 'none' : 'block';
            });

            if(valorNuevo !== valorAnterior) {
                actualizarTC();
                actualizarTotal();
            }

            if(valorNuevo === 'MXN') {
                const importe = parseFloat(importeInput.value) || 0;
                if(importe > 0) {
                    ivaInput.value = (importe * 0.16).toFixed(2);
                    actualizarTotal();
                }
            } else {
                ivaInput.value = '';
                actualizarTotal();
            }
        });
    });

    document.addEventListener('click', (e) => {
        if(!miniSelector.contains(e.target)) {
            miniDropdown.classList.remove('show');
            miniSelector.classList.remove('open');
        }
    });

    // ====== TC automático según moneda de factura ======
    function getMonedaFactura() {
        return miniSelector.dataset.value || 'MXN';
    }

    async function actualizarTC() {
        const monedaFactura = getMonedaFactura();
        const fecha = fechaInput.value;

        if(monedaFactura === 'MXN' && monedaSolicitud === 'MXN') {
            // Ambos MXN → TC = 1, readonly
            tipoCambioInput.value = '1.0000';
            tipoCambioInput.setAttribute('readonly', true);

        } else if(monedaFactura === monedaSolicitud) {
            // Misma divisa → buscar TC de esa divisa a MXN (para el ponderado)
            tipoCambioInput.removeAttribute('readonly');
            if(fecha) {
                const rate = await getTipoCambio(monedaFactura, fecha);
                if(rate) tipoCambioInput.value = rate;
            }

        } else if(monedaFactura === 'MXN' && monedaSolicitud !== 'MXN') {
            // Factura MXN, solicitud en divisa → TC de la divisa de solicitud
            tipoCambioInput.removeAttribute('readonly');
            if(fecha) {
                const rate = await getTipoCambio(monedaSolicitud, fecha);
                if(rate) tipoCambioInput.value = rate;
            }

        } else {
            // Cualquier otra combinación → TC de la moneda de la factura
            tipoCambioInput.removeAttribute('readonly');
            if(fecha) {
                const rate = await getTipoCambio(monedaFactura, fecha);
                if(rate) tipoCambioInput.value = rate;
            }
        }
    }

    fechaInput.addEventListener('change', actualizarTC);

    function actualizarTotal() {
        const monedaFactura = getMonedaFactura();
        let importe = parseFloat(importeInput.value) || 0;
        let iva = parseFloat(ivaInput.value) || 0;
        let otros = parseFloat(otrosInput.value) || 0;
        let total = importe + iva + otros;
        totalCell.textContent = formatMoney(total, monedaFactura);
    }

    importeInput.addEventListener('input', () => {
        const monedaFactura = getMonedaFactura();

        if(monedaFactura === 'MXN') {
            const importe = parseFloat(importeInput.value) || 0;
            const ivaCalculado = (importe * 0.16).toFixed(2);
            ivaInput.value = ivaCalculado;
        }

        actualizarTotal();
    });

    ivaInput.addEventListener('input', actualizarTotal);
    otrosInput.addEventListener('input', actualizarTotal);
    actualizarTotal();
    
    // Evento eliminar
    const deleteBtn = nuevaFila.querySelector('.delete-row i');
    deleteBtn.addEventListener('click', () => {
        if(pendingEditRow === nuevaFila) {
            pendingEditRow = null;
            pendingTempData = null;
            const button = document.querySelector('.button-receipt');
            button.innerHTML = 'LLENAR DATOS';
        }

        nuevaFila.remove();
        const index = facturasCargadas.findIndex(f => f.tempId === datosBase.tempId);
        if(index !== -1) facturasCargadas.splice(index, 1);
        Toast('FACTURA ELIMINADA', 'Se ha eliminado exitosamente la factura de la lista');
    });
    
    return nuevaFila;
}

function isValidDateFormat(fecha) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
        return false;

    const [year, month, day] = fecha.split('-').map(Number);

    if(month < 1 || month > 12 || day < 1 || day > 31 || year < 1900)
        return false;

    const testDate = new Date(year, month - 1, day);
    return testDate.getFullYear() === year && 
           testDate.getMonth() === month - 1 && 
           testDate.getDate() === day;
}

async function addPDFRow(row, tempData) {
    const folioFactura = row.querySelector('.editable-folio')?.value.trim();
    const fecha = row.querySelector('.editable-fecha')?.value;
    const proveedor = row.querySelector('.editable-proveedor')?.value.trim();
    const concepto = row.querySelector('.editable-concepto')?.value.trim();
    const descripcion = row.querySelector('.editable-descripcion')?.value.trim();
    const importe = row.querySelector('.editable-importe')?.value.trim();
    const iva = row.querySelector('.editable-iva')?.value.trim();
    const moneda = row.querySelector('.currency-mini-selector')?.dataset.value || 'MXN';
    const tipoCambioInput = row.querySelector('.editable-tipoCambio');

    if(!folioFactura) {
        Toast('FOLIO REQUERIDO', 'Por favor, ingresa el folio de tu factura');
        return false;
    } else if(!/^\d+$/.test(folioFactura)) {
        Toast('FOLIO INVÁLIDO', 'Ingresa únicamente el número de folio, sin letras ni caracteres especiales');
        return false;
    }

    if(!fecha) {
        Toast('FECHA REQUERIDA', 'Por favor, ingresa la fecha de emisión de tu factura');
        return false;
    } else if (!isValidDateFormat(fecha)) {
        Toast('FECHA INVÁLIDA', 'Ingresa una fecha válida con el formato YYYY-MM-DD');
        return false;
    }

    if(!proveedor) {
        Toast('PROVEEDOR REQUERIDO', 'Por favor, ingresa la razón social o nombre del proveedor');
        return false;
    }

    if(!/^(\d+|-)$/.test(concepto)) {
        Toast('CONCEPTO REQUERIDO', 'Ingresa únicamente la clave numérica del producto o un guion (-) si no aplica');
        return false;
    }

    if(!descripcion) {
        Toast('DESCRIPCIÓN REQUERIDA', 'Por favor, ingresa la descripción de producto de tu factura');
        return false;
    }

    if(!importe) {
        Toast('IMPORTE REQUERIDO', 'Por favor, ingresa el importe o subtotal de tu factura');
        return false;
    } else if(!/^\d+(\.\d{1,2})?$/.test(importe)) {
        Toast('IMPORTE INVÁLIDO', 'Por favor, ingresa un importe válido con hasta dos decimales');
        return false;
    } else if(parseFloat(importe) <= 0) {
        Toast('IMPORTE INVÁLIDO', 'El importe debe ser mayor a 0');
        return false;
    }

    if(!iva) {
        Toast('IVA REQUERIDO', 'Por favor, ingresa el IVA de tu factura');
        return false;
    } else if(!/^\d+(\.\d{1,2})?$/.test(iva)) {
        Toast('IVA INVÁLIDO', 'Por favor, ingresa un IVA válido con hasta dos decimales');
        return false;
    } else if(parseFloat(iva) < 0) {
        Toast('IVA INVÁLIDO', 'El IVA no puede ser menor a 0');
        return false;
    }

    const otrosInput = row.querySelector('.editable-others');
    const otrosVal = otrosInput.value.trim() || '0.00';
    if(!/^-?\d+(\.\d{1,2})?$/.test(otrosVal)) {
        Toast('MONTO INVÁLIDO', 'Ingresa un monto válido con hasta dos decimales o un 0 si no aplica');
        return false;
    }
    const otros = parseFloat(otrosVal).toFixed(2);

    const totalCell = row.querySelector('.editable-total');
    let totalNum = 0;
    if(totalCell) {
        const totalText = totalCell.textContent.replace('$', '');
        totalNum = parseFloat(totalText) || 0;
    }

    let tipoCambio = parseFloat(tipoCambioInput.value);
    if(isNaN(tipoCambio) && moneda !== 'MXN') {
        Toast('TIPO DE CAMBIO REQUERIDO', 'Ingresa el tipo de cambio de la fecha de emisión. Por ejemplo, si 1 EUR equivale a 21.43 MXN, captura 21.43');
        return false;
    }

    if(moneda === 'MXN' && currentMoneda === 'MXN')
        tipoCambio = '1.000';
    else if(moneda === currentMoneda && moneda !== 'MXN') {
        if(isNaN(tipoCambio) || tipoCambio <= 0) {
            if(fecha) {
                const rate = await getTipoCambio(moneda, fecha);
                tipoCambio = rate ? parseFloat(rate) : null;
            }
            if(!tipoCambio) {
                Toast('TIPO DE CAMBIO REQUERIDO', 'Por favor, ingresa el tipo de cambio de la fecha de emisión');
                return false;
            }
        }
    } else if(moneda === 'MXN' && currentMoneda !== 'MXN') {
        // Factura MXN, solicitud en divisa
        if(isNaN(tipoCambio) || tipoCambio <= 0) {
            if(fecha) {
                const rate = await getTipoCambio(currentMoneda, fecha);
                tipoCambio = rate ? parseFloat(rate) : null;
            }
            if(!tipoCambio) {
                Toast('TIPO DE CAMBIO REQUERIDO', `Por favor, ingresa el tipo de cambio de ${currentMoneda} a MXN`);
                return false;
            }
        }
    } else {
        // Otra combinación de divisas
        if(isNaN(tipoCambio) || tipoCambio <= 0) {
            Toast('TIPO DE CAMBIO REQUERIDO', 'Ingresa el tipo de cambio de la fecha de emisión');
            return false;
        }
    }

    const facturaFinal = {
        folio: folioFactura,
        fecha: fecha,
        proveedor: proveedor.toUpperCase(),
        concepto: concepto,
        descripcion: descripcion.toUpperCase(),
        importe: parseFloat(importe).toFixed(2),
        iva: parseFloat(iva).toFixed(2),
        otros: parseFloat(otros).toFixed(2),
        total: totalNum.toFixed(2),
        moneda: moneda,
        tipoCambio: parseFloat(tipoCambio).toFixed(4),
        pdfFile: tempData.pdfPath || null,
        xmlFile: tempData.xmlPath || null,
        imgFile: tempData.imgPath || null
    };

    if(duplicateFactura(facturaFinal)) {
        Toast('FACTURA YA REGISTRADA', 'Lo siento, esta factura ya fue agregada previamente a la solicitud');
        
        // Limpiar fila pendiente
        if(pendingEditRow === row) {
            pendingEditRow = null;
            pendingTempData = null;
        }

        const tempIndex = facturasCargadas.findIndex(f => f.tempId === tempData.tempId);
        if(tempIndex !== -1) facturasCargadas.splice(tempIndex, 1);
        row.remove();

        const isFacturado = document.querySelector('.tab.factura.selected') !== null;
        if(isFacturado) resetFacturado();
        else resetNoFacturado();

        const button = document.querySelector('.button-receipt');
        const xmlColumn = document.querySelector('#facturado-container .second-column');
        const isXmlVisible = xmlColumn && window.getComputedStyle(xmlColumn).display !== 'none';
        if(isFacturado && isXmlVisible) button.innerHTML = 'CARGAR';
        else button.innerHTML = 'LLENAR DATOS';
        return false;
    }

    let fileButtonsHTML = '';
    if(facturaFinal.pdfFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-pdf preview-btn-cmp" data-type="pdf"></i>`;
    if(facturaFinal.xmlFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-code preview-btn-cmp" data-type="xml"></i>`;
    if(facturaFinal.imgFile instanceof File)
        fileButtonsHTML += `<i class="fa-solid fa-file-image preview-btn-cmp" data-type="img"></i>`;

    row.innerHTML = `
        <td>${facturaFinal.folio}</td>
        <td>${facturaFinal.fecha}</td>
        <td>${facturaFinal.proveedor}</td>
        <td>${facturaFinal.concepto}</td>
        <td>${facturaFinal.descripcion}</td>
        <td>${formatMoney(facturaFinal.importe, facturaFinal.moneda)}</td>
        <td>${formatMoney(facturaFinal.iva, facturaFinal.moneda)}</td>
        <td>${formatMoney(facturaFinal.otros, facturaFinal.moneda)}</td>
        <td>${formatMoney(facturaFinal.total, facturaFinal.moneda)}</td>
        <td>${facturaFinal.moneda}</td>
        <td>${facturaFinal.tipoCambio}</td>
        <td class="delete-row">
            <div class="actions">
                ${fileButtonsHTML}
                <i class="fa-solid fa-trash-can"></i>
            </div>
        </td>
    `;

    // Botones archivos
    row.querySelectorAll('.preview-btn-cmp').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            let file = null;

            if(type === 'pdf') file = facturaFinal.pdfFile;
            else if(type === 'xml') file = facturaFinal.xmlFile;
            else if(type === 'img') file = facturaFinal.imgFile;

            if(file instanceof File) {
                const blobUrl = URL.createObjectURL(file);
                window.open(blobUrl, '_blank');
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            }
        });
    });

    // Evento eliminar
    const deleteBtn = row.querySelector('.delete-row .fa-trash-can');
    deleteBtn.addEventListener('click', () => {
        const index = facturasCargadas.findIndex(f => f.tempId === tempData.tempId);
        if (index !== -1) facturasCargadas.splice(index, 1);
        row.remove();
        updateComp();
        Toast('FACTURA ELIMINADA', 'Se ha eliminado exitosamente la factura de la lista');
    });

    const index = facturasCargadas.findIndex(f => f.tempId === tempData.tempId);
    if(index !== -1)
        facturasCargadas[index] = { ...tempData, tempId: tempData.tempId, ...facturaFinal };
    else
        facturasCargadas.push({ ...tempData, tempId: tempData.tempId, ...facturaFinal });

    Toast('FACTURA REGISTRADA', 'La factura se cargó correctamente. Puedes agregar otra');
    updateComp();
    return true;
}

function duplicateFactura(nuevaFactura) {
    return facturasCargadas.some(existente => 
        existente.folio === nuevaFactura.folio &&
        existente.proveedor === nuevaFactura.proveedor &&
        existente.fecha === nuevaFactura.fecha &&
        existente.descripcion === nuevaFactura.descripcion
    );
}


/* ================================ INPUT BUTTONS ================================ */
// Calendar
function initCalendar() {
    const monthLabel = document.querySelector('.date-header .month');
    const yearLabel = document.querySelector('.date-header .year');
    const datesContainer = document.querySelector('.dates');
    const daysHeader = document.querySelector('.days-header');
    const prevBtn = document.querySelector('.prev-month');
    const nextBtn = document.querySelector('.next-month');
    const monthSelector = document.querySelector('.month-selector');
    const yearSelector = document.querySelector('.year-selector');

    let currentDate = new Date();
    let startDate = null;
    let viewMode = 'days';

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
                        'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Funciones auxiliares
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayIndex(year, month) {
        return new Date(year, month, 1).getDay();
    }

    function isSameDate(date1, date2) {
        return date1 && date2 && date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
    }

    function toTimestamp(date) {
        if (!date) return null;
        return new Date(date.year, date.month, date.day).getTime();
    }

    // Renderiza el calendario de días
    function renderDays() {
        monthLabel.style.display = 'flex';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthLabel.textContent = monthNames[month];
        yearLabel.textContent = year;

        const firstDay = getFirstDayIndex(year, month);
        const daysInMonth = getDaysInMonth(year, month);

        // Días del mes anterior
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
        const prevMonthDays = firstDay;

        const totalCells = 42;  // 6 filas x 7 días
        const nextMonthDays = totalCells - (prevMonthDays + daysInMonth);
        
        datesContainer.innerHTML = '';
        daysHeader.style.display = 'grid';
        datesContainer.classList.remove('months-grid', 'years-grid');

        // 1. Mes anterior
        for(let i = prevMonthDays - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const cell = createDateCell(day, prevMonthYear, prevMonth, true);
            datesContainer.appendChild(cell);
        }

        // 2. Mes actual
        for(let day = 1; day <= daysInMonth; day++) {
            const cell = createDateCell(day, year, month, false);
            datesContainer.appendChild(cell);
        }

        // 3. Mes siguiente
        let nextMonth = month === 11 ? 0 : month + 1;
        let nextMonthYear = month === 11 ? year + 1 : year;
        for(let day = 1; day <= nextMonthDays; day++) {
            const cell = createDateCell(day, nextMonthYear, nextMonth, true);
            datesContainer.appendChild(cell);
        }
    }

    // Vista de días
    function createDateCell(day, year, month, isOtherMonth) {
        const cell = document.createElement('div');
        cell.classList.add('date-cell');
        cell.textContent = day;
        if(isOtherMonth) cell.classList.add('other-month');

        const dateObj = { year, month, day };

        // Día actual
        const today = new Date();
        if(year === today.getFullYear() && month === today.getMonth() && day === today.getDate())
            cell.classList.add('today');

        // Asignar clases de rango
        if(startDate && isSameDate(dateObj, startDate)) cell.classList.add('start');

        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            startDate = { year, month, day };
            globalStartDate = `${year}-${month+1}-${day}`;
            renderCalendar();
        });
        return cell;
    }

    // Vista de meses
    function renderMonths() {
        const year = currentDate.getFullYear();
        monthLabel.textContent = monthNames[currentDate.getMonth];
        yearLabel.textContent = year;

        daysHeader.style.display = 'none';
        datesContainer.innerHTML = '';
        datesContainer.classList.remove('years-grid');
        datesContainer.classList.add('months-grid');
        monthLabel.style.display = 'none';

        for (let i = 0; i < 12; i++) {
            const monthDiv = document.createElement('div');
            monthDiv.classList.add('month-item');
            monthDiv.textContent = monthNames[i];
            monthDiv.addEventListener('click', (e) => {
                e.stopPropagation();

                // Cambiar al mes seleccionado
                currentDate.setMonth(i);
                viewMode = 'days';
                renderCalendar();
            });

            datesContainer.appendChild(monthDiv);
        }
    }

    // Vista de años
    function renderYears() {
        const year = currentDate.getFullYear();
        const decadeStart = Math.floor(year / 10) * 10;
        yearLabel.textContent = `${decadeStart} - ${decadeStart + 9}`;
        monthLabel.style.display = 'none';

        daysHeader.style.display = 'none';
        datesContainer.innerHTML = '';
        datesContainer.classList.remove('months-grid');
        datesContainer.classList.add('years-grid');

        // Generar años
        const startYear = decadeStart - 1;
        for (let i = 0; i < 12; i++) {
            const y = startYear + i;
            const yearDiv = document.createElement('div');
            yearDiv.classList.add('year-item');
            yearDiv.textContent = y;
            yearDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                currentDate.setFullYear(y);
                viewMode = 'days';
                renderCalendar();
            });
            datesContainer.appendChild(yearDiv);
        }
    }

    // Render principal
    function renderCalendar() {
        if(viewMode === 'months')
            renderMonths();
        else if (viewMode === 'years')
            renderYears();
        else
            renderDays();
    }

    // Navegación con flechas
    function navigate(delta) {
        if (viewMode === 'months') {
            currentDate.setFullYear(currentDate.getFullYear() + delta);
            renderMonths();
        } else if (viewMode === 'years') {
            currentDate.setFullYear(currentDate.getFullYear() + delta * 10);
            renderYears();
        } else {
            currentDate.setMonth(currentDate.getMonth() + delta);
            renderDays();
        }
        hideSelectors();
    }

    function hideSelectors() {
        if (monthSelector) monthSelector.style.display = 'none';
        if (yearSelector) yearSelector.style.display = 'none';
    }

    // Eventos
    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

    monthLabel.addEventListener('click', (e) => {
        e.stopPropagation();

        if (viewMode === 'days') {
            viewMode = 'months';
            renderCalendar();
        } else if (viewMode === 'months') {
            viewMode = 'days';
            renderCalendar();
        } else if (viewMode === 'years') {
            viewMode = 'months';
            renderCalendar();
        }
        hideSelectors();
    });

    yearLabel.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMode = 'years';
        renderCalendar();
        hideSelectors();
    });

    document.addEventListener('click', (e) => {
        if (monthSelector && yearSelector)
            if (!monthSelector.contains(e.target) && !yearSelector.contains(e.target) &&
                e.target !== monthLabel && e.target !== yearLabel)
                    hideSelectors();
    });

    window.addEventListener('calendar-closed', () => {
        startDate = null;
        endDate = null;
        renderCalendar();
    });

    window.calendarRender = renderCalendar;
}

function setupCalendar() {
    const calendarIcon = document.querySelector('.fa-calendar');
    const datepicker = document.querySelector('.datepicker-wrapper');    
    const selectDate = document.querySelector('.date-button.select-date');

    if(!calendarIcon || !datepicker || !selectDate) return;

    function closeDatepicker() {
        calendarIcon.classList.remove('icon-active');
        datepicker.style.display = 'none';
        globalStartDate = null;
        window.dispatchEvent(new CustomEvent('calendar-closed'));
    }

    calendarIcon.addEventListener('click', (e) => {
        e.stopPropagation();

        const isVisible = datepicker.style.display === 'block';
        if(isVisible)
            closeDatepicker();
        else {
            calendarIcon.classList.add('icon-active');

            const datesContainer = document.querySelector('.dates');
            if(datesContainer && datesContainer.children.length === 0 && window.calendarRender)
                window.calendarRender();

            datepicker.style.visibility = 'hidden';
            datepicker.style.display = 'block';
            
            requestAnimationFrame(() => {
                positionDatepicker(calendarIcon, datepicker);
                datepicker.style.visibility = 'visible';
            });
        }
    });

    document.addEventListener('click', (e) => {
        if(!datepicker.contains(e.target) && e.target !== calendarIcon)
            closeDatepicker();
    });

    selectDate.addEventListener('click', (e) => {
        e.stopPropagation();

        if(!globalStartDate) {
            Toast('SELECCIÓN DE FECHA', 'Por favor, selecciona la fecha en la que tu factura fue emitida');
            return;
        }

        const [year, month, day] = globalStartDate.split('-');
        const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if(pendingEditRow) {
            const fechaInput = pendingEditRow.querySelector('.editable-fecha');
            if(fechaInput) {
                fechaInput.value = formatted;
                fechaInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        closeDatepicker();
    });
}

function positionDatepicker(icon, datepicker) {
    const rect = icon.getBoundingClientRect();
    const dpRect = datepicker.getBoundingClientRect();

    // Móvil, centrar respecto a la pantalla
    if(window.innerWidth <= 765) {
        const left = (window.innerWidth - dpRect.width) / 2;
        let top = rect.top - dpRect.height - 8;
        if(top < 10) top = rect.bottom + 8;

        datepicker.style.left = `${left}px`;
        datepicker.style.top = `${top}px`;
        return;
    }

    // Computadoras
    let left = rect.left + rect.width / 2 - dpRect.width / 2;
    let top = rect.top - dpRect.height - 8;

    if(left < 10) left = 10;
    if(left + dpRect.width > window.innerWidth - 10)
        left = window.innerWidth - dpRect.width - 10;
    if(top < 10) top = rect.bottom + 8;

    datepicker.style.left = `${left}px`;
    datepicker.style.top = `${top}px`;
}

// T.C. Information
function buttonTC() {
    document.addEventListener('click', (e) => {
        const target = e.target;
        if(!target.classList.contains('fa-circle-info')) return;

        e.stopPropagation();
        Toast('TIPO DE CAMBIO REQUERIDO', 'Ingresa el tipo de cambio de la fecha de emisión. Por ejemplo, si 1 EUR equivale a 21.43 MXN, captura 21.43');
    });
}


/* =================================== READ XML =================================== */
// XML
async function parseXML(xmlFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

            if(xmlDoc.getElementsByTagName("parsererror").length) {
                reject(new Error("Error al parsear el XML"));
                return;
            }

            const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
            if(!comprobante) {
                reject(new Error("Formato XML no reconocido (falta cfdi:Comprobante)"));
                return;
            }

            const folioFactura = comprobante.getAttribute("Folio") || "";

            let fechaRaw = comprobante.getAttribute("Fecha") || "";
            fechaRaw = fechaRaw.split("T")[0];
            const moneda = comprobante.getAttribute("Moneda") || "";
            const tipoCambio = comprobante.getAttribute("TipoCambio") || "";
            const total = parseFloat(comprobante.getAttribute("Total") || 0).toFixed(2);
            const subtotal = parseFloat(comprobante.getAttribute("SubTotal") || 0).toFixed(2);

            const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
            const proveedorNombre = emisor ? (emisor.getAttribute("Nombre") || "") : "";
            const proveedorRFC = emisor ? (emisor.getAttribute("Rfc") || "") : "";

            let iva = "0.00";
            const traslados = xmlDoc.getElementsByTagName("cfdi:Traslado");
            for(let traslado of traslados) {
                if(traslado.getAttribute("Impuesto") === "002") {
                    iva = parseFloat(traslado.getAttribute("Importe") || 0).toFixed(2);
                    break;
                }
            }

            if(iva === "0.00") {
                const impuestosNode = xmlDoc.getElementsByTagName("cfdi:Impuestos")[0];
                if(impuestosNode) {
                    const totalImpuestos = impuestosNode.getAttribute("TotalImpuestosTrasladados");
                    if(totalImpuestos) iva = parseFloat(totalImpuestos).toFixed(2);
                }
            }

            // --- Concatenar todos los conceptos y descripciones ---
            let conceptosList = [];
            let descripcionesList = [];
            const conceptosNodes = xmlDoc.getElementsByTagName("cfdi:Concepto");
            for(let conceptoNode of conceptosNodes) {
                conceptosList.push(conceptoNode.getAttribute("ClaveProdServ") || "-");
                descripcionesList.push(conceptoNode.getAttribute("Descripcion") || "-");
            }
            const concepto = conceptosList.join(" | ");
            const descripcion = descripcionesList.join(" | ");
                
            let otros = "";
            if(parseFloat(iva) + parseFloat(subtotal) === parseFloat(total))
                otros = "0.00";
            else
                otros = (parseFloat(total) - (parseFloat(iva) + parseFloat(subtotal))).toFixed(2);

            resolve({
                folio: folioFactura,
                fecha: fechaRaw,
                proveedor: proveedorNombre,
                proveedorRfc: proveedorRFC,
                concepto: concepto,
                descripcion: descripcion,
                importe: `$${subtotal}`,
                iva: `$${iva}`,
                otros: `$${otros}`,
                total: `$${total}`,
                moneda: moneda,
                tipoCambio: tipoCambio
            });
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo XML"));
        reader.readAsText(xmlFile);
    });
}


/* =================================== BANXICO =================================== */
async function getTipoCambio(moneda, fecha = null) {
    if(!moneda || moneda === 'MXN') return '1.0000';

    const BANXICO_DISPONIBLE = ['USD', 'EUR', 'JPY', 'GBP', 'CAD'];
    if(!BANXICO_DISPONIBLE.includes(moneda)) {
        Toast('TIPO DE CAMBIO', `La moneda ${moneda} no está disponible en Banxico. Por favor, ingresa el tipo de cambio manualmente`);
        return null;
    }

    const cacheKey = `${moneda}_${fecha || 'hoy'}`;
    if(exchangeRateCache[cacheKey]) return exchangeRateCache[cacheKey];

    try {
        const query = fecha ? `?fecha=${fecha}` : '';
        const res = await fetch(`${API}/api/solicitudes/tipocambio/${moneda}${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(res.ok) {
            const data = await res.json();
            const rate = parseFloat(data.tipoCambio).toFixed(4);
            exchangeRateCache[cacheKey] = rate;
            return rate;
        }

        const err = await res.json().catch(() => ({}));
        Toast('TIPO DE CAMBIO', err.message || `No se encontró tipo de cambio para ${moneda} en esa fecha. Por favor, ingrésalo manualmente`);
        return null;
    } catch {
        Toast('TIPO DE CAMBIO', 'No se pudo conectar con el servidor para obtener el tipo de cambio. Por favor, ingrésalo manualmente');
        return null;
    }
}


/* ================================ UPLOAD FACTURAS ================================ */
// IMG
async function uploadIMG(imgFile) {
    const formData = new FormData();
    formData.append('file', imgFile);

    const response = await fetch(`${API}/api/comprobaciones/upload/factura/img`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: formData
    });

    if(!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al subir el comprobante');
    }

    const data = await response.json();
    return data.ruta;
}

// PDF
async function uploadPDF(pdfFile) {
    const formData = new FormData();
    formData.append('file', pdfFile);

    const response = await fetch(`${API}/api/comprobaciones/upload/factura/pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: formData
    });

    if(!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al subir la factura');
    }

    const data = await response.json();
    return data.ruta;
}

// XML
async function uploadXML(xmlFile) {
    const formData = new FormData();
    formData.append('file', xmlFile);

    const response = await fetch(`${API}/api/comprobaciones/upload/factura/xml`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: formData
    });

    if(!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al subir la factura');
    }

    const data = await response.json();
    return data.ruta;
}

function initUpload() {
    const pdfContainer = document.querySelector('#facturado-container .first-column .receipt-container');
    const xmlContainer = document.querySelector('#facturado-container .second-column .receipt-container');
    const imgContainer = document.querySelector('#no-facturado-container .receipt-container');
    const uploadButton = document.querySelector('.button-receipt');

    let pdfInput = document.getElementById('pdf-input');
    let xmlInput = document.getElementById('xml-input');
    let imgInput = document.getElementById('img-input');

    if(!pdfInput) {
        pdfInput = document.createElement('input');
        pdfInput.id = 'pdf-input';
        pdfInput.type = 'file';
        pdfInput.accept = '.pdf';
        pdfInput.style.display = 'none';
        document.body.appendChild(pdfInput);
    }

    if(!xmlInput) {
        xmlInput = document.createElement('input');
        xmlInput.id = 'xml-input';
        xmlInput.type = 'file';
        xmlInput.accept = '.xml';
        xmlInput.style.display = 'none';
        document.body.appendChild(xmlInput);
    }

    if(!imgInput) {
        imgInput = document.createElement('input');
        imgInput.id = 'img-input';
        imgInput.type = 'file';
        imgInput.accept = '.jpg, .jpeg, .png';
        imgInput.style.display = 'none';
        document.body.appendChild(imgInput);
    }

    // Previsualizar
    function previewImage(container, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            container.innerHTML = '';
            container.style.backgroundImage = `url(${e.target.result})`;
            container.style.backgroundSize = 'cover';
            container.style.backgroundPosition = 'center';
            container.classList.add('has-image');
        };

        reader.readAsDataURL(file);
    }

    function previewFileInfo(container, file, iconClass) {
        container.innerHTML = `
            <i class="${iconClass}"></i>
            <p>${file.name}</p>
        `;

        container.style.backgroundImage = '';
        container.classList.add('has-image');
    }

    // Reset
    function resetContainer(container, type) {
        if(type === 'pdf') 
            container.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Selecciona o arrastra tu factura PDF</p>
            `;
        else if(type === 'xml') 
            container.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Selecciona o arrastra tu factura XML</p>
            `;
        else if(type === 'img') 
            container.innerHTML = `
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Selecciona o arrastra tu comprobante (JPG o PNG)</p>
            `;

        container.style.backgroundImage = '';
        container.classList.remove('has-image');
    }

    // Loader
    function showLoaderFact(container) {
        container.innerHTML = `
            <div class="loader-receipt"></div>
            <p>Subiendo comprobante...</p>
        `;
    }

    // Validaciones
    function validatePDF(file) {
        if(file.type !== 'application/pdf') {
            Toast('FORMATO DE ARCHIVO INVÁLIDO', 'Solo se permiten archivos en formato PDF');
            return false;
        }
        return true;
    }

    function validateXML(file) {
        if(!file.name.endsWith('.xml')) {
            Toast('FORMATO DE ARCHIVO INVÁLIDO', 'Solo se permiten archivos en formato XML');
            return false;
        }
        return true;
    }

    function validateIMG(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if(!validTypes.includes(file.type)) {
            Toast('FORMATO DE ARCHIVO INVÁLIDO', 'Solo se permiten archivos en formato JPG o PNG');
            return false;
        }
        return true;
    }

    // Manejadores de selección
    function onPDFSelect(file) {
        if(!validatePDF(file)) return false;
        selectedPDF = file;
        previewFileInfo(pdfContainer, file, 'fa-solid fa-file-pdf');
        return true;
    }

    function onXMLSelect(file) {
        if(!validateXML(file)) return false;
        selectedXML = file;
        previewFileInfo(xmlContainer, file, 'fa-solid fa-file-code');
        return true;
    }

    function onIMGSelect(file) {
        if(!validateIMG(file)) return false;
        selectedIMG = file;
        previewImage(imgContainer, file);
        return true;
    }

    // Eventos de arrastre y clic
    function setupContainer(container, inputElement, onSelect) {
        if(!container) return;

        container.addEventListener('click', (e) => {
            e.stopPropagation();
            inputElement.click();
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('dragover');
        });
        container.addEventListener('dragleave', () => {
            container.classList.remove('dragover');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) onSelect(file);
        });

        inputElement.addEventListener('change', (e) => {
            if(e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                if(onSelect(file))
                    inputElement.value = '';
            }
        });
    }

    setupContainer(pdfContainer, pdfInput, onPDFSelect);
    setupContainer(xmlContainer, xmlInput, onXMLSelect);
    setupContainer(imgContainer, imgInput, onIMGSelect);

    // Upload button
    if(uploadButton) {
        const newButton = uploadButton.cloneNode(true);
        uploadButton.parentNode.replaceChild(newButton, uploadButton);

        newButton.addEventListener('click', async() => {
            // 1. Fila pendiente de edición
            if(pendingEditRow && pendingTempData) {
                const success = await addPDFRow(pendingEditRow, pendingTempData);
                if(success) {
                    pendingEditRow = null;
                    pendingTempData = null;

                    const isFacturado = document.querySelector('.tab.factura.selected') !== null;
                    if(isFacturado)
                        resetFacturado();
                    else
                        resetNoFacturado();

                    const xmlColumn = document.querySelector('#facturado-container .second-column');
                    const isXmlVisible = xmlColumn && window.getComputedStyle(xmlColumn).display !== 'none';
                    const button = document.querySelector('.button-receipt');
                    if(isFacturado && isXmlVisible)
                        button.innerHTML = 'CARGAR';
                    else
                        button.innerHTML = 'LLENAR DATOS';
                }
                return;
            }

            // 2. Solicitud
            let selectedFolio = null;

            const urlParams = new URLSearchParams(window.location.search);
            if(urlParams.get('search'))
                selectedFolio = urlParams.get('search');
            else {
                const selector = document.querySelector('.request-selector');
                selectedFolio = selector ? selector.dataset.selectedFolio : null;
            }

            if(!selectedFolio) {
                Toast('SOLICITUD REQUERIDA', 'Por favor, selecciona una solicitud para registrar la comprobación');
                return;
            }

            const isFacturado = document.querySelector('.tab.factura.selected') !== null;

            // ====== FACTURADO ======
            if(isFacturado) {
                if(!selectedPDF) {
                    Toast('ARCHIVO FALTANTE', 'Por favor, selecciona la factura en formato PDF para su registro');
                    return;
                }

                // Si hay XML
                if(selectedXML) {
                    showLoaderFact(pdfContainer);
                    showLoaderFact(xmlContainer);
                    showLoader();

                    try {
                        const datosXML = await parseXML(selectedXML);

                        let tipoCambioCorr = datosXML.tipoCambio;

                        if(datosXML.moneda === 'MXN' && currentMoneda === 'MXN')
                            tipoCambioCorr = '1.0000';
                        else if(datosXML.moneda === currentMoneda && datosXML.moneda !== 'MXN') {
                            const rate = await getTipoCambio(datosXML.moneda, datosXML.fecha);
                            tipoCambioCorr = rate || datosXML.tipoCambio || '1.0000';
                        } else if(datosXML.moneda === 'MXN' && currentMoneda !== 'MXN') {
                            const rate = await getTipoCambio(currentMoneda, datosXML.fecha);
                            tipoCambioCorr = rate || '1.0000';
                        } else {
                            const rate = await getTipoCambio(datosXML.moneda, datosXML.fecha);
                            tipoCambioCorr = rate || datosXML.tipoCambio || '1.0000';
                        }

                        const nuevaFactura = {
                            folio: datosXML.folio,
                            ...datosXML,
                            tipoCambio: tipoCambioCorr,
                            pdfFile: selectedPDF,
                            xmlFile: selectedXML,
                            pdfPath: null,
                            xmlPath: null
                        };

                        if(duplicateFactura(nuevaFactura)) {
                            Toast('FACTURA YA REGISTRADA', 'Lo siento, esta factura ya fue agregada previamente a la solicitud');
                            resetFacturado();
                            return;
                        }

                        facturasCargadas.push(nuevaFactura);
                        addFactura(nuevaFactura);
                        resetFacturado();
                        Toast('FACTURA REGISTRADA', 'La factura se cargó correctamente. Puedes agregar otra');
                    } catch(error) {
                        Toast('ERROR EN EL REGISTRO', error.message);
                        if(selectedPDF) previewFileInfo(pdfContainer, selectedPDF, 'fa-solid fa-file-pdf');
                        if(selectedXML) previewFileInfo(xmlContainer, selectedXML, 'fa-solid fa-file-code');
                    } finally {
                        hideLoader();
                    }
                // Solo PDF
                } else {
                    if(pendingEditRow) {
                        Toast('ESPERA UN MOMENTO', 'Aún tienes una factura en proceso. Complétala o elimínala para continuar');
                        return;
                    }

                    showLoader();
                    try {
                        const tempId = Date.now() + '-' + Math.random();
                        const tempData = {
                            tempId: tempId,
                            pdfPath: selectedPDF,
                            moneda: currentMoneda || 'MXN',
                            tipoEdicion: 'pdf'
                        };

                        const newRow = addFacturaEditable(tempData);
                        pendingEditRow = newRow;
                        pendingTempData = tempData;
                        facturasCargadas.push(tempData);

                        const button = document.querySelector('.button-receipt');
                        button.innerHTML = 'CARGAR';
                        Toast('PDF REGISTRADO', 'Por favor, completa los datos de la factura en la tabla y presiona CARGAR al terminar');
                    } catch(error) {
                        Toast('ERROR EN EL REGISTRO', error.message);
                        if(selectedPDF) previewFileInfo(pdfContainer, selectedPDF, 'fa-solid fa-file-pdf');
                    } finally {
                        hideLoader();
                    }
                }
            }
            // ====== NO FACTURADO ====== //
            else {
                if(!selectedIMG) {
                    Toast('COMPROBANTE FALTANTE', 'Por favor, selecciona la imagen del ticket o recibo para su registro');
                    return;
                }
                if(pendingEditRow) {
                    Toast('ESPERA UN MOMENTO', 'Aún tienes una factura en proceso. Complétala o elimínala para continuar');
                    return;
                }

                showLoader();

                try {
                    const tempId = Date.now() + '-' + Math.random();
                    const tempData = {
                        tempId: tempId,
                        imgPath: selectedIMG,
                        moneda: currentMoneda || 'MXN',
                        tipoEdicion: 'img'
                    };

                    const newRow = addFacturaEditable(tempData);
                    pendingEditRow = newRow;
                    pendingTempData = tempData;
                    facturasCargadas.push(tempData);
                    const button = document.querySelector('.button-receipt');
                    if(button) button.innerHTML = 'CARGAR';
                
                    Toast('COMPROBANTE REGISTRADO', 'Por favor, completa los datos de la factura en la tabla y presiona CARGAR al terminar');
                } catch(error) {
                    Toast('ERROR EN EL REGISTRO', error.message);
                    if(selectedIMG) previewImage(imgContainer, selectedIMG);
                } finally {
                    hideLoader();
                }
            }
        });
    }
}


/* ================================== BUTTONS ================================== */
// Cancel
function cancelButton() {
    const cancelButton = document.querySelector('.button.cancel');

    cancelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-comprobaciones.html';
    });
}

// Send
async function enviarComprobacion() {
    const selector = document.querySelector('.request-selector');
    const selectedFolio = selector?.dataset.selectedFolio;

    if(!selectedFolio) {
        Toast('SOLICITUD REQUERIDA', 'Por favor, selecciona una solicitud para enviar su comprobación');
        return;
    }
    if(facturasCargadas.length === 0) {
        Toast('SIN FACTURAS', 'Agrega al menos una factura para continuar');
        return;
    }
    if(pendingEditRow) {
        Toast('DATOS INCOMPLETOS', 'Por favor, completa la información pendiente para continuar');
        return;
    }

    showLoader();
    try {
        const fechaComprobacion = new Date().toLocaleDateString('sv-SE');
        const facturasEnviar = [];

        for(const factura of facturasCargadas) {
            let rutaPDF = null, rutaXML = null, rutaIMG = null;

            if(factura.pdfFile instanceof File)
                rutaPDF = await uploadPDF(factura.pdfFile);

            if(factura.xmlFile instanceof File)
                rutaXML = await uploadXML(factura.xmlFile);

            if(factura.imgFile && factura.imgFile instanceof File)
                rutaIMG = await uploadIMG(factura.imgFile);

            const importeNum = parseFloat(String(factura.importe).replace(/[^0-9.-]/g, ''));
            const ivaNum = parseFloat(String(factura.iva).replace(/[^0-9.-]/g, ''));
            const otrosNum = parseFloat(String(factura.otros).replace(/[^0-9.-]/g, ''));
            const totalNum = parseFloat(String(factura.total).replace(/[^0-9.-]/g, ''));
            const tipoCambioNum = factura.tipoCambio ? parseFloat(factura.tipoCambio) : null;

            if(isNaN(importeNum))
                throw new Error(`Importe inválido para factura ${factura.folio}`);
            if(isNaN(ivaNum))
                throw new Error(`IVA inválido para factura ${factura.folio}`);
            if(isNaN(otrosNum))
                throw new Error(`Otros montos inválidos para factura ${factura.folio}`);
            if(isNaN(totalNum))
                throw new Error(`Total inválido para factura ${factura.folio}`);
            if(tipoCambioNum && isNaN(tipoCambioNum))
                throw new Error(`Tipo de cambio inválido para factura ${factura.folio}`);

            facturasEnviar.push({
                folio_factura: factura.folio,
                fecha_factura: factura.fecha,
                proveedor: (factura.proveedor).toUpperCase(),
                concepto: factura.concepto,
                descripcion: (factura.descripcion).toUpperCase(),
                importe: importeNum,
                iva: ivaNum,
                otros_montos: isNaN(otrosNum) ? 0 : otrosNum,
                total_moneda: totalNum,
                tipo_moneda: factura.moneda,
                ruta_xml: rutaXML,
                ruta_pdf: rutaPDF,
                ruta_jpg: rutaIMG,
                tipo_cambio: tipoCambioNum
            });
        }

        const body = {
            folio_solicitud: selectedFolio,
            fecha_comprobacion: fechaComprobacion,
            facturas: facturasEnviar
        };

        const response = await fetch(`${API}/api/comprobaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || err.mensaje || 'Error al enviar comprobación');
        }

        const result = await response.json();
        hideLoader();
        Toast('COMPROBACIÓN ENVIADA', result.message || 'Comprobación enviada correctamente!');
        resetAllFacturas();

        setTimeout(() => {
            window.location.href = 'colab-comprobaciones.html';
        }, 2500);
    } catch(error) {
        Toast('ERROR AL ENVIAR COMPROBACIÓN', error.message);
    } finally {
        hideLoader();
    }
}

// Save -> Edit
async function guardarComprobacion() {
    const urlParams = new URLSearchParams(window.location.search);
    const folioCmp = urlParams.get('folio');

    if(!folioCmp) {
        Toast('ERROR', 'Lo siento, no pude identificar la comprobación que deseas editar');
        return;
    }
    if(facturasCargadas.length === 0) {
        Toast('SIN FACTURAS', 'Agrega al menos una factura para continuar');
        return;
    }
    if(pendingEditRow) {
        Toast('DATOS INCOMPLETOS', 'Por favor, completa la información pendiente para continuar');
        return;
    }

    showLoader();
    try {
        const fechaComp = new Date().toLocaleDateString('sv-SE');
        const facturasEnviar = [];

        for(const factura of facturasCargadas) {
            let rutaPDF = factura.pdfPath || null;
            let rutaXML = factura.xmlPath || null;
            let rutaIMG = factura.imgPath || null;

            if(factura.pdfFile instanceof File)
                rutaPDF = await uploadPDF(factura.pdfFile);

            if(factura.xmlFile instanceof File)
                rutaXML = await uploadXML(factura.xmlFile);

            if(factura.imgFile instanceof File)
                rutaIMG = await uploadIMG(factura.imgFile);

            const importeNum = parseFloat(String(factura.importe).replace(/[^0-9.-]/g, ''));
            const ivaNum = parseFloat(String(factura.iva).replace(/[^0-9.-]/g, ''));
            const otrosNum = parseFloat(String(factura.otros).replace(/[^0-9.-]/g, ''));
            const totalNum = parseFloat(String(factura.total).replace(/[^0-9.-]/g, ''));
            const tipoCambioNum = factura.tipoCambio ? parseFloat(factura.tipoCambio) : null;

            if(isNaN(importeNum))  
                throw new Error(`Importe inválido en factura ${factura.folio}`);
            if(isNaN(ivaNum))
                throw new Error(`IVA inválido en factura ${factura.folio}`);
            if(isNaN(otrosNum))
                throw new Error(`Otros montos inválidos en factura ${factura.folio}`);
            if(isNaN(totalNum))
                throw new Error(`Total inválido en factura ${factura.folio}`);

            facturasEnviar.push({
                folio_factura: factura.folio,
                fecha_factura: factura.fecha,
                proveedor: (factura.proveedor || '').toUpperCase(),
                concepto: factura.concepto,
                descripcion: (factura.descripcion || '').toUpperCase(),
                importe: importeNum,
                iva: ivaNum,
                otros_montos: isNaN(otrosNum) ? 0 : otrosNum,
                total_moneda: totalNum,
                tipo_moneda: factura.moneda,
                ruta_pdf: rutaPDF,
                ruta_xml: rutaXML,
                ruta_jpg: rutaIMG,
                tipo_cambio: tipoCambioNum
            });
        }

        const body = {
            folio_comp:  folioCmp,
            fecha_comp:  fechaComp,
            facturas:    facturasEnviar
        };

        const response = await fetch(`${API}/api/comprobaciones/editar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || err.mensaje || 'Error al guardar la comprobación');
        }

        const result = await response.json();
        hideLoader();
        Toast('COMPROBACIÓN ACTUALIZADA', result.mensaje || 'La comprobación se actualizó correctamente');

        setTimeout(() => {
            window.location.href = 'colab-comprobaciones.html';
        }, 2500);
    } catch(error) {
        Toast('ERROR AL EDITAR', error.message)
    } finally {
        hideLoader();
    }
}


/* =================================== EDIT =================================== */
function loadFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchValue = urlParams.get('search');
    const folioValue = urlParams.get('folio');

    if(!searchValue || !folioValue) return;

    const title = document.querySelector('.title.folio-cmp');
    const request = document.querySelector('.request-back .sol-edit');

    if(title) title.textContent = folioValue;
    if(request) request.textContent = searchValue;
}

async function loadCmpDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const folioCmp = urlParams.get('folio');
    if(!folioCmp) return;

    showLoader();
    try {
        const response = await fetch(`${API}/api/comprobaciones/detalle?folio=${folioCmp}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'No se pudieron cargar los detalles de la comprobación');
        }

        const { comprobacion, facturas } = await response.json();

        if(facturas.length) {
            currentMoneda = comprobacion.total_moneda;
            currentMonto = comprobacion.anticipo; 
            updateXmlVisibility();
        }

        // Formatear fecha
        function formatDate(dateStr) {
            if(!dateStr) return '';

            if(dateStr.includes('T'))
                return dateStr.split('T')[0];

            const d = new Date(dateStr);
            if(!isNan(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            return dateStr;
        }

        function formatCurrency(value) {
            if(value === undefined || value === null || isNaN(value)) return '$0.00';

            const num = parseFloat(value);
            const formatted = Math.abs(num).toFixed(2);

            if(num < 0)
                return `- $${formatted}`;

            return `$${formatted}`;
        }

        // Llenar tabla con facturas existentes
        facturas.forEach(f => {
            const datos = {
                folio: f.folio_factura || '',
                fecha: formatDate(f.fecha_factura),
                proveedor: f.proveedor || '',
                concepto: f.concepto || '',
                descripcion: f.descripcion || '',
                importe: formatCurrency(f.importe),
                iva: formatCurrency(f.iva),
                otros: formatCurrency(f.otros_montos),
                total: formatCurrency(f.total_factura),
                moneda: f.tipo_moneda || '',
                tipoCambio: f.tipo_cambio?.tipo_cambio
                    ? parseFloat(f.tipo_cambio.tipo_cambio).toFixed(4)
                    : '1.0000',

                pdfFile: null,
                xmlFile: null,
                imgFile: null,
                rutaPDF: f.ruta_pdf || null,
                rutaXML: f.ruta_xml || null,
                rutaIMG: f.ruta_jpg || null,
            };

            addFactura(datos);

            facturasCargadas.push({
                ...datos,
                importe: parseFloat(f.importe || 0).toFixed(2),
                iva: parseFloat(f.iva || 0).toFixed(2),
                otros: parseFloat(f.otros_montos || 0).toFixed(2),
                total: parseFloat(f.total_factura || 0).toFixed(2),
                pdfPath: f.ruta_pdf  || null,
                xmlPath: f.ruta_xml  || null,
                imgPath: f.ruta_jpg  || null,
            });
        });

        updateComp();
        updatePayment(comprobacion.anticipo, comprobacion.total_moneda);
    } catch(error) {
        console.log(error);
        Toast('ERROR', 'No se pudo cargar el detalle de la comprobación');
    } finally {
        hideLoader();
    }
}


/* ================================== TOAST ================================== */
// Toast -> Simple
const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    width: '600px',
    customClass: { popup: 'colored-toast' },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

function Toast(title, content, imageUrl = './assets/images/Icon_agave.webp') {
    ToastMixin.fire({
        icon: undefined,
        html: `
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${imageUrl}" alt="Agave" class="agave-icon">
                <div class="text">
                    <p>${title}</p>
                    <span>${content}</span>
                </div>
            </div>
        `
    });
}
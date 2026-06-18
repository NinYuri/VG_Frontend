document.addEventListener("DOMContentLoaded", async function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('search'))
        initSearchFromUrl();
    else
        tableInformation(getCurrentFilters());

    tabSelected();
    search();
    setupSorting();
    buttonTransfer();
    initReceiptUpload();
    buttonInfo();
    buttonPreview();
    buttonDownload();
});


/* ============================== VARIABLES ============================== */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
//const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';

// Transfer receipt
let selectedFile = null;
let isUploading = false;
let uploadComplete = false;
let uploadedFilePath = null;

// Table information
let currentPage = 1;
let paginacionGlobal = {
    paginaActual: 1,
    totalPaginas: 1
};
const limitPerPage = 7;
let currentSol = 'ASC';
let currentAnticipo = null;
let currentComp = null;
let currentSaldo = null;
let currentAjuste = null;

// Adjustment
let availableAdj = [];
let currentAdjIndex = -1;


/* ================================= FUNCIONES ================================= */
const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function formatDate(dateStr) {
    if(!dateStr) return '—';

    const fechaISO = new Date(dateStr).toISOString().slice(0, 10);
    const [year, monthNum, day] = fechaISO.split('-');
    const dia = day;
    const mes = meses[parseInt(monthNum, 10) - 1];
    return `${dia} / ${mes} / ${year}`;
}

function formatCurrency(value, currencyCode = 'MXN') {
    if(value === null || value === undefined) return '0.00';
    const formatter = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return formatter.format(value);
}

// Currency
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
    user.innerHTML = '';
    user.innerHTML = logoUser;
}


/* ============================== PHONE MENU ============================== */
function phoneMenu() {
    const container = document.querySelector('.mobile-nav');
    const hamburger = document.getElementById('hamburger');
    const optionBar = document.getElementById('optionBar');
    const checkBox = hamburger.querySelector('input');

    if(!container || !hamburger || !optionBar || !checkBox) return;

    checkBox.addEventListener('change', function(e) {
        e.stopPropagation();

        container.classList.toggle('bar', checkBox.checked);
        hamburger.classList.toggle('active', checkBox.checked);
        optionBar.classList.toggle('active', checkBox.checked);
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        if(!hamburger.contains(e.target) && !optionBar.contains(e.target)) {
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
    hamburger.addEventListener('touchstart', function(e) {
        e.stopImmediatePropagation();
    }, { passive: true });
}

function initMobileScroll() {
    const nav = document.querySelector('.mobile-nav');
    const scrollContainer = document.querySelector('.content-container');

    if(!nav || !scrollContainer) return;

    function handleMobileScroll() {
        const scrollTop = scrollContainer.scrollTop;
        if(scrollTop > 30)
            nav.classList.add('scrolled');
        else
            nav.classList.remove('scrolled');
    }

    scrollContainer.addEventListener('scroll', handleMobileScroll, { passive: true });
    handleMobileScroll();
}


/* ============================== OPTIONS BAR ============================== */
async function logoutReset() {
    try {
        await fetch(`${API}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch(error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        Session.clearAll();
        window.location.href = 'index.html';
    }
}

function optionsBar() {
    const dashboard = document.querySelector('.option.dashboard');
    const request = document.querySelector('.option.request');
    const expenses = document.querySelector('.option.expenses');
    const liquidations = document.querySelector('.option.liquidation');
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;
        
        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if(currentPath.includes('colab-dashboard.html'))
            dashboard.classList.add('active');
        else if(currentPath.includes('colab-solicitudes.html') || currentPath.includes('crear-solicitud.html') || currentPath.includes('editar-solicitud.html'))
            request.classList.add('active');
        else if(currentPath.includes('colab-comprobaciones.html') || currentPath.includes('crear-comprobacion.html') || currentPath.includes('editar-comprobacion.html'))
            expenses.classList.add('active');
        else if(currentPath.includes('colab-liquidaciones.html'))
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

    logout.addEventListener('click', (e) => {
        e.stopPropagation();
        logoutReset();
    });
}


/* =========================== TABLE INFORMATION =========================== */
// Status tabs
function getActiveStatus() {
    const tabActive = document.querySelector('.tab.selected');
    if(!tabActive) return null;

    if(tabActive.classList.contains('pending'))
        return 'Pendiente';
    if(tabActive.classList.contains('paid'))
        return 'Pagado';
    if(tabActive.classList.contains('returned'))
        return 'Devuelto';
    if(tabActive.classList.contains('settled'))
        return 'Saldado';

    return null;
}

function getActiveTabId() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return 'all';

    if(activeTab.classList.contains('pending')) return 'pending';
    if(activeTab.classList.contains('paid')) return 'paid';
    if(activeTab.classList.contains('returned')) return 'returned';
    if(activeTab.classList.contains('settled')) return 'settled';

    return 'all';
}

function toastStatus() {
    const tabActive = document.querySelector('.tab.selected');
    if(!tabActive) return null;

    if(tabActive.classList.contains('pending'))
        return 'pendientes';
    if(tabActive.classList.contains('paid'))
        return 'pagadas';
    if(tabActive.classList.contains('returned'))
        return 'devueltas';
    if(tabActive.classList.contains('settled'))
        return 'saldadas';

    return null;
}

// Filters
function getCurrentFilters() {
    const estado = getActiveStatus();
    const input = document.querySelector('.search-back input');
    const valor = input ? input.value.trim() : '';
    const filtros = { estado };
    if(valor) filtros.solicitud = valor;

    filtros.orden = currentSol;
    if(currentAnticipo) filtros.ordenAnt = currentAnticipo;
    if(currentComp) filtros.ordenCmp = currentComp;
    if(currentSaldo) filtros.ordenSaldo = currentSaldo;
    if(currentAjuste) filtros.ordenAjuste = currentAjuste;

    return filtros;
}

// Backend query
async function tableInformation(filtros = {}, page = 1) {
    showLoader();
    renderTable([], getActiveTabId());
    renderCards([]);

    const offset = (page - 1) * limitPerPage;

    const params = new URLSearchParams();
    if(filtros.estado) params.append('estado', filtros.estado);
    if(filtros.solicitud) params.append('solicitud', filtros.solicitud);
    params.append('limit', limitPerPage);
    params.append('offset', offset);
    params.append('orden', currentSol);
    params.append('ordenAnt', currentAnticipo);
    params.append('ordenCmp', currentComp);
    params.append('ordenSaldo', currentSaldo);
    params.append('ordenAjuste', currentAjuste);

    try {
        const response = await fetch(`${API}/api/liquidaciones/listar?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if(!response.ok) {
            renderTable([]);
            renderCards([]);
            throw new Error('Error al obtener solicitudes');
            return;
        }

        const data = await response.json();
        const tab = getActiveTabId();

        if(data.mensaje) {
            renderTable([]);
            renderCards([]);
            const tab = toastStatus();
            Toast(`SIN LIQUIDACIONES ${tab === null ? '' : tab.toUpperCase()}`, `No tienes liquidaciones ${tab === null ? '' : tab} para mostrar en este momento`);
            return;
        }

        renderTable(data.liquidaciones, tab);
        renderCards(data.liquidaciones, tab);
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        renderCards([]);
        Toast('ERROR AL MOSTRAR', 'No se pudieron cargar las liquidaciones. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table Information
function getButtons(estado, tipo_ajuste) {
    if(estado === 'Pendiente')
        return `<i class="fa-solid fa-circle-dollar-to-slot"></i>`;
    else if(estado === 'Pagado') 
        return `
            <i class="fa-solid fa-circle-dollar-to-slot"></i>
            <i class="fa-solid fa-circle-info"></i>
        `;
    else if(estado === 'Devuelto') 
        return `<i class="fa-solid fa-circle-info"></i>`;
    else if(estado === 'Saldado' && tipo_ajuste !== 'Sin_diferencia')
        return `<i class="fa-solid fa-circle-info"></i>`;
    
    return '';
}

function renderTable(liquidaciones, tab = 'all') {
    const tbody = document.querySelector('.table-body');
    if(!tbody) return;

    tbody.innerHTML = '';
    if(liquidaciones.length === 0) return;

    const statusClass = {
        'Pendiente': 'st-pending',
        'Pagado': 'st-paid',
        'Devuelto': 'st-returned',
        'Saldado': 'st-settled'
    };

    const adjustmentClass = {
        'Devolución': 'st-return',
        'Reembolso': 'st-refund',
        'Sin_diferencia': 'st-paid-off'
    };

    liquidaciones.forEach(liq => {
        const tr = document.createElement('tr');

        const simboloAnt = obtenerSimboloMoneda(liq.moneda_anticipo);
        const simboloCmp = obtenerSimboloMoneda(liq.moneda_comprobacion);
        const simboloSaldo = obtenerSimboloMoneda(liq.moneda_comprobacion);

        const saldoNum = liq.diferencia || 0;
        const saldoAbs = Math.abs(saldoNum);
        const saldoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(saldoAbs);
        const signo = saldoNum < 0 ? '-' : '';
        const diferencia = `${signo} ${simboloSaldo}${saldoFormateado}`;

        const anticipo = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(liq.total_autorizado);

        const comprobado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(liq.total_comprobado);

        const estadoClass = statusClass[liq.estado] || '';
        const ajusteClass = adjustmentClass[liq.tipo_ajuste] || '';

        const textoAjuste = liq.tipo_ajuste.split('_')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');

        tr.innerHTML = `
            <td class="solicitud"><p>${liq.folio_solicitud}</p></td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(liq.moneda_anticipo)}" alt="${liq.moneda_anticipo}" onerror="this.style.display='none'">
                    <p><span class="symbol-money">${simboloAnt}</span>${anticipo}</p>
                </div>
            </td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(liq.moneda_comprobacion)}" alt="${liq.moneda_comprobacion}" onerror="this.style.display='none'">
                    <p><span class="symbol-money">${simboloCmp}</span>${comprobado}</p>
                </div>
            </td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(liq.moneda_comprobacion)}" alt="${liq.moneda_comprobacion}" onerror="this.style.display='none'">
                    <p>${diferencia}</p>
                </div>
            </td>
            <td><div class="status adjust ${ajusteClass}">${textoAjuste}</div></td>
            <td><div class="status ${estadoClass}">${liq.estado}</div></td>
            <td>
                <div class="actions">
                    ${getButtons(liq.estado, liq.tipo_ajuste)}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    const rowsActuales = liquidaciones.length;
    for(let i = rowsActuales; i < limitPerPage; i++) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td><p class="empty-row">Empty</p></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(emptyRow);
    }
}

// Cards Information
function renderCards(liquidaciones, tab = 'all') {
    const container = document.querySelector('.cards-mobile');
    if(!container) return;

    container.innerHTML = '';
    if(liquidaciones.length === 0) return;

    const statusClass = {
        'Pendiente': 'st-pending',
        'Pagado': 'st-paid',
        'Devuelto': 'st-returned',
        'Saldado': 'st-settled'
    };

    const adjustmentClass = {
        'Devolución': 'st-return',
        'Reembolso': 'st-refund',
        'Sin_diferencia': 'st-paid-off'
    };

    liquidaciones.forEach(liq => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-solicitud', liq.folio_solicitud);
        card.setAttribute('data-loaded', 'false');

        const estadoClass = statusClass[liq.estado] || '';
        const ajusteClass = adjustmentClass[liq.tipo_ajuste] || '';
        const textoAjuste = liq.tipo_ajuste.split('_')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');

        card.innerHTML = `
            <div class="first-info">
                <div class="info-mobile">
                    <p class="subt-mobile">SOLICITUD</p>
                    <p class="solicitud-mobile">${liq.folio_solicitud}</p>
                </div>

                <div class="both-status-mobile">
                    <div class="info-mobile">
                        <p class="subt-mobile">AJUSTE</p>
                        <p class="status ${ajusteClass} st-adjust">${textoAjuste}</p>
                    </div>

                    <div class="info-mobile">
                        <p class="subt-mobile">ESTADO</p>
                        <p class="status ${estadoClass} st-mobile">${liq.estado}</p>
                    </div>
                </div>
            </div>

            <div class="complete-info"></div>
        `;

        container.appendChild(card);
    });

    activeCards();
}

// Pagination
function updatePagination(paginacion) {
    const pageDiv = document.querySelector('.page');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    if(pageDiv) pageDiv.textContent = paginacion.paginaActual;
    paginacionGlobal = paginacion;

    // Habilitar / deshabilitar botones
    if(prevBtn) prevBtn.parentElement.classList.toggle('disabled', paginacion.paginaActual <= 1);
    if(nextBtn) nextBtn.parentElement.classList.toggle('disabled', paginacion.paginaActual >= paginacion.totalPaginas);
}

function setupPaginationEvents() {
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    if(!prevBtn || !nextBtn) return;

    const prevParent = prevBtn.parentElement;
    const nextParent = nextBtn.parentElement;

    prevParent.addEventListener('click', (e) => {
        e.stopPropagation();
        if (paginacionGlobal.paginaActual <= 1 || prevParent.classList.contains('disabled')) return;
        currentPage--;
        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
    });

    nextParent.addEventListener('click', (e) => {
        e.stopPropagation();
        if (paginacionGlobal.paginaActual >= paginacionGlobal.totalPaginas || nextParent.classList.contains('disabled')) return;
        currentPage++;
        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
    });
}

// Currency
function getFlagUrl(code) {
    const country = CURRENCY_COUNTRY[code] || code.slice(0, 2).toLowerCase();
    return `https://flagcdn.com/w40/${country}.png`;
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


/* ============================== TABLE TABS ============================== */
function tabSelected() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}


/* ============================== SEARCH ============================== */
function search() {
    const search = document.querySelector('.search-back');
    const input = search.querySelector('input');
    if(!search || !input) return;

    let debounceTimer;

    function doSearch() {
        const valor = input.value.trim();
        const filtros = getCurrentFilters();
        if(valor)
            filtros.solicitud = valor;

        currentPage = 1;
        tableInformation(filtros, currentPage);
    }

    // ENTER keypress
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            clearTimeout(debounceTimer);
            currentPage = 1;
            doSearch();
        } 
    });

    input.addEventListener('input', (e) => {
        if(input.value.trim() === '') {
            clearTimeout(debounceTimer);
            const filtros = getCurrentFilters();

            delete filtros.solicitud;

            currentPage = 1;
            tableInformation(filtros, currentPage);
        }
    });
}


/* =============================== URL PARAMS =============================== */
function initSearchFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchValue = urlParams.get('search');

    if(!searchValue) return;

    const search = document.querySelector('.search-back');
    const input = search.querySelector('input');

    input.value = searchValue;
    currentPage = 1;
    const filtros = getCurrentFilters();
    filtros.solicitud = searchValue;
    tableInformation(filtros, currentPage);
}


/* ============================= ACTIVE CARD ============================= */
async function loadCardDetails(card) {
    const solicitud = card.getAttribute('data-solicitud');
    if(!solicitud) return;

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/liquidaciones/detalle?solicitud=${encodeURIComponent(solicitud)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Error al cargar los detalles' }));
            throw new Error(err.message || 'Error al obtener detalles');
        }

        const data = await response.json();
        llenarInfoCard(card, data);
        card.setAttribute('data-loaded', 'true');
    } catch(error) {
        Toast('ERROR', error.message);
    }
}

async function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('click', async(e) => {
            if(e.target.closest('.status.btn-received.st-mobile, .complete-info, .fa-circle-check, .fa-circle-xmark, .fa-pen-to-square, .fa-money-check-dollar, .buttons-mobile')) 
                return;
            
            e.stopPropagation();

            const completeInfo = card.querySelector('.complete-info');
            const wasActive = card.classList.contains('active');

            if(wasActive)
                card.classList.remove('active');
            else {
                cards.forEach(c => {
                    c.classList.remove('active');
                });
                card.classList.add('active');

                if(card.getAttribute('data-loaded') === 'false')
                    await loadCardDetails(card);
            }
        });
    });

    const firstCard = cards[0];

    firstCard.classList.add('active');
    if(firstCard.getAttribute('data-loaded') === 'false')
        await loadCardDetails(firstCard);
}

function llenarInfoCard(card, data) {
    const completeInfo = card.querySelector('.complete-info');
    if(!completeInfo) return;

    const simboloAnt = obtenerSimboloMoneda(data.moneda_anticipo);
    const simboloCmp = obtenerSimboloMoneda(data.moneda_comprobacion);
    const simboloSaldo = obtenerSimboloMoneda(data.moneda_comprobacion);

    const saldoNum = data.diferencia || 0;
    const saldoAbs = Math.abs(saldoNum);
    const saldoFormateado = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(saldoAbs);
    const signo = saldoNum < 0 ? '-' : '';
    const diferencia = `${signo} ${simboloSaldo}${saldoFormateado}`;

    const anticipo = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(data.total_autorizado);

    const comprobado = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(data.total_comprobado);

    const banderaAnt = getFlagUrl(data.moneda_anticipo);
    const banderaCmp = getFlagUrl(data.moneda_comprobacion);
    const banderaSaldo = getFlagUrl(data.moneda_comprobacion);

    const fechaPago = data.fecha_pago ? formatDate(data.fecha_pago) : '—';

    let fechaRecibido = '';
    if(data.fecha_recibido)
        fechaRecibido = formatDate(data.fecha_recibido);
    else {
        if(data.tipo_ajuste === 'Reembolso')
            fechaRecibido = 'Pendiente de tu confirmación';
        else if(data.tipo_ajuste === "Devolución")
            fechaRecibido = 'Pendiente de confirmación por Tesorería';
    }
    
    const comprobante = !!data.ruta_comprobacion;
    const fullImageUrl = comprobante ? `${API}/${data.ruta_comprobacion}` : '';

    card.setAttribute('data-comprobante-url', fullImageUrl);

    let html = '';

    if(data.estado === 'Pendiente' || data.tipo_ajuste === 'Sin_diferencia') {
        html = `
            <div class="first-column">
                <div class="info-mobile">
                    <p class="subt-mobile">ANTICIPO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simboloAnt}</span>${anticipo}</p>
                    <p class="amount-mobile-currency"><img src="${banderaAnt}" alt="${data.moneda_anticipo}" onerror="this.style.display='none'">${data.moneda_anticipo}</p>
                </div>
            </div>

            <div class="second-column">
                <div class="info-mobile">
                    <p class="subt-mobile">COMPROBADO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simboloCmp}</span>${comprobado}</p>
                    <p class="amount-mobile-currency"><img src="${banderaCmp}" alt="${data.moneda_comprobacion}" onerror="this.style.display='none'">${data.moneda_comprobacion}</p>
                </div>
            </div>

            <div class="third-column">
                <div class="info-mobile">
                    <p class="subt-mobile">DIFERENCIA</p>
                    <p class="amount-mobile">${diferencia}</p>
                    <p class="amount-mobile-currency"><img src="${banderaSaldo}" alt="${data.moneda_comprobacion}" onerror="this.style.display='none'">${data.moneda_comprobacion}</p>
                </div>

                ${data.estado === 'Pendiente' ? 
                    `<div class="buttons-mobile"><i class="fa-solid fa-circle-dollar-to-slot"></i></div>` :
                ''}
            </div>
        `;
    } else {
        html = `
            <div class="first-column">
                <div class="info-mobile">
                    <p class="subt-mobile">ANTICIPO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simboloAnt}</span>${anticipo}</p>
                    <p class="amount-mobile-currency"><img src="${banderaAnt}" alt="${data.moneda_anticipo}" onerror="this.style.display='none'">${data.moneda_anticipo}</p>
                </div>

                <div class="info-mobile">
                    <p class="subt-mobile">COMPROBADO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simboloCmp}</span>${comprobado}</p>
                    <p class="amount-mobile-currency"><img src="${banderaCmp}" alt="${data.moneda_comprobacion}" onerror="this.style.display='none'">${data.moneda_comprobacion}</p>
                </div>
            </div>

            <div class="second-column">
                <div class="info-mobile">
                    <p class="subt-mobile">DIFERENCIA</p>
                    <p class="amount-mobile">${diferencia}</p>
                    <p class="amount-mobile-currency"><img src="${banderaSaldo}" alt="${data.moneda_comprobacion}" onerror="this.style.display='none'">${data.moneda_comprobacion}</p>
                </div>

                ${comprobante ? 
                    `<div class="info-mobile tranfer-rec">
                        <p class="subt-mobile">COMPROBANTE</p>
                        <i class="fa-solid fa-image"></i>
                        <i class="fa-solid fa-cloud-arrow-down"></i>
                    </div>`
                : `
                    <div class="map-img">
                        <img src="./assets/images/Icon_map.webp" alt="Map">
                    </div>
                `}
            </div>

            <div class="third-column">
                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE PAGO</p>
                    <p>${fechaPago}</p>
                </div>

                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE CONFIRMACIÓN</p>
                    <p class="message">${fechaRecibido}</p>
                </div>

                ${data.estado === 'Pagado' ? 
                    `<div class="buttons-mobile"><i class="fa-solid fa-circle-dollar-to-slot"></i></div>` :
                ''}
            </div>
        `;
    }
    completeInfo.innerHTML = html;

    // Image
    if(comprobante) {
        const viewIcons = completeInfo.querySelectorAll('.fa-image');
        const downloadIcons = completeInfo.querySelectorAll('.fa-cloud-arrow-down');

        viewIcons.forEach(icon => {
            icon.removeEventListener('click', handleView);
            icon.addEventListener('click', handleView);
            function handleView(e) {
                e.stopPropagation();
                previewReceipt(fullImageUrl);
            }
        });

        downloadIcons.forEach(icon => {
            icon.removeEventListener('click', handleDownload);
            icon.addEventListener('click', handleDownload);
            function handleDownload(e) {
                e.stopPropagation();
                const solicitud = card.getAttribute('data-solicitud');
                downloadReceipt(fullImageUrl, `Comprobante de Liquidación ${solicitud}.jpg`);
            }
        });
    }
}


/* ============================== CLASSIFICATION ============================== */
// Adjustment
async function fetchAjustes() {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return false;
        }

        const response = await fetch(`${API}/api/liquidaciones/ajustes`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener tipos de ajuste');
        const data = await response.json();
        availableAdj = data;
    } catch (error) {
        Toast('ERROR', 'No se pudieron cargar los tipos de ajuste');
        availableAdj = [];
    }
}

function setupSorting() {
    const orderDivs = document.querySelectorAll('.order-div[data-column]');

    orderDivs.forEach(div => {
        const orderIcons = div.querySelector('.order');
        if(!orderIcons) return;

        orderIcons.addEventListener('click', async (e) => {
            e.stopPropagation();
            const column = div.dataset.column;

            switch(column) {
                case 'solicitud':
                    currentSol = currentSol === 'ASC' ? 'DESC' : 'ASC';

                    currentAnticipo = null;
                    currentComp = null;
                    currentSaldo = null;
                    currentAjuste = null;
                    break;
                case 'anticipo':
                    currentAnticipo = currentAnticipo === 'ASC' ? 'DESC' : 'ASC';

                    currentSol = null;
                    currentComp = null;
                    currentSaldo = null;
                    currentAjuste = null;
                    break;
                case 'comprobado':
                    currentComp = currentComp === 'ASC' ? 'DESC' : 'ASC';

                    currentSol = null;
                    currentAnticipo = null;                    
                    currentSaldo = null;
                    currentAjuste = null;
                    break;
                case 'saldo':
                    currentSaldo = currentSaldo === 'ASC' ? 'DESC' : 'ASC';

                    currentSol = null;
                    currentAnticipo = null;
                    currentComp = null;                    
                    currentAjuste = null;
                    break;
                case 'ajuste':
                    if(availableAdj.length === 0) {
                        await fetchAjustes();
                        if(availableAdj.length === 0) return;
                    }
                    
                    currentAdjIndex = (currentAdjIndex + 1) % availableAdj.length;
                    currentAjuste = availableAdj[currentAdjIndex];
                    
                    currentSol = null;
                    currentAnticipo = null;
                    currentComp = null;
                    currentSaldo = null;
                    break;
                default:
                    break;
            }

            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}


/* ============================== TABLE BUTTONS ============================== */
// Transfer Receipt
async function gestionarComprobante(solicitud, fechaPago = null, fechaRecibido = null, rutaComprobante = null, noRecibido = false) {
    const body = { solicitud };
    if(fechaPago) body.fechaPago = fechaPago;
    if(fechaRecibido) body.fechaRecibido = fechaRecibido;
    if(rutaComprobante) body.rutaComprobante = rutaComprobante;
    if(noRecibido) body.noRecibido = noRecibido;

    if(!token) {
        Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
        return false;
    }

    const response = await fetch(`${API}/api/liquidaciones/comprobante`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(body)
    });

    if(!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al gestionar liquidación');
    }

    return await response.json();
}

async function buttonTransfer() {
    document.body.addEventListener('click', async(e) => {
        const button = e.target.closest('.fa-circle-dollar-to-slot');
        if(!button) return;

        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let solicitud;
        let ajuste;

        if(row) {
            const solCell = row.querySelector('.solicitud');
            const ajtCell = row.querySelector('.status.adjust');

            if(solCell) solicitud = solCell.textContent.trim();
            if(ajtCell) ajuste = ajtCell.textContent.trim();
        } else if(card) {
            const solCell = card.querySelector('.solicitud-mobile');
            const ajtCell = card.querySelector('.st-adjust');

            if(solCell) solicitud = solCell.textContent.trim();
            if(ajtCell) ajuste = ajtCell.textContent.trim();
        } else return;

        if(ajuste === 'Reembolso')
            ToastRefund(solicitud);
        else
            ToastReturn('SELECCIONA EL MÉTODO DE PAGO', '¿Cómo deseas realizar el pago correspondiente a esta liquidación?', 'EFECTIVO', 'TRANSFERENCIA', solicitud);
    });
}

async function uploadReceiptFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API}/api/liquidaciones/upload/comprobante/liquidacion`, {
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

function initReceiptUpload() {
    const receiptContainer = document.querySelector('.receipt-container');
    const uploadButton = document.querySelector('.button-receipt');
    const fileInput = document.createElement('input');
    const container = document.querySelector('.container');
    const receiptModal = document.querySelector('.transfer-wrapper');
    const closeButton = document.querySelector('.transfer-wrapper .top-decor i');

    if(!receiptContainer || !uploadButton || !container || !receiptModal || !closeButton) return;

    fileInput.type = 'file';
    fileInput.accept = '.jpg, .jpeg, .png';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    let isConfirming = false;

    // Original
    function resetContainer() {
        receiptContainer.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Selecciona o arrastra tu comprobante (JPG o PNG)</p>
        `;

        receiptContainer.style.backgroundImage = '';
        receiptContainer.style.border = '2px dashed var(--line-gray)';
        receiptContainer.classList.remove('has-image');
        
        selectedFile = null;
        isUploading = false;
        uploadComplete = false;
        uploadedFilePath = null;
        isConfirming = false;
    }

    // Loader
    function showLoaderReceipt() {
        receiptContainer.innerHTML = `
            <div class="loader-receipt"></div>
            <p>Subiendo comprobante...</p>
        `;
    }

    // Image
    function showUploadedImage(imageUrl) {
        receiptContainer.innerHTML = '';
        receiptContainer.style.backgroundImage = `url(${imageUrl})`;
        receiptContainer.style.backgroundSize = 'cover';
        receiptContainer.style.backgroundPosition = 'center';
        receiptContainer.style.border = 'none';
        receiptContainer.classList.add('has-image');

        const removeText = receiptContainer.querySelector('p');
        if(removeText) removeText.remove();
    }

    function previewFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if(!validTypes.includes(file.type)) {
            Toast('FORMATO DE ARCHIVO INVÁLIDO', 'Solo se permiten archivos en formato JPG o PNG');
            resetContainer();
            return false;
        }

        selectedFile = file;
        uploadComplete = false;
        isUploading = false;
        uploadedFilePath = null;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => { showUploadedImage(e.target.result); };
        reader.readAsDataURL(file);
        return true;
    }

    async function uploadAndConfirm(solicitud) {
        if(isConfirming) {
            Toast('ACHIVO EN PROCESO', 'Ya se está subiendo un archivo. Por favor, espera');
            return false;
        }

        if(!selectedFile) {
            Toast('COMPROBANTE REQUERIDO', 'Debes adjuntar un comprobante');
            return false;
        }

        if(isUploading) {
            Toast('ACHIVO EN PROCESO', 'Ya se está subiendo un archivo. Por favor, espera');
            return false;
        }

        isConfirming = true;
        isUploading = true;
        showLoaderReceipt();

        try {
            const ruta = await uploadReceiptFile(selectedFile);
            uploadedFilePath = ruta;
            uploadComplete = true;
            isUploading = false;

            const hoy = new Date().toLocaleDateString('sv-SE');
            await gestionarComprobante(solicitud, hoy, null, uploadedFilePath);
            Toast('COMPROBANTE CARGADO', '¡Listo! Hemos notificado a Tesorería para que confirme la recepción de la devolución');
            
            const filtros = getCurrentFilters();
            await tableInformation(filtros, currentPage);
            receiptModal.style.display = 'none';
            container.classList.remove('modal-open');
            resetContainer();
            return true;
        } catch(error) {
            Toast('ERROR', error.message);
            resetContainer();
            return false;
        } finally {
            isConfirming = false;
            isUploading = false;
        }
    }

    function openFileSelector() {
        if(isUploading || isConfirming) {
            Toast('ACHIVO EN PROCESO', 'Ya se está subiendo un archivo. Por favor, espera');
            return;
        }
        fileInput.click();
    }

    receiptContainer.addEventListener('click', openFileSelector);

    receiptContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        receiptContainer.classList.add('dragover');
    });

    receiptContainer.addEventListener('dragleave', () => {
        receiptContainer.classList.remove('dragover');
    });

    receiptContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        receiptContainer.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if(file) previewFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            previewFile(file);
        }

        fileInput.value = '';
    });

    uploadButton.addEventListener('click', async(e) => {
        e.stopPropagation();

        const solicitud = receiptModal.dataset.solicitud;
        if(!solicitud) {
            Toast('ERROR', 'No se pudo identificar el folio de la solicitud');
            return;
        }

        if(!isConfirming && selectedFile && !uploadComplete)
            await uploadAndConfirm(solicitud);
        else if(!selectedFile)
            Toast('COMPROBANTE REQUERIDO', 'Debes adjuntar el comprobante de la transferencia para continuar');
        else if(uploadComplete)
            Toast('COMPROBANTE YA REGISTRADO', 'Este comprobante ya fue cargado previamente');
        else
            Toast('ACHIVO EN PROCESO', 'Ya se está subiendo un archivo. Por favor, espera');
    });

    // Cierre del modal
    closeButton.addEventListener('click', () => {
        receiptModal.style.display = 'none';
        container.classList.remove('modal-open');
        resetContainer();
    });
}

// Information
async function buttonInfo() {
    const container = document.querySelector('.container');
    const info = document.querySelector('.info-wrapper');
    const ajusteSpan = info.querySelector('.ajuste');
    const closeBtn = info.querySelector('.top-decor i');
    const bottomCash = info.querySelector('.bottom-decor.cash');
    const bottomTransfer = info.querySelector('.bottom-decor.transfer');

    if(!container || !info || !ajusteSpan || !closeBtn || !bottomCash || !bottomTransfer) return;

    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    const newClose = newCloseBtn;

    // Modal reset
    function resetModal() {
        bottomCash.style.display = 'none';
        bottomTransfer.style.display = 'none';
        document.querySelector('.cash-entrega span').innerHTML = '';
        document.querySelector('.cash-confir span').innerHTML = '';
        document.querySelector('.transfer-entrega span').innerHTML = '';
        document.querySelector('.transfer-confir span').innerHTML = '';
        const transferImg = bottomTransfer.querySelector('.transfer-ver img');
        if(transferImg) transferImg.src = '';
        const buttonsDiv = bottomTransfer.querySelector('.buttons-info');
        if(buttonsDiv) buttonsDiv.style.display = 'none';
    }

    // Close modal
    newClose.addEventListener('click', () => {
        info.style.display = 'none';
        container.classList.remove('modal-open');
        resetModal();
    });

    // Icons click
    document.body.addEventListener('click', async(e) => {
        const target = e.target;
        if (!target.classList.contains('fa-circle-info')) return;
        e.stopPropagation();

        const row = target.closest('tr');
        const card = target.closest('.card');
        let solicitud = null;
        let ajuste = null;

        if(row) {
            const solCell = row.querySelector('.solicitud');
            const ajusteCell = row.querySelector('.status.adjust');

            if(solCell) solicitud = solCell.textContent.trim();
            if(ajusteCell) ajuste = ajusteCell.textContent.trim();
        } else if(card) {
            const solCell = card.querySelector('.solicitud-mobile');
            const ajusteCell = card.querySelector('.status.adjust-mobile');

            if(solCell) solicitud = solCell.textContent.trim();
            if(ajusteCell) ajuste = ajusteCell.textContent.trim();
        }
        if(!solicitud || !ajuste) return;

        try {
            const response = await fetch(`${API}/api/liquidaciones/detalle?solicitud=${encodeURIComponent(solicitud)}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if(!response.ok) throw new Error('Error al obtener detalles');
            const data = await response.json();

            resetModal();
            ajusteSpan.textContent = ajuste.toUpperCase();

            if(data.ruta_comprobacion) {
                bottomTransfer.style.display = 'flex';

                if(data.fecha_pago)
                    document.querySelector('.transfer-entrega span').innerHTML = formatDate(data.fecha_pago);
                else
                    document.querySelector('.transfer-entrega span').innerHTML = '—';

                if(data.fecha_recibido)
                    document.querySelector('.transfer-confir span').innerHTML = formatDate(data.fecha_recibido);
                else {
                    if(ajuste === 'Reembolso')
                        document.querySelector('.transfer-confir span').innerHTML = 'Pendiente de tu confirmación';
                    else
                        document.querySelector('.transfer-confir span').innerHTML = 'Pendiente de confirmación por Tesorería';
                };

                // Image
                const transferImg = bottomTransfer.querySelector('.transfer-ver img');
                const buttonsDiv = bottomTransfer.querySelector('.buttons-info');
                
                const fullImageUrl = `${API}/${data.ruta_comprobacion}`;
                transferImg.src = fullImageUrl;
                if(buttonsDiv) buttonsDiv.style.display = 'flex';
            } else {
                bottomCash.style.display = 'flex';

                if(data.fecha_pago)
                    document.querySelector('.cash-entrega span').innerHTML = formatDate(data.fecha_pago);
                else
                    document.querySelector('.cash-entrega span').innerHTML = '—';

                if(data.fecha_recibido)
                    document.querySelector('.cash-confir span').innerHTML = formatDate(data.fecha_recibido);
                else {
                    if(ajuste === 'Reembolso')
                        document.querySelector('.cash-confir span').innerHTML = 'Pendiente de tu confirmación';
                    else
                        document.querySelector('.cash-confir span').innerHTML = 'Pendiente de confirmación por Tesorería';
                }
            }

            info.style.display = 'flex';
            info.dataset.solicitud = solicitud;
            container.classList.add('modal-open');
        } catch(error) {
            Toast('ERROR', error.message);
        }
    });
}

// Preview Transfer Receipt
function previewReceipt(imageSrc) {
    if(!imageSrc) return;

    Swal.fire({
        imageUrl: imageSrc,
        imageAlt: 'Comprobante',
        imageHeight: 'auto',
        imageWidth: '50%',
        background: 'transparent',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'receipt-preview'
        }
    });
}

function buttonPreview() {
    const button = document.querySelector('.button-verification');
    if(!button) return;

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        const img = document.querySelector('.transfer-ver img');
        if(img && img.src && img.src !== '')
            previewReceipt(img.src);
        else
            Toast('COMPROBANTE DE LIQUIDACIÓN', 'Lo siento, no existe un comprobante para mostrar');
    });
}

// Download
async function downloadReceipt(imageSrc, filename) {
    try {
        const response = await fetch(imageSrc, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('No se pudo obtener la imagen');

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch(error) {
        Toast('DESCARGAR COMPROBANTE', 'No se pudo descargar el comprobante. Por favor, intenta de nuevo');
    }
}

function buttonDownload() {
    const button = document.querySelector('.button-download');
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        const img = document.querySelector('.transfer-ver img');
        if(img && img.src && img.src !== '') {
            const sol = document.querySelector('.info-wrapper');
            const folio = sol.dataset.solicitud || '';
            downloadReceipt(img.src, `Comprobante de Liquidación ${folio}.jpg`);
        } else
            Toast('DESCARGAR COMPROBANTE', 'Lo siento, no existe un comprobante para descargar');
    });
}


/* =================================== TOAST =================================== */
// Toast -> Simple
const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    width: '540px',
    customClass: {
        popup: 'colored-toast'
    },
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

// Toast -> Buttons
function ToastReturn(title, message, cancel, confirm, sol) {
    Swal.fire({
        title: title,
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="received-text">${message}</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: cancel,
        confirmButtonText: confirm,
        backdrop: 'rgba(0, 0, 0, 0)',
        allowOutsideClick: false,
        scrollbarPadding: false,
        width:'543px',
        heightAuto: false, 
        customClass: {
            popup: 'custom-received-modal',
            title: 'reject-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    }).then((result) => {
        if(result.isConfirmed) {
            const container = document.querySelector('.container');
            const receipt = document.querySelector('.transfer-wrapper');
            if(container && receipt) {
                receipt.dataset.solicitud = sol;
                receipt.style.display = 'flex';
                container.classList.add('modal-open');
            }
        } else if (result.dismiss === Swal.DismissReason.cancel)
            confirmMoney(sol);
    });
}

function confirmMoney(sol) {
    Swal.fire({
        title: 'CONFIRMAR DEVOLUCIÓN EN EFECTIVO',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="received-text">¿Has entregado la devolución a Tesorería para la liquidación de la solicitud ${sol}?</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: 'NO, AÚN NO',
        confirmButtonText: 'SÍ, FUE ENTREGADO',
        backdrop: 'rgba(0, 0, 0, 0)',
        allowOutsideClick: false,
        scrollbarPadding: false,
        width: '543px',
        heightAuto: false,
        customClass: {
            popup: 'custom-received-modal',
            title: 'reject-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    }).then(async (result) => {
        if(result.isConfirmed) {
            try {
                const hoy = new Date().toLocaleDateString('sv-SE');
                await gestionarComprobante(sol, hoy, null, null, false);
                Toast('DEVOLUCIÓN REGISTRADA', '¡Listo! Hemos notificado a Tesorería para que confirme la recepción de la devolución');
                
                const filtros = getCurrentFilters();
                await tableInformation(filtros, currentPage);
            } catch(error) {
                Toast('ERROR', error.message);
            }
        }
    });
}

function ToastRefund(sol) {
    Swal.fire({
        title: 'CONFIRMAR RECEPCIÓN DE REEMBOLSO',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="received-text">¿Has recibido el reembolso correspondiente a la liquidación de tu solicitud ${sol}?</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: 'NO, AÚN NO',
        confirmButtonText: 'SÍ, FUE ENTREGADO',
        backdrop: 'rgba(0, 0, 0, 0)',
        allowOutsideClick: false,
        scrollbarPadding: false,
        width: '543px',
        heightAuto: false,
        customClass: {
            popup: 'custom-received-modal',
            title: 'reject-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        }
    }).then(async (result) => {
        try {
            if(result.isConfirmed) {
                const hoy = new Date().toLocaleDateString('sv-SE');
                await gestionarComprobante(sol, null, hoy, null, false);
                Toast('RECEPCIÓN DE REEMBOLSO', '¡Listo! Tu reembolso ha sido confirmado correctamente');
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                await gestionarComprobante(sol, null, null, null, true);
                Toast('RECEPCIÓN DE REEMBOLSO', 'Hemos notificado a Tesorería para dar seguimiento a la entrega de tu reembolso');
            }

            const filtros = getCurrentFilters();
            await tableInformation(filtros, currentPage);
        } catch(error) {
            Toast('ERROR', error.message);
        }
    });
}
document.addEventListener("DOMContentLoaded", function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const tabParam = urlParams.get('tab');

    if(searchParam)
        initSearchFromUrl();
    else if(tabParam)
        cardLinks();
    else
        tableInformation(getCurrentFilters());

    setupSorting();
    tabSelected();
    searchFolio();
    initCalendar();
    setupCalendar();
    buttonsAction();

    replicateCircles();
    window.addEventListener('resize', () => replicateCircles());

    buttonInfo();
    buttonLiquidacion();
});


/* ============================== VARIABLES ============================== */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
// const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';

let globalStartDate = null;
let globalEndDate = null;
let swapped = false;
let currentPage = 1;
let paginacionGlobal = {
    paginaActual: 1,
    totalPaginas: 1
};
const limitPerPage = 7;
let currentFolio = 'ASC';
let currentSol = null;
let currentTotal = null;
let currentSaldo = null;

// Pending amount
let lastKnownCount = 0;


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
    const liquidation = document.querySelector('.option.liquidation');
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;
        
        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if(currentPath.includes('tes-dashboard.html'))
            dashboard.classList.add('active');
        else if(currentPath.includes('tes-solicitudes.html'))
            request.classList.add('active');
        else if(currentPath.includes('tes-comprobaciones.html'))
            expenses.classList.add('active');
        else if(currentPath.includes('tes-liquidaciones.html'))
            liquidation.classList.add('active');
    }

    setActiveOption();

    dashboard.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'tes-dashboard.html';
    });

    request.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'tes-solicitudes.html';
    });

    expenses.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'tes-comprobaciones.html';
    });

    liquidation.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'tes-liquidaciones.html';
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

    if(!tabActive)
        return null;

    if(tabActive.classList.contains('pending'))
        return 'Pendiente';
    if(tabActive.classList.contains('approved'))
        return 'Aprobada';
    if(tabActive.classList.contains('rejected'))
        return 'Rechazada';

    return null;
}

function getActiveTabId() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return 'pending';

    if(activeTab.classList.contains('approved')) return 'approved';
    if(activeTab.classList.contains('rejected')) return 'rejected';

    return 'pending';
}

function toastStatus() {
    const tabActive = document.querySelector('.tab.selected');
    if(!tabActive) return null;

    if(tabActive.classList.contains('pending'))
        return 'pendientes';
    if(tabActive.classList.contains('approved'))
        return 'aprobadas';
    if(tabActive.classList.contains('rejected'))
        return 'rechazadas';

    return null;
}

// Filters
function getCurrentFilters() {
    const estado = getActiveStatus();
    const input = document.querySelector('.search-back input');
    const valor = input ? input.value.trim() : '';
    const filtros = { estado };
    
    if(swapped)
        filtros.solicitud = valor;
    else
        filtros.folio = valor;

    if(globalStartDate) {
        filtros.fechaIni = globalStartDate;
        if(globalEndDate)
            filtros.fechaFin = globalEndDate;
    }

    filtros.orden = currentFolio;
    if (currentSol) filtros.ordenSols = currentSol;
    if (currentTotal) filtros.ordenTotal = currentTotal;
    if (currentSaldo) filtros.ordenSaldo = currentSaldo;

    return filtros;
}

// Backend query
async function tableInformation(filtros = {}, page = 1) {
    showLoader();
    renderTable([]);
    renderCards([]);

    const offset = (page - 1) * limitPerPage;

    const params = new URLSearchParams();
    if(filtros.estado) params.append('estado', filtros.estado);
    if(filtros.folio) params.append('folio', filtros.folio);
    if(filtros.solicitud) params.append('solicitud', filtros.solicitud); 
    if(filtros.fechaIni) params.append('fechaIni', filtros.fechaIni);
    if(filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    params.append('limit', limitPerPage);
    params.append('offset', offset);
    params.append('orden', currentFolio);
    if(currentSol) params.append('ordenSols', currentSol);
    if(currentTotal) params.append('ordenTotal', currentTotal);
    if(currentSaldo) params.append('ordenSaldo', currentSaldo);

    try {
        const response = await fetch(`${API}/api/comprobaciones/listar?${params.toString()}`, {
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
            updateCounters(0, false);
            throw new Error('Error al obtener comprobaciones');
            return;
        }

        const data = await response.json();

        if(data.mensaje) {
            renderTable([]);
            renderCards([]);
            updateCounters(0, true);
            const tab = toastStatus();
            Toast(`SIN COMPROBACIONES ${tab === null ? '' : tab.toUpperCase()}`, `No tienes comprobaciones ${tab === null ? '' : tab} para mostrar en este momento`);
            return;
        }

        renderTable(data.comprobaciones);
        renderCards(data.comprobaciones);
        updateCounters(data.pendientes ?? 0, true);
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        renderCards([]);
        updateCounters(0, false);
        Toast('ERROR AL MOSTRAR', 'No se pudieron cargar las comprobaciones. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table Information
function renderTable(comprobaciones) {
    const tbody = document.querySelector('.table-body');
    if(!tbody) return;

    tbody.innerHTML = '';
    if(comprobaciones.length === 0) return;

    const statusClass = {
        'Pendiente': 'st-pending',
        'Aprobada': 'st-approved',
        'Rechazada': 'st-rejected'
    };

    comprobaciones.forEach(cmp => {
        const tr = document.createElement('tr');

        const simboloSaldo = obtenerSimboloMoneda(cmp.saldo_moneda);
        const simboloTotal = obtenerSimboloMoneda(cmp.total_moneda);

        const saldoNum = cmp.saldo || 0;
        const saldoAbs = Math.abs(saldoNum);
        const saldoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(saldoAbs);
        const signo = saldoNum < 0 ? '-' : '';
        const saldoTexto = `${signo} ${simboloSaldo}${saldoFormateado}`;

        const totalFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(cmp.total);

        const estadoClass = statusClass[cmp.estado] || '';

        tr.innerHTML = `
            <td class="folio"><p>${cmp.folio}</p></td>
            <td class="sol"><p>${cmp.solicitud}</p></td>
            <td><p>${formatDate(cmp.fecha_comprobacion)}</p></td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(cmp.total_moneda)}" alt="${cmp.total_moneda}" onerror="this.style.display='none'">
                    <p><span class="symbol-money">${simboloTotal}</span>${totalFormateado}</p>
                </div>
            </td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(cmp.saldo_moneda)}" alt="${cmp.saldo_moneda}" onerror="this.style.display='none'">
                    <p>${saldoTexto}</p>
                </div>
            </td>
            <td><div class="status ${estadoClass}">${cmp.estado}</div></td>
            <td>
                <div class="actions">
                    ${cmp.estado === 'Pendiente' ? `
                        <i class="fa-solid fa-circle-xmark"></i>
                        <i class="fa-solid fa-circle-check"></i>
                    ` : cmp.estado === 'Aprobada' ? `
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                    `: ''}

                    <i class="fa-solid fa-circle-info"></i>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    const rowsActuales = comprobaciones.length;
    for(let i = rowsActuales; i < limitPerPage; i++) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td><p class="empty-row">Empty</p></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(emptyRow);
    }
}

// Cards Information
function renderCards(comprobaciones) {
    const statusClass = {
        'Pendiente': 'st-pending',
        'Aprobada': 'st-approved',
        'Rechazada': 'st-rejected'
    };

    const container = document.querySelector('.cards-mobile');
    if(!container) return;
    container.innerHTML = '';

    if(!comprobaciones || comprobaciones.length === 0) return;

    comprobaciones.forEach(cmp => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-folio', cmp.folio);
        card.setAttribute('data-loaded', 'false');

        // Estado
        const estado = cmp.estado || '—';
        const estadoClass = statusClass[estado] || 'st-pending';

        card.innerHTML = `
            <div class="first-info">
                <div class="info-mobile">
                    <p class="subt-mobile">FOLIO</p>
                    <p class="folio-mobile">${cmp.folio}</p>
                </div>
                                
                <div class="info-mobile">
                    <p class="subt-mobile">SOLICITUD</p>
                    <p class="sol-mobile">${cmp.solicitud}</p>
                </div>

                <div class="info-mobile">
                    <p class="subt-mobile">ESTADO</p>
                    <p class="status ${estadoClass} st-mobile">${estado}</p>
                </div>
            </div>

            <div class="complete-info"></div>
        `;

        container.appendChild(card);
    });

    activeCards();
}

// Pending amount
function updateCounters(pendientes, esRespuestaValida = true) {
    const pendingTab = document.querySelector('.tab.pending .amount');
    if(!pendingTab) return;

    const valor = pendientes ?? null;
    
    if(valor !== null && valor > 0) {
        // Caso normal -> actualizar y guardar cantidad
        pendingTab.textContent = valor;
        pendingTab.classList.add('has-number');
        lastKnownCount = valor;
    } else if(!esRespuestaValida && lastKnownCount > 0) {
        // Hubo error o no hay datos -> última cantidad conocida
        pendingTab.textContent = lastKnownCount;
        pendingTab.classList.add('has-number');
    } else 
        pendingTab.classList.remove('has-number');
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
// Selección manual
function tabSelected() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const estado = this.classList.contains('pending') ? 'Pendiente'  :
                           this.classList.contains('approved') ? 'Aprobada' :
                           this.classList.contains('rejected') ? 'Rechazada' : null;

            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('selected');
                t.querySelector('.amount')?.classList.remove('selected');
            });

            this.classList.add('selected');
            this.querySelector('.amount')?.classList.add('selected');

            currentPage = 1;
            const filtros = getCurrentFilters();
            filtros.estado = estado;
            tableInformation(filtros, currentPage);
        });
    });
}

// Link de las cards
function cardLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if(!tabParam) return;

    const estadoMap = {
        'pending': 'Pendiente',
        'approved': 'Aprobada',
        'rejected': 'Rechazada'
    };
    const estado = estadoMap[tabParam];
    if(!estado) return;

    // Remover selected
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('selected');
        const amount = tab.querySelector('.amount');
        if(amount) amount.classList.remove('selected');
    });

    // Activar opción correspondiente
    const activeTab = document.querySelector(`.tab.${tabParam}`);
    if(activeTab) {
        activeTab.classList.add('selected');
        const amount = activeTab.querySelector('.amount');
        if(amount) amount.classList.add('selected');
    }

    currentPage = 1;
    tableInformation({ estado }, currentPage);
}


/* ============================== SEARCH ============================== */
function searchFolio() {
    const search = document.querySelector('.search-back');
    const glass = search.querySelector('.fa-magnifying-glass');
    const request = search.querySelector('.fa-plane');
    const calendar = search.querySelector('.fa-calendar');
    const input = search.querySelector('input');

    if(!glass || !request || !calendar || !input) return;

    function swapIcons() {
        const parent = search;

        // Eliminar temporalmente los iconos
        const glassRemoved = parent.removeChild(glass);
        const requestRemoved = parent.removeChild(request);

        if(!swapped) {
            parent.insertBefore(requestRemoved, input);
            parent.insertBefore(glassRemoved, calendar.nextSibling);
            input.placeholder = "Solicitud. . .";
            swapped = true;
        } else {
            parent.insertBefore(glassRemoved, input);
            parent.insertBefore(requestRemoved, calendar.nextSibling);
            input.placeholder = "Folio. . .";
            swapped = false;
        }
        input.value = '';
    }

    function fadeAndSwap(shouldSwap) {
        if(shouldSwap) {
            glass.classList.add('fade-out');
            request.classList.add('fade-out');
        }

        setTimeout(() => {
            if(shouldSwap) {
                swapIcons();
                glass.classList.remove('fade-out');
                request.classList.remove('fade-out');
            }
        }, 200);
    }

    let debounceTimer;

    function doSearch() {
        const valor = input.value.trim();
        const filtros = getCurrentFilters();
        if(swapped) {
            filtros.solicitud = valor;
            delete filtros.folio;
        } else {
            filtros.folio = valor;
            delete filtros.solicitud;
        }

        currentPage = 1;
        tableInformation(filtros, currentPage);
    }

    // ENTER keypress
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            clearTimeout(debounceTimer);
            doSearch();
        }
    });

    input.addEventListener('input', (e) => {
        if(input.value.trim() === '') {
            clearTimeout(debounceTimer);
            const filtros = getCurrentFilters();

            delete filtros.folio;
            delete filtros.solicitud;

            currentPage = 1;
            tableInformation(filtros, currentPage);
        }
    });

    glass.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.folio;
        delete filtros.solicitud;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(swapped);
    });

    request.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.folio;
        delete filtros.solicitud;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(!swapped);
    });
}


/* =============================== URL PARAMS =============================== */
function initSearchFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchValue = urlParams.get('search');
    const tipo = urlParams.get('tipo');
    const tabParam = urlParams.get('tab');

    if(!searchValue || tipo !== 'solicitud' || !tabParam) return;

    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('selected');
        t.querySelector('.amount')?.classList.remove('selected');
    });
    const activeTab = document.querySelector(`.tab.${tabParam}`);
    activeTab.classList.add('selected');

    swapped = true;
    const search = document.querySelector('.search-back');
    const glass = search.querySelector('.fa-magnifying-glass');
    const request = search.querySelector('.fa-plane');
    const calendar = search.querySelector('.fa-calendar');
    const input = search.querySelector('input');
        
    // Cambiar orden de iconos
    const parent = search;
    const glassRemoved = parent.removeChild(glass);
    const requestRemoved = parent.removeChild(request);
    parent.insertBefore(requestRemoved, input);
    parent.insertBefore(glassRemoved, calendar.nextSibling);
    input.placeholder = "Solicitud. . .";
        
    // Establecer valor y realizar búsqueda
    input.value = searchValue;
    currentPage = 1;
    const filtros = getCurrentFilters();
    filtros.solicitud = searchValue;
    delete filtros.folio;
    tableInformation(filtros, currentPage);
}


/* ============================== CALENDAR ============================== */
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
    let endDate = null;
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

    function isInRange(date) {
        if (!startDate || !endDate) return false;
        const dateTs = toTimestamp(date);
        const startTs = toTimestamp(startDate);
        const endTs = toTimestamp(endDate);
        return dateTs >= startTs && dateTs <= endTs;
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

        // Asignar clases de rango
        if (startDate && isSameDate(dateObj, startDate)) cell.classList.add('start');
        if (endDate && isSameDate(dateObj, endDate)) cell.classList.add('end');
        if (isInRange(dateObj)) cell.classList.add('in-range');

        cell.addEventListener('click', (e) => {
            e.stopPropagation();

            // Si no hay inicio o ya hay un rango completo, reinicia con esta fecha como nuevo inicio
            if (startDate === null || (startDate && endDate !== null)) {
                startDate = { year, month, day };
                endDate = null;

                globalStartDate = `${year}-${month+1}-${day}`;
                globalEndDate = null;
            }
            // Si hay inicio pero no fin, se establece el fin (ordenando las fechas)
            else if (startDate && endDate === null) {
                const currentTs = toTimestamp({ year, month, day });
                const startTs = toTimestamp(startDate);
                if (currentTs < startTs) {
                    endDate = { ...startDate };
                    startDate = { year, month, day };
                } else
                    endDate = { year, month, day };
                
                globalStartDate = `${startDate.year}-${startDate.month+1}-${startDate.day}`;
                globalEndDate = `${endDate.year}-${endDate.month+1}-${endDate.day}`;
            }

            function parseGlobalDate(dateStr) {
                if (!dateStr) return null;
                const [year, month, day] = dateStr.split('-').map(Number);
                return { year, month: month - 1, day };
            }
            startDate = parseGlobalDate(globalStartDate);
            endDate = parseGlobalDate(globalEndDate);

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
    const clearDate = document.querySelector('.date-button.clear-date');
    const searchDate = document.querySelector('.date-button.search-date');

    if(!calendarIcon || !datepicker || !clearDate || !searchDate) return;

    function clearRangeSelect() {
        const dates = document.querySelectorAll('.date-cell.in-range');
        const startDate = document.querySelector('.date-cell.start');
        const endDate = document.querySelector('.date-cell.end');

        dates.forEach(date => date.classList.remove('in-range'));

        if(startDate) 
            startDate.classList.remove('start');
        if(endDate) 
            endDate.classList.remove('end');

        globalStartDate = null;
        globalEndDate = null;
        window.dispatchEvent(new CustomEvent('calendar-closed'));
    }

    calendarIcon.addEventListener('click', (e) => {
        e.stopPropagation();

        const isVisible = datepicker.style.display === 'block';
        if(isVisible) {
            calendarIcon.classList.remove('icon-active');
            datepicker.style.display = 'none';
        } else {
            calendarIcon.classList.add('icon-active');
            datepicker.style.display = 'block';

            const datesContainer = document.querySelector('.dates');
            if(datesContainer && datesContainer.children.length === 0 && window.calendarRender)
                window.calendarRender();
        }
    });

    document.addEventListener('click', (e) => {
        if(!datepicker.contains(e.target) && e.target !== calendarIcon) {
            calendarIcon.classList.remove('icon-active');
            datepicker.style.display = 'none';
        }
    });

    clearDate.addEventListener('click', (e) => {
        e.stopPropagation();
        clearRangeSelect();

        const filtros = getCurrentFilters();
        delete filtros.fechaIni;
        delete filtros.fechaFin;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        calendarIcon.classList.remove('icon-active');
        datepicker.style.display = 'none';
    });

    searchDate.addEventListener('click', (e) => {
        e.stopPropagation();

        if(!globalStartDate && !globalEndDate) {
            Toast('SELECCIÓN DE FECHA', 'Por favor, selecciona al menos una fecha para poder buscar');
            return;
        }

        const filtros = getCurrentFilters();
        currentPage = 1;
        tableInformation(filtros, currentPage);

        calendarIcon.classList.remove('icon-active');
        datepicker.style.display = 'none';
    });
}


/* ============================== ACTIVE CARD ============================== */
async function loadCardDetails(card) {
    const folio = card.getAttribute('data-folio');
    if(!folio) return;

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/comprobaciones/detalle?folio=${encodeURIComponent(folio)}`, {
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
        Toast('ERROR', error.message || 'Error al cargar los detalles');
    }
}

async function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('click', async (e) => {
            if(e.target.closest('.complete-info, .fa-circle-check, .fa-circle-xmark, .buttons-mobile'))
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
    const { comprobacion, facturas } = data;

    // Valores
    const totalFormat = formatCurrency(comprobacion.total);
    const saldoNum = comprobacion.saldo || 0;
    const saldoFormat = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(saldoNum));
    const signo = saldoNum < 0 ? '-' : '';
    const saldo = `${signo} ${obtenerSimboloMoneda(comprobacion.saldo_moneda)}${saldoFormat}`;

    completeInfo.innerHTML = `
        <div class="first-column">
            <div class="info-mobile">
                <p class="subt-mobile">FECHA</p>
                <p>${formatDate(comprobacion.fecha_comprobacion)}</p>
            </div>

            <div class="map-img">
                <img src="./assets/images/Icon_map.webp" alt="Map">
            </div>
        </div>

        <div class="second-column">
            <div class="info-mobile">
                <p class="subt-mobile">TOTAL</p>
                <p class="amount-mobile"><span class="symbol-money">${obtenerSimboloMoneda(comprobacion.total_moneda)}</span>${totalFormat}</p>
                <p class="amount-mobile-currency">
                    <img src="${getFlagUrl(comprobacion.total_moneda)}" alt="${comprobacion.total_moneda}" onerror="this.style.display='none'">
                    ${comprobacion.total_moneda}
                </p>
            </div>
        </div>

        <div class="third-column">
            <div class="info-mobile">
                <p class="subt-mobile">SALDO</p>
                <p class="amount-mobile">${saldo}</p>
                <p class="amount-mobile-currency">
                    <img src="${getFlagUrl(comprobacion.saldo_moneda)}" alt="${comprobacion.saldo_moneda}" onerror="this.style.display='none'">
                    ${comprobacion.saldo_moneda}
                </p>
            </div>

            <div class="buttons-mobile">
                ${comprobacion.estado === 'Pendiente' ? `
                    <i class="fa-solid fa-circle-xmark"></i>
                    <i class="fa-solid fa-circle-check"></i>
                ` : comprobacion.estado === 'Aprobada' ? `
                    <i class="fa-solid fa-hand-holding-dollar"></i>
                `: ''}

                <i class="fa-solid fa-circle-info"></i>
            </div>
        </div>
    `;
}


/* ============================== CLASSIFICATION ============================== */
function setupSorting() {
    const orderDivs = document.querySelectorAll('.order-div[data-column]');

    orderDivs.forEach(div => {
        const orderIcons = div.querySelector('.order');
        if(!orderIcons) return;

        orderIcons.addEventListener('click', (e) => {
            e.stopPropagation();
            const column = div.dataset.column;

            switch(column) {
                case 'folio':
                    currentFolio = currentFolio === 'ASC' ? 'DESC' : 'ASC';
                    currentSol = null;
                    currentTotal = null;
                    currentSaldo = null;
                    break;
                case 'solicitud':
                    currentSol = currentSol === 'ASC' ? 'DESC' : 'ASC';
                    currentFolio = null;
                    currentTotal = null;
                    currentSaldo = null;
                    break;
                case 'total':
                    currentTotal = currentTotal === 'ASC' ? 'DESC' : 'ASC';
                    currentFolio = null;
                    currentSol = null;
                    currentSaldo = null;
                    break;
                case 'saldo':
                    currentSaldo = currentSaldo === 'ASC' ? 'DESC' : 'ASC';
                    currentFolio = null;
                    currentSol = null;
                    currentTotal = null;
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


/* ============================== ACTION BUTTONS ============================== */
// Reject && Aprove
let handleActionButtons;

async function changeState(folio, accion, motivoRechazo = '') {
    if(!token) {
        Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
        return;
    }

    showLoader();
    try {
        const response = await fetch(`${API}/api/comprobaciones/estado`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ folio, accion, motivoRechazo }),
        });

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error al procesar' }));
            throw new Error(errorData.message || 'Error al procesar la acción');
        }

        const data = await response.json();
        
        Toast(
            `COMPROBACIÓN ${accion === 'Aprobar' ? 'APROBADA' : 'RECHAZADA'}`,
            `La comprobación con folio ${folio} fue ${accion === 'Aprobar' ? 'aprobada' : 'rechazada'} y notificada al colaborador correctamente`
        );

        const activeTab = document.querySelector('.tab.selected');
        const isPendingTab = activeTab && activeTab.classList.contains('pending');

        const filtros = getCurrentFilters();

        if(isPendingTab) {
            const tempResponse = await fetch(`${API}/api/comprobaciones/listar?estado=Pendiente&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });
            const tempData = await tempResponse.json();

            if(!tempData.comprobaciones || tempData.comprobaciones.length === 0) {
                lastKnownCount = 0;
                updateCounters(0, true);
            }
        }

        currentPage = 1;
        tableInformation(filtros, currentPage);
    } catch(error) {
        Toast('ERROR', error.message || 'Error al procesar la acción');
    } finally {
        hideLoader();
    }
}

function buttonsAction() {
    if(handleActionButtons)
        document.removeEventListener('click', handleActionButtons);

    handleActionButtons = function(e) {
        const target = e.target;

        // Aprobar
        if(target.classList.contains('fa-circle-check')) {
            e.stopImmediatePropagation();
            const row = target.closest('tr') || target.closest('.card');
            if(!row) return;

            const folioElement = row.querySelector('.folio p') || row.querySelector('.folio-mobile');
            const folio = folioElement?.textContent.trim();
            
            if(folio) changeState(folio, 'Aprobar');
        }

        // Rechazar
        if(target.classList.contains('fa-circle-xmark')) {
            e.stopImmediatePropagation();
            const row = target.closest('tr') || target.closest('.card');
            if(!row) return;

            const folioElement = row.querySelector('.folio p') || row.querySelector('.folio-mobile');
            const folio = folioElement?.textContent.trim();

            if(folio) ToastRejected(folio, changeState);
        }
    };

    document.addEventListener('click', handleActionButtons);
}

// Information
function replicateCircles() {
    const bottom = document.querySelector('.info-bottom');
    if(!bottom) return;

    const existingCircles = bottom.querySelectorAll('.info-circle');
    existingCircles.forEach(circle => circle.remove());

    const circleSize = 55;
    const spacing = 7;
    
    // Obtener el padding del contenedor
    const computedStyle = getComputedStyle(bottom);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);
    const availableWidth = bottom.clientWidth - paddingLeft - paddingRight;

    if(availableWidth <= 0) return;

    // Calcular cuántos círculos caben
    let circlesCount = Math.floor((availableWidth + spacing) / (circleSize + spacing));
    if(circlesCount < 1) circlesCount = 1;

    // Calcular espacio sobrante
    const totalCirclesWidth = circlesCount * circleSize;
    const totalGapSpace = availableWidth - totalCirclesWidth;
    const gapBetween = totalGapSpace / (circlesCount + 1);

    let leftPos = paddingLeft + gapBetween;

    for(let i = 0; i < circlesCount; i++) {
        const circle = document.createElement('div');
        circle.className = 'info-circle';
        circle.style.position = 'absolute';
        circle.style.top = '45%';
        circle.style.transform = 'rotate(-50deg)';
        circle.style.width = `${circleSize}px`;
        circle.style.height = `${circleSize}px`;
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = 'transparent';
        circle.style.boxShadow = 'inset -5px 3px 8px rgba(0, 0, 0, 0.25)';
        circle.style.left = `${leftPos}px`;
        circle.style.pointerEvents = 'none';
        bottom.appendChild(circle);
        leftPos += circleSize + gapBetween;
    }
}

async function loadDetails(folio) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/comprobaciones/detalle?folio=${encodeURIComponent(folio)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Error al cargar la información' }));
            throw new Error(err.message || 'Error al obtener detalles');
        }

        const data = await response.json();
        const { comprobacion, facturas } = data;

        // =================== DATOS =================== //
        // Encabezado
        document.querySelector('.info-folio').textContent = comprobacion.folio || '—';

        const fechaSpan = document.querySelector('.info-date span');
        if(fechaSpan) fechaSpan.textContent = formatDate(comprobacion.fecha_comprobacion);
        const actSpan = document.querySelector('.info-update span');
        if(actSpan) actSpan.textContent = formatDate(comprobacion.fecha_actualizacion);

        const statusDiv = document.querySelector('.request-generals .status');
        if(statusDiv) {
            statusDiv.textContent = comprobacion.estado || '—';
            statusDiv.className = 'status';

            if(comprobacion.estado === 'Pendiente') statusDiv.classList.add('st-pending');
            else if(comprobacion.estado === 'Aprobada') statusDiv.classList.add('st-approved');
            else if(comprobacion.estado === 'Rechazada') statusDiv.classList.add('st-rejected');
        }

        // Montos comprobación
        const importeCmp = document.querySelector('.cmp-importe');
        const ivaCmp = document.querySelector('.cmp-iva');
        const otrosCmp = document.querySelector('.cmp-otros');
        const anticipo = document.querySelector('.cmp-ant');
        const totalCmp = document.querySelectorAll('.cmp-total');

        const symbolImpCmp = document.querySelector('.cmp-importe span');
        const symbolIvaCmp = document.querySelector('.cmp-iva span');
        const symbolOtrCmp = document.querySelector('.cmp-otros span');
        const symbolAnt = document.querySelector('.cmp-ant span');

        function setNumberValue(container, value) {
            if(!container) return;
            
            const textNodes = [...container.childNodes].filter(n => n.nodeType === Node.TEXT_NODE);
            textNodes.forEach(n => n.remove());
            container.appendChild(document.createTextNode(formatCurrency(value)));
        }

        setNumberValue(importeCmp, comprobacion.total_importe);
        setNumberValue(ivaCmp, comprobacion.total_iva);
        setNumberValue(otrosCmp, comprobacion.total_otros);
        setNumberValue(anticipo, comprobacion.anticipo);
        totalCmp.forEach(t => { setNumberValue(t, comprobacion.total); });
        
        if(comprobacion.total_moneda) {
            const symbol = obtenerSimboloMoneda(comprobacion.total_moneda);
            if(symbolImpCmp) symbolImpCmp.textContent = `${symbol} `;
            if(symbolIvaCmp) symbolIvaCmp.textContent = `${symbol} `;
            if(symbolOtrCmp) symbolOtrCmp.textContent = `${symbol} `;
            if(symbolAnt) symbolAnt.textContent = `${symbol} `;
            
            const totalSpans = document.querySelectorAll('.cmp-total span');
            totalSpans.forEach(span => {
                span.textContent = `${symbol}`;
            });
        }

        const cmpFlags = document.querySelectorAll('.info-currency img');
        const cmpCurrencies = document.querySelectorAll('.info-currency p');

        if(cmpFlags.length >= 1 && comprobacion.total_moneda) {
            cmpFlags[0].src = getFlagUrl(comprobacion.total_moneda);
            cmpFlags[0].alt = comprobacion.total_moneda;
            cmpFlags[0].onerror = () => cmpFlags[0].style.display = 'none';
            if(cmpCurrencies[0]) cmpCurrencies[0].textContent = comprobacion.total_moneda;
        }
        if (cmpFlags.length >= 2 && comprobacion.saldo_moneda) {
            cmpFlags[1].src = getFlagUrl(comprobacion.saldo_moneda);
            cmpFlags[1].alt = comprobacion.saldo_moneda;
            cmpFlags[1].onerror = () => cmpFlags[1].style.display = 'none';
            if(cmpCurrencies[1]) cmpCurrencies[1].textContent = comprobacion.saldo_moneda;
        }

        const simboloSaldo = obtenerSimboloMoneda(comprobacion.saldo_moneda);

        const saldoNum = comprobacion.saldo || 0;
        const saldoAbs = Math.abs(saldoNum);
        const saldoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(saldoAbs);
        const signo = saldoNum < 0 ? '-' : '';
        const saldoTexto = `${signo}${simboloSaldo}${saldoFormateado}`;

        const saldoParrafo = document.querySelector('.cmp-saldo');
        if(saldoParrafo) saldoParrafo.textContent = saldoTexto;

        // Facturas
        const facturasContainer = document.querySelector('.content-fact');
        if(!facturasContainer) return;
        facturasContainer.innerHTML = '';

        if(!facturas.length) {
            facturasContainer.innerHTML = '<p class="no-data">No hay facturas asociadas</p>';
            return;
        }

        let totalMXN = 0; 

        facturas.forEach(fact => {
            const card = document.createElement('div');
            card.className = 'card-factura';

            let html = '';
            if(fact.concepto !== '-')
                html = `<p class="fact-text"><span>CONCEPTO: </span>${fact.concepto}</p>`;

            let buttonsHtml = '';
            if(fact.ruta_pdf)
                buttonsHtml += `<i class="fa-solid fa-file-pdf download-btn" data-url="${fact.ruta_pdf}" data-type="pdf"></i>`;
            if(fact.ruta_xml)
                buttonsHtml += `<i class="fa-solid fa-file-code download-btn" data-url="${fact.ruta_xml}" data-type="xml"></i>`;
            if(!fact.ruta_pdf && !fact.ruta_xml && fact.ruta_jpg)
                buttonsHtml += `<i class="fa-solid fa-file-image download-btn" data-url="${fact.ruta_jpg}" data-type="img"></i>`;

            const tipoCambioObj = fact.tipo_cambio || {};
            const monedaTC = tipoCambioObj.moneda || fact.tipo_moneda || 'MXN';
            let tipoCambioVal = tipoCambioObj.tipo_cambio || 1;
            if(tipoCambioVal === null || tipoCambioVal === undefined) tipoCambioVal = 1;
            const tipoCambioFormateado = parseFloat(tipoCambioVal).toFixed(4);

            // TC Ponderado
            totalMXN += fact.total_factura * tipoCambioVal;

            card.innerHTML = `
                <div class="factura-pres">
                    <div class="fact-first-info">
                        <p class="fact-subtitle">FOLIO</p>
                        <p class="fact-text folio">${fact.folio_factura || '—'}</p>
                    </div>

                    <div class="fact-first-info">
                        <p class="fact-subtitle">FECHA</p>
                        <p class="fact-text">${formatDate(fact.fecha_factura)}</p>
                    </div>
                </div>

                <div class="fact-complete-info">
                    <div class="general-information">
                        <p class="fact-subtitle prin">DATOS GENERALES</p>
                        <p class="fact-text"><span>PROVEEDOR: </span>${fact.proveedor || '—'}</p>
                        ${html}
                        <p class="fact-text"><span>DESCRIPCION: </span>${fact.descripcion || '—'}</p>
                    </div>

                    <div class="general-montos">
                        <div class="fact-montos">
                            <div class="fact-subtitle prin">MONTOS</div>

                            <div class="calc-info montos">
                                <div class="calc-titles">
                                    <p>IMPORTE:</p>
                                    <p>IVA:</p>
                                    <p>OTROS:</p>
                                </div>

                                <div class="calc-values">
                                    <p><span>${obtenerSimboloMoneda(fact.tipo_moneda)} </span>${formatCurrency(fact.importe)}</p>
                                    <p><span>${obtenerSimboloMoneda(fact.tipo_moneda)} </span>${formatCurrency(fact.iva)}</p>
                                    <p><span>${obtenerSimboloMoneda(fact.tipo_moneda)} </span>${formatCurrency(fact.otros_montos)}</p>
                                </div>
                            </div>

                            <div class="calc-saldo">
                                <p class="calc-subtitle">TOTAL:</p>
                                <p><span>${obtenerSimboloMoneda(fact.tipo_moneda)}</span>${formatCurrency(fact.total_factura)}</p>
                            </div>

                            <div class="monto-currency">
                                <img src="${getFlagUrl(fact.tipo_moneda)}" alt="${fact.tipo_moneda}" onerror="this.style.display='none'">
                                <p>${fact.tipo_moneda}</p>
                            </div>
                        </div>

                        <div class="fact-tipo-cambio">
                            <p class="fact-subtitle prin">TIPO DE CAMBIO</p>

                            <div class="moneda-cambio">
                                <div class="monto-currency cambio-intern">
                                    <img src="${getFlagUrl(monedaTC)}" alt="${monedaTC}" onerror="this.style.display='none'">
                                    <p><span>${obtenerSimboloMoneda(monedaTC)}</span>1.0000</p>
                                </div>
                                <p class="fact-text equal">=</p>
                                <div class="monto-currency cambio-mx">
                                    <img src="https://flagcdn.com/w40/mx.png" alt="MXN" onerror="this.style.display='none'">
                                    <p><span>$</span>${tipoCambioFormateado}</p>
                                </div>
                            </div>

                            <div class="buttons-info">${buttonsHtml}</div>
                        </div>
                    </div>
                </div>
            `;

            facturasContainer.appendChild(card);
        });

        // TC Ponderado
        const cmpTCDiv = document.querySelector('.calc-info.tipo-cambio');
        if(cmpTCDiv) {
            if(comprobacion.saldo_moneda !== 'MXN') {
                cmpTCDiv.style.display = 'flex';
                const tcAmount = cmpTCDiv.querySelector('.monto-currency.cambio-intern p');
            
                tcAmount.textContent = '$' + (totalMXN / comprobacion.total).toFixed(4);
            } else 
                cmpTCDiv.style.display = 'none';
        }

        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                const type = btn.dataset.type;

                const card = btn.closest('.card-factura');
                const folioFactura = card?.querySelector('.fact-first-info .fact-text.folio')?.textContent || 'documento';
                
                let extension = '';
                if(type === 'pdf') extension = 'pdf';
                else if(type === 'xml') extension = 'xml';
                else if(type === 'img') {
                    const extensionMatch = url.match(/\.(jpe?g|png)$/i);
                    extension = extensionMatch ? extensionMatch[1] : 'jpg';
                }
                
                const filename = `Factura_${folioFactura}.${extension}`;
                downloadFile(url, filename);
            });
        });
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los detalles de la comprobación');
    }
}

async function buttonInfo() {
    document.addEventListener('click', async (e) => {
        const target = e.target;
        if(!target.classList.contains('fa-circle-info')) return;

        e.stopPropagation();
        const row = target.closest('tr') || target.closest('.card');
        if(!row) return;

        const folioElement = row.querySelector('.folio p') || row.querySelector('.folio-mobile');
        const folio = folioElement?.textContent.trim();
        if(!folio) return;

        const container = document.querySelector('.container');
        const infoCard = document.querySelector('.info-wrapper');
        const buttonClose = document.querySelector('.fa-solid.fa-xmark.close');
        if(!infoCard || !container || !buttonClose) return;

        infoCard.style.display = 'flex';
        container.classList.add('modal-open');
        replicateCircles();

        await loadDetails(folio);

        buttonClose.onclick = (e) => {
            e.stopPropagation();
            infoCard.style.display = 'none';
            container.classList.remove('modal-open');
            document.querySelector('.content-fact').innerHTML = '';
        };
    });
}

// Download
async function downloadFile(url, filename) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/${url}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Error al descargar la información' }));
            throw new Error(err.message || 'Error al descargar la información');
        }

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
        Toast('ERROR', 'Lo siento, no fue posible descargar el archivo');
    }
}

// Settlement
async function settlementTab(solicitud) {
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
            const err = await response.json().catch(() => ({ message: 'Error al redirigir' }));
            throw new Error(err.message || 'Error al redirigir');
        }

        const data = await response.json();
        return data;
    } catch(error) {
        Toast('ERROR', error.message);
    }
}

function buttonLiquidacion() {
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        if(!target.classList.contains('fa-hand-holding-dollar')) return;
        e.stopPropagation();

        const row = target.closest('tr');
        const card = target.closest('.card');
        let solicitud = null;
        
        if(row)
            solicitud = row.querySelector('.sol')?.textContent.trim();
        else if(card) 
            solicitud = card.querySelector('.sol-mobile')?.textContent.trim();

        if(solicitud) {
            const data = await settlementTab(solicitud);
            if(!data) return;

            let tab = '';
            
            if(data.estado === 'Pendiente') 
                tab = 'pending';
            else if(data.estado === 'Pagado')
                tab = 'paid';
            else if(data.estado === 'Devuelto')
                tab = 'returned';
            else if(data.estado === 'Saldado')
                tab = 'settled';

            window.location.href = `tes-liquidaciones.html?search=${encodeURIComponent(solicitud)}&tab=${tab}`;
        }
    });
}


/* =================================== TOAST =================================== */
// Approved - Messages
const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    width: '570px',
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

// Rejected
function ToastRejected(folio, callback) {
    Swal.fire({
        title: 'COMPROBACIÓN RECHAZADA',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <div>
                <textarea id="motivo-rechazo" class="swal2-textarea" placeholder="Por favor, escribe el motivo de tu rechazo"></textarea>
            </div>
            <p class="reject-question">¿Deseas continuar?</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: 'VOLVER',
        confirmButtonText: 'CONTINUAR',
        backdrop: 'rgba(0, 0, 0, 0)',
        allowOutsideClick: false,
        scrollbarPadding: false,
        width:'540px',
        heightAuto: false, 
        customClass: {
            popup: 'custom-reject-modal',
            title: 'reject-title',
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn'
        },
        preConfirm: () => {
            const motivo = document.getElementById('motivo-rechazo').value.trim();
            if(!motivo) {
                Swal.showValidationMessage('Debes escribir el motivo de tu rechazo');
                return false;
            } 
            return motivo;
        }
    }).then((result) => {
        if(result.isConfirmed) {
            const motivo = result.value;
            if(callback) callback(folio, 'Rechazar', motivo);
        }
    });
}
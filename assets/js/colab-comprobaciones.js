document.addEventListener("DOMContentLoaded", function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    rolSwitch();
    optionsBar();
    
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('search'))
        initSearchFromUrl();
    else
        tableInformation(getCurrentFilters());

    tabSelected();
    search();
    initCalendar();
    setupCalendar();
    activeCards();
    setupSorting();
    buttonComp();

    replicateCircles();
    window.addEventListener('resize', () => replicateCircles());
    
    buttonInfo();
    buttonLiquidacion();
    buttonEdit();
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
let currentFolio = 'DESC';
let currentSol = null;
let currentTotal = null;
let currentSaldo = null;


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

    const colab = window.location.pathname.includes('colab-');
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
    if(!activeTab) return 'all';

    if(activeTab.classList.contains('pending')) return 'pending';
    if(activeTab.classList.contains('approved')) return 'approved';
    if(activeTab.classList.contains('rejected')) return 'rejected';

    return 'all';
}

function toastStatus() {
    const tabActive = document.querySelector('.tab.selected');

    if(!tabActive)
        return null;

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
    renderTable([], getActiveTabId());
    renderCards([]);

    const offset = (page - 1) * limitPerPage;

    const params = new URLSearchParams();
    params.append('vista', 'Colaborador');
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
            throw new Error('Error al obtener comprobaciones');
            return;
        }

        const data = await response.json();
        const tab = getActiveTabId();

        if(data.mensaje) {
            renderTable([]);
            renderCards([]);
            const tab = toastStatus();
            Toast(`SIN COMPROBACIONES ${tab === null ? '' : tab.toUpperCase()}`, `No tienes comprobaciones ${tab === null ? '' : tab} para mostrar en este momento`);
            return;
        }

        renderTable(data.comprobaciones, tab);
        renderCards(data.comprobaciones, tab);
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        renderCards([]);
        Toast('ERROR AL MOSTRAR', 'No se pudieron cargar las comprobaciones. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table Information
function getActionIcons(estado) {
    if(estado === 'Pendiente' || estado === 'Rechazada')
        return `
            <i class="fa-solid fa-pen-to-square"></i>
            <i class="fa-solid fa-circle-info"></i>
        `;
    else if(estado === 'Aprobada')
        return `
            <i class="fa-solid fa-hand-holding-dollar"></i>
            <i class="fa-solid fa-circle-info"></i>
        `;
    else
        return `<i class="fa-solid fa-circle-info"></i>`;
}

function renderTable(comprobaciones, tab = 'all') {
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

        let html = `
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
            <td><div class="actions">${getActionIcons(cmp.estado)}</div></td>
        `;

        tr.innerHTML = html;
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
function renderCards(comprobaciones, tab = 'all') {
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

// Pagination
function updatePagination(paginacion) {
    const pageDiv = document.querySelector('.page:not(.final)');
    const pageFinal = document.querySelector('.page.final');
    const buttonConexion = document.querySelector('.button-conexion');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    if(pageDiv) pageDiv.textContent = paginacion.paginaActual;
    if(pageFinal) pageFinal.textContent = paginacion.totalPaginas;
    paginacionGlobal = paginacion;

    if(buttonConexion)
        buttonConexion.style.display = paginacion.totalPaginas > 1 ? 'flex' : 'none';
    if(pageFinal)
        pageFinal.parentElement.style.display = paginacion.totalPaginas > 1 ? 'flex' : 'none';

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
    const glass = search.querySelector('.fa-magnifying-glass');
    const sol = search.querySelector('.fa-plane');
    const calendar = search.querySelector('.fa-calendar');
    const input = search.querySelector('input');
    
    if(!glass || !sol || !calendar || !input) return;

    function swapIcons() {
        const parent = search;

        const glassRemoved = parent.removeChild(glass);
        const solRemoved = parent.removeChild(sol);

        if(!swapped) {
            parent.insertBefore(solRemoved, input);
            parent.insertBefore(glassRemoved, calendar.nextSibling);
            input.placeholder = 'Solicitud. . .';
            swapped = true;
        } else {
            parent.insertBefore(glassRemoved, input);
            parent.insertBefore(solRemoved, calendar.nextSibling);
            input.placeholder = "Folio. . .";
            swapped = false;
        }
        input.value = '';
    }

    function fadeAndSwap(shouldSwap) {
        if(shouldSwap) {
            glass.classList.add('fade-out');
            sol.classList.add('fade-out');
        }

        setTimeout(() => {
            if(shouldSwap) {
                swapIcons();
                glass.classList.remove('fade-out');
                sol.classList.remove('fade-out');
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

    sol.addEventListener('click', (e) => {
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

    if(!searchValue || !tipo) return;

    const input = document.querySelector('.search-back input');
    const glass = document.querySelector('.fa-magnifying-glass');
    const sol = document.querySelector('.fa-plane');
    if (!input || !glass || !sol) return;

    input.value = searchValue;

    // Determinar modo "solicitud" (swapped = true) o "folio" (swapped = false)
    const shouldSwapp = (tipo === 'solicitud');

    if(swapped !== shouldSwapp) {
        const parent = document.querySelector('.search-back');
        const glassRemoved = parent.removeChild(glass);
        const solRemoved = parent.removeChild(sol);

        if(shouldSwapp) {
            parent.insertBefore(solRemoved, input);
            parent.insertBefore(glassRemoved, document.querySelector('.fa-calendar').nextSibling);
            input.placeholder = 'Solicitud. . .';
        } else {
            parent.insertBefore(glassRemoved, input);
            parent.insertBefore(solRemoved, document.querySelector('.fa-calendar').nextSibling);
            input.placeholder = 'Folio. . .';
        }
        swapped = shouldSwapp;
    }

    // Realizar búsqueda
    setTimeout(() => {
        const filtros = getCurrentFilters();
        if(tipo === 'folio') {
            filtros.folio = searchValue;
            delete filtros.solicitud;
        } else {
            filtros.solicitud = searchValue;
            delete filtros.folio;
        }
        
        currentPage = 1;
        tableInformation(filtros, currentPage);
    }, 200);
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

        // Día actual
        const today = new Date();
        if(year === today.getFullYear() && month === today.getMonth() && day === today.getDate())
            cell.classList.add('today');

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


/* ============================= ACTIVE CARD ============================= */
async function loadCardDetails(card) {
    const folio = card.getAttribute('data-folio');
    if(!folio) return;

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/comprobaciones/detalle?folio=${encodeURIComponent(folio)}&vista=Colaborador`, {
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
                ${comprobacion.estado === 'Aprobada' ? 
                    `<i class="fa-solid fa-hand-holding-dollar"></i>` : 
                    `<i class="fa-solid fa-pen-to-square"></i>`}
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
// Nueva Comprobación
function buttonComp() {
    const button = document.querySelector('.button-create');
    if(!button) return;

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'crear-comprobacion.html';
    });
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

        const response = await fetch(`${API}/api/comprobaciones/detalle?folio=${encodeURIComponent(folio)}&vista=Colaborador`, {
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
        const monedaSol = comprobacion.total_moneda;

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

        // =================== CALCULAR TOTALES CON CONVERSIÓN =================== //
        let totalImporte = 0;
        let totalIva = 0;
        let totalOtros = 0;

        facturas.forEach(fact => {
            const tc = fact.tipo_cambio?.tipo_cambio || 1;
            const monedaFact = fact.tipo_moneda;

            let factor = 1;
            if(monedaFact === 'MXN' && monedaSol === 'MXN')
                factor = 1;
            else if(monedaFact !== 'MXN' && monedaSol === 'MXN')
                factor = tc;
            else if(monedaFact === monedaSol)
                factor = 1;
            else if(monedaFact === 'MXN' && monedaSol !== 'MXN')
                factor = 1 / tc;
            else
                factor = 1;

            totalImporte += (fact.importe || 0) * factor;
            totalIva += (fact.iva || 0) * factor;
            totalOtros += (fact.otros_montos || 0) * factor;
        });

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

        setNumberValue(importeCmp, totalImporte);
        setNumberValue(ivaCmp, totalIva);
        setNumberValue(otrosCmp, totalOtros);
        setNumberValue(anticipo, comprobacion.anticipo);
        totalCmp.forEach(t => { setNumberValue(t, comprobacion.total); });
        
        if(monedaSol) {
            const symbol = obtenerSimboloMoneda(monedaSol);
            if(symbolImpCmp) symbolImpCmp.textContent = `${symbol} `;
            if(symbolIvaCmp) symbolIvaCmp.textContent = `${symbol} `;
            if(symbolOtrCmp) symbolOtrCmp.textContent = `${symbol} `;
            if(symbolAnt) symbolAnt.textContent = `${symbol} `;
            
            const totalSpans = document.querySelectorAll('.cmp-total span');
            totalSpans.forEach(span => { span.textContent = `${symbol}`; });
        }

        // Banderas
        const cmpFlags = document.querySelectorAll('.info-currency img');
        const cmpCurrencies = document.querySelectorAll('.info-currency p');

        if(cmpFlags.length >= 1 && monedaSol) {
            cmpFlags[0].src = getFlagUrl(monedaSol);
            cmpFlags[0].alt = monedaSol;
            cmpFlags[0].onerror = () => cmpFlags[0].style.display = 'none';
            if(cmpCurrencies[0]) cmpCurrencies[0].textContent = monedaSol;
        }
        if(cmpFlags.length >= 2 && comprobacion.saldo_moneda) {
            cmpFlags[1].src = getFlagUrl(comprobacion.saldo_moneda);
            cmpFlags[1].alt = comprobacion.saldo_moneda;
            cmpFlags[1].onerror = () => cmpFlags[1].style.display = 'none';
            if(cmpCurrencies[1]) cmpCurrencies[1].textContent = comprobacion.saldo_moneda;
        }

        // Saldo
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

        // =================== FACTURAS =================== //
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
            const monedaFact =  fact.tipo_moneda || 'MXN';
            let tipoCambioVal = tipoCambioObj.tipo_cambio || 1;
            if(tipoCambioVal === null || tipoCambioVal === undefined) tipoCambioVal = 1;
            const tipoCambioFormateado = parseFloat(tipoCambioVal).toFixed(4);

            // TC Ponderado
            if(monedaFact === 'MXN')
                totalMXN += parseFloat(fact.total_factura) || 0;
            else
                totalMXN += (parseFloat(fact.total_factura) || 0) * tipoCambioVal;

            const flagFact = getFlagUrl(monedaFact);
            const symbolFact = obtenerSimboloMoneda(monedaFact);
            const flagSol = getFlagUrl(monedaSol);
            const symbolSol = obtenerSimboloMoneda(monedaSol);

            const mismaMoneda = monedaFact === monedaSol;
            const monedaExtranjera = monedaFact !== 'MXN' ? monedaFact : monedaSol !== 'MXN' ? monedaSol : null;

            const tcHtml = (monedaFact === 'MXN' && monedaSol === 'MXN') ? `
                <div class="moneda-cambio">
                    <div class="monto-currency cambio-intern">
                        <img src="https://flagcdn.com/w40/mx.png" alt="MXN" onerror="this.style.display='none'">
                        <p><span>$</span>1.0000</p>
                    </div>
                    <p class="fact-text equal">=</p>
                    <div class="monto-currency cambio-mx">
                        <img src="https://flagcdn.com/w40/mx.png" alt="MXN" onerror="this.style.display='none'">
                        <p><span>$</span>1.0000</p>
                    </div>
                </div>
            ` : `
                <div class="moneda-cambio">
                    <div class="monto-currency cambio-intern">
                        <img src="${getFlagUrl(monedaExtranjera)}" alt="${monedaExtranjera}" onerror="this.style.display='none'">
                        <p><span>${obtenerSimboloMoneda(monedaExtranjera)}</span>1.0000</p>
                    </div>
                    <p class="fact-text equal">=</p>
                    <div class="monto-currency cambio-mx">
                        <img src="https://flagcdn.com/w40/mx.png" alt="MXN" onerror="this.style.display='none'">
                        <p><span>$</span>${tipoCambioFormateado}</p>
                    </div>
                </div>
            `;

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
                                    <p><span>${symbolFact} </span>${formatCurrency(fact.importe)}</p>
                                    <p><span>${symbolFact} </span>${formatCurrency(fact.iva)}</p>
                                    <p><span>${symbolFact} </span>${formatCurrency(fact.otros_montos)}</p>
                                </div>
                            </div>

                            <div class="calc-saldo">
                                <p class="calc-subtitle">TOTAL:</p>
                                <p><span>${symbolFact}</span>${formatCurrency(fact.total_factura)}</p>
                            </div>

                            <div class="monto-currency">
                                <img src="${flagFact}" alt="${monedaFact}" onerror="this.style.display='none'">
                                <p>${monedaFact}</p>
                            </div>
                        </div>

                        <div class="fact-tipo-cambio">
                            <p class="fact-subtitle prin">TIPO DE CAMBIO</p>
                            ${tcHtml}

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
            if(monedaSol !== 'MXN') {
                cmpTCDiv.style.display = 'flex';
                const tcAmount = cmpTCDiv.querySelector('.monto-currency.cambio-intern p');
                const tcFlagRight = cmpTCDiv.querySelector('.monto-currency.cambio-mx img');
                const tcSymbolRight = cmpTCDiv.querySelector('.monto-currency.cambio-mx p');

                if(tcAmount) tcAmount.innerHTML = `<span>${obtenerSimboloMoneda(monedaSol)}</span>${(totalMXN / comprobacion.total).toFixed(4)}`;
                if(tcFlagRight) { tcFlagRight.src = 'https://flagcdn.com/w40/mx.png'; tcFlagRight.alt = 'MXN'; }
                if(tcSymbolRight) tcSymbolRight.innerHTML = `<span>$</span>${(totalMXN / comprobacion.total).toFixed(4)}`;
            } else
                cmpTCDiv.style.display = 'none';
        }

        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                window.open(`${API}/${url}`, '_blank');
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
async function openFile(url, filename) {
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
            const err = await response.json().catch(() => ({ message: 'Error al abrir el archivo' }));
            throw new Error(err.message || 'Error al abrir el archivo');
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch(error) {
        Toast('ERROR', 'Lo siento, no fue posible abrir el archivo');
    }
}

// Settlement
function buttonLiquidacion() {
    document.body.addEventListener('click', async(e) => {
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

        if(solicitud) 
            window.location.href = `colab-liquidaciones.html?search=${encodeURIComponent(solicitud)}`;
    });
}

// Edit
function buttonEdit() {
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('.fa-pen-to-square');
        if(!button) return;
        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let folio = null;
        let sol = null;

        if(row) {
            const folioCell = row.querySelector('.folio p');
            const solCell = row.querySelector('.sol p');

            if(folioCell) folio = folioCell.textContent.trim();
            if(solCell) sol = solCell.textContent.trim();
        } else if(card) {
            const folioElem = card.querySelector('.folio-mobile');
            const solElem = card.querySelector('.sol-mobile');

            if(folioElem) folio = folioElem.textContent.trim();
            if(solElem) sol = solElem.textContent.trim();
        }

        if(folio)
            window.location.href = `editar-comprobacion.html?folio=${encodeURIComponent(folio)}&search=${encodeURIComponent(sol)}`;
        else
            Toast('ERROR', 'No se pudo identificar el folio de la solicitud');
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

function Toast(title, content) {
    ToastMixin.fire({
        icon: undefined,
        html: `
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="./assets/images/Icon_agave.webp" alt="Agave" class="agave-icon">
                <div class="text">
                    <p>${title}</p>
                    <span>${content}</span>
                </div>
            </div>
        `
    });
}
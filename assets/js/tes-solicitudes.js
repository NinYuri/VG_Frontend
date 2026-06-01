document.addEventListener("DOMContentLoaded", function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tableInformation(getCurrentFilters());
    tabSelected();
    cardLinks();
    searchColab();
    initCalendar();
    setupCalendar();
    activeCards();
    buttonTransfer();
    initReceiptUpload();
    buttonInfoDelivered();
    buttonPreview();
    buttonDownload();
});


/* ============================== VARIABLES ============================== */
// Transfer receipt
let selectedFile = null;
let isUploading = false;
let uploadComplete = false;
let uploadedFilePath = null;

// Table information
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
let currentMonto = null;

// Pending amount
let lastKnownCount = 0;

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

// Backend
const token = Session.getToken();
const logoUser = Session.getUser();


/* ================================= FUNCIONES ================================= */
const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function formatDate(dateStr) {
    const fechaISO = new Date(dateStr).toISOString().slice(0, 10);
    const [year, monthNum, day] = fechaISO.split('-');
    const dia = day;
    const mes = meses[parseInt(monthNum, 10) - 1];
    return `${dia} / ${mes} / ${year}`;
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
// Logout
async function logoutReset() {
    try {
        await fetch('http://127.0.0.1:3000/auth/logout', {
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
function getFinancialStatus() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return null;

    if(activeTab.classList.contains('pending')) 
        return 'Pendientes';
    if(activeTab.classList.contains('delivered')) 
        return 'Entregados';
    if(activeTab.classList.contains('settled'))
        return 'Liquidados';
    
    return null;
}

function getActiveTabId() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return 'pending';

    if(activeTab.classList.contains('delivered')) return 'delivered';
    if(activeTab.classList.contains('settled')) return 'settled';

    return 'pending';
}

function toastStatus() {
    const tabActiva = document.querySelector('.tab.selected');
    if(!tabActiva) return null;

    if(tabActiva.classList.contains('pending'))
        return 'pendientes de entrega'
    if(tabActiva.classList.contains('delivered')) 
        return 'entregados';
    if(tabActiva.classList.contains('settled')) 
        return 'liquidados';

    return null;
}

// Filters
function getCurrentFilters(){
    const input = document.querySelector('.search-back input');
    const valor = input ? input.value.trim() : '';
    const filtros = {};

    if(swapped)
        filtros.colaborador = valor;
    else
        filtros.folio = valor;

    if(globalStartDate) {
        filtros.fechaIni = globalStartDate;
        if(globalEndDate) 
            filtros.fechaFin = globalEndDate;
    }

    const estadoFinanciero = getFinancialStatus();
    if(estadoFinanciero !== null) filtros.estado = estadoFinanciero;
    filtros.orden = currentFolio;
    if(currentMonto) filtros.currentMonto = currentMonto;

    return filtros;
}

// Backend query
async function tableInformation(filtros = {}, page = 1) {
    showLoader();
    renderTable([]);
    renderCards([]);

    // Calcula el offset basado en la página
    const offset = (page - 1) * limitPerPage;

    // Construir query string
    const params = new URLSearchParams();
    if(filtros.estado) params.append('estado', filtros.estado);
    if(filtros.folio) params.append('folio', filtros.folio);
    if(filtros.colaborador) params.append('colaborador', filtros.colaborador);
    if(filtros.fechaIni) params.append('fechaIni', filtros.fechaIni);
    if(filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    params.append('limit', limitPerPage);
    params.append('offset', offset);
    params.append('orden', currentFolio);
    if(currentMonto) params.append('ordenMonto', currentMonto);

    try {
        const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/listar?${params.toString()}`, {
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
            updateCounters(0, 0);
            throw new Error('Error al obtener solicitudes');
            return;
        }

        const data = await response.json();
        
        if(data.mensaje) {
            renderTable([]);
            renderCards([]);
            updateCounters(0, 0);
            const tab = toastStatus();
            Toast(`SIN ANTICIPOS ${tab === null ? '' : tab.toUpperCase()}`, `No tienes anticipos ${tab === null ? '' : tab} para mostrar en este momento`);
            return;
        }

        renderTable(data.solicitudes, getActiveTabId());
        renderCards(data.solicitudes, getActiveTabId());
        updateCounters(
            data.pendientes ?? 0, 
            data.sinEntrega ?? 0
        );
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        renderCards([]);
        updateCounters(0, 0);
        Toast('ERROR AL MOSTRAR SOLICITUDES', 'No se pudieron cargar las solicitudes. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table information
function buildThead(tab) {
    const thead = document.querySelector('.table-head');
    if(!thead) return;

    const columnas= [
        { title: 'Folio', hasOrder: true },
        { title: 'Colaborador' },
        { title: 'Fecha' },
        { title: 'Monto', hasOrder: true },
        { title: 'Pago' }, 
    ];

    if(tab === 'pending')
        columnas.push({ title: 'Entrega' });
    else
        columnas.push({ title: 'Financiero' });

    const headerRow = document.createElement('tr');
    columnas.forEach(col => {
        const th = document.createElement('th');

        if(col.hasOrder) {
            th.innerHTML = `
                <div class="order-div" data-column="${col.title.toLowerCase()}">
                    <div class="order">
                        <i class="fa-solid fa-angle-up"></i>
                        <i class="fa-solid fa-angle-down"></i>
                    </div>
                    ${col.title}
                </div>`;
        } else 
            th.textContent = col.title;

        headerRow.appendChild(th);
    });

    const thAcciones = document.createElement('th');
    thAcciones.textContent = '';
    headerRow.appendChild(thAcciones);

    thead.innerHTML = '';
    thead.appendChild(headerRow);
    setupSorting();
}

function getActionIcons(estado, fechaEntrega) {
    if(estado === 'Pendiente')
        return `<i class="fa-solid fa-circle-info"></i>`;
    else if(estado === 'Liquidada') {
        return `
            <i class="fa-solid fa-hand-holding-dollar"></i>
            <i class="fa-solid fa-circle-info"></i>
        `;
    }
    else {
        if(fechaEntrega !== null)
            return `<i class="fa-solid fa-circle-info"></i>`;
        else
            return `<i class="fa-solid fa-circle-dollar-to-slot"></i>`;
    }
}

function renderTable(solicitudes, tab = null) {
    const tbody = document.querySelector('.table-body');
    if(!tbody) return;
    
    const currentTab = tab || getActiveTabId();
    buildThead(currentTab);
    tbody.innerHTML = '';

    if(solicitudes.length === 0) return;

    const statusClass = {
        'Pendiente': 'st-pending',
        'Liquidada': 'st-liquidated'
    };

    solicitudes.forEach(sol =>  {
        const tr = document.createElement('tr');

        const simbolo = obtenerSimboloMoneda(sol.moneda);
        const montoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(sol.monto);
        const estadoClass = statusClass[sol.estado_financiero] || 'st-pending';

        // Columna Entrega o Financiero
        let estadoFinanciero = sol.estado_financiero;
        let textoMostrar = '';
        let claseMostrar = '';

        if(currentTab === 'pending') {
            textoMostrar = 'Pendiente';
            claseMostrar = 'st-pending';
        } else if(currentTab === 'delivered') {
            if(!estadoFinanciero) {
                textoMostrar = 'Por confirmar';
                claseMostrar = 'st-received';
            } else {
                textoMostrar = estadoFinanciero;
                claseMostrar = statusClass[estadoFinanciero];
            }
        } else if(currentTab === 'settled') {
            textoMostrar = estadoFinanciero;
            claseMostrar = statusClass[textoMostrar];
        }

        // Celda de estado y acciones
        let statusHtml = `<td><div class="status ${claseMostrar}">${textoMostrar}</div></td>`;
        const acciones = getActionIcons(sol.estado_financiero, sol.fecha_entrega);

        let html = `
            <td class="folio"><p>${sol.folio}</p></td>
            <td><p>${sol.nombre || '—'}</p></td>
            <td><p>${formatDate(sol.inicio_viaje)}</p></td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="${getFlagUrl(sol.moneda)}" alt="${sol.moneda}" onerror="this.style.display='none'">
                    <p><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                </div>
            </td>
            <td class="payment">${sol.forma_pago}</td>
            ${statusHtml}
            <td><div class="actions">${acciones}</div></td>
        `;

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    const rowsActuales = solicitudes.length;
    for(let i = rowsActuales; i < limitPerPage; i++) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td><p class="empty-row">Empty</p></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(emptyRow);
    }

    buttonInfoDelivered();
}

// Cards Information
function renderCards(solicitudes, tab = null) {
    const currentTab = tab || getActiveTabId();
    const container = document.querySelector('.cards-mobile');
    if(!container) return;
    
    container.innerHTML = '';

    const statusClass = {
        'Pendiente': 'st-pending',
        'Liquidada': 'st-liquidated'
    };

    solicitudes.forEach(sol => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-folio', sol.folio);
        card.setAttribute('data-loaded', 'false');

        let estadoFinanciero = sol.estado_financiero;
        let textoMostrar = '';
        let claseMostrar = '';

        if(currentTab === 'pending') {
            textoMostrar = 'Pendiente';
            claseMostrar = 'st-pending';
        } else if(currentTab === 'delivered') {
            if(!estadoFinanciero) {
                textoMostrar = 'Por confirmar';
                claseMostrar = 'st-received';
            } else {
                textoMostrar = estadoFinanciero;
                claseMostrar = statusClass[estadoFinanciero];
            }
        } else if(currentTab === 'settled') {
            textoMostrar = estadoFinanciero;
            claseMostrar = statusClass[textoMostrar];
        }
        
        // Estructura
        card.innerHTML = `
            <div class="first-info">
                <div class="info-mobile">
                    <p class="subt-mobile">FOLIO</p>
                    <p class="folio-mobile">${sol.folio}</p>
                </div> 
                <div class="info-mobile">
                    <p class="subt-mobile">COLABORADOR</p>
                    <p>${sol.nombre_completo || sol.nombre || '—'}</p>
                </div>
                <div class="info-mobile">
                    <p class="subt-mobile">${currentTab === 'pending' ? 'ENTREGA' : 'FINANCIERO' }</p>
                    <p class="status ${claseMostrar} st-mobile">${textoMostrar}</p>
                </div>
            </div>

            <div class="complete-info"></div>
        `;

        container.appendChild(card);
    });

    activeCards();
}

// Pending amount
function updateCounters(pendientes, sinEntrega) {
    const pendingTab = document.querySelector('.tab.pending .amount');
    if(!pendingTab) return;

    const valor = sinEntrega ?? null;

    if(valor !== null && valor > 0) {
        // Caso normal -> actualizar y guardar cantidad
        pendingTab.textContent = valor;
        pendingTab.classList.add('has-number');
        lastKnownCount = valor;
    } else if(lastKnownCount > 0) {
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
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('selected');
                t.querySelector('.amount')?.classList.remove('selected');
            });

            this.classList.add('selected');
            this.querySelector('.amount')?.classList.add('selected');

            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}

// Links de las cards
function cardLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if(!tabParam) return;

    const estadoMap = {
        'pending': 'pending',
        'delivered': 'delivered',
        'settled': 'settled'
    };

    const tabToActivate = estadoMap[tabParam];
    if(!tabToActivate) return;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('selected');
        tab.querySelector('.amount')?.classList.remove('selected');
    });

    const activeTab = document.querySelector(`.tab.${tabToActivate}`);
    if(activeTab) {
        activeTab.classList.add('selected');
        activeTab.querySelector('.amount')?.classList.add('selected');

        currentPage = 1;
        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
    }
}


/* ============================== SEARCH ============================== */
function searchColab() {
    const search = document.querySelector('.search-back');
    const glass = search.querySelector('.fa-magnifying-glass');
    const user = search.querySelector('.fa-circle-user');
    const calendar = search.querySelector('.fa-calendar');
    const input = search.querySelector('input');

    if(!glass || !user || !calendar || !input) return;

    function swapIcons() {
        const parent = search;

        // Eliminar temporalmente los iconos
        const glassRemoved = parent.removeChild(glass);
        const userRemoved = parent.removeChild(user);

        if(!swapped) {
            parent.insertBefore(userRemoved, input);
            parent.insertBefore(glassRemoved, calendar.nextSibling);
            input.placeholder = "Colaborador. . .";
            swapped = true;
        } else {
            parent.insertBefore(glassRemoved, input);
            parent.insertBefore(userRemoved, calendar.nextSibling);
            input.placeholder = "Folio. . .";
            swapped = false;
        }
        input.value = '';
    }

    function fadeAndSwap(shouldSwap) {
        if(shouldSwap) {
            glass.classList.add('fade-out');
            user.classList.add('fade-out');
        }

        setTimeout(() => {
            if(shouldSwap) {
                swapIcons();
                glass.classList.remove('fade-out');
                user.classList.remove('fade-out');
            }
        }, 200);
    }

    let debounceTimer;

    function doSearch() {
        const valor = input.value.trim();
        const filtros = getCurrentFilters();
        if(swapped) {
            filtros.colaborador = valor;
            delete filtros.folio;
        } else {
            filtros.folio = valor;
            delete filtros.colaborador;
        }

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

            delete filtros.folio;
            delete filtros.colaborador;

            currentPage = 1;
            tableInformation(filtros, currentPage);
        }
    });

    glass.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.folio;
        delete filtros.colaborador;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(swapped);
    });

    user.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.folio;
        delete filtros.colaborador;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(!swapped);
    });
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


/* ============================= ACTIVE CARD ============================= */
async function loadCardDetails(card) {
    const folio = card.getAttribute('data-folio');
    if(!folio) return;

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/detalle?folio=${encodeURIComponent(folio)}`, {
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
        Toast("ERROR", error.message);
    }
}

function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', async (e) => {
            if(e.target.closest('.complete-info, .fa-circle-dollar-to-slot, .fa-image, .fa-cloud-arrow-down, .fa-hand-holding-dollar, .buttons-mobile')) 
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

                // Cargar información
                if(card.getAttribute('data-loaded') === 'false')
                    await loadCardDetails(card);
            }
        });
    });

    const firstCard = cards[0];
    
    firstCard.classList.add('active');
    if(firstCard.getAttribute('data-loaded') === 'false')
        loadCardDetails(firstCard);
}

function llenarInfoCard(card, data) {
    const completeInfo = card.querySelector('.complete-info');
    if(!completeInfo) return;

    const currentTab = getActiveTabId();
    const moneda = data.monto_moneda;
    const simbolo = obtenerSimboloMoneda(data.monto_moneda);
    const montoFormateado = new Intl.NumberFormat('es-MX', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(data.monto_solicitado || 0);

    const formaPago = data.forma_pago || '—';
    const fechaViaje = formatDate(data.inicio_viaje);
    const fechaEntrega = data.fecha_entrega ? formatDate(data.fecha_entrega) : '—';
    const fechaConfirmacion = data.fecha_confirmacion ? formatDate(data.fecha_confirmacion) : '—';
    const comprobante = !!data.ruta_comprobante;
    const fullImageUrl = comprobante ? `http://127.0.0.1:3000/${data.ruta_comprobante}` : '';

    card.setAttribute('data-comprobante-url', fullImageUrl);

    let html = '';

    let firstColumn = `
        <div class="first-column">
            <div class="info-mobile">
                <p class="subt-mobile">FECHA</p>
                <p>${fechaViaje}</p>
            </div>
    `;

    if(currentTab === 'pending') {
        firstColumn += `</div>`;

        const secondColumn = `
            <div class="second-column">
                <div class="info-mobile">
                    <p class="subt-mobile">MONTO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                    <p class="amount-mobile-currency"><img src="${getFlagUrl(moneda)}" alt="${moneda}" onerror="this.style.display='none'">${moneda}</p>
                </div>
            </div>
        `;

        const thirdColumn = `
            <div class="third-column">
                <div class="info-mobile">
                    <p class="subt-mobile">FORMA DE PAGO</p>
                    <p class="payment-mobile">${formaPago}</p>
                </div>

                <div class="buttons-mobile">
                    <i class="fa-solid fa-circle-dollar-to-slot"></i>
                </div>
            </div>
        `;

        html = `${firstColumn}${secondColumn}${thirdColumn}`;
    } else if(currentTab === 'delivered') {
        if(comprobante) {
            firstColumn += `
                <div class="info-mobile tranfer-rec">
                    <p class="subt-mobile">COMPROBANTE</p>
                    <i class="fa-solid fa-image"></i>
                    <i class="fa-solid fa-cloud-arrow-down"></i>
                </div>
            `;
        } else {
            firstColumn += `
                <div class="map-img">
                    <img src="./assets/images/Icon_map.webp" alt="Map">
                </div>
            `;
        }
        firstColumn += `</div>`;

        const secondColumn = `
            <div class="second-column">
                <div class="info-mobile">
                    <p class="subt-mobile">MONTO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                    <p class="amount-mobile-currency"><img src="${getFlagUrl(moneda)}" alt="${moneda}" onerror="this.style.display='none'">${moneda}</p>
                </div>
                <div class="info-mobile">
                    <p class="subt-mobile">FORMA DE PAGO</p>
                    <p class="payment-mobile">${formaPago}</p>
                </div>
            </div>
        `;

        const thirdColumn = `
            <div class="third-column">
                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE ENTREGA</p>
                    <p>${fechaEntrega}</p>
                </div>
                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE CONFIRMACIÓN</p>
                    <p>${fechaConfirmacion}</p>
                </div>
            </div>
        `;

        html = `${firstColumn}${secondColumn}${thirdColumn}`;
    } else if(currentTab === 'settled') {
        if(comprobante)
            firstColumn += `
                <div class="info-mobile tranfer-rec">
                    <p class="subt-mobile">COMPROBANTE</p>
                    <i class="fa-solid fa-image"></i>
                    <i class="fa-solid fa-cloud-arrow-down"></i>
                </div>
            `;
        else
            firstColumn += `
                <div class="map-img">
                    <img src="./assets/images/Icon_map.webp" alt="Map">
                </div>
            `;
        
        firstColumn += `</div>`;

        const secondColumn = `
            <div class="second-column">
                <div class="info-mobile">
                    <p class="subt-mobile">MONTO</p>
                    <p class="amount-mobile"><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                    <p class="amount-mobile-currency"><img src="${getFlagUrl(moneda)}" alt="${moneda}" onerror="this.style.display='none'">${moneda}</p>
                </div>
                <div class="info-mobile">
                    <p class="subt-mobile">FORMA DE PAGO</p>
                    <p class="payment-mobile">${formaPago}</p>
                </div>
            </div>
        `;

        const thirdColumn = `
            <div class="third-column">
                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE ENTREGA</p>
                    <p>${fechaEntrega}</p>
                </div>
                <div class="info-mobile">
                    <p class="subt-mobile">FECHA DE CONFIRMACIÓN</p>
                    <p>${fechaConfirmacion}</p>
                </div>
                <div class="buttons-mobile">
                    <i class="fa-solid fa-hand-holding-dollar"></i>
                </div>
            </div>
        `;

        html = `${firstColumn}${secondColumn}${thirdColumn}`;
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
                const folio = card.querySelector('.folio-mobile')?.textContent || 'comprobante';
                downloadReceipt(fullImageUrl, `Comprobante de Solicitud ${folio}.jpg`);
            }
        });
    }
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

            if(column === 'folio') {
                currentFolio = currentFolio === 'ASC' ? 'DESC' : 'ASC';
                currentMonto = null;
            } else if(column === 'monto') {
                if(currentMonto === 'DESC')
                    currentMonto = null;
                else
                    currentMonto = currentMonto === 'ASC' ? 'DESC' : 'ASC';

                // Cuando ordenamos por monto, mantenemos el folio en ASC
                currentFolio = 'ASC';
            }

            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}


/* ============================== TABLE BUTTONS ============================== */
// Transfer Receipt -> Pending Tab
async function gestionarAnticipo(folio, fechaEntrega = null, fechaConfirmacion = null, rutaComprobante = null, noRecibido = false) {
    const body = { folio };
    if(fechaEntrega) body.fechaEntrega = fechaEntrega;
    if(fechaConfirmacion) body.fechaConfirmacion = fechaConfirmacion;
    if(rutaComprobante) body.rutaComprobante = rutaComprobante;
    if(noRecibido) body.noRecibido = noRecibido;

    const response = await fetch('http://127.0.0.1:3000/api/solicitudes/anticipo', {
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
        throw new Error(err.message || 'Error al gestionar anticipo');
    }

    return await response.json();
}

async function buttonTransfer() {
    const container = document.querySelector('.container');
    if(!container) return;

    document.body.addEventListener('click', async (e) => {
        const button = e.target.closest('.fa-circle-dollar-to-slot');
        if(!button) return;

        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let folio;
        let payment;

        if(row) {
            const paymentCell = row.querySelector('.payment');
            const folioCell = row.querySelector('.folio');

            if(paymentCell) payment = paymentCell.textContent.trim();
            if(folioCell) folio = folioCell.textContent.trim();
        } else if(card) {
            const paymentCell = card.querySelector('.payment-mobile');
            const folioCell = card.querySelector('.folio-mobile');

            if(paymentCell) payment = paymentCell.textContent.trim();
            if(folioCell) folio = folioCell.textContent.trim();
        } else return;

        if(payment === 'Transferencia') {
            const receipt = document.querySelector('.transfer-wrapper');
            receipt.dataset.folio = folio;
            const buttonClose = receipt.querySelector('.top-decor i');
            if(!receipt || !buttonClose) return;

            receipt.style.display = 'flex';
            container.classList.add('modal-open');
        } else 
            ToastButtons(folio);
    });
}

async function uploadReceiptFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://127.0.0.1:3000/api/solicitudes/upload/comprobante/anticipo', {
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
        reader.onload = (e) => {
            showUploadedImage(e.target.result);
        };
        reader.readAsDataURL(file);

        return true;
    }

    async function uploadAndConfirm(folio) {
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
            await gestionarAnticipo(folio, hoy, null, uploadedFilePath);
            Toast('COMPROBANTE CARGADO', '¡Listo! Hemos notificado al colaborador para que confirme la recepción del anticipo');

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

    uploadButton.addEventListener('click', async (e) => {
        e.stopPropagation();

        const folio = receiptModal.dataset.folio;
        if(!folio) {
            Toast('ERROR', 'No se pudo identificar el folio');
            return;
        }

        if(!isConfirming && selectedFile && !uploadComplete)
            await uploadAndConfirm(folio);
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

// Information -> Delivered Tab
async function buttonInfoDelivered() {
    const container = document.querySelector('.container');
    const info = document.querySelector('.info-wrapper');
    const folioSpan = info.querySelector('.info-folio');
    const closeBtn = info.querySelector('.top-decor i');
    const bottomCash = info.querySelector('.bottom-decor.cash');
    const bottomTransfer = info.querySelector('.bottom-decor.transfer');

    if (!container || !info || !folioSpan || !closeBtn || !bottomCash || !bottomTransfer) return;

    // Limpiar eventos anteriores
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    const newClose = newCloseBtn;

    // Modal Reset
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
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.classList.contains('fa-circle-info')) return;
        e.stopPropagation();

        const row = target.closest('tr');
        const card = target.closest('.card');
        let folio = null;
        let payment = null;

        if(row) {
            const folioCell = row.querySelector('.folio');
            const paymentCell = row.querySelector('.payment');
            if(folioCell) folio = folioCell.textContent.trim();
            if(paymentCell) payment = paymentCell.textContent.trim();
        } else if(card) {
            const folioCell = card.querySelector('.folio-mobile');
            const paymentCell = card.querySelector('.payment-mobile');
            if(folioCell) folio = folioCell.textContent.trim();
            if(paymentCell) payment = paymentCell.textContent.trim();
        }
        if(!folio || !payment) return;

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/detalle?folio=${encodeURIComponent(folio)}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if(!response.ok) throw new Error('Error al obtener detalles');
            const data = await response.json();

            resetModal();
            folioSpan.textContent = folio;

            if(payment === 'Efectivo') {
                bottomCash.style.display = 'flex';
                
                if(data.fecha_entrega)
                    document.querySelector('.cash-entrega span').innerHTML = formatDate(data.fecha_entrega);
                else
                    document.querySelector('.cash-entrega span').innerHTML = '—';

                if(data.fecha_confirmacion)
                    document.querySelector('.cash-confir span').innerHTML = formatDate(data.fecha_confirmacion);
                else
                    document.querySelector('.cash-confir span').innerHTML = '—';
            } else if(payment === 'Transferencia') {
                bottomTransfer.style.display = 'flex';
                
                if(data.fecha_entrega)
                    document.querySelector('.transfer-entrega span').innerHTML = formatDate(data.fecha_entrega);
                else
                    document.querySelector('.transfer-entrega span').innerHTML = '—';

                if(data.fecha_confirmacion)
                    document.querySelector('.transfer-confir span').innerHTML = formatDate(data.fecha_confirmacion);
                else
                    document.querySelector('.transfer-confir span').innerHTML = '—';
                
                // Image
                const transferImg = bottomTransfer.querySelector('.transfer-ver img');
                const buttonsDiv = bottomTransfer.querySelector('.buttons-info');
                if(data.ruta_comprobante) {
                    const fullImageUrl = `http://127.0.0.1:3000/${data.ruta_comprobante}`;
                    transferImg.src = fullImageUrl;
                    if(buttonsDiv) buttonsDiv.style.display = 'flex';
                }
            }

            info.style.display = 'flex';
            container.classList.add('modal-open');
        } catch (error) {
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
            Toast('ENTREGA DE ANTICIPO', 'Lo siento, no existe un comprobante para mostrar');
    });
}

// Download Transfer Receipt
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
    } catch (error) {
        Toast('DESCARGAR COMPROBANTE', 'No se pudo descargar el comprobante. Intenta de nuevo.');
    }
}

function buttonDownload() {
    const button = document.querySelector('.button-download');
    if (!button) return;

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        const img = document.querySelector('.transfer-ver img');
        if(img && img.src && img.src !== '') {
            const folio = document.querySelector('.info-folio')?.textContent || 'Comprobante';
            downloadReceipt(img.src, `Comprobante de Solicitud ${folio}.jpg`);
        } else
            Toast('DESCARGAR COMPROBANTE', 'Lo siento, no existe un comprobante para descargar');
    });
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

// Toast -> Buttons
function ToastButtons(folio) {
    Swal.fire({
        title: 'CONFIRMAR ENTREGA DE ANTICIPO',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="received-text">¿Se ha entregado el anticipo en efectivo al colaborador para la solicitud con folio ${folio}?</p>
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
        width:'543px',
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
                await gestionarAnticipo(folio, hoy);
                Toast('ENTREGA DE ANTICIPO', '¡Listo! Hemos notificado al colaborador para que confirme la recepción del anticipo');

                const filtros = getCurrentFilters();
                tableInformation(filtros, currentPage);
            } catch (error) {
                Toast('ERROR', error.message);
            }
        }
    });
}
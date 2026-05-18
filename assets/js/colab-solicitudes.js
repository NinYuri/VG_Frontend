document.addEventListener("DOMContentLoaded", function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tableInformation({});
    tabSelected();
    search();
    initCalendar();
    setupCalendar();
    activeCards();
    buttonRequest();
    buttonReceived();
    buttonEdit();
    buttonInfo();
});


/* ============================== VARIABLES ============================== */
let globalStartDate = null;
let globalEndDate = null;
let currentPage = 1;
let paginacionGlobal = {
    paginaActual: 1,
    totalPaginas: 1
};
const limitPerPage = 7;
let currentFolio = 'ASC';
let currentMonto = null;

const token = Session.getToken();
const logoUser = Session.getUser();


/* ================================= FUNCTIONS ================================= */
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
async function logoutReset() {
    try {
        await fetch('http://127.0.0.1:3000/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch(error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        Session.clearToken();
        window.location.href = 'index.html';
    }
}

function optionsBar() {
    const dashboard = document.querySelector('.option.dashboard');
    const request = document.querySelector('.option.request');
    const expenses = document.querySelector('.option.expenses');
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;
        
        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if(currentPath.includes('colab-dashboard.html'))
            dashboard.classList.add('active');
        else if(currentPath.includes('colab-solicitudes.html'))
            request.classList.add('active');
        else if(currentPath.includes('colab-comprobaciones.html'))
            expenses.classList.add('active');
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
    if(tabActive.classList.contains('canceled'))
        return 'Cancelada';

    return null;
}

function getActiveTabId() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return 'all';

    if(activeTab.classList.contains('pending')) return 'pending';
    if(activeTab.classList.contains('approved')) return 'approved';
    if(activeTab.classList.contains('rejected')) return 'rejected';
    if(activeTab.classList.contains('canceled')) return 'canceled';

    return 'all';
}

// Filters
function getCurrentFilters() {
    const estado = getActiveStatus();
    const input = document.querySelector('.search-back input');
    const valor = input ? input.value.trim() : '';
    const filtros = { estado };
    if(valor) filtros.folio = valor;

    if(globalStartDate) {
        filtros.fechaIni = globalStartDate;
        if(globalEndDate)
            filtros.fechaFin = globalEndDate;
    }

    filtros.orden = currentFolio;
    if(currentMonto) filtros.ordenMonto = currentMonto;

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
    if(filtros.folio) params.append('folio', filtros.folio);
    if(filtros.fechaIni) params.append('fechaIni', filtros.fechaIni);
    if(filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    params.append('limit', limitPerPage);
    params.append('offset', offset);
    params.append('orden', currentFolio);
    params.append('ordenMonto', currentMonto);

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
            throw new Error('Error al obtener solicitudes');
        }

        const data = await response.json();
        const tab = getActiveTabId();

        if(data.mensaje) {
            renderTable([]);
            renderCards([]);
            Toast('ERROR AL MOSTRAR SOLICITUDES', data.mensaje);
            return;
        }

        renderTable(data.solicitudes, tab);
        renderCards(data.solicitudes);
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        renderCards([]);
        Toast('ERROR AL MOSTRAR SOLICITUDES', 'No se pudieron cargar las solicitudes. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table Information
function buildThead(tab) {
    const thead = document.querySelector('.table-head');
    if(!thead) return;

    // Columnas base
    const columnas = [
        { title: 'Folio', hasOrder: true },
        { title: 'Fecha' },
        { title: 'Destino' },
        { title: 'Monto', hasOrder: true },
        { title: 'Estado' }
    ];

    if(tab === 'all' || tab === 'approved')
        columnas.push({ title: 'Finanzas' });

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
       
    if(tab === 'rejected' || tab === 'canceled') {
        const emptyHeader = document.createElement('th');
        emptyHeader.textContent = '';
        headerRow.appendChild(emptyHeader);
    }

    const thAcciones = document.createElement('th');
    thAcciones.textContent = '';
    headerRow.appendChild(thAcciones);

    thead.innerHTML = '';
    thead.appendChild(headerRow);
    setupSorting();
}

function getActionIcons(estado, financiero, tab) {
    if(tab === 'pending')
        return `
            <i class="fa-solid fa-circle-xmark"></i>
            <i class="fa-solid fa-pen-to-square"></i>
            <i class="fa-solid fa-circle-info"></i>
        `;
    
    else if(tab === 'approved') {
        if(financiero === 'Pendiente')
            return `
                <i class="fa-solid fa-money-check-dollar"></i>
                <i class="fa-solid fa-circle-info"></i>
            `;
        else
            return `<i class="fa-solid fa-circle-info"></i>`;
    }

    else if(tab === 'rejected' || tab === 'canceled')
        return `<i class="fa-solid fa-circle-info"></i>`;
    
    else {
        if(estado === 'Pendiente') 
            return `
                <i class="fa-solid fa-circle-xmark"></i>
                <i class="fa-solid fa-pen-to-square"></i>
                <i class="fa-solid fa-circle-info"></i>
            `;
        
        else if(estado === 'Aprobada') {
            if(financiero === 'Pendiente')
                return `
                    <i class="fa-solid fa-money-check-dollar"></i>
                    <i class="fa-solid fa-circle-info"></i>
                `;
            else
                return `<i class="fa-solid fa-circle-info"></i>`;
        }

        else
            return `<i class="fa-solid fa-circle-info"></i>`;
    }
}

function renderTable(solicitudes, tab = 'all') {
    const tbody = document.querySelector('.table-body');
    if(!tbody) return;

    // Construir thead
    buildThead(tab);
    tbody.innerHTML = '';

    if(solicitudes.length === 0) return;

    const statusClass = {
        'Pendiente': 'st-pending',
        'Aprobada': 'st-approved',
        'Rechazada': 'st-rejected',
        'Cancelada': 'st-canceled',
        'Liquidada': 'st-liquidated'
    };

    solicitudes.forEach(sol => {
        const tr = document.createElement('tr');

        const simbolo = obtenerSimboloMoneda(sol.moneda);
        const montoFormateado = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(sol.monto);
        const estadoClass = statusClass[sol.estado] || '';

        // Celdas base
        let html = `
            <td class="folio"><p>${sol.folio}</p></td>
            <td><p>${formatDate(sol.inicio_viaje)}</p></td>
            <td><p>${sol.destino}</p></td>
            <td class="monto-cell">
                <div class="monto-content">
                    <img src="./assets/images/${sol.moneda}.webp" alt="${sol.moneda}">
                    <p><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                </div>
            </td>
            <td><div class="status ${estadoClass}">${sol.estado}</div></td>
        `;

        // Columna Finanzas
        if(tab === 'all' || tab === 'approved') {
            let finanzasHtml = '';
            
            if(sol.estado === 'Aprobada') {
                if(sol.estado_finanzas) {
                    const estadoFinClass = statusClass[sol.estado_finanzas] || '';
                    finanzasHtml = `<div class="status ${estadoFinClass}">${sol.estado_finanzas}</div>`;
                }
                else
                    finanzasHtml = `<div class="status btn-received">¿Recibido?</div>`;
            }

            html += `<td>${finanzasHtml}</td>`;
        }

        if(tab === 'canceled' || tab === 'rejected')
            html += `<td></td>`;

        // Columna de acciones
        const acciones = getActionIcons(sol.estado, sol.estado_finanzas, tab);
        html += `<td><div class="actions">${acciones}</div></td>`;

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    const rowsActuales = solicitudes.length;
    for(let i = rowsActuales; i < limitPerPage; i++) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td><p class="empty-row">Empty</p></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(emptyRow);
    }

    buttonReceived();
    buttonCanceled();
    buttonEdit();
    buttonInfo();
}

// Cards Information
function getCardActionIcons(estado, financiero) {
    if(estado === 'Pendiente')
        return `
            <i class="fa-solid fa-circle-xmark"></i>
            <i class="fa-solid fa-pen-to-square"></i>
        `;
    else if(estado === 'Aprobada' && financiero === 'Pendiente' || financiero === 'Liquidada')
        return `<i class="fa-solid fa-money-check-dollar"></i>`;

    return '';
}

function renderCards(solicitudes) {
    const statusClass = {
        'Pendiente': 'st-pending',
        'Aprobada': 'st-approved',
        'Rechazada': 'st-rejected',
        'Cancelada': 'st-canceled',
        'Liquidada': 'st-liquidated'
    };

    const container = document.querySelector('.cards-mobile');
    container.innerHTML = '';

    solicitudes.forEach(sol => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-folio', sol.folio);
        card.setAttribute('data-loaded', 'false');

        const estado = sol.estado || '—';
        const estadoClass = statusClass[estado] || '';
        const estadoFinanzas = sol.estado_finanzas;

        // Bloque both-status
        let bothStatusHtml = `
            <div class="info-mobile">
                <p class="subt-mobile">ESTADO</p>
                <p class="status ${estadoClass} st-mobile">${estado}</p>
            </div>
        `;

        // Estado financiero
        if(estado === 'Aprobada') {
            const finanzasClass = statusClass[estadoFinanzas] || '';
            let secondStatusHtml = '';

            if(!estadoFinanzas)
                secondStatusHtml = `<p class="status btn-received st-mobile">¿Recibido?</p>`;
            else
                secondStatusHtml = `<p class="status ${finanzasClass} st-mobile">${estadoFinanzas}</p>`;

            bothStatusHtml += `
                <div class="info-mobile">
                    <p class="subt-mobile">FINANCIERO</p>
                    ${secondStatusHtml}
                </div>
            `;
        }
        
        // Estructura básica
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

                <div class="both-status-mobile">
                    ${bothStatusHtml}
                </div>
            </div>

            <div class="complete-info"></div>
        `;

        container.appendChild(card);
    });

    activeCards();
    buttonReceived();
    buttonCanceled();
    buttonEdit();
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
function obtenerSimboloMoneda(codigo) {
    const simbolos = { MXN: '$', USD: '$', EUR: '€', JPY: '¥' };
    return simbolos[codigo] || '$';
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
            tableInformation(filtros);
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
            filtros.folio = valor;

        currentPage = 1;
        tableInformation(filtros);
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

            delete filtros.valor;

            currentPage = 1;
            tableInformation(filtros);
        }
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
        tableInformation(filtros);
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
        tableInformation(filtros);

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
        completeInfo.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('click', async (e) => {
            if(e.target.closest('.complete-info, .fa-circle-check, .fa-circle-xmark, .fa-pen-to-square, .fa-money-check-dollar, .buttons-mobile')) return;
            
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
        loadCardDetails(firstCard);
}

function llenarInfoCard(card, data) {
    const completeInfo = card.querySelector('.complete-info');

    const simbolo = obtenerSimboloMoneda(data.monto_moneda);
    const montoFormateado = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(data.monto_solicitado || 0);
    const buttons = getCardActionIcons(data.estado, data.estado_finanzas);

    completeInfo.innerHTML = `
        <div class="first-column">
            <div class="info-mobile">
                <p class="subt-mobile">DESTINO</p>
                <p class="destiny">${data.destino || '—'}</p>
            </div>
            <div class="info-mobile second">
                <div class="info-mobile arrival">
                    <p class="subt-mobile">SALIDA</p>
                    <p>${formatDate(data.inicio_viaje)}</p>
                </div>
                <div class="info-mobile return">
                    <p class="subt-mobile">REGRESO</p>
                    <p>${formatDate(data.fin_viaje)}</p>
                </div>
            </div>
            <div class="info-mobile">
                <p class="subt-mobile">MOTIVO</p>
                <p>${data.motivo || '—'}</p>
            </div>
        </div>

        <div class="second-column">
            <div class="info-mobile">
                <p class="subt-mobile">MONTO</p>
                <p class="amount-mobile"><span class="symbol-money">${simbolo}</span>${montoFormateado}</p>
                <p class="amount-mobile-currency"><img src="./assets/images/${data.monto_moneda}.webp" alt="${data.monto_moneda}">${data.monto_moneda}</p>
            </div>
            <div class="info-mobile">
                <p class="subt-mobile">FORMA DE PAGO</p>
                <p>${data.forma_pago || '—'}</p>
            </div>
            <div class="map-img">
                <img src="./assets/images/Icon_map.webp" alt="Map">
            </div>
        </div>

        <div class="third-column">
            <div class="info-mobile">
                <p class="subt-mobile">FECHA DE SOLICITUD</p>
                <p>${formatDate(data.fecha_recepcion)}</p>
            </div>

            <div class="info-mobile">
                <p class="subt-mobile">FECHA DE PAGO</p>
                <p>08 / ABR / 2026</p>
            </div>

            <div class="info-mobile">
                <p class="subt-mobile">FECHA DE ACTUALIZACIÓN</p>
                <p>${formatDate(data.fecha_actualizacion)}</p>
            </div>

            <div class="buttons-mobile">
                ${buttons}
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
            
            if(column === 'folio') {
                currentFolio = currentFolio === 'ASC' ? 'DESC' : 'ASC';
                currentMonto = null;
            } else if(column === 'monto') {
                if(currentMonto === 'DESC')
                    currentMonto = null;
                else
                    currentMonto = currentMonto === 'ASC' ? 'DESC' : 'ASC';
                
                currentFolio = 'ASC';
            }

            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros);
        });
    });
}


/* ============================== ACTION BUTTONS ============================== */
// New Request
function buttonRequest() {
    const button = document.querySelector('.button-create');
    if(!button) return;

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        window.location.href = 'crear-solicitud.html';
    });
}

// Edit
function buttonEdit() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.fa-pen-to-square');
        if(!button) return;
        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let folio = null;

        if(row) {
            const folioCell = row.querySelector('.folio p');
            if(folioCell) folio = folioCell.textContent.trim();
        } else if(card) {
            const folioElem = card.querySelector('.folio-mobile');
            if (folioElem) folio = folioElem.textContent.trim();
        }

        if(folio)
            window.location.href = `editar-solicitud.html?folio=${encodeURIComponent(folio)}`;
        else
            Toast('ERROR', 'No se pudo identificar el folio de la solicitud');
    });
}

// Money received
async function moneyReceived(folio, confirmado) {
    if(!token) {
        Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
        return false;
    }

    showLoader();

    const body = { folio };
    if(confirmado) {
        const today = new Date().toISOString().slice(0, 10);
        body.fechaConfirmacion = today;
        body.noRecibido = false;
    } else
        body.noRecibido = true;

    try {
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
            const errorData = await response.json().catch(() => ({ message: 'Error al procesar la confirmación' }));
            throw new Error(errorData.message);
        }

        const data = await response.json();

        if(confirmado) 
            Toast('RECEPCIÓN DE ANTICIPO', '¡Listo! Tu anticipo ha sido confirmado correctamente');
        else
            Toast('RECEPCIÓN DE ANTICIPO', 'Hemos notificado a Tesorería para dar seguimiento a la entrega de tu anticipo');

        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
        return true;
    } catch(error) {
        Toast('ERROR', error.message || 'No se pudo procesar la confirmación');
        return false;
    } finally {
        hideLoader();
    }
}

function buttonReceived() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.status.btn-received');
        if (!button) return;
        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let folio = 'desconocido';
        let elemento = null;

        if(row) {
            const folioCell = row.querySelector('.folio');
            if(folioCell) folio = folioCell.textContent.trim();
            elemento = row;
        } else if(card) {
            const folioElem = card.querySelector('.folio-mobile');
            if(folioElem) folio = folioElem.textContent.trim();
            elemento = card;
        } else return;

        ToastReceived(folio);
    });
}

// Cancel
async function cancelRequest(folio, elemento) {
    if(!token) {
        Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
        return false;
    }

    showLoader();
    try {
        const response = await fetch('http://127.0.0.1:3000/api/solicitudes/cancelar', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ folio })
        });

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error al cancelar la solicitud' }));
            throw new Error(errorData.message);
        }

        const data = await response.json();
        Toast('SOLICITUD CANCELADA', 'Ahora puedes consultarla en la pestaña de Canceladas');

        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
        return true;
    } catch(error) {
        Toast('ERROR', error.message || 'No se pudo cancelar la solicitud');
        return false;
    } finally {
        hideLoader();
    }
}

function buttonCanceled() {
    document.addEventListener('click', async (e) => {
        const button = e.target.closest('.fa-circle-xmark');
        if(!button) return;
        e.stopPropagation();

        const row = button.closest('tr');
        const card = button.closest('.card');
        let folio = 'desconocido';
        let elemento = null;

        if(row) {
            const folioCell = row.querySelector('.folio p');
            if(folioCell) folio = folioCell.textContent.trim();
            elemento = row;
        } else if(card) {
            const folioElem = card.querySelector('.folio-mobile');
            if(folioElem) folio = folioElem.textContent.trim();
            elemento = card;
        } else return;

        ToastCanceled(folio, elemento);
    });
}

// Information
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
        const buttonClose = document.querySelector('.arrow-back');
        if(!infoCard || !container || !buttonClose) return;

        showLoader();
        infoCard.style.display = 'flex';
        container.classList.add('modal-open');

        try {
            if(!token) {
                Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
                return;
            }

            const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/detalle?folio=${encodeURIComponent(folio)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if(!response.ok) {
                const err = await response.json().catch(() => ({ message: 'Error al cargar la información' }));
                throw new Error(err.message || 'Error al obtener detalles');
            }

            const data = await response.json();
            populateInfoPanel(data);
        } catch(error) {
            Toast('ERROR', error.message);
            infoCard.style.display = 'none';
            container.classList.remove('modal-open');
        } finally {
            hideLoader();
        };

        buttonClose.onclick = (e) => {
            e.stopPropagation();
            infoCard.style.display = 'none';
            container.classList.remove('modal-open');
        };
    });
}

// Calculate travel days
function calculateDays() {
    const infoWrapper = document.querySelector('.info-wrapper');
    if(!infoWrapper) return;

    const departureDate = infoWrapper.querySelector('.departure-date p:last-child');
    const returnDate = infoWrapper.querySelector('.return-date p:last-child');
    const days = infoWrapper.querySelector('.total-days span');

    if(!departureDate || !returnDate || !days) return;

    // Obtener textos
    const startDate = departureDate.textContent.trim();
    const endDate = returnDate.textContent.trim();

    // Mapeo de meses para cálculo
    const meses = {
        'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
    };

    function parseDate(dateStr) {
        const partes = dateStr.split('/').map(p => p.trim());
        const dia = parseInt(partes[0], 10);
        const mesAbrev = partes[1].toUpperCase();
        const year = parseInt(partes[2], 10);
        const mes = meses[mesAbrev];
        if(isNaN(dia) || mes === undefined || isNaN(year)) return null;
        return new Date(year, mes, dia);
    }

    const salida = parseDate(startDate);
    const regreso = parseDate(endDate);

    if(salida && regreso && regreso >= salida) {
        const diffTime = regreso - salida;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        days.textContent = diffDays.toString().padStart(2, '0');
    } else
        days.textContent = '00';
}

function populateInfoPanel(data) {
    // Folio y fecha de solicitud
    document.querySelector('.info-folio span').textContent = data.folio || '—';
    document.querySelector('.info-date span').textContent = formatDate(data.fecha_recepcion);

    // Estado
    const firstStatusDiv = document.querySelector('.both-status .first');
    if(firstStatusDiv) {
        firstStatusDiv.textContent = data.estado || '—';
        firstStatusDiv.className = 'status first';
        if(data.estado) {
            const estadoClass = data.estado === 'Pendiente' ? 'st-pending' :
                                data.estado === 'Aprobada' ? 'st-approved' : 
                                data.estado === 'Rechazada' ? 'st-rejected' : 
                                data.estado === 'Cancelada' ?  'st-canceled' : '';
            if(estadoClass) firstStatusDiv.classList.add(estadoClass);
        }
    }

    // Estado Financiero
    const bothContainer = document.querySelector('.both-status');
    if(!bothContainer) return;

    let secondStatusDiv = bothContainer.querySelector('.second');
    const estadoFinanzas = data.estado_finanzas;

    if(estadoFinanzas) {
        if(!secondStatusDiv) {
            secondStatusDiv = document.createElement('div');
            secondStatusDiv.className = 'status second';
            bothContainer.appendChild(secondStatusDiv);
        }

        secondStatusDiv.textContent = estadoFinanzas;
        secondStatusDiv.className = 'status second';
        const finanzasClass = estadoFinanzas === 'Pendiente' ? 'st-pending' :
                              estadoFinanzas === 'Liquidada' ?  'st-liquidated' : '';
        if(finanzasClass) secondStatusDiv.classList.add(finanzasClass);
        secondStatusDiv.style.display = 'flex';
    } else {
        if(secondStatusDiv)
            secondStatusDiv.remove();
    }

    // Destino
    document.querySelector('.request-destination p:not(.info-subtitle)').textContent = (data.destino || '—').toUpperCase();

    // Colaborador
    document.querySelector('.colab .info-subtitle').textContent = (data.colaborador || 'Sin nombre').toUpperCase();

    // Fechas de salida y regreso
    document.querySelector('.departure-date p:last-child').textContent = formatDate(data.inicio_viaje);
    document.querySelector('.return-date p:last-child').textContent = formatDate(data.fin_viaje);

    // Calcular días de viaje
    calculateDays();

    // Motivo
    document.querySelector('.info-motive p:last-child').textContent = data.motivo || '—';

    // Monto
    const montoFormateado = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(data.monto_solicitado || 0);
    document.querySelector('.info-amount .symbol-money').textContent = obtenerSimboloMoneda(data.monto_moneda);
    document.querySelector('.info-amount').childNodes[1]?.nodeType === 3 && (document.querySelector('.info-amount').childNodes[1].textContent = ' ' + montoFormateado);
    const amountP = document.querySelector('.info-amount');
    amountP.innerHTML = `<span class="symbol-money">${obtenerSimboloMoneda(data.monto_moneda)}</span>${montoFormateado}`;

    // Moneda (bandera y código)
    const flagImg = document.querySelector('.info-currency img');
    flagImg.src = `./assets/images/${data.monto_moneda}.webp`;
    flagImg.alt = data.monto_moneda;
    document.querySelector('.info-currency p').textContent = data.monto_moneda;

    // Forma de pago
    document.querySelector('.info-payment').textContent = data.forma_pago || '—';

    // Fecha de entrega y actualización
    if(data.fecha_entrega)
        document.querySelector('.payment-date span').textContent = formatDate(data.fecha_entrega);
    else
        document.querySelector('.payment-date').style.display = 'none';
    
    document.querySelector('.info-update span').textContent = formatDate(data.fecha_actualizacion);
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
function ToastCanceled(folio, elemento) {
    Swal.fire({
        title: 'SOLICITUD CANCELADA',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="canceled-text">Estás a punto de cancelar la solicitud ${folio}</p>
            <p class="canceled-text">Esta acción no podrá deshacerse</p>
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
        }
    }).then(async (result) => {
        if(result.isConfirmed) {
            await cancelRequest(folio, elemento);
        }
    });
}

// Toast -> Buttons
function ToastReceived(folio) {
    Swal.fire({
        title: 'CONFIRMAR RECEPCIÓN DE ANTICIPO',
        html: `
            <img src="./assets/images/Icon_agave1.webp" alt="Agave" class="agave-half left">
            <img src="./assets/images/Icon_agave2.webp" alt="Agave" class="agave-half right">
            <p class="received-text">¿Has recibido el anticipo de viáticos correspondiente a tu solicitud con folio ${folio}?</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: 'NO, AÚN NO',
        confirmButtonText: 'SÍ, LO RECIBÍ',
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
        if(result.isConfirmed) 
            await moneyReceived(folio, true);
        else if(result.dismiss === Swal.DismissReason.cancel)
            await moneyReceived(folio, false);
    });
}
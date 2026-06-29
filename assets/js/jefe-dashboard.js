document.addEventListener('DOMContentLoaded', async function() {
    menuUser();
    phoneMenu();
    initMobileScroll();
    rolSwitch();
    optionsBar();
    cardLinks();

    showLoader();
    try {
        await Promise.all([
            loadAllMonths(),
            updateCardCounts(),
            initTendChart(),
            initExpenseChart(),
            initTotalCard(),
        ]);

        setupStatusChartNav();
    } finally {
        hideLoader();
    }

    window.addEventListener('resize', () => {
        if(expensesChart && currentExpenseYear)
            updateExpenseChart(currentExpenseYear);
    });
});


/* ================================ VARIABLES ================================ */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
// const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';

// Estados mensuales
let currentYear = null;
let currentMonth = null;
let currentChart = null;
let allMonthsData = [];

// Tendencia solicitudes
let tendChart = null;
let currentTendYear = new Date().getFullYear();
let minTendYear = null;
let maxTendYear = null;

// Gasto mensual
let expensesChart = null;
let currentExpenseYear = new Date().getFullYear();
let minExpenseYear = null;
let maxExpenseYear = null;

// Gastos card
let currentTotalYear = new Date().getFullYear();
let currentTotalMonth = new Date().getMonth() + 1;
const totalCardCache = {};

const MONTH_NAMES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                     'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const CURRENCY_COLORS = [
    '#2A5156', '#C9C867', '#97BD13', '#D65B5B',
    '#53A0E4', '#E4A853', '#9B53E4', '#53E4C4',
    '#E453A0', '#5356E4'
];

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


/* ================================= FUNCTIONS ================================= */
function formatCurrency(value, currencyCode = 'MXN') {
    if(value === null || value === undefined) return '0.00';
    const formatter = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return formatter.format(value);
}

// Precargar imágenes de banderas en un Map
async function preloadFlags(currencies) {
    const flagMap = new Map();
    await Promise.all(currencies.map(code => new Promise(resolve => {
        const img = new Image();
        img.src = getFlagUrl(code);
        img.onload  = () => { flagMap.set(code, img); resolve(); };
        img.onerror = () => resolve(); // sin bandera → usará color
    })));
    return flagMap;
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


/* ================================= PHONE MENU ================================= */
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

    rolDiv.style.display = 'grid';

    if(specialBtn.classList.contains('current'))
        rolDiv.classList.add('special-active');

    specialBtn.addEventListener('click', () => {
        if(specialBtn.classList.contains('current')) return;
        
        specialBtn.classList.add('current');
        normalBtn.classList.remove('current');
        rolDiv.classList.add('special-active');

        window.location.href = 'jefe-dashboard.html';
    });

    normalBtn.addEventListener('click', () => {
        if(normalBtn.classList.contains('current')) return;

        normalBtn.classList.add('current');
        specialBtn.classList.remove('current');
        rolDiv.classList.remove('special-active');

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
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;
        
        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if(currentPath.includes('jefe-dashboard.html'))
            dashboard.classList.add('active');
        else if(currentPath.includes('jefe-solicitudes.html'))
            request.classList.add('active');
    }
    
    setActiveOption();

    dashboard.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'jefe-dashboard.html';
    });

    request.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'jefe-solicitudes.html'
    });

    logout.addEventListener('click', (e) => {
        e.stopPropagation();
        logoutReset();
    });
}


/* ============================== CARD LINKS ============================== */
function cardLinks() {
    const cards = document.querySelectorAll('.card-wrapper');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const tabToActivate = this.getAttribute('data-tab');
            window.location.href = `jefe-solicitudes.html?tab=${tabToActivate}`;
        });
    });
}


/* ============================== CARDS COUNTS ============================== */
async function fetchCardCounts() {
    try {
        const response = await fetch(`${API}/api/solicitudes/dashboard/cantidad-solicitudes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener cantidades');
        const data = await response.json();
        return data;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar las cantidades de solicitudes');
        return [];
    }
}

async function updateCardCounts() {
    const counts = await fetchCardCounts();
    
    const defaultNumbers = {
        'Pendiente': '00',
        'Aprobada': '00',
        'Rechazada': '00'
    };
    
    if(counts && counts.length) {
        counts.forEach(item => {
            if(defaultNumbers.hasOwnProperty(item.estado))
                defaultNumbers[item.estado] = item.cantidad.toString().padStart(2, '0');
        });
    }
    
    const pendingEl = document.querySelector('.pending-number');
    const approvedEl = document.querySelector('.approved-number');
    const rejectedEl = document.querySelector('.rejected-number');
    
    if(pendingEl) {
        const span = pendingEl.querySelector('span');
        pendingEl.innerHTML = '';
        if(span) pendingEl.appendChild(span);
        pendingEl.appendChild(document.createTextNode(defaultNumbers['Pendiente']));
    }
    if(approvedEl) {
        const span = approvedEl.querySelector('span');
        approvedEl.innerHTML = '';
        if(span) approvedEl.appendChild(span);
        approvedEl.appendChild(document.createTextNode(defaultNumbers['Aprobada']));
    }
    if(rejectedEl) {
        const span = rejectedEl.querySelector('span');
        rejectedEl.innerHTML = '';
        if(span) rejectedEl.appendChild(span);
        rejectedEl.appendChild(document.createTextNode(defaultNumbers['Rechazada']));
    }
}


/* ============================== GRAPHS ============================== */
// Plugins
const shadowPlugin = {
    id: 'shadowPlugin',
    beforeDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        ctx.save();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    },
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        ctx.restore();
    }
}

function createFlagPlugin(flagMap, currencyColors) {
    return {
        id: 'flagPoints',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;

            const isMobile = window.innerWidth <= 765;
            const isDesktop = window.innerWidth >= 1801;

            const SIZE = isDesktop ? 18 : isMobile ? 14 : 16;

            chart.data.datasets.forEach((dataset, di) => {
                const meta = chart.getDatasetMeta(di);
                const code = dataset.currency;
                const flagImg = flagMap.get(code);
                const color = currencyColors[di % currencyColors.length];

                meta.data.forEach(point => {
                    const { x, y } = point.getProps(['x', 'y'], true);
                    if (dataset.data[meta.data.indexOf(point)] === null) return;

                    ctx.save();
                    if(flagImg) {
                        // Recorte circular para la bandera
                        ctx.beginPath();
                        ctx.arc(x, y, SIZE / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(flagImg, x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);

                        // Borde
                        ctx.restore();
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(x, y, SIZE / 2, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    } else {
                        // Fallback: círculo de color
                        ctx.beginPath();
                        ctx.arc(x, y, SIZE / 2, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    ctx.restore();
                });
            });
        }
    };
}


// ======= Status graph =======
async function fetchStatusChart(year, month) {
    try {
        const params = new URLSearchParams();
        params.append('vista', 'Jefe');

        const response = await fetch(`${API}/api/solicitudes/dashboard/estados?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos');
        const data = await response.json();

        // Buscar el mes o año solicitado
        let found = null;
        if(year && month) found = data.find(item => item.anio === year && item.mes === month);
        if(!found && data.length) found = data[0];
        
        return found;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de estados');
        return null;
    }
}

// Legend
function updateStatusLegend(pendientes, aprobadas, rechazadas, canceladas) {
    const legendItems = document.querySelectorAll('.legend-item');

    if(legendItems.length >= 3) {
        legendItems[0].style.display = pendientes > 0 ? 'flex' : 'none';
        legendItems[1].style.display = aprobadas > 0 ? 'flex' : 'none';
        legendItems[2].style.display = rechazadas > 0 ? 'flex' : 'none';
    }
}

function calcPercentage(pendientes, aprobadas, rechazadas, canceladas) {
    const total = (pendientes + aprobadas + rechazadas) - canceladas;
    
    if(total === 0) return { pctPend: 0, pctAprob: 0, pctRech: 0 };

    let pctPend  = Math.round((pendientes / total) * 100);
    let pctAprob = Math.round((aprobadas / total) * 100);
    let pctRech  = Math.round((rechazadas / total) * 100);

    const suma = pctPend + pctAprob + pctRech;
    
    if(suma !== 100) {
        const diferencia = 100 - suma;
        let maxPct = Math.max(pctPend, pctAprob, pctRech);
        
        if(maxPct === pctPend) pctPend += diferencia;
        else if(maxPct === pctAprob) pctAprob += diferencia;
        else pctRech += diferencia;
    }

    return { pctPend, pctAprob, pctRech };
}

async function updateStatusChart(year, month) {
    const dataRow = await fetchStatusChart(year, month);
    if(!dataRow) return;

    // Actualizar año y mes
    document.querySelector('.center-text .year').textContent = dataRow.anio;
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    document.querySelector('.center-text .month').textContent = monthNames[dataRow.mes - 1];

    currentYear = dataRow.anio;
    currentMonth = dataRow.mes;

    // Leyenda de gráfica
    const pendientes = dataRow.pendientes || 0;
    const aprobadas = dataRow.aprobadas || 0;
    const rechazadas = dataRow.rechazadas || 0;
    const canceladas = dataRow.canceladas || 0;

    const porcentajes = calcPercentage(pendientes, aprobadas, rechazadas, canceladas);
    const pctPend  = porcentajes.pctPend;
    const pctAprob = porcentajes.pctAprob;
    const pctRech  = porcentajes.pctRech;

    const legendItems = document.querySelectorAll('.legend-item');
    if(legendItems.length >= 3) {
        legendItems[0].querySelector('.percentage').textContent = `${pctPend}%`;
        legendItems[1].querySelector('.percentage').textContent = `${pctAprob}%`;
        legendItems[2].querySelector('.percentage').textContent = `${pctRech}%`;
    }
    updateStatusLegend(pendientes, aprobadas, rechazadas);

    // Actualizar gráfica
    if(currentChart) currentChart.destroy();

    const ctx = document.getElementById('status-chart').getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
            datasets: [{
                data: [pendientes, aprobadas, rechazadas],
                backgroundColor: [
                    '#C9C867',     
                    '#97BD13',
                    '#D65B5B',
                ],
                borderWidth: 0,
                hoverOffset: 0,     // hover de separación
                spacing: 0          // espacio entre segmentos
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        },
        plugins: [shadowPlugin]
    });   
}

async function loadAllMonths() {
    try {
        const params = new URLSearchParams();
        params.append('vista', 'Jefe');

        const response = await fetch(`${API}/api/solicitudes/dashboard/estados?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al cargar meses');

        allMonthsData = await response.json();
        allMonthsData.sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));
        if(allMonthsData.length) {
            const last = allMonthsData[allMonthsData.length - 1];
            await updateStatusChart(last.anio, last.mes);
        }
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de estado');
    }
}

function setupStatusChartNav() {
    const prevBtn = document.querySelector('.chartst-container .prev.status-button');
    const nextBtn = document.querySelector('.chartst-container .next.status-button');
    if(!prevBtn || !nextBtn) return;

    // Remover cualquier evento anterior
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    function getCurrentIndex() {
        return allMonthsData.findIndex(item => item.anio === currentYear && item.mes === currentMonth);
    }

    function updateButtonsState(idx) {
        if(idx <= 0) newPrev.classList.add('disabled');
        else newPrev.classList.remove('disabled');

        if(idx >= allMonthsData.length - 1) newNext.classList.add('disabled');
        else newNext.classList.remove('disabled');
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = getCurrentIndex();

        if(idx > 0 && !newPrev.classList.contains('disabled')) {
            const prevMonthData = allMonthsData[idx - 1];
            await updateStatusChart(prevMonthData.anio, prevMonthData.mes);
            updateButtonsState(idx - 1);
        }
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = getCurrentIndex();

        if(idx < allMonthsData.length - 1 && !newNext.classList.contains('disabled')) {
            const nextMonthData = allMonthsData[idx + 1];
            await updateStatusChart(nextMonthData.anio, nextMonthData.mes);
            updateButtonsState(idx + 1);
        }
    });

    const initialIdx = getCurrentIndex();
    if(initialIdx !== -1) updateButtonsState(initialIdx);
}


// ======= Tendencia graph =======
// Years
async function fetchGraphsYears(forTendencia = true) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/years-jefes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener rango de años');

        const { enviadas, aprobadas } = await response.json();

        if(forTendencia) {
            if(enviadas && enviadas.min && enviadas.max) {
                maxTendYear = enviadas.max;
                minTendYear = enviadas.min;
            } else {
                const currentYear = new Date().getFullYear();
                minTendYear = currentYear;
                maxTendYear = currentYear;
            }

            return { min: minTendYear, max: maxTendYear };
       } else {
            if(aprobadas && aprobadas.min && aprobadas.max) {
                minExpenseYear = aprobadas.min;
                maxExpenseYear = aprobadas.max;
            } else {
                const currentYear = new Date().getFullYear();
                minExpenseYear = currentYear;
                maxExpenseYear = currentYear;
            }

            return { min: minExpenseYear, max: maxExpenseYear };
        }
    } catch(error) {
        Toast('ERROR', 'No se pudo determinar el rango de años');
        const currentYear = new Date().getFullYear();
        
        if(forTendencia) {
            maxTendYear = currentYear;
            minTendYear = currentYear;
        } else {
            maxExpenseYear = currentYear;
            minExpenseYear = currentYear;
        }

        return { min: currentYear, max: currentYear };
    }
}

async function initTendChart() {
    await fetchGraphsYears(true);

    if(maxTendYear)
        currentTendYear = maxTendYear;
    else
        currentTendYear = new Date().getFullYear();

    await updateTendChart(currentTendYear);
    setupTendChartNav();
}

function setupTendChartNav() {
    const prevBtn = document.querySelector('.graph-back.requests .prev.request-button');
    const nextBtn = document.querySelector('.graph-back.requests .next.request-button');
    if(!prevBtn || !nextBtn) return;

    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    function updateButtonsState() {
        if(minTendYear === null || maxTendYear === null) return;

        if(currentTendYear <= minTendYear) newPrev.classList.add('disabled');
        else newPrev.classList.remove('disabled');
        
        if(currentTendYear >= maxTendYear) newNext.classList.add('disabled');
        else newNext.classList.remove('disabled');
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(currentTendYear > minTendYear && !newPrev.classList.contains('disabled')) {
            await updateTendChart(currentTendYear - 1);
            updateButtonsState();
        }
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(currentTendYear < maxTendYear && !newNext.classList.contains('disabled')) {
            await updateTendChart(currentTendYear + 1);
            updateButtonsState();
        }
    });
    
    updateButtonsState();
}

// Backend
async function fetchTendData(year) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/tendencia?year=${year}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos de tendencias de solicitudes');
        
        const data = await response.json();
        const monthlyData = Array(12).fill(0);
        data.forEach(item => {
            if(item.mes >= 1 && item.mes <= 12)
                monthlyData[item.mes - 1] = item.solicitudes;
        });
        return monthlyData;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de tendencia');
        return Array(12).fill(0);
    }
}

// Graph
async function updateTendChart(year) {
    const monthlyData = await fetchTendData(year);

    // Actualizar el año
    const yearSpan = document.querySelector('.graph-back.requests .request-year');
    if(yearSpan) yearSpan.textContent = year;
    currentTendYear = year;

    if(tendChart) tendChart.destroy();
    const maxData = Math.max(...monthlyData, 0);

    let step = 10000;
    if(maxData <= 100) step = 10;
    else if(maxData <= 1000) step = 100;
    else if(maxData <= 5000) step = 1000;
    else if(maxData <= 10000) step = 2000;
    else if(maxData <= 50000) step = 10000;
    else step = 25000;

    let yMax = Math.ceil(maxData / step) * step;
    if(yMax === 0) yMax = step;

    const ctx = document.getElementById('trend-chart').getContext('2d');
    const isDesktop = window.innerWidth >= 1801;

    tendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Solicitudes',
                data: monthlyData,
                borderColor: '#2A5156',
                borderWidth: isDesktop ? 2 : 1.5,
                tension: 0,
                pointBackgroundColor: '#2A5156',
                pointBorderWidth: isDesktop ? 2 : 1,
                pointRadius: isDesktop ? 4 : 3,
                pointHoverRadius: isDesktop ? 7 :5,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgb(217, 217, 217, 0.8)',
                    titleColor: '#505455',
                    bodyColor: '#000000',
                    titleFont: { size: isDesktop ? 15 : 10 },
                    bodyFont: { size: isDesktop ? 21 : 15, weight: 'normal', color: '#000000' },
                    displayColors: false,
                    padding: isDesktop ? 7 : 6,
                    callbacks: {
                        label: (context) => context.raw + ' solicitudes'
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: yMax,
                    grid: {
                        color: '#919A9B',
                        lineWidth: 1.5,
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: step,
                        font: { size: isDesktop ? 18 : 11 },
                        color: '#000000'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: isDesktop ? 15 : 10, weight: 400 },
                        color: '#000000'
                    }
                }
            },
            elements: { line: { borderJoinStyle: 'round' } }
        }
    });
}


// ======= Gasto graph =======
async function initExpenseChart() {
    await fetchGraphsYears(false);

    if(maxExpenseYear)
        currentExpenseYear = maxExpenseYear;
    else
        currentExpenseYear = new Date().getFullYear();

    await updateExpenseChart(currentExpenseYear);
    setupExpenseChartNav();
}

function setupExpenseChartNav() {
    const prevBtn = document.querySelector('.graph-back.expenses .prev.expense-button');
    const nextBtn = document.querySelector('.graph-back.expenses .next.expense-button');
    if(!prevBtn || !nextBtn) return;

    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    function updateButtonsState() {
        if(minExpenseYear === null || maxExpenseYear === null) return;

        if(currentExpenseYear <= minExpenseYear) newPrev.classList.add('disabled');
        else newPrev.classList.remove('disabled');

        if(currentExpenseYear >= maxExpenseYear) newNext.classList.add('disabled');
        else newNext.classList.remove('disabled');
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(currentExpenseYear > minExpenseYear && !newPrev.classList.contains('disabled')) {
            await updateExpenseChart(currentExpenseYear - 1);
            updateButtonsState();
        }
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(currentExpenseYear < maxExpenseYear && !newNext.classList.contains('disabled')) {
            await updateExpenseChart(currentExpenseYear + 1);
            updateButtonsState();
        }
    });

    updateButtonsState();
}

// Backend
async function fetchExpenseData(year) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/gasto?year=${year}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos de gasto mensual');
        const data = await response.json();
        return data;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de gastos');
        return [];
    }
}

function buildDatasets(rawData, flagMap, isDesktop) {
    const byMoneda = {};
    rawData.forEach(({ mes, monto, moneda }) => {
        if(!byMoneda[moneda]) byMoneda[moneda] = Array(12).fill(null);
        const idx = mes - 1;
        byMoneda[moneda][idx] = (byMoneda[moneda][idx] || 0) + monto;
    });

    const currencies = Object.keys(byMoneda);
    const currencyColors = {};
    currencies.forEach((code, i) => {
        currencyColors[code] = CURRENCY_COLORS[i % CURRENCY_COLORS.length];
    });

    return currencies.map((code, i) => ({
        label: code,
        currency: code,
        data: byMoneda[code],
        borderColor: currencyColors[code],
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointRadius: 12,
        pointHoverRadius: 14,
        borderWidth: isDesktop ? 2 : 1.5,
        tension: 0,
        fill: false,
        spanGaps: true,
    }));
}

function calcYMax(datasets) {
    let max = 0;
    datasets.forEach(ds => ds.data.forEach(v => { if (v && v > max) max = v; }));
    let step = 0;
    
    if(max <= 100) step = 10;
    else if(max <= 1000) step = 100;
    else if(max <= 5000) step = 1000;
    else if(max <= 10000) step = 2000;
    else if(max <= 50000) step = 10000;
    else step = 25000;
    
    return { max: Math.ceil((max * 1.2) / step) * step || step, step };
}

// Graph
async function renderExpenseChart(rawData) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const isDesktop = window.innerWidth >= 1801;

    // Obtener monedas únicas y precargar banderas
    const currencies = [...new Set(rawData.map(d => d.moneda))];
    const flagMap = await preloadFlags(currencies);
    const flagPlugin = createFlagPlugin(flagMap, CURRENCY_COLORS);
    
    const datasets  = buildDatasets(rawData, flagMap, isDesktop);
    const { max, step } = calcYMax(datasets);

    if(expensesChart) expensesChart.destroy();

    expensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'],
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgb(217, 217, 217, 0.8)',
                    titleColor: '#505455',
                    bodyColor:  '#000000',
                    titleFont: { size: isDesktop ? 15 : 10 },
                    bodyFont: { size: isDesktop ? 21 : 15, weight: 'normal', color: '#000000' },
                    displayColors: false,
                    padding: isDesktop ? 7 : 6,
                    callbacks: {
                        title: (items) => items[0].dataset.label,
                        label: (ctx) => {
                            const code   = ctx.dataset.currency;
                            const symbol = obtenerSimboloMoneda(code);
                            return `${symbol}${(ctx.raw || 0).toLocaleString('es-MX')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max,
                    grid: { 
                        color: '#919A9B', 
                        lineWidth: 1.5, 
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: step,
                        font:  { size: isDesktop ? 18 : 11 },
                        color: '#000000',
                        callback: (v) => v.toLocaleString('es-MX')
                    }
                },
                x: {
                    grid: { 
                        display: false, 
                        drawBorder: false 
                    },
                    ticks: {
                        font:  { size: isDesktop ? 15 : 10, weight: 400 },
                        color: '#000000'
                    }
                }
            },
            elements: { line: { borderJoinStyle: 'round' } }
        },
        plugins: [shadowPlugin, flagPlugin]
    });
}

async function updateExpenseChart(year) {
    // Actualizar año
    const yearSpan = document.querySelector('.graph-back.expenses .expense-year');
    if(yearSpan) yearSpan.textContent = year;
    currentExpenseYear = year;

    const rawData = await fetchExpenseData(year);
    await renderExpenseChart(rawData);
}


/* ============================== TARJETA GASTO ============================== */
async function fetchTotalCardData(year) {
    if(totalCardCache[year]) return totalCardCache[year];

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/gasto?year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }, 
            credentials: 'include' 
        });

        if(!response.ok) throw new Error('Error al obtener datos de gasto mensual');
        const data = await response.json();

        totalCardCache[year] = data.map(r => ({
            mes: Number(r.mes),
            monto: r.monto ? Number(r.monto) : 0,
            moneda: r.moneda,
        }));

        return totalCardCache[year];
    } catch {
        Toast('ERROR', 'No se pudieron cargar los datos del gasto total');
        return [];
    }
}

// Montos del mes
function aggregateTotals(rawData, month) {
    const totals = {};
    rawData
        .filter(r => r.mes === month)
        .forEach(({ monto, moneda }) => {
            totals[moneda] = (totals[moneda] || 0) + (monto || 0);
        });

    return totals;
}

// Meses con datos en un año dado
function getAvailableMonths(rawData) {
    return [...new Set(rawData.map(r => r.mes))].sort((a, b) => a - b);
}

async function updateTotalCard(year, month) {
    const rawData = await fetchTotalCardData(year);
    const totals  = aggregateTotals(rawData, month);

    currentTotalYear  = year;
    currentTotalMonth = month;

    const yearSpan  = document.querySelector('.graph-back.total .total-year');
    const monthSpan = document.querySelector('.graph-back.total .total-month');
    if(yearSpan)  yearSpan.textContent  = year;
    if(monthSpan) monthSpan.textContent = MONTH_NAMES[month - 1];

    // Otras monedas
    document.querySelectorAll('.graph-back.total .total-money.other-currency').forEach(el => el.remove());

    const totalMoneyP = document.querySelector('.graph-back.total .total-money');
    Object.entries(totals).forEach(([moneda, monto]) => {
        const symbol = obtenerSimboloMoneda(moneda);
        const p = document.createElement('p');
        p.className = 'total-money other-currency';
        p.innerHTML = `<span class="total-amount"><span>${symbol}</span>${formatCurrency(monto)} <span class="currency-str">${moneda}</span></span>`;
        totalMoneyP.insertAdjacentElement('afterend', p);
    });
}

async function initTotalCard() {
    if(!minExpenseYear || !maxExpenseYear)
        await fetchGraphsYears(false);

    currentTotalYear = maxExpenseYear || new Date().getFullYear();

    const rawData = await fetchTotalCardData(currentTotalYear);
    const months = getAvailableMonths(rawData);
    currentTotalMonth = months.length ? months[months.length - 1] : new Date().getMonth() + 1;

    await updateTotalCard(currentTotalYear, currentTotalMonth);
    setupTotalCardNav();
}

function setupTotalCardNav() {
    const prevBtn = document.querySelector('.graph-back.total .prev.total-button');
    const nextBtn = document.querySelector('.graph-back.total .next.total-button');
    if(!prevBtn || !nextBtn) return;

    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    async function updateButtonsState() {
        const prevData = await fetchTotalCardData(currentTotalMonth === 1 ? currentTotalYear - 1 : currentTotalYear);
        const prevMonths = getAvailableMonths(prevData);
        const atVeryStart = currentTotalYear <= minExpenseYear && (currentTotalMonth <= (prevMonths[0] || 1));
        newPrev.classList.toggle('disabled', atVeryStart);

        const nextData = await fetchTotalCardData(currentTotalMonth === 12 ? currentTotalYear + 1 : currentTotalYear);
        const nextMonths = getAvailableMonths(nextData);
        const atVeryEnd = currentTotalYear >= maxExpenseYear && (currentTotalMonth >= (nextMonths[nextMonths.length - 1] || 12));
        newNext.classList.toggle('disabled', atVeryEnd);
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(newPrev.classList.contains('disabled')) return;

        let year = currentTotalYear;
        let month = currentTotalMonth - 1;

        if(month < 1) {
            year--;
            const prevData = await fetchTotalCardData(year);
            const prevMonths = getAvailableMonths(prevData);
            month = prevMonths.length ? prevMonths[prevMonths.length - 1] : 12;
        }

        await updateTotalCard(year, month);
        await updateButtonsState();
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(newNext.classList.contains('disabled')) return;

        let year = currentTotalYear;
        let month = currentTotalMonth + 1;

        if(month > 12) {
            year++;
            const nextData = await fetchTotalCardData(year);
            const nextMonths = getAvailableMonths(nextData);
            month = nextMonths.length ? nextMonths[0] : 1;
        }

        await updateTotalCard(year, month);
        await updateButtonsState();
    });

    updateButtonsState();
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
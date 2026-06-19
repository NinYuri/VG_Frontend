document.addEventListener("DOMContentLoaded", async function() {
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    cardLinks();

    showLoader();
    try {
        await Promise.all([
            updateCardCounts(),
            loadAllComprobacionesMonths(),
            initAntChart(),
            initCmpChart(),
            initLiquidMXN(),
        ]);

        setupCompChartNav();
    } finally {
        hideLoader();
    }

    window.addEventListener('resize', () => {
        if(antChart && currentAntYear)
            updateAntChart(currentAntYear);
    });
});

/* ================================ VARIABLES ================================ */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
// const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';

// Estados mensuales (comprobaciones)
let currentCompYear = null;
let currentCompMonth = null;
let currentCompChart = null;
let allCompData = [];

// Anticipos mensuales
let antChart = null;
let currentAntYear = new Date().getFullYear();
let minAntYear = null;
let maxAntYear = null;

// Comprobaciones mensuales
let expenseChart = null;
let currentExpenseYear = new Date().getFullYear();
let minExpenseYear = null;
let maxExpenseYear = null;

// Card liquidaciones
let currentYearLiq = null;
let currentMonthLiq = null;
let availableYearsLiq = [];
let liqCardCache = {};
let minLiqYear = null;
let maxLiqYear = null;

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
    user.innerHTML = '';
    user.innerHTML = logoUser;
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


/* ============================== CARD LINKS ============================== */
function cardLinks() {
    const cards = document.querySelectorAll('.card-wrapper');

    cards.forEach(card => {
        card.addEventListener('click', function() {
            const tabToActivate = this.getAttribute('data-tab');

            if(tabToActivate === 'pending')
                window.location.href = 'tes-solicitudes.html?tab=pending';
            else if(tabToActivate === 'expenses')
                window.location.href = 'tes-comprobaciones.html?tab=pending';
            else if(tabToActivate === 'liquidation')
                window.location.href = 'tes-liquidaciones.html?tab=pending';
        });
    });
}


/* ============================== CARDS COUNTS ============================== */
async function fetchCardCounts() {
    try {
        const response = await fetch(`${API}/api/solicitudes/dashboard/cantidad-tes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener cantidades');
        const data = await response.json();
        return data;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar las cantidades de las tarjetas');
        return [];
    }
}

async function updateCardCounts() {
    const counts = await fetchCardCounts();
    
    let anticipos = '00';
    let comprobaciones = '00';
    let liquidaciones = '00';
    
    if(counts && counts.length) {
        const row = counts[0];
        anticipos = row.anticipos.toString().padStart(2, '0');
        comprobaciones = row.comprobaciones.toString().padStart(2, '0');
        liquidaciones = row.liquidaciones.toString().padStart(2, '0');
    }
    
    const advancesEl = document.querySelector('.advances-number');
    const expensesEl = document.querySelector('.expenses-number');
    const returnsEl = document.querySelector('.returns-number');
    
    if(advancesEl) {
        const span = advancesEl.querySelector('span');
        advancesEl.innerHTML = '';
        if(span) advancesEl.appendChild(span);
        advancesEl.appendChild(document.createTextNode(anticipos));
    }
    if(expensesEl) {
        const span = expensesEl.querySelector('span');
        expensesEl.innerHTML = '';
        if(span) expensesEl.appendChild(span);
        expensesEl.appendChild(document.createTextNode(comprobaciones));
    }
    if(returnsEl) {
        const span = returnsEl.querySelector('span');
        returnsEl.innerHTML = '';
        if(span) returnsEl.appendChild(span);
        returnsEl.appendChild(document.createTextNode(liquidaciones));
    }
}


/* ============================== GRAPHS ============================== */
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
};

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


// ======= Expenses graph =======
// Backend
async function fetchCompChart(year, month) {
    try {
        const response = await fetch(`${API}/api/comprobaciones/dashboard/estados`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos de comprobaciones');
        const data = await response.json();

        let found = null;
        if(year && month) found = data.find(item => item.anio === year && item.mes === month);
        if(!found && data.length) found = data[0];

        return found;
    } catch (error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de comprobaciones');
        return null;
    }
}

// Legend
function updateCompLegend(pendientes, aprobadas, rechazadas) {
    const legendItems = document.querySelectorAll('.graph-back.comp .legend-item');

    if(legendItems.length >= 3) {
        legendItems[0].style.display = pendientes > 0 ? 'flex' : 'none';
        legendItems[1].style.display = aprobadas > 0 ? 'flex' : 'none';
        legendItems[2].style.display = rechazadas > 0 ? 'flex' : 'none';
    }
}

function compPercentage(pendientes, aprobadas, rechazadas) {
    const total = pendientes + aprobadas + rechazadas;
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

// Graph
async function updateCompChart(year, month) {
    const dataRow = await fetchCompChart(year, month);
    if(!dataRow) return;

    // Actualizar año y mes
    document.querySelector('.graph-back.comp .center-text .year').textContent = dataRow.anio;
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    document.querySelector('.graph-back.comp .center-text .month').textContent = monthNames[dataRow.mes - 1];

    currentCompYear = dataRow.anio;
    currentCompMonth = dataRow.mes;

    // Leyenda de gráfica
    const pendientes = dataRow.pendientes || 0;
    const aprobadas = dataRow.aprobadas || 0;
    const rechazadas = dataRow.rechazadas || 0;

    const porcentajes = compPercentage(pendientes, aprobadas, rechazadas);
    const pctPend  = porcentajes.pctPend;
    const pctAprob = porcentajes.pctAprob;
    const pctRech  = porcentajes.pctRech;

    const legendItems = document.querySelectorAll('.graph-back.comp .legend-item');
    if(legendItems.length >= 3) {
        legendItems[0].querySelector('.percentage').textContent = `${pctPend}%`;
        legendItems[1].querySelector('.percentage').textContent = `${pctAprob}%`;
        legendItems[2].querySelector('.percentage').textContent = `${pctRech}%`;
    }
    updateCompLegend(pendientes, aprobadas, rechazadas);

    // Actualizar gráfica
    if(currentCompChart) currentCompChart.destroy();

    const ctx = document.getElementById('comp-chart').getContext('2d');
    currentCompChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
            datasets: [{
                data: [pendientes, aprobadas, rechazadas],
                backgroundColor: [
                    '#C9C867',     
                    '#97BD13',
                    '#D65B5B'
                ],
                borderWidth: 0,
                hoverOffset: 0,
                spacing: 0
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

async function loadAllComprobacionesMonths() {
    try {
        const response = await fetch(`${API}/api/comprobaciones/dashboard/estados`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al cargar meses de comprobaciones');
        allCompData = await response.json();
        allCompData.sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));
        if(allCompData.length) {
            const last = allCompData[allCompData.length - 1];
            await updateCompChart(last.anio, last.mes);
        }
    } catch (error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de comprobaciones');
    }
}

function setupCompChartNav() {
    const prevBtn = document.querySelector('.graph-back.comp .chartst-container .prev.comp-button');
    const nextBtn = document.querySelector('.graph-back.comp .chartst-container .next.comp-button');
    if(!prevBtn || !nextBtn) return;

    // Remover cualquier evento anterior
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    function getCurrentIndex() {
        return allCompData.findIndex(item => item.anio === currentCompYear && item.mes === currentCompMonth);
    }

    function updateButtonsState(idx) {
        if(idx <= 0) newPrev.classList.add('disabled');
        else newPrev.classList.remove('disabled');

        if(idx >= allCompData.length - 1) newNext.classList.add('disabled');
        else newNext.classList.remove('disabled');
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = getCurrentIndex();

        if(idx > 0 && !newPrev.classList.contains('disabled')) {
            const prevData = allCompData[idx - 1];
            await updateCompChart(prevData.anio, prevData.mes);
            updateButtonsState(idx - 1);
        }
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = getCurrentIndex();

        if(idx < allCompData.length - 1 && !newNext.classList.contains('disabled')) {
            const nextData = allCompData[idx + 1];
            await updateCompChart(nextData.anio, nextData.mes);
            updateButtonsState(idx + 1);
        }
    });

    const initialIdx = getCurrentIndex();
    if(initialIdx !== -1) updateButtonsState(initialIdx);
}


// ======= Anticipos graph =======
async function fetchAntYears() {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/years-tes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener rango de años de anticipos');

        const data = await response.json();
        if(data && data.length > 0) {
            minAntYear = data[0].min_anio;
            maxAntYear = data[0].max_anio;
        } else {
            const currentYear = new Date().getFullYear();
            minAntYear = currentYear;
            maxAntYear = currentYear;
        }

        return { minAntYear, maxAntYear }
    } catch(error) {
        Toast('ERROR', 'No se pudo determinar el rango de años de anticipos');
        const currentYear = new Date().getFullYear();
        minAntYear = currentYear;
        maxAntYear = currentYear;
        return { minAntYear, maxAntYear }
    }
}

async function initAntChart() {
    await fetchAntYears();

    if(maxAntYear)
        currentAntYear = maxAntYear;
    else
        currentAntYear = new Date().getFullYear();

    await updateAntChart(currentAntYear);
    setupAntChartNav();
}

function setupAntChartNav() {
    const prevBtn = document.querySelector('.graph-back.requests .prev.request-button');
    const nextBtn = document.querySelector('.graph-back.requests .next.request-button');
    if(!prevBtn || !nextBtn) return;

    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    function updateButtonsState() {
        if(minAntYear === null || maxAntYear === null) return;

        if(currentAntYear <= minAntYear) newPrev.classList.add('disabled');
        else newPrev.classList.remove('disabled');

        if(currentAntYear >= maxAntYear) newNext.classList.add('disabled');
        else newNext.classList.remove('disabled');
    }

    newPrev.addEventListener('click', async(e) => {
        e.stopPropagation();
        if(currentAntYear > minAntYear && !newPrev.classList.contains('disabled')) {
            await updateAntChart(currentAntYear - 1);
            updateButtonsState();
        }
    });

    newNext.addEventListener('click', async(e) => {
        e.stopPropagation();
        if(currentAntYear < maxAntYear && !newNext.classList.contains('disabled')) {
            await updateAntChart(currentAntYear + 1);
            updateButtonsState();
        }
    });

    updateButtonsState();
}

// Backend
async function fetchAntData(year) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/solicitudes/dashboard/anticipos?year=${year}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos de anticipos');
        const data = await response.json();
        return data;
    } catch(error) {
        Toast('ERROR', 'No se pudo cargar los datos de la gráfica de anticipos');
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

// Calcula el máximo para el eje Y
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
async function renderAntChart(rawData) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    const isDesktop = window.innerWidth >= 1801;

    // Obtener monedas únicas y precargar banderas
    const currencies = [...new Set(rawData.map(d => d.moneda))];
    const flagMap = await preloadFlags(currencies);
    const flagPlugin = createFlagPlugin(flagMap, CURRENCY_COLORS);

    const datasets  = buildDatasets(rawData, flagMap, isDesktop);
    const { max, step } = calcYMax(datasets);

    if(antChart) antChart.destroy();

    antChart = new Chart(ctx, {
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

async function updateAntChart(year) {
    const yearSpan = document.querySelector('.graph-back.requests .request-year');
    if(yearSpan) yearSpan.textContent = year;
    currentAntYear = year;

    const rawData = await fetchAntData(year);
    await renderAntChart(rawData);
}


// ======= Comprobaciones graph =======
async function fetchCmpYears() {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/comprobaciones/dashboard/years-tes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener rango de años de comprobaciones');

        const data = await response.json();
        if(data && data.length > 0) {
            minExpenseYear = data[0].min_anio;
            maxExpenseYear = data[0].max_anio;
        } else {
            const currentYear = new Date().getFullYear();
            minExpenseYear = currentYear;
            maxExpenseYear = currentYear;
        }

        return { minExpenseYear, maxExpenseYear }
    } catch(error) {
        Toast('ERROR', 'No se pudo determinar el rango de años de comprobaciones');
        const currentYear = new Date().getFullYear();
        minExpenseYear = currentYear;
        maxExpenseYear = currentYear;
        return { minExpenseYear, maxExpenseYear }
    }
}

async function initCmpChart() {
    await fetchCmpYears();
    
    if(maxExpenseYear)
        currentExpenseYear = maxExpenseYear;
    else
        currentExpenseYear = new Date().getFullYear();
    
    await updateCmpChart(currentExpenseYear);
    setupCmpChartNav();
}

function setupCmpChartNav() {
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
            await updateCmpChart(currentExpenseYear - 1);
            updateButtonsState();
        }
    });
    
    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(currentExpenseYear < maxExpenseYear && !newNext.classList.contains('disabled')) {
            await updateCmpChart(currentExpenseYear + 1);
            updateButtonsState();
        }
    });
    
    updateButtonsState();
}

// Backend
async function fetchCmpData(year) {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/comprobaciones/dashboard/comprobado-tes?year=${year}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos comprobados');

        const data = await response.json();
        const monthlyData = Array(12).fill(0);
        data.forEach(item => {
            if(item.mes >= 1 && item.mes <= 12)
                monthlyData[item.mes - 1] = item.total_mxn;
        });
        return monthlyData;
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de la gráfica de comprobaciones');
        return Array(12).fill(0);
    }
}

// Graph 
async function updateCmpChart(year) {
    const monthlyData = await fetchCmpData(year);

    // Actualizar año
    const yearSpan = document.querySelector('.graph-back.expenses .expense-year');
    if(yearSpan) yearSpan.textContent = year;
    currentExpenseYear = year;

    if(expenseChart) expenseChart.destroy();

    // Calcular máximo de los datos
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

    // Gráfica
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const isDesktop = window.innerWidth >= 1801;

    expenseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Comprobado',
                data: monthlyData,
                borderColor: '#2A5156',
                borderWidth: isDesktop ? 2 : 1.5,
                tension: 0,
                pointBackgroundColor: '#2A5156',
                pointBorderWidth: isDesktop ? 2 : 1,
                pointRadius: isDesktop ? 4 : 3,
                pointHoverRadius: isDesktop ? 7 : 5,
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
                        title: (context) => "COMPROBADO",
                        label: (context) => "$" + context.raw.toLocaleString('es-MX')
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
                        color: '#000000',
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-MX');
                        }
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


/* =========================== TARJETA LIQUIDACIONES =========================== */
async function fetchLiqData(year) {
    if(liqCardCache[year]) return liqCardCache[year];

    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/liquidaciones/dashboard/liquidaciones?year=${year}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener datos de liquidaciones');
        const data = await response.json();

        liqCardCache[year] = data.map(r => ({
            mes: Number(r.mes),
            devoluciones: r.devoluciones ? Number(r.devoluciones) : 0,
            reembolsos: r.reembolsos ? Number(r.reembolsos) : 0,
        }));

        return liqCardCache[year];
    } catch(error) {
        Toast('ERROR', 'No se pudieron cargar los datos de liquidaciones');
        return [];
    }
}

async function fetchLiqYears() {
    try {
        if(!token) {
            Toast('SESIÓN EXPIRADA', 'Por favor, inicia sesión nuevamente');
            return;
        }

        const response = await fetch(`${API}/api/liquidaciones/dashboard/years-liq`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if(!response.ok) throw new Error('Error al obtener años de liquidaciones');
        const data = await response.json();

        if(data.length) {
            minLiqYear = data[0].min_anio;
            maxLiqYear = data[0].max_anio;
        } else {
            const today = new Date().getFullYear();
            minLiqYear = today;
            maxLiqYear = today;
        }
    } catch(error) {
        Toast('ERROR', 'No se pudo determinar el rango de años de liquidaciones');
        const today = new Date().getFullYear();
        minLiqYear = today;
        maxLiqYear = today;
    }
}

function getAvailableMonthsLiq(rawData) {
    return [...new Set(rawData.map(r => r.mes))].sort((a, b) => a - b);
}

// Card
function updateLiqCard(rawData, month) {
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO',
                        'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

    document.querySelector('.total-year').textContent  = currentYearLiq;
    document.querySelector('.total-month').textContent = monthNames[month - 1];

    const monthData = rawData.find(item => item.mes === month);
    const devoluciones = monthData ? monthData.devoluciones : 0;
    const reembolsos = monthData ? monthData.reembolsos   : 0;

    const totalAmounts = document.querySelectorAll('.total-money.treasury .total-amount');
    if(totalAmounts.length >= 2) {
        totalAmounts[0].textContent = formatCurrency(devoluciones);
        totalAmounts[1].textContent = formatCurrency(reembolsos);
    }
}

async function initLiquidMXN() {
    await fetchLiqYears();

    currentYearLiq = maxLiqYear || new Date().getFullYear();

    const rawData = await fetchLiqData(currentYearLiq);
    const months = getAvailableMonthsLiq(rawData);
    currentMonthLiq = months.length ? months[months.length - 1] : new Date().getMonth() + 1;

    updateLiqCard(rawData, currentMonthLiq);
    setupLiqCardNav();
}

// Navegación
function setupLiqCardNav() {
    const prevBtn = document.querySelector('.prev.total-button');
    const nextBtn = document.querySelector('.next.total-button');
    if(!prevBtn || !nextBtn) return;

    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    async function updateButtonsState() {
        // Mes anterior
        const prevYearData = await fetchLiqData(currentMonthLiq === 1 ? currentYearLiq - 1 : currentYearLiq);
        const prevMonths = getAvailableMonthsLiq(prevYearData);
        const atStart = currentYearLiq <= minLiqYear && currentMonthLiq <= (prevMonths[0] || 1);
        newPrev.classList.toggle('disabled', atStart);

        // Mes siguiente
        const nextYearData = await fetchLiqData(currentMonthLiq === 12 ? currentYearLiq + 1 : currentYearLiq);
        const nextMonths = getAvailableMonthsLiq(nextYearData);
        const atEnd = currentYearLiq >= maxLiqYear && currentMonthLiq >= (nextMonths[nextMonths.length - 1] || 12);
        newNext.classList.toggle('disabled', atEnd);
    }

    newPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(newPrev.classList.contains('disabled')) return;

        let year = currentYearLiq;
        let month = currentMonthLiq - 1;

        if(month < 1) {
            year--;
            const prevData = await fetchLiqData(year);
            const prevMonths = getAvailableMonthsLiq(prevData);
            month = prevMonths.length ? prevMonths[prevMonths.length - 1] : 12;
        }

        const rawData = await fetchLiqData(year);
        currentYearLiq = year;
        currentMonthLiq = month;
        updateLiqCard(rawData, month);
        await updateButtonsState();
    });

    newNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(newNext.classList.contains('disabled')) return;

        let year = currentYearLiq;
        let month = currentMonthLiq + 1;

        if(month > 12) {
            year++;
            const nextData = await fetchLiqData(year);
            const nextMonths = getAvailableMonthsLiq(nextData);
            month = nextMonths.length ? nextMonths[0] : 1;
        }

        const rawData = await fetchLiqData(year);
        currentYearLiq = year;
        currentMonthLiq = month;
        updateLiqCard(rawData, month);
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
document.addEventListener("DOMContentLoaded", async function() {
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    cardLinks();
    await updateCardCounts();
    await loadAllComprobacionesMonths();
    setupCompChartNav();
    trendsChart();
    advanceChart();
});

/* ================================ VARIABLES ================================ */
// Graphs
let trendChart = null;
let advancesChart = null;

// Estados mensuales (comprobaciones)
let currentCompYear = null;
let currentCompMonth = null;
let currentCompChart = null;
let allCompData = [];

// Backend
const token = Session.getToken();
const logoUser = Session.getUser();


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
        const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/dashboard/cantidad-tes`, {
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


// ======= Expenses graph =======
// Backend
async function fetchCompChart(year, month) {
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/comprobaciones/dashboard/estados`, {
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

// Leyenda
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

// Gráfica
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
        const response = await fetch(`http://127.0.0.1:3000/api/comprobaciones/dashboard/estados`, {
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


// Gasto mensual graph
function trendsChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');

    if(trendChart)
        trendChart.destroy();

    const isDesktop = window.innerWidth >= 1801;

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Gasto Real',
                data: [4500, 6800, 18000, 10500, 8500, 10000, 1500, 45700, 10900, 1750, 9500, 1800],
                borderColor: '#2A5156',
                borderWidth: isDesktop ? 2 : 1.5,
                tension: 0,
                pointBackgroundColor: '#2A5156',
                pointBorderWidth: isDesktop ? 2 : 1,
                pointRadius: isDesktop ? 4 : 3,
                pointHoverRadius: isDesktop ? 7 : 5,
                fill: false
            }, {
                label: 'Aprobado',
                data: [1500, 5500, 18000, 9500, 8500, 8900, 1300, 50000, 10900, 1750, 11500, 1700], 
                borderColor: '#35530e',
                borderWidth: isDesktop ? 1.5 : 1,
                borderDash: [6, 4],
                tension: 0,
                pointBackgroundColor: '#35530e',
                pointBorderWidth: 1.5,
                pointRadius: isDesktop ? 3.5 : 2.5,
                pointHoverRadius: isDesktop ? 6 : 4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 6,
                        boxHeight: 6,
                        padding: 15,
                        font: { size: isDesktop ? 15 : 12 },
                        color: '#000000'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(217, 217, 217, 0.8)',
                    titleColor: '#505455',
                    bodyColor: '#000000',
                    titleFont: { size: isDesktop ? 15 : 11 },
                    bodyFont: { size: isDesktop ? 21 : 15, weight: 'normal', color: '#000000' },
                    displayColors: false,
                    padding: isDesktop ? 7 : 6,
                    callbacks: {
                        title: (context) => {
                            return context[0].label;
                        },
                        label: (context) => {
                            return context.dataset.label + ': $' + context.raw.toLocaleString('es-MX');
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 60000,
                    grid: {
                        color: '#919A9B',
                        lineWidth: 1.5,
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: 10000,
                        font: { size: isDesktop ? 18 : 11 },
                        color: '#000000',
                        callback: function(value) {
                            return value;
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
                        color: '#000000',
                    }
                }
            },
            elements: {
                line: { borderJoinStyle: 'round' }
            }
        }
    });
}

// Anticipos graph
function advanceChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    if(advancesChart) 
        advancesChart.destroy();

    const isDesktop = window.innerWidth >= 1801;

    advancesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Anticipo',
                data: [15000, 11000, 10000, 20000, 25000, 41000, 32000, 48000, 30000, 27000, 25000, 50000],
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
                        title: (context) => "ANTICIPO",
                        label: (context) => "$" + context.raw.toLocaleString('es-MX')
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 60000,
                    grid: {
                        color: '#919A9B',
                        lineWidth: 1.5,
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: 10000,
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
            elements: {
                line: { borderJoinStyle: 'round' }
            }
        }
    });
}
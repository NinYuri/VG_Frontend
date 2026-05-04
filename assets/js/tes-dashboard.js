document.addEventListener("DOMContentLoaded", function() {
    phoneMenu();
    initMobileScroll();
    optionsBar();
    expensesChart();
    trendsChart();
    advanceChart();
});

/* ================================ VARIABLES ================================ */
let trendChart = null;
let advancesChart = null;


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

        if(currentPath.includes('tes-dashboard.html'))
            dashboard.classList.add('active');
        else if(currentPath.includes('tes-solicitudes.html'))
            request.classList.add('active');
        else if(currentPath.includes('tes-comprobaciones.html'))
            expenses.classList.add('active');
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

    logout.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'index.html';
    });
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

// Comprobaciones graph
function expensesChart() {
    const ctx = document.getElementById('status-chart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
            datasets: [{
                data: [18, 23, 5],
                backgroundColor: [
                    '#C9C867',     
                    '#97BD13',
                    '#D65B5B'
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
document.addEventListener('DOMContentLoaded', function() {
    optionsBar();
    statusChart();
    requestChart();
    expenseChart();
});


/* ================================ VARIABLES ================================ */
let trendChart = null;
let expensesChart = null;


/* ============================== OPTIONS BAR ============================== */
function optionsBar() {
    const dashboard = document.querySelector('.option.dashboard');
    const request = document.querySelector('.option.request');
    const logout = document.querySelector('.option.log-out');

    dashboard.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'jefe-dashboard.html';
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

// Status graph
function statusChart() {
    const ctx = document.getElementById('status-chart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
            datasets: [{
                data: [18, 23, 5],
                backgroundColor: [
                    '#C9C867',      // amarillo para pendientes
                    '#97BD13',      // verde para aprobadas
                    '#D65B5B'       // rojo para rechazadas
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

// Request graph
function requestChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    if(trendChart)
        trendChart.destroy();

    const isMobile = window.innerWidth <= 768;
    const isDesktop = window.innerWidth >= 1920;

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Solicitudes',
                data: [42, 58, 34, 38, 122, 12, 90, 120, 156, 65, 34, 78],
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
                    max: 200,
                    grid: {
                        color: '#919A9B',
                        lineWidth: 1.5,
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: 50,
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
            elements: {
                line: { borderJoinStyle: 'round' }
            }
        }
    });
}

// Expenses graph 
function expenseChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    if(expensesChart) 
        expensesChart.destroy();

    const isDesktop = window.innerWidth >= 1920;

    expensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Gasto',
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
                        title: (context) => "GASTO",
                        label: (context) => "$" + context.raw.toLocaleString('es-MX')
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 50000,
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
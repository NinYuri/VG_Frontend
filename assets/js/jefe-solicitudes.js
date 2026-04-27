document.addEventListener('DOMContentLoaded', function() {
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tabSelected();
    cardLinks();
    searchColab();
    initCalendar();
    setupCalendar();
    activeCards();
    updateCurrency();
    buttonRejected();
    buttonApproved();
    buttonInfo();
});


/* ============================== VARIABLES ============================== */
let motivoRechazo = null;


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
        window.location.href = 'jefe-solicitudes.html';
    });

    logout.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'index.html';
    });
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
        });
    });
}

// Links de las cards
function cardLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if(tabParam) {
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

    let swapped = false;

    function swapIcons() {
        const parent = search;

        // Eliminar temporalmente los iconos
        const glassRemoved = parent.removeChild(glass);
        const userRemoved = parent.removeChild(user);

        if(!swapped) {
            parent.insertBefore(userRemoved, input);
            parent.insertBefore(glassRemoved, calendar.nextSibling);
            input.placeholder = "Colaborador. . .";
        } else {
            parent.insertBefore(glassRemoved, input);
            parent.insertBefore(userRemoved, calendar.nextSibling);
            input.placeholder = "Folio. . .";
        }

        swapped = !swapped;
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

    glass.addEventListener('click', (e) => {
        e.stopPropagation();
        const shouldSwap = swapped;
        fadeAndSwap(shouldSwap);
    });

    user.addEventListener('click', (e) => {
        e.stopPropagation();
        const shouldSwap = !swapped;
        fadeAndSwap(shouldSwap);
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
                console.log(`Rango reiniciado. Inicio: ${day}/${month+1}/${year}`);
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
                
                console.log(`Rango seleccionado: ${startDate.day}/${startDate.month+1}/${startDate.year} - ${endDate.day}/${endDate.month+1}/${endDate.year}`);
            }

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

    if(!calendarIcon || !datepicker) return;

    function clearRangeSelect() {
        const dates = document.querySelectorAll('.date-cell.in-range');
        const startDate = document.querySelector('.date-cell.start');
        const endDate = document.querySelector('.date-cell.end');

        dates.forEach(date => {
            if (date && date.classList) 
                date.classList.remove('in-range');
        });
        if(startDate && startDate.classList) 
            startDate.classList.remove('start');
        if(endDate && endDate.classList) 
            endDate.classList.remove('end');

        window.dispatchEvent(new CustomEvent('calendar-closed'));
    }

    calendarIcon.addEventListener('click', (e) => {
        e.stopPropagation();

        const isVisible = datepicker.style.display === 'block';
        if(isVisible) {
            clearRangeSelect();
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
            clearRangeSelect();
            calendarIcon.classList.remove('icon-active');
            datepicker.style.display = 'none';
        }
    });
}


/* ============================== ACTIVE CARD ============================== */
function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();

            if(e.target.closest('.fa-circle-check, .fa-circle-xmark, .buttons-mobile')) return;
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active')
        });
    });
}


/* ============================== FLAG CURRENCY ============================== */
function updateCurrency() {
    const currencies = [
        { code: 'MXN', flag: './assets/images/MXN.webp', symbol: '$' },
        { code: 'USD', flag: './assets/images/USD.webp', symbol: '$' },
        { code: 'EUR', flag: './assets/images/EUR.webp', symbol: '€' },
        { code: 'JPY', flag: './assets/images/JPY.webp',  symbol: '¥' }
    ];

    // TABLE
    const tableRows = document.querySelectorAll('.table-body tr');
    tableRows.forEach(row => {
        const montoCell = row.querySelector('.monto-cell');
        const img = montoCell.querySelector('img');
        const symbolSpan = montoCell.querySelector('.symbol-money');

        if(!montoCell || !img || !symbolSpan) return;
        
        let currencyCode = img.getAttribute('alt')?.toUpperCase();
        const currency = currencies.find(c => c.code === currencyCode);
        if(!currency) return;

        symbolSpan.textContent = currency.symbol;
    });


    // CARDS
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const amountMobile = card.querySelector('.amount-mobile');
        const img = card.querySelector('img');
        const symbolSpan = amountMobile.querySelector('.symbol-money');

        if(!amountMobile || !img || !symbolSpan) return;

        let currencyCode = img.getAttribute('alt')?.toUpperCase();
        const currency = currencies.find(c => c.code === currencyCode);
        if(!currency) return;

        symbolSpan.textContent = currency.symbol;
    }); 


    // INFORMATION
    const info = document.querySelector('.info-wrapper');
    if(!info) return;

    const img = info.querySelector('.currency-flag');
    const symbolSpan = info.querySelector('.symbol-money');

    if(!img || !symbolSpan) return;

    let currencyCode = img.getAttribute('alt')?.toUpperCase();
    const currency = currencies.find(c => c.code === currencyCode);
    if(!currency) return;

    symbolSpan.textContent = currency.symbol;
}


/* ============================== ACTION BUTTONS ============================== */
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

// Reject
function buttonRejected() {
    const buttons = document.querySelectorAll('.fa-circle-xmark');
    if(!buttons) return;

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 

            // Determinar si está en tabla o tarjeta
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
            
            ToastRejected(folio);
        });
    });
}

// Approve
function buttonApproved() {
    const buttons = document.querySelectorAll('.fa-circle-check');
    if(!buttons) return;

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(e);

            // Determinar si está en tabla o tarjeta
            const row = button.closest('tr');
            const card = button.closest('.card');
            let folio = 'desconocido';
            let elemento = null;

            if(row) {
                const folioCell = row.querySelector('.folio');
                if(folioCell) folio = folioCell.textContent.trim();
                elemento = row
            } else if(card) {
                const folioElem = card.querySelector('.folio-mobile');
                if(folioElem) folio = folioElem.textContent.trim();
                elemento = card;
            } else return;

            Toast('SOLICITUD APROBADA', `La solicitud con folio ${folio} fue aprobada y notificada al colaborador correctamente`);
        });
    });
}

// Information
function buttonInfo() {
    const buttons = document.querySelectorAll('.fa-circle-info');
    const container = document.querySelector('.container');
    if(!buttons) return;

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            // Llamar al backend
            
            const infoCard = document.querySelector('.info-wrapper');
            const buttonClose = document.querySelector('.arrow-back');

            if(!infoCard || !buttonClose) return;

            infoCard.style.display = 'flex';
            container.classList.add('modal-open');
            calculateDays();

            buttonClose.addEventListener('click', (e) => {
                e.stopPropagation();
                infoCard.style.display = 'none';
                container.classList.remove('modal-open');
            });
        });
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
function ToastRejected(folio, imageLeft = './assets/images/Icon_agave1.webp', imageRight = './assets/images/Icon_agave2.webp') {
    Swal.fire({
        title: 'SOLICITUD RECHAZADA',
        html: `
            <img src="${imageLeft}" alt="Agave" class="agave-half left">
            <img src="${imageRight}" alt="Agave" class="agave-half right">
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
            motivoRechazo = result.value;
            Toast('SOLICITUD RECHAZADA', `La solicitud con folio ${folio} fue rechazada y notificada al colaborador correctamente`);
        }
    });
}
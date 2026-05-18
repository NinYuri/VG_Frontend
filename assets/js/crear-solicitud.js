document.addEventListener("DOMContentLoaded", function() {
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    initCalendar();
    currencyOptions();
    paymentOptions();
    sendButton();
    saveButton();
    cancelButton();

    // Edit mode
    const folio = getFolioFromUrl();
    if(folio)
        loadSolicitudData(folio);
});


/* ============================== VARIABLES ============================== */
let globalStartDate = null;
let globalEndDate = null;

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
    const request = document.querySelector('.option.requests');
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
        else if(currentPath.includes('colab-solicitudes.html') || currentPath.includes('crear-solicitud.html') || currentPath.includes('editar-solicitud.html'))
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

    logout.addEventListener('click', async(e) => {
        e.stopPropagation();

        await fetch('http://localhost:3000/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        window.location.href = 'index.html';
    });
}


/* =============================== FORM BUTTONS =============================== */
// Cancel
function cancelButton() {
    const cancelButton = document.querySelector('.button.cancel');

    cancelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'colab-solicitudes.html';
    });
}

// CREATE REQUEST
async function sendButton() {
    const sendButton = document.querySelector('.button.send');
    if(!sendButton) return;

    sendButton.addEventListener('click', async (e) => {
        e.stopPropagation();

        if(!validateForm(false)) return;

        const inicio_viaje = formatDate(globalStartDate);
        const fin_viaje = formatDate(globalEndDate);
        const destinoRaw = document.getElementById('ans-destination')?.value.trim();
        const destino = destinoRaw 
                        ? destinoRaw.charAt(0).toUpperCase() + destinoRaw.slice(1)
                        : '';
        const motivoRaw = document.querySelector('.answer.motive textarea')?.value.trim();
        const motivo = motivoRaw 
                        ? motivoRaw.charAt(0).toUpperCase() + motivoRaw.slice(1)
                        : '';
        const monto_solicitado = parseFloat(document.querySelector('.answer.money input')?.value.trim());
        const monto_moneda = document.querySelector('.currency-selector .flags p')?.textContent.trim();
        const forma_pago = document.querySelector('.payment-selector p')?.textContent.trim();
        const fecha_recepcion = new Date().toLocaleDateString('sv-SE');

        const data = {
            inicio_viaje: inicio_viaje,
            fin_viaje: fin_viaje,
            destino: destino,
            motivo: motivo,
            monto_solicitado: monto_solicitado,
            monto_moneda: monto_moneda,
            forma_pago: forma_pago,
            fecha_recepcion: fecha_recepcion
        };

        showLoader();        
        try {
            const response = await fetch('http://127.0.0.1:3000/api/solicitudes', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if(!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || err.mensaje || 'Error al enviar solicitud');
            }

            const result = await response.json();
            hideLoader();
            Toast('SOLICITUD ENVIADA', result.message || '¡Solicitud enviada correctamente!');
            
            setTimeout(() => {
                window.location.href = 'colab-solicitudes.html';
            }, 2500);
        }catch(error) {
            hideLoader();
            Toast('ERROR AL ENVIAR SOLICITUD', error.message);
        };
    });
}

// EDIT REQUEST
function getFolioFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('folio');
}

async function loadSolicitudData(folio) {
    showLoader();
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/solicitudes/detalle?folio=${encodeURIComponent(folio)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if(!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Error al cargar la solicitud');
        }

        const data = await response.json();
        populateFormWithData(data);
    } catch(error) {
        Toast('ERROR', error.message);
        setTimeout(() => window.location.href = 'colab-solicitudes.html', 2000);
    } finally {
        hideLoader();
    }
}

function populateFormWithData(data) {
    // Destino
    const destinationInput = document.getElementById('ans-destination');
    if(destinationInput) destinationInput.value = data.destino || '';

    // Motivo
    const motiveTextarea = document.querySelector('.answer.motive textarea');
    if(motiveTextarea) motiveTextarea.value = data.motivo || '';

    // Monto
    const amountInput = document.querySelector('.answer.money input');
    if(amountInput) amountInput.value = data.monto_solicitado || '';

    // Moneda
    const moneda = data.monto_moneda || 'MXN';
    const currencies = [
        { code: 'MXN', name: 'MXN', flag: './assets/images/MXN.webp', symbol: '$' },
        { code: 'USD', name: 'USD', flag: './assets/images/USD.webp', symbol: '$' },
        { code: 'EUR', name: 'EUR', flag: './assets/images/EUR.webp', symbol: '€' },
        { code: 'JPY', name: 'JPY', flag: './assets/images/JPY.webp', symbol: '¥' }
    ];
    const selectedCurrency = currencies.find(c => c.code === moneda);
    if(selectedCurrency && typeof updateSelectedCurrency === 'function')
        updateSelectedCurrency(selectedCurrency);

    // Forma de pago
    const formaPago = data.forma_pago || 'Transferencia';
    const payments = [
        { name: 'Transferencia' },
        { name: 'Efectivo' }
    ];
    const selectedPayment = payments.find(p => p.name === formaPago);
    if (selectedPayment && typeof updateSelectedPayment === 'function')
        updateSelectedPayment(selectedPayment);

    // Fechas
    if(data.inicio_viaje) {
        const startDateObj = parseDateString(data.inicio_viaje);
        if(startDateObj) {
            globalStartDate = data.inicio_viaje;
            if(typeof setCalendarRange === 'function')
                setCalendarRange(globalStartDate, globalEndDate);
        }
    }
    if(data.fin_viaje) {
        const endDateObj = parseDateString(data.fin_viaje);
        if(endDateObj) {
            globalEndDate = data.fin_viaje;
            if(typeof setCalendarRange === 'function')
                setCalendarRange(globalStartDate, globalEndDate);
        }
    }

    if(typeof window.calendarRender === 'function')
        window.calendarRender();
}

// String YYYY-MM-DD to object { year, month, day }
function parseDateString(dateStr) {
    if(!dateStr) return null;
    
    const parts = dateStr.split('-');
    if(parts.length !== 3) return null;

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month, day };
}

async function saveButton() {
    const saveButton = document.querySelector('.button.save');
    if(!saveButton) return;

    saveButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        const folio = getFolioFromUrl();
        if(!folio) {
            Toast('ERROR', 'No se ha identificado el folio de la solicitud a editar');
            return;
        }

        if(!validateForm(true)) return;

        const inicio_viaje = formatDate(globalStartDate);
        const fin_viaje = formatDate(globalEndDate);
        const destinoRaw = document.getElementById('ans-destination')?.value.trim();
        const destino = destinoRaw 
                        ? destinoRaw.charAt(0).toUpperCase() + destinoRaw.slice(1)
                        : '';
        const motivoRaw = document.querySelector('.answer.motive textarea')?.value.trim();
        const motivo = motivoRaw 
                        ? motivoRaw.charAt(0).toUpperCase() + motivoRaw.slice(1)
                        : '';
        const monto_solicitado = parseFloat(document.querySelector('.answer.money input')?.value.trim());
        const monto_moneda = document.querySelector('.currency-selector .flags p')?.textContent.trim();
        const forma_pago = document.querySelector('.payment-selector p')?.textContent.trim();

        const data = {
            folio: folio,
            inicio_viaje: inicio_viaje,
            fin_viaje: fin_viaje,
            destino: destino,
            motivo: motivo,
            monto_solicitado: monto_solicitado,
            monto_moneda: monto_moneda,
            forma_pago: forma_pago
        }; 
        
        showLoader();
        try {
            const response = await fetch('http://127.0.0.1:3000/api/solicitudes/editar', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if(!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || err.mensaje || 'Error al editar la solicitud');
            }

            const result = await response.json();
            
            hideLoader();
            Toast('SOLICITUD EDITADA', 'Tu solicitud ha sido editada correctamente y se encuentra en proceso de aprobación');

            setTimeout(() => {
                window.location.href = 'colab-solicitudes.html';
            }, 2500);
        } catch(error) {
            hideLoader();
            Toast('ERROR AL EDITAR SOLICITUD', error.message);
        }
    });
}


/* =============================== VALIDATIONS =============================== */
function validateForm(isEdit = false) {
    const destination = document.getElementById('ans-destination')?.value.trim();
    const motive = document.querySelector('.answer.motive textarea')?.value.trim();
    const amount = document.querySelector('.answer.money input')?.value.trim();

    const errorTitle = isEdit 
        ? 'ERROR AL GUARDAR CAMBIOS' 
        : 'ERROR AL ENVIAR SOLICITUD';
    
    if(!destination) {
        Toast(errorTitle, 'Por favor, ingresa la ciudad de destino de tu viaje');
        return false;
    }

    if(!globalStartDate || !globalEndDate) {
        Toast(errorTitle, 'Por favor, selecciona ambas fechas de tu viaje');
        return false;
    } else if(globalStartDate === globalEndDate) {
        Toast(errorTitle, 'Por favor, selecciona un rango de fechas válido');
        return false;
    }

    if(!motive) {
        Toast(errorTitle, 'Por favor, ingresa el motivo de tu viaje');
        return false;
    }

    if(!amount) {
        Toast(errorTitle, 'Por favor, ingresa el monto que necesitas para tu viaje');
        return false;
    } else if(!onlyNumbers(amount)) {
        Toast(errorTitle, 'Por favor, ingresa un monto válido');
        return false;
    }

    return true;
}

function onlyNumbers(number) { 
    return /^\d+$/.test(number);
}

function formatDate(dateInput) {
    if(!dateInput) return null;

    // String en formato YYYY-MM-DD
    if(typeof dateInput === 'string') {
        const parts = dateInput.split('-').map(p => p.trim());
        if(parts.length === 3) {
            const year = parts[0];
            const month = String(parts[1]).padStart(2, '0');
            const day = String(parts[2]).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }

    // Si es objeto
    if(dateInput.year && dateInput.month !== undefined && dateInput.day) {
        const year = dateInput.year;
        const month = String(dateInput.month + 1).padStart(2, '0');
        const day = String(dateInput.day).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
}


/* ============================== CURRENCY OPTIONS ============================== */
function currencyOptions() {
    const currencies = [
        { code: 'MXN', name: 'MXN', flag: './assets/images/MXN.webp', symbol: '$' },
        { code: 'USD', name: 'USD', flag: './assets/images/USD.webp', symbol: '$' },
        { code: 'EUR', name: 'EUR', flag: './assets/images/EUR.webp', symbol: '€' },
        { code: 'JPY', name: 'JPY', flag: './assets/images/JPY.webp', symbol: '¥' }
    ];

    const selector = document.querySelector('.currency-selector');
    const flagsDiv = selector.querySelector('.flags');
    const dropdown = selector.querySelector('.currency-dropdown');
    const symbol = document.querySelector('.answer.money .symbol');
    
    // Construir lista
    function buildDropdown(currentCurrency) {
        dropdown.innerHTML = '';
        const otherCurrencies = currencies.filter(c => c.code !== currentCurrency);
        otherCurrencies.forEach(currency => {
            const option = document.createElement('div');
            option.className = 'currency-option';
            option.setAttribute('data-currency', currency.code);
            option.innerHTML = `
                <img src="${currency.flag}" alt="${currency.code}">
                <span>${currency.name}</span>
            `;
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                updateSelectedCurrency(currency);
                dropdown.classList.remove('show');
                closeOtherDropdowns(selector);
            });
            dropdown.appendChild(option);
        });
    }

    function updateSelectedCurrency(currency) {
        flagsDiv.innerHTML = `
            <img src="${currency.flag}" alt="${currency.code}">
            <p>${currency.name}</p>
            <i class="fa-solid fa-angle-down"></i>
        `;
        symbol.innerHTML = `${currency.symbol}`;

        buildDropdown(currency.code);
    }

    flagsDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');

        closeOtherDropdowns(selector);
        if(!isOpen)
            dropdown.classList.add('show');
        else
            dropdown.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if(!selector.contains(e.target))
            dropdown.classList.remove('show');
    });

    const defaultCurrency = currencies.find(c => c.code === 'MXN');
    updateSelectedCurrency(defaultCurrency);
    window.updateSelectedCurrency = updateSelectedCurrency;
}


/* ============================== PAYMENT OPTIONS ============================== */
function paymentOptions() {
    const payments = [
        { name: 'Transferencia' },
        { name: 'Efectivo' }
    ];

    const selector = document.querySelector('.payment-selector');
    const pTag = selector.querySelector('p');
    const dropdown = selector.querySelector('.payment-dropdown');

    function buildDropdown(currentName) {
        dropdown.innerHTML = '';
        const others = payments.filter(p => p.name !== currentName);
        others.forEach(payment => {
            const option = document.createElement('div');
            option.className = 'payment-option';
            option.textContent = payment.name;
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                updateSelectedPayment(payment);
                dropdown.classList.remove('show');
                closeOtherDropdowns(selector);
            });
            dropdown.appendChild(option);
        });
    }

    function updateSelectedPayment(payment) {
        pTag.textContent = payment.name;
        buildDropdown(payment.name);
    }

    selector.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');

        closeOtherDropdowns(selector);
        if(!isOpen)
            dropdown.classList.add('show');
        else
            dropdown.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if(!selector.contains(e.target))
            dropdown.classList.remove('show');
    });

    const defaultPayment = payments.find(n => n.name === 'Transferencia');
    updateSelectedPayment(defaultPayment);
    window.updateSelectedPayment = updateSelectedPayment;
}


/* =========================== DROPDOWN FUNCTIONS =========================== */
function closeOtherDropdowns(currentSelector) {
    const allSelectors = ['.currency-selector', '.payment-selector'];
    allSelectors.forEach(sel => {
        const other = document.querySelector(sel);
        if (other && other !== currentSelector) {
            const dropdown = other.querySelector('.currency-dropdown, .payment-dropdown');
            if (dropdown && dropdown.classList.contains('show'))
                dropdown.classList.remove('show');
        }
    });
}


/* =============================== DATE PICKER =============================== */
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

    window.setCalendarRange = (startDateStr, endDateStr) => {
        if(startDateStr) {
            const start = parseDateString(startDateStr);
            if(start) {
                startDate = start;
                globalStartDate = startDateStr;
                currentDate = new Date(start.year, start.month, 1);
            }
        }
        if(endDateStr) {
            const end = parseDateString(endDateStr);
            if(end) {
                endDate = end;
                globalEndDate = endDateStr;
            }
        }
        renderCalendar();
    };

    window.calendarRender = renderCalendar;
    renderCalendar();
}


/* =================================== TOAST =================================== */
// Toast -> Simple
const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    width: '600px',
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
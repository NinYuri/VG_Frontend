document.addEventListener("DOMContentLoaded", function() {
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tabSelected();
    searchColab();
    initCalendar();
    setupCalendar();
    activeCards();
    updateCurrency();
    buttonTransfer();
    initReceiptUpload();
});


/* ============================== VARIABLES ============================== */
// Transfer receipt
let selectedFile = null;
let isUploading = false;
let uploadComplete = false;


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


/* ============================= ACTIVE CARD ============================= */
function activeCards() {
    const cards = document.querySelectorAll('.cards-mobile .card');
    if(!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();

            if(e.target.closest('.fa-circle-dollar-to-slot, .buttons-mobile')) return;
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
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
}


/* ============================== TABLE BUTTONS ============================== */
// Transfer Receipt
function buttonTransfer() {
    const buttons = document.querySelectorAll('.fa-circle-dollar-to-slot');
    const container = document.querySelector('.container');
    if(!buttons) return;

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
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
                const buttonClose = document.querySelector('.top-decor i');
                if(!receipt || !buttonClose) return;

                receipt.style.display = 'flex';
                container.classList.add('modal-open');

                buttonClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    receipt.style.display = 'none';
                    container.classList.remove('modal-open');
                });
            } else 
                ToastButtons(folio);
        });
    });
}

function initReceiptUpload() {
    const receiptContainer = document.querySelector('.receipt-container');
    const uploadButton = document.querySelector('.button-receipt');
    const fileInput = document.createElement('input');
    const container = document.querySelector('.container');
    const receiptModal = document.querySelector('.transfer-wrapper');
    const closeButton = document.querySelector('.top-decor i');

    if(!receiptContainer || !uploadButton || !container || !receiptModal || !closeButton) return;

    fileInput.type = 'file';
    fileInput.accept = '.jpg, .jpeg, .png';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

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

        uploadComplete = true;
        isUploading = false;

        const removeText = receiptContainer.querySelector('p');
        if(removeText) removeText.remove();
    }

    function handleFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if(!validTypes.includes(file.type)) {
            Toast('FORMATO DE ARCHIVO INVÁLIDO', 'Solo se permiten archivos en formato JPG o PNG');
            resetContainer();
            return;
        }

        selectedFile = file;
        receiptContainer.style.backgroundImage = '';
        receiptContainer.style.border = '2px dashed var(--line-gray)';
        receiptContainer.classList.remove('has-image');
        showLoaderReceipt();

        isUploading = true;
        uploadComplete = false;

        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
                showUploadedImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }, 2000);
    }

    function openFileSelector() {
        if(!isUploading)
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
        if(file)
            handleFile(file);
    });

    uploadButton.addEventListener('click', (e) => {
        e.stopPropagation();

        if(uploadComplete) {
            Toast('COMPROBANTE CARGADO', '¡Listo! Hemos notificado al colaborador para que confirme la recepción del anticipo');

            setTimeout(() => {
                receiptModal.style.display = 'none';
                container.classList.remove('modal-open');
                resetContainer();
            }, 2000);
        } else if(selectedFile === null && !isUploading)
                Toast('COMPROBANTE REQUERIDO', 'Debes adjuntar el comprobante de la transferencia para continuar');
            else if(selectedFile !== null && !isUploading)
                handleFile(selectedFile);
            else
                Toast('ACHIVO EN PROCESO', 'Ya se está subiendo un archivo. Por favor, espera');
    });

    fileInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            handleFile(file);
        }

        fileInput.value = '';
    });

    // Cierre del modal
    closeButton.addEventListener('click', () => {
        receiptModal.style.display = 'none';
        container.classList.remove('modal-open');
        resetContainer();
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
    width: '540px',
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
function ToastButtons(folio, imageLeft = './assets/images/Icon_agave1.webp', imageRight = './assets/images/Icon_agave2.webp') {
    Swal.fire({
        title: 'CONFIRMAR ENTREGA DE ANTICIPO',
        html: `
            <img src="${imageLeft}" alt="Agave" class="agave-half left">
            <img src="${imageRight}" alt="Agave" class="agave-half right">
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
    }).then((result) => {
        if(result.isConfirmed) {
            Toast('ENTREGA DE ANTICIPO', '¡Listo! Hemos notificado al colaborador para que confirme la recepción del anticipo');
        }
    });
}
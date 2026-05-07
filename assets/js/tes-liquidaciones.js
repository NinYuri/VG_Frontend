document.addEventListener('DOMContentLoaded', function() {
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tabSelected();
    cardLinks();
    updateCurrency();
    buttonReturn();
});


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
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('selected');
            const amount = tab.querySelector('.amount');
            if(amount) amount.classList.remove('selected');
        });

        const activeTab = document.querySelector(`.tab.${tabParam}`);
        if(activeTab) {
            activeTab.classList.add('selected');
            const amount = activeTab.querySelector('.amount');
            if(amount) amount.classList.add('selected');
        }
    }
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
        const anticipoCell = row.querySelector('.anticipo-cell');
        const antImg = anticipoCell.querySelector('img');
        const antSymbol = anticipoCell.querySelector('.symbol-money.anticipo');

        const comprobadoCell = row.querySelector('.comprobado-cell');
        const cmpImg = comprobadoCell.querySelector('img');
        const cmpSymbol = comprobadoCell.querySelector('.symbol-money.comprobado');

        const saldoCell = row.querySelector('.saldo-cell');
        const saldoImg = saldoCell.querySelector('img');
        const saldoSymbol = saldoCell.querySelector('.symbol-money.saldo');

        if(!anticipoCell || !antImg || !antSymbol || !comprobadoCell || !cmpImg || !cmpSymbol || !saldoCell || !saldoImg || !saldoSymbol) return;
        
        let currencyCode;
        
        currencyCode = antImg.getAttribute('alt')?.toUpperCase();
        const antCurrency = currencies.find(c => c.code === currencyCode);
        
        currencyCode = cmpImg.getAttribute('alt')?.toUpperCase();
        const cmpCurrency = currencies.find(c => c.code === currencyCode);

        currencyCode = saldoImg.getAttribute('alt')?.toUpperCase();
        const saldoCurrency = currencies.find(c => c.code === currencyCode);

        if(!antCurrency || !cmpCurrency || !saldoCurrency) return;

        antSymbol.textContent = antCurrency.symbol;
        cmpSymbol.textContent = cmpCurrency.symbol;
        saldoSymbol.textContent = saldoCurrency.symbol;
    });


    // CARDS -> CORREGIR
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
// Pending Tab
function buttonReturn() {
    const buttons = document.querySelectorAll('.fa-circle-dollar-to-slot');
    if(!buttons) return;

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const row = button.closest('tr');
            let folio = 'desconocido';
            let status;

            if(row) {
                const folioCell = row.querySelector('.folio');
                if(folioCell) folio = folioCell.textContent.trim();

                const statusCell = row.querySelector('.status.st-adjustment');
                if(statusCell) status = statusCell.textContent.trim();
            }

            if(status === 'Devolución')
                ToastReceived(folio);
        });
    });
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
function ToastReceived(folio, imageLeft = './assets/images/Icon_agave1.webp', imageRight = './assets/images/Icon_agave2.webp') {
    Swal.fire({
        title: 'CONFIRMAR RECEPCIÓN DE DEVOLUCIÓN',
        html: `
            <img src="${imageLeft}" alt="Agave" class="agave-half left">
            <img src="${imageRight}" alt="Agave" class="agave-half right">
            <p class="received-text">¿Tesorería ha recibido la devolución correspondiente a la solicitud con folio ${folio}?</p>
        `,
        position: 'top-end',
        background: '#00333E',
        color: '#FFFFFF',
        showCancelButton: true,
        cancelButtonText: 'NO, AÚN NO',
        confirmButtonText: 'SÍ, RECIBIDA',
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
            Toast('RECEPCIÓN DE DEVOLUCIÓN', '¡Listo! La devolución ha sido registrada correctamente');
        } else
            Toast('RECEPCIÓN DE DEVOLUCIÓN', 'Hemos notificado al colaborador para dar seguimiento a la entrega de la devolución');
    });
}
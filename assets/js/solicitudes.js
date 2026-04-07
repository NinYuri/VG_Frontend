document.addEventListener("DOMContentLoaded", function() {
    optionsBar();
    tabSelected();
    createTravelRequest();
});


/* ============================== OPTIONS BAR ============================== */
function optionsBar() {
    const dashboard = document.querySelector('.option.dashboard');
    const request = document.querySelector('.option.requests');
    const expenses = document.querySelector('.option.expenses');
    const history = document.querySelector('.option.history');

    request.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'solicitudes.html';
    });
}


/* ================================= TABLE TABS ================================= */
function tabSelected() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}


/* ========================= CREATE TRAVEL EXPENSE REQUEST ========================== */
function createTravelRequest() { 
    const buttonCreate = document.querySelector('.button-create');

    buttonCreate.addEventListener('click', function() {
        window.location.href = 'crear-solicitud.html';
    });
}


/* ================================ CANCEL BUTTON ================================ */

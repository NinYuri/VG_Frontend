document.addEventListener("DOMContentLoaded", function() {
    tabSelected();
    createTravelRequest();
});


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
document.addEventListener("DOMContentLoaded", function() {
    tabSelected();
});


/* ================================= TABLE TABS ================================= */
function tabSelected() {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            tabs.forEach(t => t.classList.remove("selected"));
            this.classList.add("selected");
        });
    });
}
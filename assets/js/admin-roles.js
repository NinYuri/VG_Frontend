document.addEventListener('DOMContentLoaded', function() {
    setupPaginationEvents();
    menuUser();
    phoneMenu();
    initMobileScroll();
    optionsBar();
    tableInformation(getCurrentFilters());
    tabSelected();
    search();
    setupSorting();
});


/* ============================== VARIABLES ============================== */
// Backend
const token = Session.getToken();
const logoUser = Session.getUser();
const API = 'http://127.0.0.1:3000';
// const API = 'http://10.10.164.200:3000';

let swapped = false;
let currentPage = 1;
let paginacionGlobal = {
    paginaActual: 1,
    totalPaginas: 1
};
const limitPerPage = 7;
let currentNombre = null;
let currentEmail = null;
let currentDep = null;
let currentRol = null;

// Rol
const ROLES = ['Colaborador', 'Jefe', 'Tesorería', 'Administrador'];


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
    if(!user) return;

    function capitalizarNombre(nombreCompleto) {
        if(!nombreCompleto) return '';
        return nombreCompleto
            .trim()
            .toLowerCase()
            .split(' ')
            .map(palabra => {
                if(palabra.length === 0) return '';
                return palabra[0].toUpperCase() + palabra.slice(1);
            })
            .join(' ');
    }

    const name = capitalizarNombre(logoUser);
    user.innerHTML = name;
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
async function logoutReset() {
    try {
        await fetch(`${API}/auth/logout`, {
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
    const access = document.querySelector('.option.access');
    const roles = document.querySelector('.option.roles');
    const boss = document.querySelector('.option.boss');
    const logout = document.querySelector('.option.log-out');

    function setActiveOption() {
        const allOptions = document.querySelectorAll('.option:not(.log-out)');
        const currentPath = window.location.pathname;
        
        allOptions.forEach(option => {
            option.classList.remove('active');
        });

        if(currentPath.includes('admin-usuarios.html'))
            access.classList.add('active');
        else if(currentPath.includes('admin-roles.html'))
            roles.classList.add('active');
        else if(currentPath.includes('admin-jefes.html'))
            boss.classList.add('active');
    }

    setActiveOption();

    access.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'admin-usuarios.html';
    });

    roles.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'admin-roles.html';
    });

    boss.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'admin-jefes.html';
    });

    logout.addEventListener('click', (e) => {
        e.stopPropagation();
        logoutReset();
    });
}


/* =========================== TABLE INFORMATION =========================== */
function getActiveStatus() {
    const tabActive = document.querySelector('.tab.selected');
    if(!tabActive) return null;

    if(tabActive.classList.contains('name'))
        return 'Nombre';
    if(tabActive.classList.contains('email'))
        return 'Correo';

    return null;
}

function getActiveTabId() {
    const activeTab = document.querySelector('.tab.selected');
    if(!activeTab) return 'name';

    if(activeTab.classList.contains('name')) return 'name';
    if(activeTab.classList.contains('email')) return 'email';

    return 'name';
}

// Filters
function getCurrentFilters() {
    const ident = getActiveStatus();
    const input = document.querySelector('.search-back input');
    const valor = input ? input.value.trim() : '';
    const filtros = { ident };

    if(swapped)
        filtros.departamento = valor;
    else
        filtros.colaborador = valor;
    if(currentNombre) filtros.ordenNombre = currentNombre;
    if(currentEmail) filtros.ordenEmail = currentEmail;
    if(currentDep) filtros.ordenDep = currentDep;
    if(currentRol) filtros.ordenRol = currentRol;

    return filtros;
}

// Backend query
async function tableInformation(filtros = {}, page = 1) {
    showLoader();
    renderTable([]);
    //renderCards([]);

    const offset = (page - 1) * limitPerPage;

    const params = new URLSearchParams();
    if(filtros.ident) params.append('ident', filtros.ident);
    if(filtros.colaborador) params.append('colaborador', filtros.colaborador);
    if(filtros.departamento) params.append('departamento', filtros.departamento);
    if(filtros.ordenNombre) params.append('ordenNombre', filtros.ordenNombre);
    if(filtros.ordenEmail) params.append('ordenEmail', filtros.ordenEmail);
    if(filtros.ordenDep) params.append('ordenDep', filtros.ordenDep);
    if(filtros.ordenRol) params.append('ordenRol', filtros.ordenRol);
    params.append('pagina', 'Roles');
    params.append('limit', limitPerPage);
    params.append('offset', offset);

    try {
        const response = await fetch(`${API}/auth/listar?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if(!response.ok) {
            renderTable([]);
            //renderCards([]);
            throw new Error('Error al obtener usuarios');
            return;
        }

        const data = await response.json();

        if(data.mensaje) {
            renderTable([]);
            //renderCards([]);
            Toast('SIN USUARIOS', 'No tienes usuarios activos para mostrar en este momento');
            return;
        }

        renderTable(data.usuarios);
        //renderCards(data.usuarios);
        updatePagination(data.paginacion);
        currentPage = data.paginacion.paginaActual;
    } catch(error) {
        renderTable([]);
        //renderCards([]);
        console.log(error);
        Toast('ERROR AL MOSTRAR', 'No se pudieron cargar los usuarios. Por favor, intenta de nuevo');
    } finally {
        hideLoader();
    }
}

// Table Information
function buildThead(tab) {
    const thead = document.querySelector('.table-head');
    if(!thead) return;

    const columnas = [];

    if(tab === 'name')
        columnas.push({ title: 'Colaborador', hasOrder: true });
    else if(tab === 'email')
        columnas.push({ title: 'Correo', hasOrder: true });

    columnas.push(
        { title: 'Departamento', hasOrder: true },
        { title: 'Rol', hasOrder: true }
    );

    const headerRow = document.createElement('tr');
    columnas.forEach(col => {
        const th = document.createElement('th');

        th.innerHTML = `
            <div class="order-div" data-column="${col.title.toLowerCase()}">
                <div class="order">
                    <i class="fa-solid fa-angle-up"></i>
                    <i class="fa-solid fa-angle-down"></i>
                </div>
                ${col.title}
            </div>`;

        headerRow.appendChild(th);
    });

    thead.innerHTML = '';
    thead.appendChild(headerRow);
    setupSorting();
}

function renderTable(usuarios) {
    const tbody = document.querySelector('.table-body');
    if(!tbody) return;

    // Construir thead
    const tab = getActiveTabId();
    buildThead(tab);
    tbody.innerHTML = '';

    if(usuarios.length === 0) return;

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        
        let html = '';
        if(tab === 'email')
            html += `<td><p>${u.correo || '—'}</p></td>`;
        else
            html += `<td><p>${u.nombre_completo || '—'}</p></td>`;

        html += `
            <td><p>${u.departamento || '—'}</p></td>
            <td>
                <div class="rol-selector" data-usuario-id="${u.usuario_id}" data-current="${u.rol}">
                    <p class="rol-text">${u.rol}</p>
                    <i class="fa-solid fa-angle-down"></i>
                    <div class="rol-dropdown"></div>
                </div>
            </td>
        `;

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    const rowsActuales = usuarios.length;
    for(let i = rowsActuales; i < limitPerPage; i++) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td><p class="empty-row">Empty</p></td><td></td><td></td>`;
        tbody.appendChild(emptyRow);
    }

    setupRolDropdowns();
}

// Pagination
function updatePagination(paginacion) {
    const pageDiv = document.querySelector('.page:not(.final)');
    const pageFinal = document.querySelector('.page.final');
    const buttonConexion = document.querySelector('.button-conexion');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    if(pageDiv) pageDiv.textContent = paginacion.paginaActual;
    if(pageFinal) pageFinal.textContent = paginacion.totalPaginas;
    paginacionGlobal = paginacion;

    if(buttonConexion)
        buttonConexion.style.display = paginacion.totalPaginas > 1 ? 'flex' : 'none';
    if(pageFinal)
        pageFinal.parentElement.style.display = paginacion.totalPaginas > 1 ? 'flex' : 'none';

    // Habilitar / deshabilitar botones
    if(prevBtn) prevBtn.parentElement.classList.toggle('disabled', paginacion.paginaActual <= 1);
    if(nextBtn) nextBtn.parentElement.classList.toggle('disabled', paginacion.paginaActual >= paginacion.totalPaginas);
}

function setupPaginationEvents() {
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    if(!prevBtn || !nextBtn) return;

    const prevParent = prevBtn.parentElement;
    const nextParent = nextBtn.parentElement;

    prevParent.addEventListener('click', (e) => {
        e.stopPropagation();
        if (paginacionGlobal.paginaActual <= 1 || prevParent.classList.contains('disabled')) return;
        currentPage--;
        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
    });

    nextParent.addEventListener('click', (e) => {
        e.stopPropagation();
        if (paginacionGlobal.paginaActual >= paginacionGlobal.totalPaginas || nextParent.classList.contains('disabled')) return;
        currentPage++;
        const filtros = getCurrentFilters();
        tableInformation(filtros, currentPage);
    });
}


/* ================================ TABLE TABS ================================ */
function tabSelected() {
    const tabs = document.querySelectorAll('.tab');
    const search = document.querySelector('.search-back');
    const input = document.querySelector('.search-back input');
    const colab = search.querySelector('.fa-circle-user') || search.querySelector('.fa-envelope');
    const dep = search.querySelector('.fa-building');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            currentNombre = null;
            currentEmail = null;
            currentPage = 1;

            if(swapped) {
                search.insertBefore(colab, input);
                search.appendChild(dep);
                swapped = false;
            }

            if(this.classList.contains('email')) {
                if(input) input.placeholder = 'Correo. . .';
                colab.classList.remove('fa-circle-user');
                colab.classList.add('fa-envelope');
            } else {
                if(input) input.placeholder = 'Colaborador. . .';
                colab.classList.remove('fa-envelope');
                colab.classList.add('fa-circle-user');
            }

            if(input) input.value = '';

            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}


/* ============================== SEARCH ============================== */
function search() {
    const search = document.querySelector('.search-back');
    const colab = search.querySelector('.fa-circle-user') || search.querySelector('.fa-envelope');
    const dep = search.querySelector('.fa-building');
    const input = search.querySelector('input');

    if(!search || !colab || !dep || !input) return;

    function swapIcons() {
        const parent = search;

        if(!swapped) {
            parent.insertBefore(dep, input);
            parent.appendChild(colab);
            input.placeholder = 'Departamento. . .';
            swapped = true;
        } else {
            parent.insertBefore(colab, input);
            parent.appendChild(dep);
            input.placeholder = getActiveTabId() === 'name' ? 'Colaborador. . .' : 'Correo. . .';
            swapped = false;
        }
        input.value = '';
    }

    function fadeAndSwap(shouldSwap) {
        if(shouldSwap) {
            colab.classList.add('fade-out');
            dep.classList.add('fade-out');
        }

        setTimeout(() => {
            if(shouldSwap) {
                swapIcons();
                colab.classList.remove('fade-out');
                dep.classList.remove('fade-out');
            }
        }, 200);
    }

    let debounceTimer;

    function doSearch() {
        const valor = input.value.trim();
        const filtros = getCurrentFilters();
        if(swapped) {
            filtros.departamento = valor;
            delete filtros.colaborador;
        } else {
            filtros.colaborador = valor;
            delete filtros.departamento;
        }

        currentPage = 1;
        tableInformation(filtros, currentPage);
    }

    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            clearTimeout(debounceTimer);
            currentPage = 1;
            doSearch();
        }
    });

    input.addEventListener('input', () => {
        if(input.value.trim() === '') {
            clearTimeout(debounceTimer);
            const filtros = getCurrentFilters();

            delete filtros.colaborador;
            delete filtros.departamento;
            
            currentPage = 1;
            tableInformation(filtros, currentPage);
        }
    });

    colab.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.colaborador;
        delete filtros.departamento;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(swapped);
    });

    dep.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtros = getCurrentFilters();

        delete filtros.colaborador;
        delete filtros.departamento;

        currentPage = 1;
        tableInformation(filtros, currentPage);
        fadeAndSwap(!swapped);
    });
}


/* ============================== CLASSIFICATION ============================== */
function setupSorting() {
    const orderDivs = document.querySelectorAll('.order-div[data-column]');

    orderDivs.forEach(div => {
        const orderIcons = div.querySelector('.order');
        if(!orderIcons) return;

        orderIcons.addEventListener('click', (e) => {
            e.stopPropagation();
            const column = div.dataset.column;

            switch(column) {
                case 'colaborador':
                    currentNombre = currentNombre === 'ASC' ? 'DESC' : 'ASC';

                    currentEmail = null;
                    currentDep = null;
                    currentRol = null;
                    break;
                case 'correo':
                    currentEmail = currentEmail === 'ASC' ? 'DESC' : 'ASC';

                    currentNombre = null;
                    currentDep = null;
                    currentRol = null;
                    break;
                case 'departamento':
                    currentDep = currentDep === 'ASC' ? 'DESC' : 'ASC';

                    currentNombre = null;
                    currentEmail = null;
                    currentRol = null;
                    break;
                case 'rol':
                    currentRol = currentRol == 'ASC' ? 'DESC' : 'ASC';

                    currentNombre = null;
                    currentEmail = null;
                    currentDep = null;
                    break;
                default:
                    break;
            }

            currentPage = 1;
            const filtros = getCurrentFilters();
            tableInformation(filtros, currentPage);
        });
    });
}


/* =================================== ROLES =================================== */
function setupRolDropdowns() {
    const selectors = document.querySelectorAll('.rol-selector');

    selectors.forEach(selector => {
        const dropdown = selector.querySelector('.rol-dropdown');
        const text = selector.querySelector('.rol-text');
        const usuarioId = selector.dataset.usuarioId;

        function buildDropdown(currentRol) {
            dropdown.innerHTML = '';
            const otros = ROLES.filter(r => r !== currentRol);

            otros.forEach(rolOpcion => {
                const option = document.createElement('div');
                option.className = 'rol-option';
                option.textContent = rolOpcion;

                option.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await updateRol(usuarioId, rolOpcion, selector, text, buildDropdown);
                });

                dropdown.appendChild(option);
            });
        }

        buildDropdown(selector.dataset.current);

        selector.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('show');
            document.querySelectorAll('.rol-dropdown.show').forEach(d => d.classList.remove('show'));
            if(!isOpen) dropdown.classList.add('show');
        });
    });

    document.addEventListener('click', (e) => {
        if(!e.target.closest('.rol-selector'))
            document.querySelectorAll('.rol-dropdown.show').forEach(d => d.classList.remove('show'));
    });
}

async function updateRol(usuarioId, nuevoRol, selector, textEl, buildDropdownFn) {
    try {
        const response = await fetch(`${API}/auth/actualizar-rol`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ usuarioId: parseInt(usuarioId), rol: nuevoRol })
        });

        if(!response.ok) throw new Error('Error al actualizar el rol');

        textEl.textContent = nuevoRol;
        selector.dataset.current = nuevoRol;
        buildDropdownFn(nuevoRol);
        selector.querySelector('.rol-dropdown').classList.remove('show');

        Toast('ROL ACTUALIZADO', `El rol del usuario se actualizó a ${nuevoRol} correctamente`);
    } catch(error) {
        console.log(error);
        Toast('ACTUALIZACIÓN FALLIDA', 'No fue posible actualizar el rol del usuario. Por favor, inténtalo nuevamente');
    }
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

function Toast(title, content) {
    ToastMixin.fire({
        icon: undefined,
        html: `
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="./assets/images/Icon_agave.webp" alt="Agave" class="agave-icon">
                <div class="text">
                    <p>${title}</p>
                    <span>${content}</span>
                </div>
            </div>
        `
    });
}
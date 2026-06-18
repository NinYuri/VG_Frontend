document.addEventListener("DOMContentLoaded", function() {
    passwordVisibility();
    login();
});

/* ================================ VARIABLES ================================ */
//const API = 'http://127.0.0.1:3000';
const API = 'http://10.10.164.200:3000';


/* =================================== LOADER =================================== */
function showLoader() {
    document.querySelector('.loader-overlay').style.display = 'flex';
}

function hideLoader() {
    document.querySelector('.loader-overlay').style.display = 'none';
}


/* =================================== LOGIN =================================== */
async function login() {
    document.querySelector('.button-login').addEventListener('click', async(e) => {
        e.stopPropagation();

        if(!loginValidation()) return;

        const correo = document.getElementById('user').value;
        const password = document.getElementById('password').value;
        
        try {
            showLoader();

            const response = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ correo, password }),
            });

            if(!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Error desconocido');
            }

            const data = await response.json();
            Session.setToken(data.access_token);
            Session.setUser(data.usuario.nombre);

            hideLoader();

            // Redirigir acorde el rol
            const rol = data.usuario.rol;
            switch(rol) {
                case 'Jefe':
                    window.location.href = 'jefe-dashboard.html';
                    break;
                case 'Tesorería':
                    window.location.href = 'tes-dashboard.html';
                    break;
                case 'Colaborador':
                    window.location.href = 'colab-dashboard.html';
                    break;
                default:
                    window.location.href = 'index.html';    // fallback
            }
        } catch(error) {
            hideLoader();
            Toast(error.message);
        }
    }); 
}


/* ============================== PASSWORD ============================== */
function passwordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.pass');

    toggleIcon.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    });
}


/* ============================== VALIDATIONS ============================== */
function loginValidation() {
    const user = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    if(user === "" || user.trim() === "") {
        Toast('Por favor, ingresa tu correo y contraseña');
        return false;
    }
    if(password === "" || password.trim() === "") {
        Toast('Por favor, ingresa tu correo y contraseña');
        return false;
    }
    return true;
}


/* =================================== TOAST =================================== */
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

function Toast(content, title = 'ERROR AL INICIAR SESIÓN', imageUrl = './assets/images/Icon_agave.webp') {
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
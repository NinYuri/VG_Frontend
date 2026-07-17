/* ================================ VARIABLES ================================ */
const API = 'https://api.apps-dev-mamr.com.mx/';
// const API = 'http://10.10.164.200:3000';

const msalConfig = {
    auth: {
        clientId: '9ab12a2e-e456-4273-85bd-6d9b648e6916',
        authority: 'https://login.microsoftonline.com/8f861cfa-33df-4e2c-ac7e-3b8224ae9d66',
        redirectUri: 'https://wonderful-smoke-0a279fc0f.7.azurestaticapps.net/',
    },
    cache: {
        cacheLocation: 'sessionStorage',
    }
};

const LOGIN_SCOPES = ['openid', 'profile', 'email', 'User.Read'];
let msalInstance;


/* =================================== LOADER =================================== */
function showLoader() {
    document.querySelector('.loader-overlay').style.display = 'flex';
}

function hideLoader() {
    document.querySelector('.loader-overlay').style.display = 'none';
}


/* =================================== INIT =================================== */
document.addEventListener("DOMContentLoaded", async function() {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    try {
        const response = await msalInstance.handleRedirectPromise();
        if(response) {
            await loginBackend(response.accessToken);
            return;
        }
    } catch(error) {
        hideLoader();
        Toast(error.message || 'Error al procesar respuesta de Microsoft');
        return;
    }

    document.querySelector('.button-login.microsoft').addEventListener('click', () => {
        msalInstance.loginRedirect({ scopes: LOGIN_SCOPES });
    });
});


/* =============================== LOGIN MICROSOFT =============================== */
async function loginBackend(microsoftToken) {
    showLoader();

    try {
        const response = await fetch(`${API}/auth/login-microsoft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            credentials: 'include',
            body: JSON.stringify({ token: microsoftToken }),
        });

        if(!response.ok) {
            const err = await response.json().catch(() => null);
            throw new Error(err?.message || 'Error al iniciar sesión');
        }

        const data = await response.json();
        Session.setToken(data.access_token);
        Session.setUser(data.usuario.nombre);
        Session.setRol(data.usuario.rol);
        Session.setJefe(data.usuario.es_jefe);

        // Redirigir según rol
        const rol = data.usuario.rol;
        switch(rol) {
            case 'Administrador':
                window.location.href = 'admin-usuarios.html'
                break;
            case 'Jefe': 
                window.location.href = 'jefe-dashboard.html';  
                break;
            case 'Tesorería': 
                window.location.href = 'tes-dashboard.html';   
                break;
            case 'Colaborador': 
                window.location.href = 'colab-dashboard.html'; 
                break;
            default: window.location.href = 'index.html';
        }
    } catch(error) {
        hideLoader();
        Toast(error.message);
    }
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
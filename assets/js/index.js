document.addEventListener("DOMContentLoaded", function() {
    passwordVisibility();
    login();
});


/* ============================== LOGIN ============================== */
async function login() {
    document.querySelector('.button-login').addEventListener('click', async(e) => {
        e.stopPropagation();

        if(!loginValidation()) return;

        const data = {
            usuario: document.getElementById('user').value,
            password: document.getElementById('password').value
        };

        console.log(data);
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
        Toast('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
        return false;
    }
    if(password === "" || password.trim() === "") {
        Toast('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
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
    width: '500px',
    customClass: {
        popup: 'colored-toast'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

function Toast(title, imageUrl = './assets/images/Icon_agave.png') {
    ToastMixin.fire({
        icon: undefined,
        html: `
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${imageUrl}" alt="Agave" class="agave-icon">
                <span>${title}</span>
            </div>
        `
    });
}
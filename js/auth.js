document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Кнопка выхода может быть на многих страницах
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message');

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.login === login && u.password === password);

    if (user) {
        if (user.blocked) {
            errorMessage.textContent = 'Ваш аккаунт заблокирован.';
            return;
        }
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        // Перенаправление в зависимости от роли
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }
    } else {
        errorMessage.textContent = 'Неверный логин или пароль.';
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html'; // Возвращаемся на страницу входа
}
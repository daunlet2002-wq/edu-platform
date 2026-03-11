document.addEventListener('DOMContentLoaded', () => {
    const adminNavContainer = document.getElementById('admin-nav-container');
    if (adminNavContainer) {
        adminNavContainer.innerHTML = `
            <a href="students.html" class="nav-card">Управление учениками</a>
            <a href="lessons.html" class="nav-card">Управление уроками</a>
            <a href="results.html" class="nav-card">Просмотр результатов</a>
            <a href="statistics.html" class="nav-card">Статистика</a>
        `;
    }
});
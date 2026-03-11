document.addEventListener('DOMContentLoaded', () => {
    // Инициализация базы данных при первом запуске, если она не существует
    if (!localStorage.getItem('db_initialized')) {
        console.log("Initializing database for the first time.");

        // Создаем пользователя-администратора
        const initialUsers = [
            {
                id: 1,
                name: 'Admin',
                login: 'admin',
                password: 'admin123',
                role: 'admin',
                blocked: false
            },
            {
                id: 2,
                name: 'Тестовый Ученик',
                login: 'student',
                password: '123',
                role: 'student',
                blocked: false
            }
        ];

        // Сохраняем начальные данные в localStorage
        localStorage.setItem('users', JSON.stringify(initialUsers));
        localStorage.setItem('lessons', JSON.stringify([]));
        localStorage.setItem('questions', JSON.stringify([]));
        localStorage.setItem('results', JSON.stringify([]));
        localStorage.setItem('answers', JSON.stringify([]));
        localStorage.setItem('notifications', JSON.stringify([]));
        localStorage.setItem('bookmarks', JSON.stringify({}));

        // Устанавливаем начальные значения для ID
        localStorage.setItem('nextUserId', '3');
        localStorage.setItem('nextLessonId', '1');
        localStorage.setItem('nextQuestionId', '1');
        localStorage.setItem('nextResultId', '1');
        localStorage.setItem('nextAnswerId', '1');
        localStorage.setItem('nextNotificationId', '1');

        // Устанавливаем флаг, что база данных инициализирована
        localStorage.setItem('db_initialized', 'true');
    }
});

// Вспомогательная функция для получения следующего ID
function getNextId(key) {
    const nextId = parseInt(localStorage.getItem(key) || '1', 10);
    localStorage.setItem(key, (nextId + 1).toString());
    return nextId;
}
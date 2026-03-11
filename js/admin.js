document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    checkTheme();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Привязываем обработчик выхода к кнопке, если она есть
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Инициализация элементов управления темой
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (window.location.pathname.endsWith('admin-students.html')) {
        loadStudents();
        document.getElementById('create-student-form').addEventListener('submit', createStudent);
    }

    if (window.location.pathname.endsWith('admin-lessons.html')) {
        loadLessonsForAdmin();
        loadLessonOptions();
        document.getElementById('create-lesson-form').addEventListener('submit', createLesson);
        document.getElementById('add-question-form').addEventListener('submit', addQuestion);
        
        // При выборе урока загружаем его вопросы
        document.getElementById('lesson-select').addEventListener('change', (e) => loadQuestionsForLesson(parseInt(e.target.value)));
    }

    if (window.location.pathname.endsWith('admin-results.html')) {
        loadResults();
    }

    if (window.location.pathname.endsWith('admin-statistics.html')) {
        loadStatistics();
    }
});

// Загрузка списка студентов
function loadStudents() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const students = users.filter(u => u.role === 'student');
    const tableBody = document.querySelector('#students-table tbody');
    tableBody.innerHTML = '';
    students.forEach(student => {
        const isBlocked = student.blocked;
        const row = `<tr>
            <td data-label="ID">${student.id}</td>
            <td data-label="Имя">${student.name}</td>
            <td data-label="Логин">${student.login}</td>
            <td data-label="Действия">
                <button onclick="editStudent(${student.id})">Ред.</button>
                <button onclick="resetStudentPassword(${student.id})">Сброс пароля</button>
                <button onclick="toggleBlockStudent(${student.id})" style="background-color: ${isBlocked ? '#28a745' : '#ffc107'}">
                    ${isBlocked ? 'Разблок.' : 'Блок.'}
                </button>
                <button class="delete-btn" onclick="deleteStudent(${student.id})">Удалить</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Редактирование ученика
function editStudent(id) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const student = users.find(u => u.id === id);
    if (!student) return;

    const newName = prompt("Введите новое имя:", student.name);
    const newLogin = prompt("Введите новый логин:", student.login);

    if (newName && newLogin) {
        student.name = newName;
        student.login = newLogin;
        localStorage.setItem('users', JSON.stringify(users));
        loadStudents();
    }
}

// Сброс пароля
function resetStudentPassword(id) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const student = users.find(u => u.id === id);
    if (!student) return;

    const newPass = prompt("Введите новый пароль:");
    if (newPass) {
        student.password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        alert("Пароль успешно изменен.");
    }
}

// Блокировка ученика
function toggleBlockStudent(id) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const student = users.find(u => u.id === id);
    if (!student) return;

    student.blocked = !student.blocked;
    localStorage.setItem('users', JSON.stringify(users));
    loadStudents();
}

// Создание студента
function createStudent(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const login = document.getElementById('student-login').value;
    const password = document.getElementById('student-password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const newUser = {
        id: getNextId('nextUserId'),
        name,
        login,
        password,
        role: 'student',
        blocked: false
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    loadStudents();
    e.target.reset();
}

// Удаление студента
function deleteStudent(studentId) {
    if(!confirm('Вы уверены, что хотите удалить этого ученика?')) return;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.id !== studentId);
    localStorage.setItem('users', JSON.stringify(users));
    loadStudents();
}

// Загрузка уроков для админа
function loadLessonsForAdmin() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const container = document.getElementById('lessons-list-admin');
    container.innerHTML = '';
    lessons.forEach(lesson => {
        const isVisible = lesson.visible !== false;
        container.innerHTML += `
            <div class="lesson-card" style="opacity: ${isVisible ? 1 : 0.6}">
                <h3>${lesson.title} <small>(${lesson.category || 'Без категории'})</small></h3>
                <p>Видео: ${lesson.video_url}</p>
                <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap; justify-content: center;">
                    <button onclick="editLesson(${lesson.id})">Ред.</button>
                    <button onclick="toggleLessonVisibility(${lesson.id})">${isVisible ? 'Скрыть' : 'Публик.'}</button>
                    <button class="delete-btn" onclick="deleteLesson(${lesson.id})">Удалить</button>
                </div>
            </div>`;
    });
}

// Редактирование урока
function editLesson(id) {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    const title = prompt("Название урока:", lesson.title);
    const video = prompt("Ссылка с YouTube или путь к файлу:", lesson.video_url)?.trim();
    const category = prompt("Категория:", lesson.category || "");
    const duration = prompt("Время на тест (мин):", lesson.duration || 20);

    if (title && video && duration) {
        lesson.title = title;
        lesson.video_url = video;
        lesson.category = category;
        lesson.duration = parseInt(duration);
        localStorage.setItem('lessons', JSON.stringify(lessons));
        loadLessonsForAdmin();
    }
}

// Переключение видимости урока
function toggleLessonVisibility(id) {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    lesson.visible = !lesson.visible;
    localStorage.setItem('lessons', JSON.stringify(lessons));
    loadLessonsForAdmin();
}

// Удаление урока
function deleteLesson(lessonId) {
    if(!confirm('Вы уверены? Удаление урока удалит также все связанные вопросы.')) return;
    
    let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    lessons = lessons.filter(l => l.id !== lessonId);
    localStorage.setItem('lessons', JSON.stringify(lessons));

    // Удаляем вопросы, связанные с уроком
    let questions = JSON.parse(localStorage.getItem('questions')) || [];
    questions = questions.filter(q => q.lesson_id !== lessonId);
    localStorage.setItem('questions', JSON.stringify(questions));

    loadLessonsForAdmin();
    loadLessonOptions();
    
    // Очистить список вопросов если был выбран удаленный урок
    document.getElementById('questions-list-admin').innerHTML = '';
}

// Загрузка опций для select при создании вопроса
function loadLessonOptions() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const select = document.getElementById('lesson-select');
    select.innerHTML = '<option value="">Выберите урок</option>';
    lessons.forEach(lesson => {
        select.innerHTML += `<option value="${lesson.id}">${lesson.title}</option>`;
    });
}

// Создание урока
function createLesson(e) {
    e.preventDefault();
    const title = document.getElementById('lesson-title').value;
    const video_url = document.getElementById('lesson-video').value.trim();
    const category = document.getElementById('lesson-category').value;
    const duration = document.getElementById('lesson-duration').value;

    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const newLesson = {
        id: getNextId('nextLessonId'),
        title,
        video_url,
        category,
        duration: parseInt(duration, 10) || 20, // По умолчанию 20 минут
        visible: true // По умолчанию урок видим
    };
    lessons.push(newLesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));
    loadLessonsForAdmin();
    loadLessonOptions();
    e.target.reset();
}

// Добавление вопроса
function addQuestion(e) {
    e.preventDefault();
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    const newQuestion = {
        id: getNextId('nextQuestionId'),
        lesson_id: parseInt(document.getElementById('lesson-select').value),
        question: document.getElementById('question-text').value,
        optionA: document.getElementById('optionA').value,
        optionB: document.getElementById('optionB').value,
        optionC: document.getElementById('optionC').value,
        optionD: document.getElementById('optionD').value,
        correctAnswer: document.getElementById('correctAnswer').value
    };
    questions.push(newQuestion);
    localStorage.setItem('questions', JSON.stringify(questions));
    alert('Вопрос добавлен!');
    e.target.reset();
    loadQuestionsForLesson(newQuestion.lesson_id);
}

// Загрузка вопросов для редактирования
function loadQuestionsForLesson(lessonId) {
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    const lessonQuestions = questions.filter(q => q.lesson_id === lessonId);
    const container = document.getElementById('questions-list-admin');
    
    if (!container) return;
    
    if (!lessonId) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<h3>Список вопросов</h3>';
    if (lessonQuestions.length === 0) container.innerHTML += '<p>Вопросов пока нет.</p>';

    lessonQuestions.forEach(q => {
        container.innerHTML += `
            <div class="question-item" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 4px;">
                <p><strong>${q.question}</strong> (Ответ: ${q.correctAnswer})</p>
                <button class="delete-btn" onclick="deleteQuestion(${q.id}, ${lessonId})">Удалить</button>
            </div>`;
    });
}

// Удаление вопроса
function deleteQuestion(id, lessonId) {
    if(!confirm("Удалить этот вопрос?")) return;
    let questions = JSON.parse(localStorage.getItem('questions')) || [];
    questions = questions.filter(q => q.id !== id);
    localStorage.setItem('questions', JSON.stringify(questions));
    loadQuestionsForLesson(lessonId);
}

// Загрузка результатов
function loadResults() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const questionsAll = JSON.parse(localStorage.getItem('questions')) || [];
    const tableBody = document.querySelector('#results-table tbody');
    tableBody.innerHTML = '';

    // Сортируем по ID, чтобы правильно посчитать попытки
    results.sort((a, b) => a.id - b.id);

    // Считаем попытки
    const attemptsCount = {}; // Ключ: "user_id-lesson_id"

    // Разворачиваем обратно, чтобы новые были сверху, но сначала проставим номера попыток
    const resultsWithAttempts = results.map(r => {
        const key = `${r.user_id}-${r.lesson_id}`;
        if (!attemptsCount[key]) attemptsCount[key] = 0;
        attemptsCount[key]++;
        return { ...r, attempt: attemptsCount[key] };
    }).reverse();

    resultsWithAttempts.forEach(result => {
        const user = users.find(u => u.id === result.user_id);
        const lesson = lessons.find(l => l.id === result.lesson_id);
        const lessonQuestions = questionsAll.filter(q => q.lesson_id === result.lesson_id);

        const row = `<tr>
            <td data-label="Ученик">${user ? user.name : 'N/A'}</td>
            <td data-label="Урок">${lesson ? lesson.title : 'N/A'}</td>
            <td data-label="Попытка">${result.attempt}</td>
            <td data-label="Результат">${result.score} / ${lessonQuestions.length}</td>
            <td data-label="Комментарий">
                <input type="text" id="comment-${result.id}" value="${result.teacher_comment || ''}" placeholder="Добавить комментарий">
            </td>
            <td data-label="Действия">
                <button onclick="addComment(${result.id})">Сохранить</button>
            </td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Добавление комментария учителя
function addComment(resultId) {
    const commentInput = document.getElementById(`comment-${resultId}`);
    const comment = commentInput.value;

    let results = JSON.parse(localStorage.getItem('results')) || [];
    const resultIndex = results.findIndex(r => r.id === resultId);
    if (resultIndex !== -1) {
        results[resultIndex].teacher_comment = comment;
        localStorage.setItem('results', JSON.stringify(results));
        
        // Отправка уведомления ученику
        const result = results[resultIndex];
        sendNotification(result.user_id, `Учитель оставил комментарий к вашему тесту по уроку #${result.lesson_id}: "${comment}"`);
        
        alert('Комментарий сохранен!');
    }
}

// Отправка уведомления (вспомогательная функция)
function sendNotification(userId, message) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const newNotification = {
        id: getNextId('nextNotificationId'),
        user_id: userId,
        message: message,
        read: false
    };
    notifications.push(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Статистика
function loadStatistics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    
    const students = users.filter(u => u.role === 'student');
    
    // Топ учеников
    const studentStats = students.map(s => {
        const sResults = results.filter(r => r.user_id === s.id);
        const totalScore = sResults.reduce((acc, r) => acc + r.score, 0);
        const avg = sResults.length ? (totalScore / sResults.length).toFixed(1) : 0;
        return { name: s.name, avg: parseFloat(avg), tests: sResults.length };
    }).sort((a, b) => b.avg - a.avg); // Сортировка по среднему баллу
    
    const topStudentsTable = document.getElementById('top-students-table');
    if (topStudentsTable) {
        topStudentsTable.innerHTML = studentStats.map(s => `<tr><td data-label="Имя">${s.name}</td><td data-label="Пройдено тестов">${s.tests}</td><td data-label="Средний балл">${s.avg}</td></tr>`).join('');
    }
    
    // Статистика по урокам
    const lessonStats = lessons.map(l => {
        const lResults = results.filter(r => r.lesson_id === l.id);
        const avgScore = lResults.length ? (lResults.reduce((acc, r) => acc + r.score, 0) / lResults.length).toFixed(1) : 0;
        return { title: l.title, count: lResults.length, avg: avgScore };
    });
    
    const lessonStatsContainer = document.getElementById('lesson-stats-container');
    if (lessonStatsContainer) {
        lessonStatsContainer.innerHTML = lessonStats.map(l => 
            `<div class="lesson-card"><h4>${l.title}</h4><p>Прохождений: ${l.count}</p><p>Ср. балл: ${l.avg}</p></div>`
        ).join('');
    }
}

// Управление темой
function checkTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

document.addEventListener('DOMContentLoaded', () => {
    checkTheme(); // Проверка темы при загрузке
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')); 
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

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

    if (window.location.pathname.endsWith('student-dashboard.html')) {
        loadLessons();
        loadProgress(); // Загрузка общего прогресса
        loadNotifications(); // Загрузка уведомлений
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => loadLessons(e.target.value));
        }
    } else if (window.location.pathname.endsWith('lesson.html')) {
        loadLesson();
    } else if (window.location.pathname.endsWith('result.html')) {
        loadResult();
    } else if (window.location.pathname.endsWith('history.html')) {
        loadHistory();
    } else if (window.location.pathname.endsWith('student-profile.html')) {
        loadProfile();
    } else if (window.location.pathname.endsWith('bookmarks.html')) {
        loadBookmarksPage();
    }
});

// Управление темой
function checkTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function loadLessons(searchTerm = '') {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const lessonsList = document.getElementById('lessons-list');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const results = JSON.parse(localStorage.getItem('results')) || [];
    
    // Фильтрация по поиску и видимости
    const filteredLessons = lessons.filter(l => 
        l.visible !== false && 
        l.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    lessonsList.innerHTML = '';
    filteredLessons.forEach(lesson => {
        const isCompleted = results.some(r => r.user_id === currentUser.id && r.lesson_id === lesson.id);
        const lessonCard = document.createElement('a');
        lessonCard.href = `lesson.html?id=${lesson.id}`;
        lessonCard.className = `lesson-card ${isCompleted ? 'completed' : ''}`;
        lessonCard.innerHTML = `
            <h3>${lesson.title}</h3>
            <p>${lesson.category || 'Общее'}</p>
            ${isCompleted ? '<span class="badge">Пройдено</span>' : ''}
        `;
        lessonsList.appendChild(lessonCard);
    });
}

// Прогресс обучения
function loadProgress() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const visibleLessons = lessons.filter(l => l.visible !== false);
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Уникальные пройденные уроки
    const passedLessonIds = new Set(
        results.filter(r => r.user_id === currentUser.id).map(r => r.lesson_id)
    );
    
    const progress = visibleLessons.length > 0 ? Math.round((passedLessonIds.size / visibleLessons.length) * 100) : 0;
    
    const progressBar = document.getElementById('progress-bar-container');
    if (progressBar) {
        progressBar.innerHTML = `<div class="progress-bar" style="width: ${progress}%">${progress}%</div>`;
    }
}

// Уведомления
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    // Показываем только непрочитанные уведомления для текущего пользователя
    const userNotifications = notifications.filter(n => n.user_id === currentUser.id && !n.read);
    const container = document.getElementById('notifications-container');
    
    if (container && userNotifications.length > 0) {
        container.innerHTML = userNotifications.map(n => `
            <div class="notification" style="display: flex; justify-content: space-between; align-items: center;">
                <span>${n.message}</span>
                <button onclick="markAsRead(${n.id})" style="margin-left: 10px; font-size: 12px; padding: 5px;">Ок</button>
            </div>
        `).join('');
    }
}

function markAsRead(id) {
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications(); // Перерисовать список
    }
}

function retakeTest(lessonId) {
    window.location.href = `test.html?lessonId=${lessonId}`;
}

function loadLesson() {
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = parseInt(urlParams.get('id'));
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const lesson = lessons.find(l => l.id === lessonId);

    if (lesson) {
        document.getElementById('lesson-title').textContent = lesson.title;
        const videoContainer = document.getElementById('video-container');
        const videoUrl = (lesson.video_url || '').trim();
        
        // Проверка на YouTube ссылку
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = videoUrl.match(youtubeRegex);
            const youtubeId = (match && match[2].length === 11) ? match[2] : null;

            if (youtubeId) {
                // Если это YouTube, вставляем iframe
                videoContainer.innerHTML = `
                    <iframe width="100%" height="500" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                `;
                showTestButton(); // Показываем кнопку теста сразу
            } else {
                // Если ссылка похожа на YouTube, но ID не найден
                videoContainer.innerHTML = `<p style="color: red;">Не удалось извлечь ID из ссылки YouTube. Убедитесь, что ссылка правильная. Пример: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>`;
            }
        } else {
            // Если это обычный файл
            videoContainer.innerHTML = `
                <video controls style="width: 100%" onended="showTestButton()">
                    <source src="${videoUrl}">
                    Ваш браузер не поддерживает видео.
                </video>
                <div class="video-controls">
                    <label>Скорость: 
                        <select onchange="document.querySelector('video').playbackRate = this.value">
                            <option value="0.5">0.5x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                    </label>
                </div>`;

            // Добавляем обработку ошибок загрузки видео
            const video = videoContainer.querySelector('video');
            video.addEventListener('error', function() {
                videoContainer.innerHTML += `<p style="color: red; margin-top: 10px;">Ошибка: Не удалось загрузить видеофайл. Проверьте, что путь <b>${videoUrl}</b> указан верно и файл существует в папке <b>assets/videos</b>.</p>`;
            }, true);
        }
        
        const startTestBtn = document.getElementById('start-test-btn');
        startTestBtn.onclick = () => {
            window.location.href = `test.html?lessonId=${lesson.id}`;
        };
        
        // Закладки
        const bookmarkBtn = document.getElementById('bookmark-button');
        if (bookmarkBtn) {
            updateBookmarkButton(lesson.id);
            bookmarkBtn.onclick = () => toggleBookmark(lesson.id);
        }
    }
}

function showTestButton() {
    document.getElementById('start-test-btn').style.display = 'block';
}

function loadResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultId = parseInt(urlParams.get('resultId'));
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const resultContainer = document.getElementById('result-container');

    if (!resultId || !currentUser) {
        if (resultContainer) resultContainer.innerHTML = '<p>Результат не найден.</p>';
        return;
    }

    const results = JSON.parse(localStorage.getItem('results')) || [];
    const result = results.find(r => r.id === resultId && r.user_id === currentUser.id);

    if (result) {
        const questions = JSON.parse(localStorage.getItem('questions')) || [];


        const lessonQuestions = questions.filter(q => q.lesson_id === result.lesson_id);
        const totalQuestions = lessonQuestions.length;

        document.getElementById('score').textContent = `${result.score} / ${totalQuestions}`;
        document.getElementById('teacher-comment').textContent = result.teacher_comment || 'Пока нет комментария.';
        
        // Показываем детальный разбор ответов
        showDetailedAnswers(result.lesson_id, currentUser.id);
        
        // Добавляем кнопку повторного прохождения теста
        const retakeButton = document.createElement('button');
        retakeButton.textContent = 'Пройти тест снова';
        retakeButton.onclick = () => retakeTest(result.lesson_id);
        if (resultContainer) resultContainer.appendChild(retakeButton);

    } else {
        if (resultContainer) resultContainer.innerHTML = '<p>Результат не найден.</p>';
    }
}

function showDetailedAnswers(lessonId, userId) {
    const answers = JSON.parse(localStorage.getItem('answers')) || [];
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    const lessonQuestions = questions.filter(q => q.lesson_id === lessonId);
    const container = document.getElementById('detailed-answers');
    
    if (!container) return;
    
    container.innerHTML = '<h3>Детальный разбор</h3>';
    
    lessonQuestions.forEach((q, index) => {
        const userAnswersForQ = answers.filter(a => a.question_id === q.id && a.user_id === userId);
        const userAnswer = userAnswersForQ.length > 0 ? userAnswersForQ[userAnswersForQ.length - 1] : null;
        
        const selected = userAnswer ? userAnswer.selected_answer : 'Нет ответа';
        const isCorrect = selected === q.correctAnswer;
        
        const div = document.createElement('div');
        div.className = 'question';
        div.style.borderLeft = `5px solid ${isCorrect ? 'var(--success-color)' : 'var(--danger-color)'}`;
        
        div.innerHTML = `
            <p><strong>${index + 1}. ${q.question}</strong></p>
            <p>Ваш ответ: <b>${selected}</b> ${isCorrect ? '✅' : '❌'}</p>
            ${!isCorrect ? `<p style="color: var(--success-color);">Правильный ответ: <b>${q.correctAnswer}</b></p>` : ''}
        `;
        container.appendChild(div);
    });
}

// Функции закладок
function toggleBookmark(lessonId) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    let userBookmarks = bookmarks[currentUser.id] || [];
    
    if (userBookmarks.includes(lessonId)) {
        userBookmarks = userBookmarks.filter(id => id !== lessonId);
    } else {
        userBookmarks.push(lessonId);
    }
    
    bookmarks[currentUser.id] = userBookmarks;
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarkButton(lessonId);
}

function updateBookmarkButton(lessonId) {
    const btn = document.getElementById('bookmark-button');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    const userBookmarks = bookmarks[currentUser.id] || [];
    
    if (userBookmarks.includes(lessonId)) {
        btn.textContent = 'Убрать из закладок';
        btn.classList.add('active');
    } else {
        btn.textContent = 'В закладки';
        btn.classList.remove('active');
    }
}

// История обучения
function loadHistory() {
    const historyList = document.getElementById('history-list');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    
    const userResults = results.filter(r => r.user_id === currentUser.id).reverse(); // Сначала новые
    
    historyList.innerHTML = '';
    if (userResults.length === 0) {
        historyList.innerHTML = '<p>История пуста.</p>';
        return;
    }

    userResults.forEach(result => {
        const lesson = lessons.find(l => l.id === result.lesson_id);
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <h4>${lesson ? lesson.title : 'Урок удален'}</h4>
            <p>Результат: ${result.score}</p>
            <p>Комментарий: ${result.teacher_comment || 'Нет'}</p>
            <a href="result.html?resultId=${result.id}">Подробнее</a>
        `;
        historyList.appendChild(div);
    });
}

// Профиль
function loadProfile() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-login').textContent = currentUser.login;
    
    // Статистика в профиле
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const userResults = results.filter(r => r.user_id === currentUser.id);
    const totalTests = userResults.length;
    const avgScore = totalTests > 0 ? (userResults.reduce((acc, r) => acc + r.score, 0) / totalTests).toFixed(1) : 0;
    
    document.getElementById('stats-tests').textContent = totalTests;
    document.getElementById('stats-avg').textContent = avgScore;
}

// Страница закладок
function loadBookmarksPage() {
    const list = document.getElementById('bookmarks-list');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    const userBookmarks = bookmarks[currentUser.id] || [];
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    
    list.innerHTML = '';
    if (userBookmarks.length === 0) {
        list.innerHTML = '<p>Нет закладок.</p>';
        return;
    }

    userBookmarks.forEach(id => {
        const lesson = lessons.find(l => l.id === id);
        if (lesson) {
            const card = document.createElement('div');
            card.className = 'lesson-card';
            card.innerHTML = `
                <h3>${lesson.title}</h3>
                <a href="lesson.html?id=${lesson.id}">Перейти</a>
                <button onclick="toggleBookmark(${lesson.id}); loadBookmarksPage()">Удалить</button>
            `;
            list.appendChild(card);
        }
    });
}

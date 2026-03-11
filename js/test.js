document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = parseInt(urlParams.get('lessonId'));
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    if (!lessonId) {
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Получаем урок, чтобы узнать время на тест
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const lesson = lessons.find(l => l.id === lessonId);
    const duration = (lesson && lesson.duration) ? lesson.duration : 20; // 20 минут по умолчанию

    loadTest(lessonId);
    startTimer(duration * 60);

    document.getElementById('submit-test-btn').addEventListener('click', () => {
        submitTest(lessonId, currentUser.id);
    });
});

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('time-left');
    
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (display) display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(interval);
            alert("Время вышло! Тест отправляется автоматически.");
            document.getElementById('submit-test-btn').click();
        }
    }, 1000);
}

function loadTest(lessonId) {
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    const lessonQuestions = questions.filter(q => q.lesson_id === lessonId);
    const testContainer = document.getElementById('test-container');
    testContainer.innerHTML = '';

    if (lessonQuestions.length === 0) {
        testContainer.innerHTML = '<p>Вопросов пока нет.</p>';
        const submitBtn = document.getElementById('submit-test-btn');
        if (submitBtn) submitBtn.style.display = 'none';
        return;
    }

    lessonQuestions.forEach((q, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        questionElement.innerHTML = `
            <p><strong>${index + 1}. ${q.question}</strong></p>
            <label><input type="radio" name="question${q.id}" value="A"> ${q.optionA}</label><br>
            <label><input type="radio" name="question${q.id}" value="B"> ${q.optionB}</label><br>
            <label><input type="radio" name="question${q.id}" value="C"> ${q.optionC}</label><br>
            <label><input type="radio" name="question${q.id}" value="D"> ${q.optionD}</label><br>
        `;
        testContainer.appendChild(questionElement);
    });
}

function submitTest(lessonId, userId) {
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    const lessonQuestions = questions.filter(q => q.lesson_id === lessonId);
    let score = 0;
    let userAnswers = [];

    lessonQuestions.forEach(q => {
        const selectedOption = document.querySelector(`input[name="question${q.id}"]:checked`);
        if (selectedOption) {
            const selectedAnswer = selectedOption.value;
            userAnswers.push({
                id: getNextId('nextAnswerId'),
                user_id: userId,
                question_id: q.id,
                selected_answer: selectedAnswer
            });
            if (selectedAnswer === q.correctAnswer) {
                score++;
            }
        }
    });

    let allAnswers = JSON.parse(localStorage.getItem('answers')) || [];
    allAnswers = allAnswers.concat(userAnswers);
    localStorage.setItem('answers', JSON.stringify(allAnswers));

    let results = JSON.parse(localStorage.getItem('results')) || [];
    const newResultId = getNextId('nextResultId');    
    const newResult = {
        id: newResultId,
        user_id: userId,
        lesson_id: lessonId,
        score: score,
        teacher_comment: '',
        date: new Date().toLocaleString()
    };
    results.push(newResult);
    localStorage.setItem('results', JSON.stringify(results));

    window.location.href = `result.html?resultId=${newResultId}`;
}

function getNextId(key) {
    const nextId = parseInt(localStorage.getItem(key) || '1', 10);
    localStorage.setItem(key, (nextId + 1).toString());
    return nextId;
}

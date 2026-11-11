// js/validation.js

// Функция для показа/скрытия ошибки под полем ввода
export function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(errorId);
    
    if (message) {
        input.classList.add('input--error'); // Добавляем красную рамку
        errorSpan.textContent = message;
    } else {
        input.classList.remove('input--error');
        errorSpan.textContent = '';
    }
}

// Функция проверки суммы
export function validateAmount(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
        return 'Введите корректную сумму (больше 0)';
    }
    return null; // Если ошибок нет, возвращаем null
}
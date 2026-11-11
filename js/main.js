// ================= НАСТРОЙКИ API =================
// Главный файл логики приложения
const BASE_URL = 'https://api.frankfurter.dev/v1';

async function fetchCurrencies() {
    const response = await fetch(`${BASE_URL}/currencies`);
    if (!response.ok) throw new Error('Ошибка загрузки списка валют');
    return await response.json();
}

async function convertCurrency(amount, from, to) {
    const response = await fetch(`${BASE_URL}/latest?amount=${amount}&from=${from}&to=${to}`);
    if (!response.ok) throw new Error('Ошибка при конвертации');
    const data = await response.json();
    return data.rates[to];
}

async function fetchHistory(from, to) {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await fetch(`${BASE_URL}/${start}..${end}?from=${from}&to=${to}`);
    if (!response.ok) throw new Error('Ошибка загрузки истории');
    return await response.json();
}

// ================= ВАЛИДАЦИЯ =================
function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(errorId);
    
    if (message) {
        input.classList.add('input--error');
        errorSpan.textContent = message;
    } else {
        input.classList.remove('input--error');
        errorSpan.textContent = '';
    }
}

function validateAmount(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
        return 'Введите корректную сумму (больше 0)';
    }
    return null;
}

// ================= ОСНОВНАЯ ЛОГИКА =================
document.addEventListener('DOMContentLoaded', () => {
    // --- ВКЛАДКИ ---
    const tabs = document.querySelectorAll('.tabs__btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('tabs__btn--active');
                t.setAttribute('aria-selected', 'false');
            });
            contents.forEach(c => {
                c.classList.remove('tab-content--active');
                c.hidden = true;
            });

            tab.classList.add('tabs__btn--active');
            tab.setAttribute('aria-selected', 'true');

            const targetContent = document.getElementById(`tab-${tab.dataset.tab}`);
            if (targetContent) {
                targetContent.classList.add('tab-content--active');
                targetContent.hidden = false;
            }
        });
    });

    // --- КОНВЕРТЕР ---
    const converterForm = document.getElementById('converter-form');
    const amountInput = document.getElementById('converter-amount');
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const resultDiv = document.getElementById('converter-result');
    const historyDiv = document.getElementById('converter-history');
    const historyContent = document.getElementById('history-content');

    async function initCurrencies() {
        try {
            const currencies = await fetchCurrencies();
            fromSelect.innerHTML = '';
            toSelect.innerHTML = '';

            for (const [code, name] of Object.entries(currencies)) {
                fromSelect.add(new Option(`${code} — ${name}`, code));
                toSelect.add(new Option(`${code} — ${name}`, code));
            }

            fromSelect.value = 'USD';
            toSelect.value = 'EUR';
        } catch (error) {
            resultDiv.className = 'result result--error';
            resultDiv.innerHTML = 'Не удалось загрузить список валют. Проверьте интернет.';
        }
    }

    initCurrencies();

    converterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = amountInput.value;
        
        const error = validateAmount(amount);
        if (error) {
            showError('converter-amount', 'converter-amount-error', error);
            resultDiv.className = 'result';
            resultDiv.innerHTML = '';
            return;
        }
        showError('converter-amount', 'converter-amount-error', '');

        const from = fromSelect.value;
        const to = toSelect.value;

        if (from === to) {
            resultDiv.className = 'result result--error';
            resultDiv.innerHTML = 'Выберите разные валюты для конвертации.';
            return;
        }

        resultDiv.className = 'result result--loading';
        resultDiv.innerHTML = 'Загрузка курса...';
        historyDiv.hidden = true;

        try {
            const converted = await convertCurrency(amount, from, to);
            
            resultDiv.className = 'result result--success';
            resultDiv.innerHTML = `
                <div class="result__value">${converted.toFixed(2)} ${to}</div>
                <div class="result__note">По курсу на сегодня. ${amount} ${from} = ${converted.toFixed(2)} ${to}</div>
            `;

            const historyData = await fetchHistory(from, to);
            const dates = Object.keys(historyData.rates).sort().reverse().slice(0, 5);
            
            let tableHTML = '<table><thead><tr><th>Дата</th><th>Курс</th></tr></thead><tbody>';
            dates.forEach(date => {
                tableHTML += `<tr><td>${date}</td><td>${historyData.rates[date][to].toFixed(4)}</td></tr>`;
            });
            tableHTML += '</tbody></table>';

            historyContent.innerHTML = tableHTML;
            historyDiv.hidden = false;

        } catch (error) {
            resultDiv.className = 'result result--error';
            resultDiv.innerHTML = 'Ошибка соединения с сервером. Попробуйте позже.';
        }
    });

    // --- ВКЛАД ---
    const depositForm = document.getElementById('deposit-form');
    const depositResult = document.getElementById('deposit-result');

    depositForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Вот эта строчка спасает от перезагрузки!

        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const term = parseInt(document.getElementById('deposit-term').value);
        const rate = parseFloat(document.getElementById('deposit-rate').value);
        const isCapitalized = document.getElementById('deposit-capitalization').checked;

        let hasError = false;
        if (isNaN(amount) || amount <= 0) {
            showError('deposit-amount', 'deposit-amount-error', 'Введите корректную сумму');
            hasError = true;
        } else { showError('deposit-amount', 'deposit-amount-error', ''); }

        if (isNaN(term) || term <= 0) {
            showError('deposit-term', 'deposit-term-error', 'Введите срок');
            hasError = true;
        } else { showError('deposit-term', 'deposit-term-error', ''); }

        if (isNaN(rate) || rate <= 0) {
            showError('deposit-rate', 'deposit-rate-error', 'Введите ставку');
            hasError = true;
        } else { showError('deposit-rate', 'deposit-rate-error', ''); }

        if (hasError) return;

        let totalAmount = amount;
        const monthlyRate = (rate / 100) / 12;

        if (isCapitalized) {
            totalAmount = amount * Math.pow(1 + monthlyRate, term);
        } else {
            totalAmount = amount + (amount * (rate / 100) * (term / 12));
        }

        const income = totalAmount - amount;

        depositResult.className = 'result result--success';
        depositResult.innerHTML = `
            <div class="result__value">${totalAmount.toFixed(2)} ₽</div>
            <div class="result__note">
                Итоговая сумма через ${term} мес.<br>
                <strong>Ваш доход:</strong> ${income.toFixed(2)} ₽
            </div>
        `;
    });

    // --- КРЕДИТ ---
    const creditForm = document.getElementById('credit-form');
    const creditResult = document.getElementById('credit-result');

    creditForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('credit-amount').value);
        const term = parseInt(document.getElementById('credit-term').value);
        const rate = parseFloat(document.getElementById('credit-rate').value);

        let hasError = false;
        if (isNaN(amount) || amount <= 0) {
            showError('credit-amount', 'credit-amount-error', 'Введите корректную сумму');
            hasError = true;
        } else { showError('credit-amount', 'credit-amount-error', ''); }

        if (isNaN(term) || term <= 0) {
            showError('credit-term', 'credit-term-error', 'Введите срок');
            hasError = true;
        } else { showError('credit-term', 'credit-term-error', ''); }

        if (isNaN(rate) || rate <= 0) {
            showError('credit-rate', 'credit-rate-error', 'Введите ставку');
            hasError = true;
        } else { showError('credit-rate', 'credit-rate-error', ''); }

        if (hasError) return;

        const monthlyRate = (rate / 100) / 12;
        const annuityCoefficient = (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
        const monthlyPayment = amount * annuityCoefficient;
        const totalPayment = monthlyPayment * term;
        const overpayment = totalPayment - amount;

        creditResult.className = 'result result--success';
        creditResult.innerHTML = `
            <div class="result__value">${monthlyPayment.toFixed(2)} ₽</div>
            <div class="result__note">
                Ежемесячный платеж<br><br>
                <strong>Общая сумма выплат:</strong> ${totalPayment.toFixed(2)} ₽<br>
                <strong>Переплата по процентам:</strong> ${overpayment.toFixed(2)} ₽
            </div>
        `;
    });
});
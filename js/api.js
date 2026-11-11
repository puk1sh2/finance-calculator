// js/api.js

// Базовый URL для API Frankfurter
const BASE_URL = 'https://api.frankfurter.dev/v1';

// 1. Получение списка доступных валют
export async function fetchCurrencies() {
    try {
        const response = await fetch(`${BASE_URL}/currencies`);
        if (!response.ok) throw new Error('Ошибка загрузки списка валют');
        return await response.json();
    } catch (error) {
        console.error('API Error (Currencies):', error);
        throw error;
    }
}

// 2. Конвертация валюты
export async function convertCurrency(amount, from, to) {
    try {
        const response = await fetch(`${BASE_URL}/latest?amount=${amount}&from=${from}&to=${to}`);
        if (!response.ok) throw new Error('Ошибка при конвертации');
        const data = await response.json();
        return data.rates[to];
    } catch (error) {
        console.error('API Error (Convert):', error);
        throw error;
    }
}

// 3. Получение истории курса за последние 30 дней
export async function fetchHistory(from, to) {
    try {
        // Вычисляем даты: сегодня и 30 дней назад
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await fetch(`${BASE_URL}/${start}..${end}?from=${from}&to=${to}`);
        if (!response.ok) throw new Error('Ошибка загрузки истории');
        return await response.json();
    } catch (error) {
        console.error('API Error (History):', error);
        throw error;
    }
}
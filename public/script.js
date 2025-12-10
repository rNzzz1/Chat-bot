document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statsBtn = document.getElementById('statsBtn');
    const messageCount = document.getElementById('messageCount');
    const serverTime = document.getElementById('serverTime');
    const quickButtons = document.querySelectorAll('.quick-btn');
    
    // Модальное окно
    const statsModal = document.getElementById('statsModal');
    const closeModal = document.querySelector('.close');
    const statsContent = document.getElementById('statsContent');
    
    // Обновление времени сервера
    function updateServerTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU');
        serverTime.textContent = timeString;
    }
    
    // Загрузка истории чата
    async function loadChatHistory() {
        try {
            const response = await fetch('/api/chat');
            const data = await response.json();
            
            // Очищаем только если есть сообщения
            if (data.messages && data.messages.length > 0) {
                // Удаляем приветственное сообщение
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }
                
                // Очищаем историю
                chatHistory.innerHTML = '';
                
                // Добавляем все сообщения
                data.messages.forEach(message => {
                    addMessageToHistory(message);
                });
                
                // Прокручиваем вниз
                scrollToBottom();
            }
            
            // Обновляем счетчик
            messageCount.textContent = `Сообщений: ${data.total || 0}`;
            
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        }
    }
    
    // Отправка сообщения
    async function sendMessage() {
        const text = messageInput.value.trim();
        
        if (!text) {
            messageInput.focus();
            return;
        }
        
        try {
            // Показываем сообщение пользователя сразу
            const userMessage = {
                text,
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('ru-RU')
            };
            addMessageToHistory(userMessage);
            
            // Очищаем поле ввода
            messageInput.value = '';
            
            // Отправляем на сервер
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Добавляем ответ бота
                addMessageToHistory(data.botMessage);
                // Обновляем счетчик
                messageCount.textContent = `Сообщений: ${data.historyLength || 0}`;
            } else {
                // Показываем ошибку
                showError(data.error || 'Ошибка отправки сообщения');
            }
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            showError('Ошибка соединения с сервером');
        }
    }
    
    // Добавление сообщения в историю
    function addMessageToHistory(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender}`;
        
        // Форматируем время
        const time = message.timestamp || new Date().toLocaleTimeString('ru-RU');
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="sender">
                    ${message.sender === 'user' ? '<i class="fas fa-user"></i> Вы' : '<i class="fas fa-robot"></i> Бот'}
                </span>
                <span class="timestamp">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        `;
        
        // Удаляем приветственное сообщение если оно есть
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage && message.sender === 'user') {
            welcomeMessage.remove();
        }
        
        chatHistory.appendChild(messageElement);
        scrollToBottom();
    }
    
    // Прокрутка вниз
    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Показать ошибку
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'message bot error';
        errorElement.innerHTML = `
            <div class="message-header">
                <span class="sender"><i class="fas fa-exclamation-triangle"></i> Ошибка</span>
                <span class="timestamp">${new Date().toLocaleTimeString('ru-RU')}</span>
            </div>
            <div class="message-text">${escapeHtml(message)}</div>
        `;
        
        chatHistory.appendChild(errorElement);
        scrollToBottom();
    }
    
    // Очистка истории
    async function clearHistory() {
        if (!confirm('Вы уверены, что хотите очистить всю историю чата?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/chat/clear');
            const data = await response.json();
            
            if (response.ok) {
                // Очищаем историю на клиенте
                chatHistory.innerHTML = `
                    <div class="welcome-message">
                        <div class="message bot">
                            <div class="message-header">
                                <span class="sender"><i class="fas fa-robot"></i> Бот</span>
                                <span class="timestamp">Сейчас</span>
                            </div>
                            <div class="message-text">
                                История очищена. Привет! Я простой чат-бот с локальной логикой.
                            </div>
                        </div>
                    </div>
                `;
                
                // Обновляем счетчик
                messageCount.textContent = 'Сообщений: 0';
                
                alert(data.message);
            }
        } catch (error) {
            console.error('Ошибка очистки:', error);
            showError('Ошибка очистки истории');
        }
    }
    
    // Показать статистику
    async function showStats() {
        try {
            const response = await fetch('/api/chat/stats');
            const data = await response.json();
            
            if (response.ok) {
                statsContent.innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h3>📊 Общая статистика</h3>
                            <p>Всего сообщений: <strong>${data.totalMessages}</strong></p>
                            <p>Сообщений от вас: <strong>${data.userMessages}</strong></p>
                            <p>Ответов бота: <strong>${data.botMessages}</strong></p>
                            <p>Статус сервера: <span style="color: #4CAF50;">${data.serverStatus}</span></p>
                        </div>
                        
                        <div class="stat-item">
                            <h3>📈 Распределение по категориям</h3>
                            ${Object.entries(data.categories).map(([category, count]) => `
                                <p>${getCategoryName(category)}: <strong>${count}</strong></p>
                            `).join('')}
                        </div>
                        
                        <div class="stat-item">
                            <h3>⏰ Информация</h3>
                            <p>Последнее обновление: ${data.timestamp}</p>
                            <p>Версия API: 1.0</p>
                            <p>Тип бота: Локальная логика</p>
                        </div>
                    </div>
                `;
                
                statsModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            statsContent.innerHTML = '<p style="color: #ff6b6b;">Ошибка загрузки статистики</p>';
        }
    }
    
    // Получить читаемое название категории
    function getCategoryName(category) {
        const names = {
            'greetings': 'Приветствия',
            'feelings': 'Самочувствие',
            'weather': 'Погода',
            'time': 'Время',
            'help': 'Помощь',
            'farewell': 'Прощания',
            'default': 'Прочее'
        };
        return names[category] || category;
    }
    
    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Обработчики событий
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    clearBtn.addEventListener('click', clearHistory);
    statsBtn.addEventListener('click', showStats);
    
    // Быстрые кнопки
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            messageInput.value = this.dataset.message;
            messageInput.focus();
        });
    });
    
    // Модальное окно
    closeModal.addEventListener('click', function() {
        statsModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });
    
    // Инициализация
    updateServerTime();
    loadChatHistory();
    
    // Обновление времени каждую секунду
    setInterval(updateServerTime, 1000);
    
    // Автофокус на поле ввода
    messageInput.focus();
});
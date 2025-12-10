const fs = require('fs');
const path = require('path');

// Загрузка базы ответов
const responsesPath = path.join(__dirname, '../data/responses.json');
const responses = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));

// Массив для хранения истории сообщений (в реальном приложении использовалась бы БД)
let messageHistory = [];
let messageId = 1;

// Получить текущее время в формате строки
const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    }) + ' ' + now.toLocaleDateString('ru-RU');
};

// Функция для поиска ответа на сообщение пользователя
const findResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();
    
    // Проверяем каждую категорию
    for (const [category, data] of Object.entries(responses)) {
        if (category === 'default') continue;
        
        // Проверяем наличие ключевых слов
        for (const keyword of data.keywords) {
            if (message.includes(keyword)) {
                let response = data.responses[Math.floor(Math.random() * data.responses.length)];
                
                // Заменяем плейсхолдеры
                if (response.includes('{{currentTime}}')) {
                    response = response.replace('{{currentTime}}', getCurrentTime());
                }
                
                return {
                    category,
                    response
                };
            }
        }
    }
    
    // Если не нашли подходящей категории - возвращаем ответ по умолчанию
    const defaultResponse = responses.default.responses[
        Math.floor(Math.random() * responses.default.responses.length)
    ];
    
    return {
        category: 'default',
        response: defaultResponse
    };
};

// Контроллеры
const chatController = {
    // Отправить сообщение
    sendMessage: (req, res) => {
        try {
            const { message } = req.body;
            
            if (!message || typeof message !== 'string') {
                return res.status(400).json({ 
                    error: 'Сообщение обязательно и должно быть строкой' 
                });
            }
            
            // Находим ответ
            const { category, response } = findResponse(message);
            
            // Создаем объекты сообщений
            const userMessage = {
                id: messageId++,
                text: message,
                sender: 'user',
                timestamp: getCurrentTime(),
                category: 'user'
            };
            
            const botMessage = {
                id: messageId++,
                text: response,
                sender: 'bot',
                timestamp: getCurrentTime(),
                category: category
            };
            
            // Добавляем в историю
            messageHistory.push(userMessage, botMessage);
            
            // Ограничиваем историю последними 50 сообщениями
            if (messageHistory.length > 50) {
                messageHistory = messageHistory.slice(-50);
            }
            
            res.json({
                userMessage,
                botMessage,
                historyLength: messageHistory.length
            });
            
        } catch (error) {
            console.error('Ошибка в sendMessage:', error);
            res.status(500).json({ error: 'Ошибка обработки сообщения' });
        }
    },
    
    // Получить историю сообщений
    getHistory: (req, res) => {
        try {
            const { limit } = req.query;
            let history = messageHistory;
            
            // Применяем лимит если указан
            if (limit && !isNaN(parseInt(limit)) && parseInt(limit) > 0) {
                history = messageHistory.slice(-parseInt(limit));
            }
            
            res.json({
                messages: history,
                total: messageHistory.length,
                timestamp: getCurrentTime()
            });
        } catch (error) {
            console.error('Ошибка в getHistory:', error);
            res.status(500).json({ error: 'Ошибка получения истории' });
        }
    },
    
    // Удалить сообщение по ID
    deleteMessage: (req, res) => {
        try {
            const { id } = req.params;
            const messageId = parseInt(id);
            
            if (isNaN(messageId)) {
                return res.status(400).json({ error: 'Неверный ID сообщения' });
            }
            
            const initialLength = messageHistory.length;
            messageHistory = messageHistory.filter(msg => msg.id !== messageId);
            
            if (messageHistory.length === initialLength) {
                return res.status(404).json({ 
                    error: 'Сообщение с указанным ID не найдено' 
                });
            }
            
            res.json({
                success: true,
                message: `Сообщение с ID ${id} удалено`,
                remaining: messageHistory.length
            });
        } catch (error) {
            console.error('Ошибка в deleteMessage:', error);
            res.status(500).json({ error: 'Ошибка удаления сообщения' });
        }
    },
    
    // Очистить всю историю
    clearHistory: (req, res) => {
        try {
            const count = messageHistory.length;
            messageHistory = [];
            messageId = 1;
            
            res.json({
                success: true,
                message: `История очищена. Удалено ${count} сообщений`,
                remaining: 0
            });
        } catch (error) {
            console.error('Ошибка в clearHistory:', error);
            res.status(500).json({ error: 'Ошибка очистки истории' });
        }
    },
    
    // Получить статистику
    getStats: (req, res) => {
        try {
            const stats = {
                totalMessages: messageHistory.length,
                userMessages: messageHistory.filter(msg => msg.sender === 'user').length,
                botMessages: messageHistory.filter(msg => msg.sender === 'bot').length,
                categories: {}
            };
            
            // Считаем сообщения по категориям
            messageHistory.forEach(msg => {
                if (msg.sender === 'bot') {
                    stats.categories[msg.category] = (stats.categories[msg.category] || 0) + 1;
                }
            });
            
            res.json({
                ...stats,
                timestamp: getCurrentTime(),
                serverStatus: 'active'
            });
        } catch (error) {
            console.error('Ошибка в getStats:', error);
            res.status(500).json({ error: 'Ошибка получения статистики' });
        }
    }
};

module.exports = chatController;
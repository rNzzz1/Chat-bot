// Middleware для логирования запросов
const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} от ${ip}`);
    
    // Логируем тело запроса для POST запросов
    if (method === 'POST' && req.body) {
        console.log('Тело запроса:', req.body);
    }
    
    // Сохраняем оригинальный метод отправки ответа
    const originalSend = res.send;
    res.send = function(data) {
        console.log(`Ответ отправлен: ${res.statusCode}`);
        if (res.statusCode >= 400) {
            console.log('Ошибка:', data);
        }
        originalSend.apply(res, arguments);
    };
    
    next();
};

module.exports = logger;
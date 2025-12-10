const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Middleware для проверки наличия тела запроса у POST
const validateMessage = (req, res, next) => {
    if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
        return res.status(400).json({ error: 'Тело запроса не может быть пустым' });
    }
    next();
};

// Маршруты
router.post('/', validateMessage, chatController.sendMessage);
router.get('/', chatController.getHistory);
router.delete('/:id', chatController.deleteMessage);
router.get('/clear', chatController.clearHistory);
router.get('/stats', chatController.getStats);

module.exports = router;
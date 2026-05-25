const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const authJWT = require('../middleware/authJWT');

router.use(authJWT.verificarToken);
router.use(authJWT.getSede);

router.post('/upload', knowledgeController.uploadDocument);
router.post('/load-default', knowledgeController.loadDefaultDocument);
router.post('/query', knowledgeController.queryKnowledge);

module.exports = router;

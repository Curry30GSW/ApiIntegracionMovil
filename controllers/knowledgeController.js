const knowledgeService = require('../services/knowledgeService');

async function uploadDocument(req, res) {
    try {
        const { document_name, text, source } = req.body;

        if (!document_name || !text) {
            return res.status(400).json({
                ok: false,
                message: 'Faltan campos requeridos: document_name y text'
            });
        }

        const result = await knowledgeService.saveDocument({
            documentName: document_name,
            source,
            text,
            id_sede: req.id_sede
        });

        return res.status(201).json({
            ok: true,
            data: result
        });
    } catch (error) {
        console.error('Error cargando documento:', error);
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
}

async function loadDefaultDocument(req, res) {
    try {
        const result = await knowledgeService.loadDefaultDocument(req.id_sede);

        return res.status(201).json({
            ok: true,
            data: result
        });
    } catch (error) {
        console.error('Error cargando documento por defecto:', error);
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
}

async function queryKnowledge(req, res) {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                ok: false,
                message: 'Falta el campo question'
            });
        }

        const chunks = await knowledgeService.queryKnowledge(question, req.id_sede);
        const response = await knowledgeService.answerKnowledge(question, chunks);

        return res.json({
            ok: true,
            answer: response.answer,
            sources: response.sources
        });
    } catch (error) {
        console.error('Error consultando la base de conocimiento:', error);
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
}

module.exports = {
    uploadDocument,
    loadDefaultDocument,
    queryKnowledge
};

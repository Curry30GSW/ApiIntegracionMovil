const fs = require('fs/promises');
const path = require('path');
const OpenAI = require('openai');
const db = require('../config/database');

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'tu_api_key'
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    : null;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4.1-mini';
const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 80;

function normalizeText(text) {
    return text
        .replace(/\r/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function splitIntoChunks(text) {
    const normalized = normalizeText(text);

    if (!normalized) {
        return [];
    }

    const words = normalized.split(' ');
    const chunks = [];

    let start = 0;

    while (start < words.length) {
        const end = Math.min(words.length, start + CHUNK_SIZE);
        chunks.push({
            chunk_index: chunks.length,
            text: words.slice(start, end).join(' ')
        });

        if (end === words.length) {
            break;
        }

        start = Math.max(0, end - CHUNK_OVERLAP);
    }

    return chunks;
}

async function ensureKnowledgeSchema() {
    await db.query('CREATE EXTENSION IF NOT EXISTS vector');

    await db.query(`
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id BIGSERIAL PRIMARY KEY,
            id_sede INTEGER NOT NULL,
            document_name TEXT NOT NULL,
            source TEXT,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding VECTOR(1536) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_sede
        ON knowledge_chunks (id_sede)
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document
        ON knowledge_chunks (id_sede, document_name)
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
        ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
    `);
}

async function getEmbedding(text) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'tu_api_key' || !openai) {
        throw new Error('OPENAI_API_KEY no está configurada');
    }

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text
    });

    return response.data[0].embedding;
}

async function saveDocument({ documentName, source, text, id_sede }) {
    await ensureKnowledgeSchema();

    const chunks = splitIntoChunks(text);

    if (!chunks.length) {
        throw new Error('El documento no tiene contenido válido para indexar');
    }

    await db.query(
        'DELETE FROM knowledge_chunks WHERE id_sede = $1 AND document_name = $2',
        [id_sede, documentName]
    );

    for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk.text);

        await db.query(
            `
                INSERT INTO knowledge_chunks (
                    id_sede,
                    document_name,
                    source,
                    chunk_index,
                    content,
                    embedding
                )
                VALUES ($1, $2, $3, $4, $5, $6::vector)
            `,
            [
                id_sede,
                documentName,
                source || documentName,
                chunk.chunk_index,
                chunk.text,
                JSON.stringify(embedding)
            ]
        );
    }

    return {
        document_name: documentName,
        chunks: chunks.length,
        source: source || documentName
    };
}

async function loadDefaultDocument(id_sede) {
    const filePath = path.join(__dirname, '..', 'data', 'knowledge-base.txt');
    const fileContent = await fs.readFile(filePath, 'utf8');

    return saveDocument({
        documentName: 'knowledge-base.txt',
        source: 'documento-local',
        text: fileContent,
        id_sede
    });
}

async function queryKnowledge(question, id_sede, topK = 4) {
    await ensureKnowledgeSchema();

    const embedding = await getEmbedding(question);

    const result = await db.query(
        `
            SELECT
                id,
                document_name,
                source,
                chunk_index,
                content,
                1 - (embedding <=> $1::vector) AS similarity
            FROM knowledge_chunks
            WHERE id_sede = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
        `,
        [JSON.stringify(embedding), id_sede, topK]
    );

    return result.rows;
}

async function answerKnowledge(question, chunks) {
    if (!chunks.length) {
        return {
            answer: 'No encontré información suficiente en la base de conocimiento para responder esta pregunta.',
            sources: []
        };
    }

    const context = chunks
        .map((chunk, index) => {
            return `[${index + 1}] ${chunk.document_name} | chunk ${chunk.chunk_index + 1}\n${chunk.content}`;
        })
        .join('\n\n');

    const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: `Eres un asistente que responde usando únicamente el contexto proporcionado. Si el contexto no contiene la respuesta, di que no tienes esa información. Responde en español y cita las fuentes cuando sea posible.`
            },
            {
                role: 'user',
                content: `Pregunta del usuario: ${question}\n\nContexto de la base de conocimiento:\n${context}`
            }
        ]
    });

    return {
        answer: response.choices[0].message.content,
        sources: chunks.map(chunk => ({
            document_name: chunk.document_name,
            source: chunk.source,
            chunk_index: chunk.chunk_index
        }))
    };
}

module.exports = {
    saveDocument,
    loadDefaultDocument,
    queryKnowledge,
    answerKnowledge
};

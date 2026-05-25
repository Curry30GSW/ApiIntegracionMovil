const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function detectarPreguntaConocimiento(mensaje) {
    const texto = mensaje.toLowerCase().trim();

    return /\b(documento|base de conocimiento|segun el documento|según el documento|que dice|qué dice|pregunta sobre|política|politica|informacion|información|contexto)\b/.test(texto);
}

async function detectarIntento(message) {
    const trimmed = message.trim();

    if (!trimmed) {
        return {
            intent: 'desconocido'
        };
    }

    if (detectarPreguntaConocimiento(trimmed)) {
        return {
            intent: 'knowledge_query',
            question: trimmed
        };
    }

    const prompt = `
Eres un sistema que analiza mensajes para un bot financiero.

Debes responder SOLO JSON válido.

Intenciones posibles:

- consultar_deuda
- clientes_vencidos
- clientes_pendientes
- buscar_cliente
- knowledge_query
- crear_credito
- desconocido

Ejemplos:
- "cuánto debe juan" => {"intent":"consultar_deuda","cliente":"juan"}
- "buscar cliente carlos" => {"intent":"buscar_cliente","cliente":"carlos"}
- "clientes pendientes" => {"intent":"clientes_pendientes"}
- "¿qué dice el documento sobre la política de cobranza?" => {"intent":"knowledge_query","question":"¿qué dice el documento sobre la política de cobranza?"}

Mensaje:
"${trimmed}"

Responde formato JSON:

{
  "intent": "",
  "cliente": "",
  "question": "",
  "monto": null
}
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0
    });

    const content = response.choices[0].message.content;

    try {
        const parsed = JSON.parse(content);

        if (!parsed.intent) {
            return {
                intent: 'desconocido'
            };
        }

        return parsed;
    } catch (error) {
        return {
            intent: 'desconocido'
        };
    }
}

module.exports = {
    detectarIntento
};
// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;


// ⬇️ AGREGAR ESTE DEBUG ⬇️
console.log('🔍 DEBUG - Variables de entorno:');
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('API_BASE_URL:', API_BASE_URL);

// Validación crítica
if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno');
}

// Estados de conversación por usuario
const userSessions = new Map();

// Mapeo de comandos a rutas de API
const commands = {
    '/start': 'Bienvenido al bot de Gota a Gota. Comandos disponibles:\n\n' +
        '/crearcredito - Crear un nuevo crédito\n' +
        '/pagar - Registrar un pago\n' +
        '/consultarcliente - Consultar información de un cliente\n' +
        '/crearcliente - Crear un nuevo cliente\n' +
        '/cancelar - Cancelar operación actual',
    '/cancelar': 'Operación cancelada.',
    '/crearcredito': 'crear_credito',
    '/pagar': 'pagar',
    '/consultarcliente': 'consultar_cliente',
    '/crearcliente': 'crear_cliente'
};

// Función principal para manejar mensajes
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    // Inicializar sesión si no existe
    if (!userSessions.has(chatId)) {
        userSessions.set(chatId, { state: 'idle', data: {} });
    }

    const session = userSessions.get(chatId);

    // Manejar comandos
    if (text.startsWith('/')) {
        if (text === '/start') {
            await sendMessage(chatId, commands['/start']);
            session.state = 'idle';
        }
        else if (text === '/cancelar') {
            session.state = 'idle';
            session.data = {};
            await sendMessage(chatId, commands['/cancelar']);
        }
        else if (commands[text]) {
            const action = commands[text];
            if (action === 'crear_credito') {
                await iniciarCrearCredito(chatId, session);
            } else if (action === 'pagar') {
                await iniciarPagar(chatId, session);
            } else if (action === 'consultar_cliente') {
                await iniciarConsultarCliente(chatId, session);
            } else if (action === 'crear_cliente') {
                await iniciarCrearCliente(chatId, session);
            }
        } else {
            await sendMessage(chatId, 'Comando no reconocido. Usa /start para ver los comandos disponibles.');
        }
        return;
    }

    // Manejar respuestas según el estado
    try {
        switch (session.state) {
            case 'crear_credito_monto':
                await procesarMontoCredito(chatId, session, text);
                break;
            case 'crear_credito_cliente':
                await procesarClienteCredito(chatId, session, text);
                break;
            case 'crear_credito_plazo':
                await procesarPlazoCredito(chatId, session, text);
                break;
            case 'pagar_id':
                await procesarPago(chatId, session, text);
                break;
            case 'consultar_cliente_id':
                await procesarConsultarCliente(chatId, session, text);
                break;
            case 'crear_cliente_nombre':
                await procesarNombreCliente(chatId, session, text);
                break;
            case 'crear_cliente_telefono':
                await procesarTelefonoCliente(chatId, session, text);
                break;
            case 'crear_cliente_direccion':
                await procesarDireccionCliente(chatId, session, text);
                break;
            default:
                await sendMessage(chatId, 'Por favor, inicia una operación con uno de los comandos.');
        }
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        await sendMessage(chatId, 'Ocurrió un error. Por favor, intenta de nuevo.');
        session.state = 'idle';
    }
}

// Funciones para cada flujo
async function iniciarCrearCredito(chatId, session) {
    session.state = 'crear_credito_monto';
    session.data = {};
    await sendMessage(chatId, 'Por favor, ingresa el monto del crédito:');
}

async function procesarMontoCredito(chatId, session, monto) {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        await sendMessage(chatId, 'Por favor, ingresa un monto válido (número positivo):');
        return;
    }
    session.data.monto = montoNum;
    session.state = 'crear_credito_cliente';
    await sendMessage(chatId, 'Por favor, ingresa el ID del cliente:');
}

async function procesarClienteCredito(chatId, session, clienteId) {
    session.data.id_cliente = parseInt(clienteId);
    session.state = 'crear_credito_plazo';
    await sendMessage(chatId, 'Por favor, ingresa el plazo en días (ejemplo: 30):');
}

async function procesarPlazoCredito(chatId, session, plazo) {
    const plazoNum = parseInt(plazo);
    if (isNaN(plazoNum) || plazoNum <= 0) {
        await sendMessage(chatId, 'Por favor, ingresa un plazo válido (número positivo):');
        return;
    }

    session.data.plazo_dias = plazoNum;
    session.data.fecha_inicio = new Date().toISOString().split('T')[0];

    try {
        const token = await obtenerToken();

        const response = await fetch(`${API_BASE_URL}/creditos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(session.data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        await sendMessage(chatId, `✅ Crédito creado exitosamente!\n\n` +
            `ID: ${data.id}\n` +
            `Monto: $${data.monto}\n` +
            `Cliente ID: ${data.id_cliente}\n` +
            `Plazo: ${data.plazo_dias} días`);
    } catch (error) {
        console.error('Error creando crédito:', error.message);
        await sendMessage(chatId, '❌ Error al crear el crédito. Verifica que el ID del cliente sea válido.');
    }

    session.state = 'idle';
    session.data = {};
}

async function iniciarPagar(chatId, session) {
    session.state = 'pagar_id';
    session.data = {};
    await sendMessage(chatId, 'Por favor, ingresa el ID del crédito a pagar:');
}

async function procesarPago(chatId, session, creditoId) {
    const id = parseInt(creditoId);
    if (isNaN(id)) {
        await sendMessage(chatId, 'Por favor, ingresa un ID válido:');
        return;
    }

    try {
        const token = await obtenerToken();

        const response = await fetch(`${API_BASE_URL}/creditos/pagar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await sendMessage(chatId, `✅ Pago registrado exitosamente!\n\n` +
            `Crédito ID: ${id}\n` +
            `Fecha de pago: ${new Date().toLocaleDateString()}`);
    } catch (error) {
        console.error('Error registrando pago:', error.message);
        await sendMessage(chatId, '❌ Error al registrar el pago. Verifica que el ID del crédito sea válido.');
    }

    session.state = 'idle';
}

async function iniciarConsultarCliente(chatId, session) {
    session.state = 'consultar_cliente_id';
    await sendMessage(chatId, 'Por favor, ingresa el ID del cliente:');
}

async function procesarConsultarCliente(chatId, session, clienteId) {
    const id = parseInt(clienteId);
    if (isNaN(id)) {
        await sendMessage(chatId, 'Por favor, ingresa un ID válido:');
        return;
    }

    try {
        const token = await obtenerToken();

        // Consultar cliente
        const clienteResponse = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!clienteResponse.ok) {
            throw new Error(`HTTP error! status: ${clienteResponse.status}`);
        }

        const cliente = await clienteResponse.json();

        let mensaje = `📋 INFORMACIÓN DEL CLIENTE\n\n` +
            `ID: ${cliente.id}\n` +
            `Nombre: ${cliente.nombre}\n` +
            `Teléfono: ${cliente.telefono || 'No registrado'}\n` +
            `Dirección: ${cliente.direccion || 'No registrada'}\n`;

        // Consultar créditos del cliente
        try {
            const creditosResponse = await fetch(`${API_BASE_URL}/creditos/cliente/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (creditosResponse.ok) {
                const creditos = await creditosResponse.json();

                if (creditos && creditos.length > 0) {
                    mensaje += `\n💰 CRÉDITOS:\n`;
                    creditos.forEach(credito => {
                        mensaje += `- ID: ${credito.id} | Monto: $${credito.monto} | Estado: ${credito.estado || 'Activo'}\n`;
                    });
                } else {
                    mensaje += `\n💰 No tiene créditos activos.`;
                }
            }
        } catch (error) {
            mensaje += `\n💰 Error al consultar créditos.`;
        }

        await sendMessage(chatId, mensaje);
    } catch (error) {
        console.error('Error consultando cliente:', error.message);
        await sendMessage(chatId, '❌ Error al consultar el cliente. Verifica que el ID sea válido.');
    }

    session.state = 'idle';
}

async function iniciarCrearCliente(chatId, session) {
    session.state = 'crear_cliente_nombre';
    session.data = {};
    await sendMessage(chatId, 'Por favor, ingresa el nombre completo del cliente:');
}

async function procesarNombreCliente(chatId, session, nombre) {
    if (!nombre || nombre.trim().length < 3) {
        await sendMessage(chatId, 'Por favor, ingresa un nombre válido (mínimo 3 caracteres):');
        return;
    }
    session.data.nombre = nombre.trim();
    session.state = 'crear_cliente_telefono';
    await sendMessage(chatId, 'Por favor, ingresa el número de teléfono del cliente:');
}

async function procesarTelefonoCliente(chatId, session, telefono) {
    session.data.telefono = telefono.trim();
    session.state = 'crear_cliente_direccion';
    await sendMessage(chatId, 'Por favor, ingresa la dirección del cliente:');
}

async function procesarDireccionCliente(chatId, session, direccion) {
    session.data.direccion = direccion.trim();

    try {
        const token = await obtenerToken();

        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(session.data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        await sendMessage(chatId, `✅ Cliente creado exitosamente!\n\n` +
            `ID: ${data.id}\n` +
            `Nombre: ${data.nombre}\n` +
            `Teléfono: ${data.telefono}\n` +
            `Dirección: ${data.direccion}`);
    } catch (error) {
        console.error('Error creando cliente:', error.message);
        await sendMessage(chatId, '❌ Error al crear el cliente. Por favor, intenta de nuevo.');
    }

    session.state = 'idle';
    session.data = {};
}

// Función para enviar mensajes a Telegram usando fetch
async function sendMessage(chatId, text) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error enviando mensaje a Telegram:', error.message);
    }
}

// Función para obtener token usando fetch
async function obtenerToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: process.env.BOT_USER || 'bot_user',
                password: process.env.BOT_PASSWORD || 'bot_password'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error obteniendo token:', error.message);
        // Fallback - token fijo para el bot
        return process.env.BOT_FIXED_TOKEN;
    }
}

// Webhook handler
async function handleWebhook(req, res) {
    try {
        const update = req.body;

        if (update.message) {
            await handleMessage(update.message);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook:', error);
        res.sendStatus(500);
    }
}

// Configurar webhook usando fetch
async function setWebhook() {
    const webhookUrl = `${process.env.WEBHOOK_URL}/telegram-webhook`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: webhookUrl
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.ok) {
            console.log(`✅ Webhook configurado en: ${webhookUrl}`);
        } else {
            console.error('Error configurando webhook:', data.description);
        }
    } catch (error) {
        console.error('Error configurando webhook:', error.message);
    }
}

async function testBot(req, res) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await response.json();

        res.json({
            bot_info: data,
            webhook_configured: process.env.WEBHOOK_URL ? 'Yes' : 'No',
            api_url: API_BASE_URL
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



module.exports = {
    handleWebhook,
    setWebhook,
    testBot
};
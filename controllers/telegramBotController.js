// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_SEDE_ID = parseInt(process.env.BOT_SEDE_ID) || 1; // ID de sede por defecto para el bot

// ⬇️ DEBUG ⬇️
console.log('🔍 DEBUG - Variables de entorno:');
console.log('BOT_TOKEN:', BOT_TOKEN ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('WEBHOOK_URL:', process.env.WEBHOOK_URL ? '✅ Configurado' : '❌ NO CONFIGURADO');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('BOT_SEDE_ID:', BOT_SEDE_ID);

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

    console.log(`📩 Mensaje recibido de ${userId}: ${text}`);

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
            case 'crear_credito_cliente':
                await procesarClienteCredito(chatId, session, text);
                break;
            case 'crear_credito_monto':
                await procesarMontoCredito(chatId, session, text);
                break;
            case 'crear_credito_interes':
                await procesarInteresCredito(chatId, session, text);
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
            case 'crear_cliente_cedula':
                await procesarCedulaCliente(chatId, session, text);
                break;
            case 'crear_cliente_nombre':
                await procesarNombreCliente(chatId, session, text);
                break;
            case 'crear_cliente_apellidos':
                await procesarApellidosCliente(chatId, session, text);
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

// ========================================
// FLUJO: CREAR CRÉDITO
// ========================================

async function iniciarCrearCredito(chatId, session) {
    session.state = 'crear_credito_cliente';
    session.data = {};
    await sendMessage(chatId, 'Por favor, ingresa el ID del cliente:');
}

async function procesarClienteCredito(chatId, session, clienteId) {
    const id = parseInt(clienteId);
    if (isNaN(id)) {
        await sendMessage(chatId, 'Por favor, ingresa un ID válido:');
        return;
    }

    session.data.id_cliente = id;
    session.state = 'crear_credito_monto';
    await sendMessage(chatId, 'Por favor, ingresa el monto del crédito:');
}

async function procesarMontoCredito(chatId, session, monto) {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        await sendMessage(chatId, 'Por favor, ingresa un monto válido (número positivo):');
        return;
    }

    session.data.monto_prestado = montoNum;
    session.state = 'crear_credito_interes';
    await sendMessage(chatId, 'Por favor, ingresa el porcentaje de interés (ejemplo: 20 para 20%):');
}

async function procesarInteresCredito(chatId, session, interes) {
    const interesNum = parseFloat(interes);
    if (isNaN(interesNum) || interesNum < 0) {
        await sendMessage(chatId, 'Por favor, ingresa un interés válido (número positivo o 0):');
        return;
    }

    // Calcular monto a pagar
    const monto_prestado = session.data.monto_prestado;
    const monto_por_pagar = monto_prestado + (monto_prestado * interesNum / 100);
    session.data.monto_por_pagar = monto_por_pagar;
    session.data.interes = interesNum;

    session.state = 'crear_credito_plazo';
    await sendMessage(chatId, 'Por favor, ingresa el plazo en días (ejemplo: 30):');
}

async function procesarPlazoCredito(chatId, session, plazo) {
    const plazoNum = parseInt(plazo);
    if (isNaN(plazoNum) || plazoNum <= 0) {
        await sendMessage(chatId, 'Por favor, ingresa un plazo válido (número positivo):');
        return;
    }

    // Calcular fechas
    const fechaHoy = new Date();
    const fechaPago = new Date();
    fechaPago.setDate(fechaPago.getDate() + plazoNum);

    session.data.fecha_credito = fechaHoy.toISOString().split('T')[0];
    session.data.fecha_pago = fechaPago.toISOString().split('T')[0];
    session.data.estado = 'pendiente';
    session.data.id_sede = BOT_SEDE_ID;
    // Asignar cobrador por defecto (puedes cambiarlo según tu lógica)
    session.data.id_cobrador = 1; // CAMBIAR: deberías tener un cobrador específico para el bot

    try {
        const token = await obtenerToken();

        console.log('📤 Creando crédito:', session.data);

        const response = await fetch(`${API_BASE_URL}/creditos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(session.data)
        });

        const responseText = await response.text();
        console.log('📥 Respuesta del servidor:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const data = JSON.parse(responseText);

        await sendMessage(chatId, `✅ Crédito creado exitosamente!\n\n` +
            `ID: ${data.id_credito || 'Generado'}\n` +
            `Cliente ID: ${session.data.id_cliente}\n` +
            `Monto prestado: $${session.data.monto_prestado}\n` +
            `Monto a pagar: $${session.data.monto_por_pagar}\n` +
            `Interés: ${session.data.interes}%\n` +
            `Fecha de pago: ${session.data.fecha_pago}`);
    } catch (error) {
        console.error('❌ Error creando crédito:', error.message);
        await sendMessage(chatId, `❌ Error al crear el crédito: ${error.message}\n\nVerifica que el ID del cliente sea válido.`);
    }

    session.state = 'idle';
    session.data = {};
}

// ========================================
// FLUJO: PAGAR CRÉDITO
// ========================================

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

        const responseText = await response.text();
        console.log('📥 Respuesta del servidor:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await sendMessage(chatId, `✅ Pago registrado exitosamente!\n\n` +
            `Crédito ID: ${id}\n` +
            `Fecha de pago: ${new Date().toLocaleDateString()}`);
    } catch (error) {
        console.error('❌ Error registrando pago:', error.message);
        await sendMessage(chatId, '❌ Error al registrar el pago. Verifica que el ID del crédito sea válido.');
    }

    session.state = 'idle';
}

// ========================================
// FLUJO: CONSULTAR CLIENTE
// ========================================

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

        const responseText = await clienteResponse.text();
        console.log('📥 Respuesta cliente:', clienteResponse.status, responseText);

        if (!clienteResponse.ok) {
            throw new Error(`HTTP error! status: ${clienteResponse.status}`);
        }

        const cliente = JSON.parse(responseText);

        let mensaje = `📋 INFORMACIÓN DEL CLIENTE\n\n` +
            `ID: ${cliente.id_cliente}\n` +
            `Cédula: ${cliente.cedula || 'No registrada'}\n` +
            `Nombre: ${cliente.nombre} ${cliente.apellidos || ''}\n` +
            `Teléfono: ${cliente.celular || 'No registrado'}\n` +
            `Dirección: ${cliente.direccion || 'No registrada'}\n`;

        // Consultar créditos del cliente
        try {
            const creditosResponse = await fetch(`${API_BASE_URL}/creditos/cliente/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (creditosResponse.ok) {
                const creditosText = await creditosResponse.text();
                const creditos = JSON.parse(creditosText);

                if (creditos && creditos.length > 0) {
                    mensaje += `\n💰 CRÉDITOS (${creditos.length}):\n`;
                    creditos.forEach(credito => {
                        mensaje += `\n- ID: ${credito.id_credito}\n`;
                        mensaje += `  Monto: $${credito.monto_por_pagar}\n`;
                        mensaje += `  Estado: ${credito.estado}\n`;
                        mensaje += `  Fecha pago: ${credito.fecha_pago}\n`;
                    });
                } else {
                    mensaje += `\n💰 No tiene créditos.`;
                }
            }
        } catch (error) {
            console.error('Error consultando créditos:', error);
            mensaje += `\n💰 Error al consultar créditos.`;
        }

        await sendMessage(chatId, mensaje);
    } catch (error) {
        console.error('❌ Error consultando cliente:', error.message);
        await sendMessage(chatId, '❌ Error al consultar el cliente. Verifica que el ID sea válido.');
    }

    session.state = 'idle';
}

// ========================================
// FLUJO: CREAR CLIENTE
// ========================================

async function iniciarCrearCliente(chatId, session) {
    session.state = 'crear_cliente_cedula';
    session.data = {};
    await sendMessage(chatId, 'Por favor, ingresa la cédula del cliente:');
}

async function procesarCedulaCliente(chatId, session, cedula) {
    if (!cedula || cedula.trim().length < 3) {
        await sendMessage(chatId, 'Por favor, ingresa una cédula válida:');
        return;
    }
    session.data.cedula = cedula.trim();
    session.state = 'crear_cliente_nombre';
    await sendMessage(chatId, 'Por favor, ingresa el nombre del cliente:');
}

async function procesarNombreCliente(chatId, session, nombre) {
    if (!nombre || nombre.trim().length < 2) {
        await sendMessage(chatId, 'Por favor, ingresa un nombre válido (mínimo 2 caracteres):');
        return;
    }
    session.data.nombre = nombre.trim();
    session.state = 'crear_cliente_apellidos';
    await sendMessage(chatId, 'Por favor, ingresa los apellidos del cliente:');
}

async function procesarApellidosCliente(chatId, session, apellidos) {
    session.data.apellidos = apellidos.trim();
    session.state = 'crear_cliente_telefono';
    await sendMessage(chatId, 'Por favor, ingresa el número de teléfono del cliente:');
}

async function procesarTelefonoCliente(chatId, session, telefono) {
    session.data.celular = telefono.trim();
    session.state = 'crear_cliente_direccion';
    await sendMessage(chatId, 'Por favor, ingresa la dirección del cliente:');
}

async function procesarDireccionCliente(chatId, session, direccion) {
    session.data.direccion = direccion.trim();
    session.data.id_sede = BOT_SEDE_ID;
    session.data.id_cobrador = 1; // CAMBIAR: Cobrador por defecto para clientes del bot

    try {
        const token = await obtenerToken();

        console.log('📤 Creando cliente:', session.data);

        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(session.data)
        });

        const responseText = await response.text();
        console.log('📥 Respuesta del servidor:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }

        const data = JSON.parse(responseText);

        await sendMessage(chatId, `✅ Cliente creado exitosamente!\n\n` +
            `ID: ${data.id_cliente || 'Generado'}\n` +
            `Cédula: ${session.data.cedula}\n` +
            `Nombre: ${session.data.nombre} ${session.data.apellidos}\n` +
            `Teléfono: ${session.data.celular}\n` +
            `Dirección: ${session.data.direccion}`);
    } catch (error) {
        console.error('❌ Error creando cliente:', error.message);
        await sendMessage(chatId, `❌ Error al crear el cliente: ${error.message}`);
    }

    session.state = 'idle';
    session.data = {};
}

// ========================================
// UTILIDADES
// ========================================

async function sendMessage(chatId, text) {
    try {
        console.log('📤 Enviando mensaje a', chatId);

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('❌ Error de Telegram:', responseData);
            throw new Error(`HTTP error! status: ${response.status}, data: ${JSON.stringify(responseData)}`);
        }

        console.log('✅ Mensaje enviado correctamente');
    } catch (error) {
        console.error('❌ Error enviando mensaje a Telegram:', error.message);
    }
}

async function obtenerToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: process.env.BOT_USER || 'bot_telegram',
                password: process.env.BOT_PASSWORD || 'bot777'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Token obtenido correctamente');
        return data.token;
    } catch (error) {
        console.error('❌ Error obteniendo token:', error.message);
        throw error;
    }
}

async function handleWebhook(req, res) {
    try {
        const update = req.body;
        console.log('📨 Webhook recibido:', JSON.stringify(update, null, 2));

        if (update.message) {
            await handleMessage(update.message);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.sendStatus(500);
    }
}

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
            console.error('❌ Error configurando webhook:', data.description);
        }
    } catch (error) {
        console.error('❌ Error configurando webhook:', error.message);
    }
}

async function testBot(req, res) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await response.json();

        res.json({
            bot_info: data,
            webhook_configured: process.env.WEBHOOK_URL ? 'Yes' : 'No',
            api_url: API_BASE_URL,
            sede_id: BOT_SEDE_ID
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
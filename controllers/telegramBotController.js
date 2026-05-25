// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_SEDE_ID = parseInt(String(process.env.BOT_SEDE_ID || '1').trim(), 10) || 1; // ID de sede por defecto para el bot
const { detectarIntento } = require('../services/ai.service');
const botDataService = require('../services/botDataService');

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
        '/cargar_kb - Cargar el documento de la base de conocimiento\n' +
        '/cancelar - Cancelar operación actual',
    '/cancelar': 'Operación cancelada.',
    '/crearcredito': 'crear_credito',
    '/pagar': 'pagar',
    '/consultarcliente': 'consultar_cliente',
    '/crearcliente': 'crear_cliente',
    '/cargar_kb': 'cargar_kb'
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
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: 'Crear Crédito', callback_data: 'crear_credito' },
                        { text: 'Pagar', callback_data: 'pagar' }
                    ],
                    [
                        { text: 'Consultar Cliente', callback_data: 'consultar' },
                        { text: 'Crear Cliente', callback_data: 'crear_cliente' }
                    ],
                    [
                        { text: 'Cancelar', callback_data: 'cancelar' }
                    ]
                ]
            };

            await sendMessageWithKeyboard(chatId, 'Bienvenido al bot de Gota a Gota. Selecciona una opción:', inlineKeyboard);
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
            } else if (action === 'cargar_kb') {
                await cargarBaseConocimiento(chatId);
            }
        } else {
            await sendMessage(chatId, 'Comando no reconocido. Usa /start para ver los comandos disponibles.');
        }
        return;
    }

    // Manejar respuestas según el estado
    try {
        if (session.state === 'idle' && !text.startsWith('/')) {

            const resultadoIA = await detectarIntento(text);

            console.log('🧠 IA:', resultadoIA);

            switch (resultadoIA.intent) {

                case 'consultar_deuda':
                    await consultarDeudaPorNombre(
                        chatId,
                        resultadoIA.cliente
                    );
                    return;

                case 'clientes_vencidos':
                    await consultarClientesVencidos(chatId);
                    return;

                case 'clientes_pendientes':
                    await consultarClientesPendientes(chatId);
                    return;

                case 'buscar_cliente':
                    await buscarClientePorNombre(
                        chatId,
                        resultadoIA.cliente
                    );
                    return;

                case 'knowledge_query':
                    await consultarBaseConocimiento(
                        chatId,
                        resultadoIA.question || text
                    );
                    return;
            }
        }
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

async function sendMessageWithKeyboard(chatId, text, inlineKeyboard) {
    try {
        console.log('📤 Enviando mensaje con teclado a', chatId);

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                reply_markup: inlineKeyboard
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('❌ Error de Telegram:', responseData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ Mensaje con teclado enviado correctamente');
    } catch (error) {
        console.error('❌ Error enviando mensaje a Telegram:', error.message);
    }
}


async function handleCallbackQuery(callbackQuery) {

    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const callbackQueryId = callbackQuery.id;

    console.log('📌 Data recibida:', data);
    console.log('📌 Tipo de data:', typeof data);

    // Responder el callback para quitar el reloj de carga
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: "Procesando..."
            })
        });
    } catch (error) {
        console.error('Error respondiendo callback:', error);
    }

    // Si data es undefined o null, mostrar error
    if (!data) {
        console.error('❌ Error: callback_data es undefined');
        await sendMessage(chatId, '❌ Error: El botón no tiene acción definida. Por favor usa /start nuevamente.');
        return;
    }

    // Inicializar sesión si no existe
    if (!userSessions.has(chatId)) {
        userSessions.set(chatId, { state: 'idle', data: {} });
    }
    const session = userSessions.get(chatId);

    // Manejar según qué botón presionaron
    switch (data) {
        case 'crear_credito':
            await iniciarCrearCredito(chatId, session);
            break;
        case 'pagar':
            await iniciarPagar(chatId, session);
            break;
        case 'consultar':
            await iniciarConsultarCliente(chatId, session);
            break;
        case 'crear_cliente':
            await iniciarCrearCliente(chatId, session);
            break;
        case 'cancelar':
            session.state = 'idle';
            session.data = {};
            await sendMessage(chatId, 'Operación cancelada.');
            break;
        default:
            console.log('Callback no reconocido:', data);
            await sendMessage(chatId, `Opción no reconocida: "${data}". Usa /start para reiniciar.`);
    }
}

async function buscarClientePorNombre(chatId, nombre) {
    try {
        const clientes = await botDataService.buscarClientePorNombre(nombre, BOT_SEDE_ID);

        if (!clientes.length) {
            await sendMessage(chatId, `No encontré clientes con el nombre "${nombre}".`);
            return;
        }

        let mensaje = `🔎 Clientes encontrados para "${nombre}":\n\n`;

        clientes.forEach((cliente) => {
            mensaje += `• ID: ${cliente.id_cliente}\n`;
            mensaje += `  Nombre: ${cliente.nombre} ${cliente.apellidos || ''}\n`;
            mensaje += `  Cédula: ${cliente.cedula || 'No registrada'}\n`;
            mensaje += `  Celular: ${cliente.celular || 'No registrado'}\n`;
            mensaje += `  Activo: ${cliente.activo ? 'Sí' : 'No'}\n\n`;
        });

        await sendMessage(chatId, mensaje.trim());
    } catch (error) {
        console.error('❌ Error buscando cliente por nombre:', error.message);
        await sendMessage(chatId, '❌ No pude buscar el cliente en este momento.');
    }
}

async function consultarDeudaPorNombre(chatId, nombre) {
    try {
        const resultados = await botDataService.consultarDeudaPorNombre(nombre, BOT_SEDE_ID);

        if (!resultados.length) {
            await sendMessage(chatId, `No encontré un cliente llamado "${nombre}" para consultar la deuda.`);
            return;
        }

        const cliente = resultados[0];
        const deudaFormateada = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(cliente.deuda_total || 0));

        await sendMessage(
            chatId,
            `💰 Deuda de ${cliente.nombre} ${cliente.apellidos || ''}: ${deudaFormateada}\n` +
            `🧾 Créditos pendientes: ${cliente.creditos_pendientes || 0}`
        );
    } catch (error) {
        console.error('❌ Error consultando deuda:', error.message);
        await sendMessage(chatId, '❌ No pude consultar la deuda en este momento.');
    }
}

async function consultarClientesPendientes(chatId) {
    try {
        const pendientes = await botDataService.consultarClientesPendientes(BOT_SEDE_ID);

        if (!pendientes.length) {
            await sendMessage(chatId, '✅ No hay clientes con créditos pendientes en esta sede.');
            return;
        }

        let mensaje = '⏳ Clientes con créditos pendientes:\n\n';

        pendientes.forEach((credito) => {
            mensaje += `• ${credito.nombre} ${credito.apellidos || ''}\n`;
            mensaje += `  ID crédito: ${credito.id_credito}\n`;
            mensaje += `  Estado: ${credito.estado}\n`;
            mensaje += `  Fecha de pago: ${credito.fecha_pago || 'No registrada'}\n`;
            mensaje += `  Monto: ${new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Number(credito.monto_por_pagar || 0))}\n\n`;
        });

        await sendMessage(chatId, mensaje.trim());
    } catch (error) {
        console.error('❌ Error consultando clientes pendientes:', error.message);
        await sendMessage(chatId, '❌ No pude consultar los clientes pendientes.');
    }
}

async function consultarBaseConocimiento(chatId, pregunta) {
    try {
        const token = await obtenerToken();

        const response = await fetch(`${API_BASE_URL}/knowledge/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question: pregunta })
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(responseText);
        }

        const data = JSON.parse(responseText);
        let mensaje = `🧠 ${data.answer}`;

        if (data.sources && data.sources.length) {
            mensaje += `\n\n📚 Fuentes:\n`;
            data.sources.forEach((source) => {
                mensaje += `• ${source.document_name} (chunk ${source.chunk_index + 1})\n`;
            });
        }

        await sendMessage(chatId, mensaje.trim());
    } catch (error) {
        console.error('❌ Error consultando base de conocimiento:', error.message);
        await sendMessage(chatId, '❌ No pude consultar la base de conocimiento.');
    }
}

async function cargarBaseConocimiento(chatId) {
    try {
        const token = await obtenerToken();

        const response = await fetch(`${API_BASE_URL}/knowledge/load-default`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(responseText);
        }

        const data = JSON.parse(responseText);

        await sendMessage(
            chatId,
            `✅ Base de conocimiento cargada: ${data.data.document_name}\n` +
            `📄 Chunks indexados: ${data.data.chunks}`
        );
    } catch (error) {
        console.error('❌ Error cargando base de conocimiento:', error.message);
        await sendMessage(chatId, '❌ No pude cargar la base de conocimiento.');
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
    session.data.id_cobrador = 4; // CAMBIAR: deberías tener un cobrador específico para el bot

    try {
        const token = await obtenerToken();

        console.log('📤 Creando crédito:', session.data);

        const response = await fetch(`${API_BASE_URL}/creditos/`, {
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

        const raw = JSON.parse(responseText);
        const cliente = raw.data;

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
                        // Formatear monto con separadores de miles y 2 decimales
                        const montoFormateado = new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(credito.monto_por_pagar);

                        // Formatear fecha (de ISO a DD/MM/YYYY)
                        let fechaFormateada = 'No especificada';
                        if (credito.fecha_pago) {
                            const fecha = new Date(credito.fecha_pago);
                            if (!isNaN(fecha.getTime())) {
                                fechaFormateada = fecha.toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                });
                            }
                        }

                        // Emoji según estado
                        const estadoEmoji = credito.estado === 'pagado' ? '✅' : '⏳';
                        const estadoTexto = credito.estado === 'pagado' ? 'Pagado' : 'Pendiente';

                        mensaje += `\n• ID: ${credito.id_credito}\n`;
                        mensaje += `  ${estadoEmoji} Estado: ${estadoTexto}\n`;
                        mensaje += `  💰 Monto: ${montoFormateado}\n`;
                        mensaje += `  📅 Fecha pago: ${fechaFormateada}\n`;
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
    session.data.id_cobrador = 4;
    session.data.activo = 1;

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
                contraseña: process.env.BOT_PASSWORD || 'bot777'
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

        // LOG MUY DETALLADO
        console.log('📨 HEADERS:', req.headers);
        console.log('📨 BODY COMPLETO:', JSON.stringify(update, null, 2));

        // Verificar si tiene callback_query
        if (update.callback_query) {
            console.log('🎯 CALLBACK QUERY ENCONTRADO!');
            console.log('Datos del callback:', update.callback_query.data);
            console.log('ID del callback:', update.callback_query.id);
            await handleCallbackQuery(update.callback_query);
        }
        else if (update.message) {
            console.log('💬 MENSAJE NORMAL');
            console.log('Texto:', update.message.text);
            await handleMessage(update.message);
        }
        else {
            console.log('⚠️ Update sin message ni callback_query');
            console.log('Claves recibidas:', Object.keys(update));
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        console.error('Stack:', error.stack);
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
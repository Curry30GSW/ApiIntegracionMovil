const Cobrador = require('../models/Cobrador');

exports.crearCobrador = async (req, res) => {
    try {
        const { nombre, apellidos, celular, direccion, cedula } = req.body;

        // Validaciones básicas
        if (!nombre || !apellidos || !celular || !cedula) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const id = await Cobrador.crear({ nombre, apellidos, celular, direccion, cedula });
        res.status(201).json({ message: 'Cobrador creado exitosamente', id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'La cédula ya está registrada' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

exports.obtenerCobradores = async (req, res) => {
    try {
        const cobradores = await Cobrador.obtenerTodos();
        res.json(cobradores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
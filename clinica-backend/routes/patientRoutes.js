// mi-clinica-app/clinica-backend/routes/patientRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Esto es tu pool de mysql2
const authMiddleware = require('../middleware/authMiddleware');

// --- RUTA GET ALL PATIENTS (Listar pacientes) ---
// Asegúrate de que esta ruta también maneje el clinic_id para administradores
router.get('/', authMiddleware, async (req, res) => {
    const userRole = req.user.role;
    const userClinicId = req.user.clinic_id;

    try {
        let query = 'SELECT * FROM patients';
        const values = [];

        if (userRole !== 'superadmin') {
            if (!userClinicId) {
                return res.status(403).json({ message: 'Acceso denegado: Tu usuario no está asociado a una clínica para ver pacientes.' });
            }
            query += ' WHERE clinic_id = ?'; // Usamos ? para mysql2
            values.push(userClinicId);
        }

        const [rows] = await pool.query(query, values); // mysql2 devuelve [rows, fields]
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error al obtener todos los pacientes:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de pacientes.' });
    }
});

// --- RUTA GET PATIENT BY ID (Obtener paciente individual) ---
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userClinicId = req.user.clinic_id;

    try {
        let query = 'SELECT * FROM patients WHERE id = ?'; // CAMBIO: Usamos ? para mysql2
        let values = [id];

        if (userRole !== 'superadmin') {
            if (!userClinicId) {
                return res.status(403).json({ message: 'Acceso denegado: Tu usuario no está asociado a una clínica.' });
            }
            query += ' AND clinic_id = ?'; // CAMBIO: Usamos ? para mysql2
            values.push(userClinicId);
        }

        const [rows] = await pool.query(query, values); // mysql2 devuelve [rows, fields]

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado o no tienes permiso para verlo.' });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error al obtener paciente por ID:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener el paciente.' });
    }
});

// --- RUTA POST (Crear nuevo paciente) ---
router.post('/', authMiddleware, async (req, res) => {
    const { first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history, clinic_id } = req.body;
    const userRole = req.user.role;
    const userClinicId = req.user.clinic_id;

    // Validar que un admin solo cree pacientes para su propia clínica
    if (userRole === 'admin' && clinic_id !== userClinicId) {
        return res.status(403).json({ message: 'No tienes permiso para crear pacientes en otra clínica.' });
    }
    // Asignar clinic_id si el admin no lo envió o es inválido
    const finalClinicId = userRole === 'admin' ? userClinicId : clinic_id;
    if (!finalClinicId) {
        return res.status(400).json({ message: 'El ID de la clínica es requerido.' });
    }

    try {
        const query = `
            INSERT INTO patients (clinic_id, first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `; // CAMBIO: Usamos ? para mysql2
        const values = [finalClinicId, first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history];

        const [result] = await pool.query(query, values); // mysql2 devuelve [result, fields]
        res.status(201).json({ id: result.insertId, message: 'Paciente creado exitosamente.' });
    } catch (err) {
        console.error('Error al crear paciente:', err);
        // Manejo de error de duplicado de documento_number, si aplica una restricción UNIQUE
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe un paciente con este número de documento.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al crear el paciente.' });
    }
});

// --- RUTA PUT (Actualizar paciente) ---
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history, clinic_id } = req.body;
    const userRole = req.user.role;
    const userClinicId = req.user.clinic_id;

    try {
        // Primero, verificar que el paciente exista y que el usuario tenga permiso para modificarlo
        let checkQuery = 'SELECT clinic_id FROM patients WHERE id = ?'; // CAMBIO: Usamos ?
        let checkValues = [id];
        const [checkRows] = await pool.query(checkQuery, checkValues);

        if (checkRows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        const patientClinicId = checkRows[0].clinic_id;

        // Restricción para admins: solo pueden actualizar pacientes de su clínica
        if (userRole === 'admin' && patientClinicId !== userClinicId) {
            return res.status(403).json({ message: 'No tienes permiso para actualizar este paciente.' });
        }
        // Restricción para superadmins: si intentan cambiar clinic_id, validar que lo hagan bien
        if (userRole === 'superadmin' && clinic_id && clinic_id !== patientClinicId) {
            // Opcional: Podrías añadir una validación aquí para asegurar que el nuevo clinic_id exista
        }

        const query = `
            UPDATE patients
            SET first_name = ?, last_name = ?, document_type = ?, document_number = ?, birth_date = ?, gender = ?, address = ?, phone = ?, email = ?, blood_type = ?, allergies = ?, medical_history = ?, clinic_id = ?
            WHERE id = ?
        `; // CAMBIO: Usamos ? para mysql2
        const values = [first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history, clinic_id, id];

        const [result] = await pool.query(query, values); // mysql2 devuelve [result, fields]

        if (result.affectedRows === 0) {
            // Esto podría ocurrir si el paciente existía pero el ID en la URL no coincide
            // o si un admin intentó modificar un paciente fuera de su clínica (aunque la validación anterior ya lo cubrió)
            return res.status(404).json({ message: 'Paciente no encontrado o no se pudo actualizar.' });
        }

        res.status(200).json({ message: 'Paciente actualizado exitosamente.' });
    } catch (err) {
        console.error('Error al actualizar paciente:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe otro paciente con este número de documento.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el paciente.' });
    }
});

// --- RUTA DELETE (Eliminar paciente) ---
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;
    const userClinicId = req.user.clinic_id;

    try {
        // Primero, verificar que el paciente exista y que el usuario tenga permiso para eliminarlo
        let checkQuery = 'SELECT clinic_id FROM patients WHERE id = ?'; // CAMBIO: Usamos ?
        let checkValues = [id];
        const [checkRows] = await pool.query(checkQuery, checkValues);

        if (checkRows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        const patientClinicId = checkRows[0].clinic_id;

        // Restricción para admins: solo pueden eliminar pacientes de su clínica
        if (userRole === 'admin' && patientClinicId !== userClinicId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este paciente.' });
        }

        const query = 'DELETE FROM patients WHERE id = ?'; // CAMBIO: Usamos ? para mysql2
        const [result] = await pool.query(query, [id]); // mysql2 devuelve [result, fields]

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado o no se pudo eliminar.' });
        }

        res.status(200).json({ message: 'Paciente eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar paciente:', err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el paciente.' });
    }
});

module.exports = router;
// mi-clinica-app/clinica-backend/controllers/patientController.js

const pool = require('../config/db');

// --- 1. Crear un nuevo paciente ---
exports.createPatient = async (req, res) => {
  const {
    clinic_id,
    first_name,
    last_name,
    document_type,
    document_number,
    birth_date,
    gender,
    address,
    phone,
    email,
    blood_type,
    allergies,
    medical_history
  } = req.body;

  if (!clinic_id || !first_name || !last_name || !document_number) {
    return res.status(400).json({ message: 'Los campos clinic_id, first_name, last_name y document_number son requeridos.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [clinicRows] = await connection.execute('SELECT id FROM clinics WHERE id = ?', [clinic_id]);
    if (clinicRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'El ID de la clínica especificada no existe.' });
    }

    const [result] = await connection.execute(
      `INSERT INTO patients (clinic_id, first_name, last_name, document_type, document_number, birth_date, gender, address, phone, email, blood_type, allergies, medical_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinic_id,
        first_name,
        last_name,
        document_type,
        document_number,
        birth_date,
        gender,
        address,
        phone,
        email,
        blood_type,
        allergies,
        medical_history
      ]
    );

    await connection.commit();
    res.status(201).json({ message: 'Paciente creado exitosamente.', patientId: result.insertId });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear el paciente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El número de documento ya está registrado para otro paciente.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al crear el paciente.' });
  } finally {
    if (connection) connection.release();
  }
};

// --- 2. Obtener todos los pacientes (el filtrado por rol se hará en la ruta) ---
exports.getAllPatients = async (req, res) => {
  try {
    const [patients] = await pool.execute('SELECT * FROM patients');
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error al obtener todos los pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener los pacientes.' });
  }
};

// --- 3. Obtener un paciente por ID (la verificación de propiedad se hará en la ruta) ---
exports.getPatientById = async (req, res) => {
  const patientId = req.params.id;
  try {
    const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [patientId]);

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    res.status(200).json(patients[0]);
  } catch (error) {
    console.error('Error al obtener el paciente por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el paciente.' });
  }
};

// --- 4. Actualizar un paciente por ID (la verificación de propiedad y rol se hará en la ruta) ---
exports.updatePatient = async (req, res) => {
  const patientId = req.params.id;
  const {
    clinic_id,
    first_name,
    last_name,
    document_type,
    document_number,
    birth_date,
    gender,
    address,
    phone,
    email,
    blood_type,
    allergies,
    medical_history
  } = req.body;

  if (!clinic_id || !first_name || !last_name || !document_number) {
    return res.status(400).json({ message: 'Los campos principales del paciente son requeridos.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [clinicRows] = await connection.execute('SELECT id FROM clinics WHERE id = ?', [clinic_id]);
    if (clinicRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'El ID de la clínica especificada no existe.' });
    }

    const [result] = await connection.execute(
      `UPDATE patients SET
        clinic_id = ?,
        first_name = ?,
        last_name = ?,
        document_type = ?,
        document_number = ?,
        birth_date = ?,
        gender = ?,
        address = ?,
        phone = ?,
        email = ?,
        blood_type = ?,
        allergies = ?,
        medical_history = ?
       WHERE id = ?`,
      [
        clinic_id,
        first_name,
        last_name,
        document_type,
        document_number,
        birth_date,
        gender,
        address,
        phone,
        email,
        blood_type,
        allergies,
        medical_history,
        patientId
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Paciente no encontrado para actualizar.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Paciente actualizado exitosamente.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar el paciente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El número de documento ya está registrado para otro paciente.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar el paciente.' });
  } finally {
    if (connection) connection.release();
  }
};

// --- 5. Eliminar un paciente por ID (la verificación de propiedad se hará en la ruta) ---
exports.deletePatient = async (req, res) => {
  const patientId = req.params.id;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Paciente no encontrado para eliminar.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Paciente eliminado exitosamente.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar el paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el paciente.' });
  } finally {
    if (connection) connection.release();
  }
};
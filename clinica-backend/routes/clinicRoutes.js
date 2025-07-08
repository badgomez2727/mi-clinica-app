// mi-clinica-app/clinica-backend/routes/clinicRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware'); // <<< Importar authorizeRoles
const clinicController = require('../controllers/clinicController');
const pool = require('../config/db');

// --- RUTAS DE CLÍNICAS (Protegidas con authMiddleware y authorizeRoles) ---

// POST - Crear una nueva clínica con sus sedes (solo superadmin)
router.post('/', authMiddleware, authorizeRoles(['superadmin']), clinicController.createClinic);

// GET - Obtener todas las clínicas (superadmin y admin pueden verlas para asociar usuarios/pacientes)
router.get('/', authMiddleware, authorizeRoles(['superadmin', 'admin']), clinicController.getAllClinics);

// GET - Obtener una sola clínica por ID con sus sedes (superadmin y admin)
router.get('/:id', authMiddleware, authorizeRoles(['superadmin', 'admin']), async (req, res) => {
  const clinicId = req.params.id;
  try {
    const [clinics] = await pool.execute('SELECT id, name, nit, address, service_code, phone, email, logo, small_logo, status FROM clinics WHERE id = ?', [clinicId]);

    if (clinics.length === 0) {
      return res.status(404).json({ message: 'Clínica no encontrada.' });
    }

    const clinic = clinics[0];
    const [branches] = await pool.execute('SELECT id, name, address, phone, service_code FROM clinic_branches WHERE clinic_id = ?', [clinic.id]);

    res.status(200).json({ ...clinic, branches });

  } catch (error) {
    console.error('Error al obtener la clínica por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la clínica.' });
  }
});

// PUT - Actualizar una clínica y sus sedes (solo superadmin)
router.put('/:id', authMiddleware, authorizeRoles(['superadmin']), async (req, res) => {
  const clinicId = req.params.id;
  const { name, nit, address, service_code, phone, email, logo, small_logo, branches, status } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [updateClinicResult] = await connection.execute(
      `UPDATE clinics SET name = ?, nit = ?, address = ?, service_code = ?, phone = ?, email = ?, logo = ?, small_logo = ?, status = ? WHERE id = ?`,
      [name, nit, address, service_code, phone, email, logo, small_logo, status, clinicId]
    );

    if (updateClinicResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Clínica no encontrada para actualizar.' });
    }

    await connection.execute(`DELETE FROM clinic_branches WHERE clinic_id = ?`, [clinicId]);

    if (branches && branches.length > 0) {
      const branchValues = branches.map(branch => [
        clinicId,
        branch.name,
        branch.address,
        branch.phone,
        branch.service_code
      ]);
      await connection.query(
        `INSERT INTO clinic_branches (clinic_id, name, address, phone, service_code) VALUES ?`,
        [branchValues]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Clínica actualizada exitosamente.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar la clínica:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El NIT o algún código de servicio de sede ya existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar la clínica.' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE - Eliminar una clínica por ID (solo superadmin)
router.delete('/:id', authMiddleware, authorizeRoles(['superadmin']), async (req, res) => {
  const clinicId = req.params.id;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute('DELETE FROM clinics WHERE id = ?', [clinicId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Clínica no encontrada para eliminar.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Clínica eliminada exitosamente.' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar la clínica:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar la clínica.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
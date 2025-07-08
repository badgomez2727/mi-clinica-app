const pool = require('../config/db'); // Vamos a crear este archivo en el siguiente paso


// Crear una nueva clínica con sus sedes
exports.createClinic = async (req, res) => {
  const { name, nit, address, service_code, phone, email, logo, small_logo, branches, status } = req.body; // <<< Añadir 'status' aquí

  if (!name || !nit || !address || !service_code || !phone || !email) {
    return res.status(400).json({ message: 'Todos los campos principales de la clínica son requeridos.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insertar la clínica principal
    const [clinicResult] = await connection.execute(
      `INSERT INTO clinics (name, nit, address, service_code, phone, email, logo, small_logo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, // <<< Añadir 'status' a la inserción
      [name, nit, address, service_code, phone, email, logo, small_logo, status || 'active'] // <<< Usar 'status' o 'active' por defecto
    );

    const clinicId = clinicResult.insertId;

    // Insertar las sedes (branches)
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
    res.status(201).json({ message: 'Clínica creada exitosamente.', clinicId });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear la clínica:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El NIT o algún código de servicio de sede ya existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al crear la clínica.' });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todas las clínicas con sus sedes
exports.getAllClinics = async (req, res) => {
  try {
    // Seleccionar todas las columnas de clinics, incluyendo el nuevo 'status'
    const [clinics] = await pool.execute('SELECT id, name, nit, address, service_code, phone, email, logo, small_logo, status FROM clinics'); // <<< Añadir 'status' a la selección

    const clinicsWithBranches = await Promise.all(clinics.map(async (clinic) => {
      const [branches] = await pool.execute('SELECT id, name, address, phone, service_code FROM clinic_branches WHERE clinic_id = ?', [clinic.id]);
      return { ...clinic, branches };
    }));

    res.status(200).json(clinicsWithBranches);

  } catch (error) {
    console.error('Error al obtener todas las clínicas:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener las clínicas.' });
  }
};



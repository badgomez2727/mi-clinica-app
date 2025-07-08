// mi-clinica-app/clinica-backend/middleware/roleMiddleware.js

const pool = require('../config/db'); // Importamos el pool para consultas de verificación

// Middleware para verificar roles permitidos
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso denegado: Rol de usuario no disponible.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: No tienes los permisos necesarios.' });
    }
    next();
  };
};

// Middleware para verificar la propiedad de la clínica para recursos específicos (ej. pacientes)
const checkClinicOwnership = async (req, res, next) => {
  const currentUser = req.user; // Obtenido del authMiddleware (ahora con clinic_id)
  const resourceId = req.params.id; // ID del recurso (paciente) de la URL
  const { clinic_id: bodyClinicId } = req.body; // clinic_id si se envía en el body (para POST/PUT)

  // Si el usuario es un superadmin, no necesita verificación de propiedad de clínica
  if (currentUser.role === 'superadmin') {
    return next();
  }

  // Si el usuario es un admin, debe tener un clinic_id asignado y se aplican restricciones
  if (currentUser.role === 'admin') {
    if (!currentUser.clinic_id) {
      return res.status(403).json({ message: 'Acceso denegado: Administrador no asociado a ninguna clínica.' });
    }

    let connection;
    try {
      connection = await pool.getConnection();

      // Lógica para GET/PUT/DELETE de un recurso existente (ej. /patients/:id)
      if (resourceId) {
        const [rows] = await connection.execute('SELECT clinic_id FROM patients WHERE id = ?', [resourceId]);
        const resource = rows[0];

        if (!resource) {
          return res.status(404).json({ message: 'Paciente no encontrado o no autorizado.' });
        }
        if (resource.clinic_id !== currentUser.clinic_id) {
          return res.status(403).json({ message: 'Acceso denegado: No puedes acceder a recursos de otras clínicas.' });
        }
      }

      // Lógica para POST o PUT donde se especifica clinic_id en el body
      if (bodyClinicId && bodyClinicId !== currentUser.clinic_id) {
        return res.status(403).json({ message: 'Acceso denegado: No puedes crear/modificar recursos para otras clínicas.' });
      }

      // Si es un POST (creación) y el admin no envió clinic_id en el body,
      // le asignamos automáticamente el clinic_id del admin para que el controlador lo use.
      if (req.method === 'POST' && bodyClinicId === undefined) {
          req.body.clinic_id = currentUser.clinic_id;
      }

    } catch (error) {
      console.error('Error al verificar propiedad de la clínica:', error);
      return res.status(500).json({ message: 'Error interno del servidor al verificar la propiedad de la clínica.' });
    } finally {
      if (connection) connection.release();
    }
  }
  next();
};

module.exports = { authorizeRoles, checkClinicOwnership };
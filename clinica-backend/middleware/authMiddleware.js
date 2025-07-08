// mi-clinica-app/clinica-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener el token de "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar la información del usuario (incluido el rol) al objeto de solicitud
    req.user = decoded; // decoded contendrá { id, document_number, role }
    next(); // Pasar al siguiente middleware o controlador de ruta
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authMiddleware;
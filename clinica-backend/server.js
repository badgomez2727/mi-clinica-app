require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Ya no necesitamos importar 'mysql', 'bcrypt', 'jwt' aquí directamente,
// ya que los importamos en sus respectivos controladores/middlewares o en db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/authMiddleware');
const pool = require('./config/db'); // Importa el pool de conexiones

// Importa las rutas de clínicas
const clinicRoutes = require('./routes/clinicRoutes'); 
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
// const JWT_SECRET = process.env.JWT_SECRET; // JWT_SECRET ya se usa en authMiddleware, no es necesario aquí

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API de Clínica funcionando!');
});

// Ruta de autenticación (la dejamos aquí por ahora)
app.post('/api/auth/login', async (req, res) => {
  const { document_number, password } = req.body;

  if (!document_number || !password) {
    return res.status(400).json({ message: 'Número de documento y contraseña son requeridos.' });
  }

  let connection; // Declarar connection aquí para que esté disponible en finally
  try {
    connection = await pool.getConnection(); // Obtener una conexión del pool
    const [rows] = await connection.execute('SELECT id, document_number, password, first_name, last_name, role, clinic_id FROM users WHERE document_number = ?', [document_number]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // bcrypt importado si es necesario en este archivo

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = {
      id: user.id,
      document_number: user.document_number,
      role: user.role,
      clinic_id: user.clinic_id
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Usar process.env.JWT_SECRET

    const { password: userPassword, ...userData } = user;
    res.json({ token, user: userData });

  } catch (error) {
    console.error('Error en el proceso de login:', error);
    res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' });
  } finally {
    if (connection) connection.release(); // Liberar la conexión
  }
});

app.get('/api/auth/verify-token', authMiddleware, (req, res) => {
  // Si el middleware authMiddleware pasa, significa que el token es válido
  // y req.user contiene la información decodificada del token.
  res.status(200).json({
    message: 'Token válido',
    user: req.user // Envía de vuelta la información del usuario del token
  });
});

// Ruta protegida de prueba (sin cambios, solo para demostrar el middleware)
app.get('/api/protected-data', authMiddleware, (req, res) => {
  res.json({
    message: '¡Acceso a datos protegidos exitoso!',
    userData: req.user,
    secretData: 'Esta es información que solo usuarios autenticados pueden ver.'
  });
});

// --- Usar las rutas de clínicas ---
app.use('/api/clinics', clinicRoutes); 
app.use('/api/patients', patientRoutes);
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
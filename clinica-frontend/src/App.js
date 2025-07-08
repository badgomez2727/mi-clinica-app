// mi-clinica-app/clinica-frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css'; // Asegúrate de que tus estilos generales de App estén aquí

// --- Importaciones desde las nuevas ubicaciones ---
import { AuthProvider } from './context/AuthContext';       // Desde src/context/AuthContext.js
import PrivateRoute from './components/PrivateRoute';     // Desde src/components/PrivateRoute.js

// Importación de componentes (¡Ajustadas a la nueva estructura!)
import LoginPage from './components/Auth/Login';          // Login.js ahora en components/Auth/
import Dashboard from './components/Dashboard';             // Dashboard.js sigue en components/

// Componentes de Clínicas (¡Ahora en components/Clinics/)
import ClinicList from './components/Clinics/ClinicList';
import AddClinic from './components/Clinics/AddClinic';
import EditClinic from './components/Clinics/EditClinic';

// Componentes de Pacientes (¡Ahora en components/Patients/)
import PatientList from './components/Patients/PatientList';
import AddPatient from './components/Patients/AddPatient';
import EditPatient from './components/Patients/EditPatient';

import PatientForm from './components/Patients/PatientForm';

// Si tienes componentes de usuario, asegúrate de que sus rutas estén bien si los has movido también:
// import UserList from './components/Users/UserList';
// import AddUser from './components/Users/AddUser';
// import EditUser from './components/Users/EditUser';


function App() {
  return (
    <Router>
      <AuthProvider> {/* Envuelve toda la aplicación para proveer el contexto de autenticación */}
        <Routes>
          {/* Ruta de Login, accesible sin autenticación */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas bajo el Dashboard */}
          {/* El componente Dashboard se renderiza y sus sub-rutas se muestran en su Outlet */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard /> {/* Dashboard siempre se renderizará con su barra lateral */}
              </PrivateRoute>
            }
          >
            {/* Rutas ANIDADAS: Se renderizarán DENTRO del <Outlet /> del Dashboard */}

            {/* Rutas de Usuarios (descomentar si ya los tienes implementados o los vas a hacer) */}
            {/* <Route path="list-users" element={<UserList />} /> */}
            {/* <Route path="add-user" element={<AddUser />} /> */}
            {/* <Route path="edit-user/:id" element={<EditUser />} /> */}

            {/* Rutas de Clínicas */}
            <Route path="list-clinics" element={<ClinicList />} />
            <Route path="add-clinic" element={<AddClinic />} />
            <Route path="edit-clinic/:id" element={<EditClinic />} />

            {/* Rutas de Pacientes */}
            <Route path="list-patients" element={<PatientList />} />
            <Route path="add-patient" element={<AddPatient />} />
            <Route path="edit-patient/:id" element={<EditPatient />} />
            // ... otras importaciones y rutas ...

            <Route path="/dashboard/add-patient" element={<PatientForm />} />
            <Route path="/dashboard/edit-patient/:id" element={<PatientForm />} /> {/* <--- Esta es la que estaba causando el error si no existía */}
            <Route path="/dashboard/list-patients" element={<PatientList />} /> {/* Asumiendo que tienes una PatientList */}

            {/* Ruta por defecto para /dashboard. Redirige a list-clinics si no hay otra coincidencia */}
            <Route index element={<Navigate to="list-clinics" />} />
          </Route>

          {/* Redirección de la raíz (/) */}
          {/* Si alguien va a "/", y está logueado, lo envía a /dashboard. */}
          {/* Si no está logueado, PrivateRoute lo redirigirá a /login. */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            }
          />
          
          {/* Ruta para cualquier otra URL no encontrada (404) */}
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
// mi-clinica-app/clinica-frontend/src/components/Dashboard.js

import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Lógica de roles ---
  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdminClinic = user && user.role === 'admin'; // 'admin' ahora es admin de UNA clínica
  const isDoctor = user && user.role === 'doctor'; // Ejemplo de otro rol
  const clinic = user && user.clinic; // Asumiendo que el objeto user tiene un campo clinic con los datos de la clínica
  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Clínica App</h2> 
          {user && (
            <p>Bienvenido, {user.username} ({user.role})</p>
          )}
        </div>
        <ul className="sidebar-menu">

          {/* Módulos para SuperAdmin (Vista Global) */}
          {isSuperAdmin && (
            <>
              <li className="menu-category">Super Administración</li>
              <li><Link to="list-clinics">Gestionar Todas las Clínicas</Link></li> {/* Ahora muestra TODAS */}
              <li><Link to="add-clinic">Crear Nueva Clínica</Link></li>
              <li><Link to="list-patients">Gestionar Todos los Pacientes</Link></li> {/* Ahora muestra TODOS */}
              {/* Aquí el SuperAdmin podría tener un link para Gestionar Usuarios de CUALQUIER tipo */}
              <li><Link to="list-users">Gestionar Usuarios (Global)</Link></li> {/* Necesitarás este componente */}
              <li><Link to="add-user">Crear Usuario (Global)</Link></li> {/* Necesitarás este componente */}
              <li><Link to="manage-specialties">Gestionar Especialidades</Link></li> {/* Necesitarás este componente */}
              {/* Posiblemente un enlace para un dashboard de métricas globales */}
            </>
          )}

          {/* Módulos para Admin de Clínica (Vista Local) */}
          {isAdminClinic && (
            <>
              <li className="menu-category">Administración de Mi Clínica</li>
              {/* Enlace a "Mi Clínica" que cargará la clínica específica del admin */}
              {user.clinicId && (
                <li><Link to={`edit-clinic/${user.clinicId}`}>Mi Clínica</Link></li>
              )}
              <li><Link to="list-patients">Mis Pacientes</Link></li> {/* Mostrará solo los de su clínica */}
              <li><Link to="add-patient">Crear Nuevo Paciente</Link></li>
              {/* Aquí el Admin de Clínica podría tener enlaces para gestionar doctores de SU CLÍNICA */}
              <li><Link to="list-doctors">Gestionar Mis Doctores</Link></li> {/* Necesitarás este componente */}
              <li><Link to="add-doctor">Añadir Doctor</Link></li> {/* Necesitarás este componente */}
            </>
          )}

          {/* Módulos para Doctores (Ejemplo) */}
          {isDoctor && (
            <>
              <li className="menu-category">Módulos de Doctor</li>
              <li><Link to="my-appointments">Mis Citas</Link></li>
              <li><Link to="my-patients">Mis Pacientes</Link></li> {/* Pacientes asignados a ese doctor */}
            </>
          )}

          {/* Enlaces que podrían ser para todos (si aplica) o solo para algunos roles.
              Si los quieres siempre visibles, sácalos de las condiciones de rol.
              Por ahora, los puse dentro de las condiciones de SuperAdmin/AdminClinic
              porque su significado ("lista de clínicas/pacientes") cambia según el rol.
          */}
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
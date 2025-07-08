// mi-clinica-app/clinica-frontend/src/components/Clinics/ClinicList.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; // ¡Importación de tu instancia centralizada!
import './ClinicList.css';

function ClinicList() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdminClinic = user && user.role === 'admin';

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        if (isSuperAdmin) {
          response = await api.get('/clinics'); // SIN HEADERS EXPLÍCITOS
          setClinics(response.data);
        } else if (isAdminClinic && user.clinic_id) { // Usamos user.clinic_id consistente con JWT payload
          navigate(`/dashboard/edit-clinic/${user.clinic_id}`, { replace: true });
          return;
        } else {
          setError("No tienes permiso para ver esta lista de clínicas.");
          setClinics([]);
        }
      } catch (err) {
        console.error("Error fetching clinics:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError("No tienes autorización para ver las clínicas.");
        } else {
          setError("Error al cargar las clínicas. Inténtalo de nuevo más tarde.");
        }
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchClinics();
    } else if (!user && !loading) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, loading, isSuperAdmin, isAdminClinic]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta clínica?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/clinics/${id}`); // SIN HEADERS EXPLÍCITOS
      setClinics(clinics.filter(clinic => clinic.id !== id)); // Ajustado a clinic.id si tu DB usa 'id'
    } catch (err) {
      console.error("Error deleting clinic:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("No tienes autorización para eliminar clínicas.");
      } else {
        setError("Error al eliminar la clínica. Inténtalo de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando clínicas...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (clinics.length === 0 && isSuperAdmin) {
      return <div className="info-message">No se encontraron clínicas.</div>;
  }
  if (clinics.length === 0 && !isSuperAdmin && !isAdminClinic) {
    return <div className="info-message">No tienes permisos para ver clínicas o no hay clínicas asignadas.</div>;
  }

  return (
    <div className="clinic-list-container">
      <h2>{isSuperAdmin ? 'Todas las Clínicas' : 'Mi Clínica (Admin de Clínica)'}</h2>
      {isSuperAdmin && (
        <button className="add-button" onClick={() => navigate('/dashboard/add-clinic')}>
          Añadir Nueva Clínica
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Estado</th> {/* Añadir columna para el estado */}
            {isSuperAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {clinics.map(clinic => (
            <tr key={clinic.id}> {/* Asegúrate de que tu ID de DB se llama 'id' */}
              <td>{clinic.name}</td>
              <td>{clinic.address}</td>
              <td>{clinic.phone}</td>
              <td>{clinic.email}</td>
              <td>{clinic.status}</td> {/* Mostrar el estado */}
              {isSuperAdmin && (
                <td>
                  <button onClick={() => navigate(`/dashboard/edit-clinic/${clinic.id}`)} className="btn-edit">Editar</button>
                  <button onClick={() => handleDelete(clinic.id)} className="btn-delete">Eliminar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClinicList;
// mi-clinica-app/clinica-frontend/src/components/Patients/PatientList.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import './PatientList.css'; // Asegúrate de crear este CSS

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        // La ruta /api/patients ya maneja el filtrado por clinic_id para admins
        const response = await api.get('/patients');
        setPatients(response.data);
      } catch (err) {
        console.error("Error fetching patients:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError("No tienes autorización para ver los pacientes.");
        } else {
          setError("Error al cargar los pacientes. Inténtalo de nuevo más tarde.");
        }
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Solo si hay un usuario logueado
      fetchPatients();
    } else if (!user && !loading) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, loading]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/patients/${id}`);
      setPatients(patients.filter(patient => patient.id !== id));
    } catch (err) {
      console.error("Error deleting patient:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError("No tienes autorización para eliminar pacientes.");
      } else {
        setError("Error al eliminar el paciente. Inténtalo de nuevo más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando pacientes...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (patients.length === 0) {
      return <div className="info-message">No se encontraron pacientes.</div>;
  }

  return (
    <div className="patient-list-container">
      <h2>Lista de Pacientes</h2>
      {(isSuperAdmin || isAdmin) && (
        <button className="add-button" onClick={() => navigate('/dashboard/add-patient')}>
          Añadir Nuevo Paciente
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Documento</th>
            <th>Clínica ID</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.id}>
              <td>{patient.first_name} {patient.last_name}</td>
              <td>{patient.document_type}: {patient.document_number}</td>
              <td>{patient.clinic_id}</td>
              <td>{patient.phone}</td>
              <td>{patient.email}</td>
              <td>
                <button onClick={() => navigate(`/dashboard/edit-patient/${patient.id}`)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(patient.id)} className="btn-delete">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PatientList;
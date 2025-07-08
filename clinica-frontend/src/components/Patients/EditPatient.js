// mi-clinica-app/clinica-frontend/src/components/EditPatient.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './EditPatient.css'; // O './AddPatient.css' si reutilizas los estilos

function EditPatient() {
  const { id } = useParams(); // Obtiene el ID del paciente de la URL
  const navigate = useNavigate();
  const { token } = useAuth();
  const [patientData, setPatientData] = useState({
    clinic_id: '',
    first_name: '',
    last_name: '',
    document_type: '',
    document_number: '',
    birth_date: '',
    gender: '',
    address: '',
    phone: '',
    email: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
  });
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPatientAndClinics = async () => {
      if (!token) {
        setError('No autorizado: No hay token disponible.');
        setLoading(false);
        return;
      }

      try {
        // Cargar clínicas disponibles
        const clinicsResponse = await fetch('http://localhost:5000/api/clinics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const clinicsData = await clinicsResponse.json();
        if (clinicsResponse.ok) {
          setClinics(clinicsData);
        } else {
          setError(clinicsData.message || 'Error al cargar las clínicas.');
          setLoading(false);
          return;
        }

        // Cargar datos del paciente
        const patientResponse = await fetch(`http://localhost:5000/api/patients/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const patientDataLoaded = await patientResponse.json();

        if (patientResponse.ok) {
          // Formatear birth_date a YYYY-MM-DD para el input type="date"
          if (patientDataLoaded.birth_date) {
            patientDataLoaded.birth_date = new Date(patientDataLoaded.birth_date).toISOString().split('T')[0];
          }
          setPatientData(patientDataLoaded);
        } else {
          setError(patientDataLoaded.message || 'Error al cargar los datos del paciente.');
        }
      } catch (err) {
        console.error('Error de red o del servidor:', err);
        setError('No se pudo conectar con el servidor para cargar el paciente o las clínicas.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAndClinics();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData({ ...patientData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Prepara los datos para enviar, asegurando que birth_date sea formato YYYY-MM-DD o null
    const dataToSend = { ...patientData };
    if (dataToSend.birth_date === '') { // Si el campo de fecha está vacío, enviar null
        dataToSend.birth_date = null;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Paciente actualizado exitosamente.');
        setTimeout(() => navigate('/dashboard/list-patients'), 2000); // Redirigir al listado
      } else {
        setError(data.message || 'Error al actualizar el paciente.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="edit-patient-container">Cargando datos del paciente...</div>;
  }

  if (error && !patientData.first_name) { // Si hay un error inicial y no se cargó el paciente
    return <div className="edit-patient-container error-message">{error}</div>;
  }

  return (
    <div className="edit-patient-container">
      <h2>Editar Paciente: {patientData.first_name} {patientData.last_name}</h2>
      <form onSubmit={handleSubmit} className="edit-patient-form">
        <div className="form-section">
          <h3>Datos del Paciente</h3>

          <div className="form-group">
            <label htmlFor="clinic_id">Clínica Asociada:</label>
            <select
              id="clinic_id"
              name="clinic_id"
              value={patientData.clinic_id}
              onChange={handleChange}
              required
            >
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="first_name">Nombre(s):</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={patientData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Apellido(s):</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={patientData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="document_type">Tipo de Documento:</label>
            <select
              id="document_type"
              name="document_type"
              value={patientData.document_type}
              onChange={handleChange}
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PA">Pasaporte</option>
              <option value="RC">Registro Civil</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="document_number">Número de Documento:</label>
            <input
              type="text"
              id="document_number"
              name="document_number"
              value={patientData.document_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="birth_date">Fecha de Nacimiento:</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={patientData.birth_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Género:</label>
            <select
              id="gender"
              name="gender"
              value={patientData.gender}
              onChange={handleChange}
            >
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={patientData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono:</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={patientData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={patientData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="blood_type">Tipo de Sangre:</label>
            <input
              type="text"
              id="blood_type"
              name="blood_type"
              value={patientData.blood_type}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="allergies">Alergias:</label>
            <textarea
              id="allergies"
              name="allergies"
              value={patientData.allergies}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="medical_history">Historial Médico:</label>
            <textarea
              id="medical_history"
              name="medical_history"
              value={patientData.medical_history}
              onChange={handleChange}
            ></textarea>
          </div>

        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? 'Actualizando...' : 'Actualizar Paciente'}
        </button>
      </form>
    </div>
  );
}

export default EditPatient;
// mi-clinica-app/clinica-frontend/src/components/AddPatient.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AddPatient.css'; // O './AddClinic.css' si lo reutilizas

function AddPatient() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [patientData, setPatientData] = useState({
    clinic_id: '', // Este será un select con las clínicas disponibles
    first_name: '',
    last_name: '',
    document_type: 'CC', // Valor por defecto
    document_number: '',
    birth_date: '',
    gender: 'male', // Valor por defecto
    address: '',
    phone: '',
    email: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
  });
  const [clinics, setClinics] = useState([]); // Para cargar las clínicas disponibles
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchClinics = async () => {
      if (!token) {
        setError('No autorizado: No hay token disponible.');
        setLoadingClinics(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:5000/api/clinics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setClinics(data);
          if (data.length > 0) {
            setPatientData(prevData => ({ ...prevData, clinic_id: data[0].id })); // Seleccionar la primera clínica por defecto
          }
        } else {
          setError(data.message || 'Error al cargar las clínicas.');
        }
      } catch (err) {
        console.error('Error de red o del servidor:', err);
        setError('No se pudo conectar con el servidor para cargar las clínicas.');
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinics();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData({ ...patientData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Convertir birth_date a formato YYYY-MM-DD si no está vacío
    const dataToSend = { ...patientData };
    if (dataToSend.birth_date) {
        const dateObj = new Date(dataToSend.birth_date);
        dataToSend.birth_date = dateObj.toISOString().split('T')[0];
    } else {
        dataToSend.birth_date = null; // Enviar null si está vacío
    }


    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Paciente creado exitosamente.');
        setPatientData({ // Restablecer el formulario
          clinic_id: clinics.length > 0 ? clinics[0].id : '',
          first_name: '',
          last_name: '',
          document_type: 'CC',
          document_number: '',
          birth_date: '',
          gender: 'male',
          address: '',
          phone: '',
          email: '',
          blood_type: '',
          allergies: '',
          medical_history: '',
        });
        setTimeout(() => navigate('/dashboard/list-patients'), 2000);
      } else {
        setError(data.message || 'Error al crear el paciente.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingClinics) {
    return <div className="add-patient-container">Cargando clínicas disponibles...</div>;
  }

  if (error && clinics.length === 0) {
    return <div className="add-patient-container error-message">{error}</div>;
  }

  return (
    <div className="add-patient-container">
      <h2>Añadir Nuevo Paciente</h2>
      <form onSubmit={handleSubmit} className="add-patient-form">
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
          {submitting ? 'Creando...' : 'Crear Paciente'}
        </button>
      </form>
    </div>
  );
}

export default AddPatient;
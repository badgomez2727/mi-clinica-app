// mi-clinica-app/clinica-frontend/src/components/Patients/PatientForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; // Importa tu instancia centralizada de Axios
import './PatientForm.css'; // Asegúrate de crear este CSS

function PatientForm() {
  const { id } = useParams(); // Obtiene el ID del paciente de la URL (para edición)
  const navigate = useNavigate();
  const { user } = useAuth(); // Para verificar el rol y clinic_id

  const [patient, setPatient] = useState({
    clinic_id: user?.clinic_id || '', // Auto-asigna si el usuario es admin
    first_name: '',
    last_name: '',
    document_type: 'CC', // Opcional: valor por defecto
    document_number: '',
    birth_date: '',
    gender: 'Otro', // Opcional: valor por defecto
    address: '',
    phone: '',
    email: '',
    blood_type: '',
    allergies: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(true); // Para la carga inicial de datos en edición
  const [submitting, setSubmitting] = useState(false); // Para el estado de envío del formulario
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isEditing = id ? true : false;

  useEffect(() => {
    // Redireccionar si el usuario no tiene los roles adecuados
    if (user && !['superadmin', 'admin'].includes(user.role)) {
      setError("No tienes permisos para acceder a este formulario.");
      setLoading(false);
      // navigate('/dashboard'); // Opcional: redirigir
      return;
    }

    if (isEditing) {
      setLoading(true);
      setError(null);
      const fetchPatient = async () => {
        try {
          const response = await api.get(`/patients/${id}`); // SIN HEADERS EXPLÍCITOS
          setPatient(response.data);
        } catch (err) {
          console.error("Error fetching patient:", err);
          if (err.response && err.response.status === 404) {
            setError('Paciente no encontrado.');
            // navigate('/dashboard/list-patients', { replace: true });
          } else if (err.response && err.response.status === 403) {
            setError('No tienes permiso para ver este paciente.');
          } else {
            setError('Error al cargar la información del paciente. Inténtalo de nuevo más tarde.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    } else {
      // Si es un nuevo paciente, y el usuario es admin, pre-llenar clinic_id
      if (user && user.role === 'admin' && user.clinic_id) {
        setPatient(prevPatient => ({ ...prevPatient, clinic_id: user.clinic_id }));
      }
      setLoading(false); // No hay carga si es nuevo
    }
  }, [id, isEditing, navigate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient(prevPatient => ({
      ...prevPatient,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Si el usuario es admin, asegura que el clinic_id sea el suyo
    if (user.role === 'admin' && user.clinic_id && patient.clinic_id !== user.clinic_id) {
      setError("No puedes asignar pacientes a otras clínicas.");
      setSubmitting(false);
      return;
    }
    // Si el usuario es admin y clinic_id está vacío, asignarlo
    if (user.role === 'admin' && user.clinic_id && !patient.clinic_id) {
      setPatient(prevPatient => ({ ...prevPatient, clinic_id: user.clinic_id }));
    }

    try {
      if (isEditing) {
        await api.put(`/patients/${id}`, patient); // SIN HEADERS EXPLÍCITOS
        setSuccess('Paciente actualizado exitosamente.');
      } else {
        await api.post('/patients', patient); // SIN HEADERS EXPLÍCITOS
        setSuccess('Paciente creado exitosamente.');
        setPatient({ // Limpiar el formulario después de crear
          clinic_id: user?.clinic_id || '',
          first_name: '', last_name: '', document_type: 'CC', document_number: '',
          birth_date: '', gender: 'Otro', address: '', phone: '', email: '',
          blood_type: '', allergies: '', medical_history: ''
        });
      }
    } catch (err) {
      console.error("Error saving patient:", err);
      if (err.response) {
        setError(err.response.data.message || 'Error al guardar el paciente.');
        if (err.response.status === 401 || err.response.status === 403) {
          setError('No tienes permiso para realizar esta acción. Verifica tu rol o la clínica asignada.');
        }
      } else {
        setError('Error de red o servidor no disponible.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Cargando datos del paciente...</div>;
  }

  if (error && user && !['superadmin', 'admin'].includes(user.role)) {
    return <div className="error-message">{error}</div>;
  }

  if (user && !['superadmin', 'admin'].includes(user.role)) {
    return <div className="error-message">Acceso denegado. Solo los superadministradores y administradores pueden gestionar pacientes.</div>;
  }

  return (
    <div className="patient-form-container">
      <h2>{isEditing ? 'Editar Paciente' : 'Añadir Nuevo Paciente'}</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {/* Solo SuperAdmin puede seleccionar la clínica */}
        {user.role === 'superadmin' && (
          <div className="form-group">
            <label htmlFor="clinic_id">ID de Clínica:</label>
            <input
              type="number"
              id="clinic_id"
              name="clinic_id"
              value={patient.clinic_id}
              onChange={handleChange}
              required
            />
          </div>
        )}
        {/* Si es Admin, mostrar el ID de la clínica (no editable) */}
        {user.role === 'admin' && user.clinic_id && (
          <div className="form-group">
            <label>Clínica Asignada:</label>
            <input
              type="text"
              value={user.clinic_id}
              disabled
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="first_name">Nombre:</label>
          <input type="text" id="first_name" name="first_name" value={patient.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Apellido:</label>
          <input type="text" id="last_name" name="last_name" value={patient.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="document_type">Tipo de Documento:</label>
          <select id="document_type" name="document_type" value={patient.document_type} onChange={handleChange}>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PA">Pasaporte</option>
            <option value="RC">Registro Civil</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="document_number">Número de Documento:</label>
          <input type="text" id="document_number" name="document_number" value={patient.document_number} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="birth_date">Fecha de Nacimiento:</label>
          <input type="date" id="birth_date" name="birth_date" value={patient.birth_date ? patient.birth_date.split('T')[0] : ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Género:</label>
          <select id="gender" name="gender" value={patient.gender} onChange={handleChange}>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="address">Dirección:</label>
          <input type="text" id="address" name="address" value={patient.address} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Teléfono:</label>
          <input type="text" id="phone" name="phone" value={patient.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={patient.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="blood_type">Grupo Sanguíneo:</label>
          <input type="text" id="blood_type" name="blood_type" value={patient.blood_type} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="allergies">Alergias:</label>
          <textarea id="allergies" name="allergies" value={patient.allergies} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="medical_history">Historial Médico:</label>
          <textarea id="medical_history" name="medical_history" value={patient.medical_history} onChange={handleChange}></textarea>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Paciente' : 'Añadir Paciente')}
        </button>
        <button type="button" onClick={() => navigate('/dashboard/list-patients')} className="btn-secondary">
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default PatientForm;
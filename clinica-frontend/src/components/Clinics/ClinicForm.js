// mi-clinica-app/clinica-frontend/src/components/Clinics/ClinicForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; // <--- ¡Importación de tu instancia centralizada!
import './ClinicForm.css'; // Asegúrate de crear este CSS

function ClinicForm() {
  const { id } = useParams(); // Obtiene el ID de la clínica de la URL si existe (para edición)
  const navigate = useNavigate();
  const { user } = useAuth(); // Usamos 'user' para posibles validaciones de rol

  const [clinic, setClinic] = useState({
    name: '',
    nit: '', // Asegúrate de incluir todos los campos de tu backend
    address: '',
    service_code: '',
    phone: '',
    email: '',
    logo: '',
    small_logo: '',
    status: 'Activa', // Valor por defecto
    branches: [] // Para las sedes
  });
  const [loading, setLoading] = useState(true); // Para la carga inicial de datos en edición
  const [submitting, setSubmitting] = useState(false); // Para el estado de envío del formulario
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isEditing = id ? true : false;

  useEffect(() => {
    // Si el usuario no es superadmin, redirigir o mostrar error
    if (user && user.role !== 'superadmin') {
        setError("No tienes permisos para acceder a este formulario.");
        setLoading(false);
        // Opcional: navigate('/dashboard');
        return;
    }

    if (isEditing) {
      setLoading(true);
      setError(null);
      const fetchClinic = async () => {
        try {
          const response = await api.get(`/clinics/${id}`); // <--- SIN HEADERS EXPLÍCITOS
          setClinic(response.data);
        } catch (err) {
          console.error("Error fetching clinic:", err);
          setError('No se pudo cargar la información de la clínica. Inténtalo de nuevo más tarde.');
          if (err.response && err.response.status === 404) {
            navigate('/dashboard/list-clinics', { replace: true });
          } else if (err.response && err.response.status === 403) {
             setError('No tienes permiso para ver esta clínica.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchClinic();
    } else {
      setLoading(false); // No hay carga si es nuevo
    }
  }, [id, isEditing, navigate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClinic(prevClinic => ({
      ...prevClinic,
      [name]: value
    }));
  };

  const handleBranchChange = (index, e) => {
    const { name, value } = e.target;
    const newBranches = [...clinic.branches];
    newBranches[index] = { ...newBranches[index], [name]: value };
    setClinic(prevClinic => ({ ...prevClinic, branches: newBranches }));
  };

  const addBranch = () => {
    setClinic(prevClinic => ({
      ...prevClinic,
      branches: [...prevClinic.branches, { name: '', address: '', phone: '', service_code: '' }]
    }));
  };

  const removeBranch = (index) => {
    const newBranches = clinic.branches.filter((_, i) => i !== index);
    setClinic(prevClinic => ({ ...prevClinic, branches: newBranches }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing) {
        await api.put(`/clinics/${id}`, clinic); // <--- SIN HEADERS EXPLÍCITOS
        setSuccess('Clínica actualizada exitosamente.');
      } else {
        await api.post('/clinics', clinic); // <--- SIN HEADERS EXPLÍCITOS
        setSuccess('Clínica creada exitosamente.');
        setClinic({ // Limpiar el formulario después de crear
          name: '', nit: '', address: '', service_code: '', phone: '', email: '',
          logo: '', small_logo: '', status: 'Activa', branches: []
        });
      }
      // Opcional: redirigir a la lista de clínicas después de un éxito
      // navigate('/dashboard/list-clinics');
    } catch (err) {
      console.error("Error saving clinic:", err);
      if (err.response) {
        setError(err.response.data.message || 'Error al guardar la clínica.');
        if (err.response.status === 401 || err.response.status === 403) {
            setError('No tienes permiso para realizar esta acción. Inicia sesión como superadministrador.');
        }
      } else {
        setError('Error de red o servidor no disponible.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Cargando datos de la clínica...</div>;
  }

  if (error && user && user.role !== 'superadmin') {
    return <div className="error-message">{error}</div>;
  }

  // Si no es superadmin, no renderizar el formulario
  if (user && user.role !== 'superadmin') {
    return <div className="error-message">Acceso denegado. Solo los superadministradores pueden gestionar clínicas.</div>;
  }


  return (
    <div className="clinic-form-container">
      <h2>{isEditing ? 'Editar Clínica' : 'Añadir Nueva Clínica'}</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-group">
          <label htmlFor="name">Nombre:</label>
          <input type="text" id="name" name="name" value={clinic.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="nit">NIT:</label>
          <input type="text" id="nit" name="nit" value={clinic.nit} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="address">Dirección:</label>
          <input type="text" id="address" name="address" value={clinic.address} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="service_code">Código de Servicio:</label>
          <input type="text" id="service_code" name="service_code" value={clinic.service_code} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Teléfono:</label>
          <input type="text" id="phone" name="phone" value={clinic.phone} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={clinic.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="logo">URL Logo:</label>
          <input type="text" id="logo" name="logo" value={clinic.logo} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="small_logo">URL Small Logo:</label>
          <input type="text" id="small_logo" name="small_logo" value={clinic.small_logo} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Estado:</label>
          <select id="status" name="status" value={clinic.status} onChange={handleChange}>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </div>

        <h3>Sedes</h3>
        {clinic.branches.map((branch, index) => (
          <div key={index} className="branch-item">
            <h4>Sede {index + 1}</h4>
            <div className="form-group">
              <label htmlFor={`branch-name-${index}`}>Nombre Sede:</label>
              <input type="text" id={`branch-name-${index}`} name="name" value={branch.name} onChange={(e) => handleBranchChange(index, e)} required />
            </div>
            <div className="form-group">
              <label htmlFor={`branch-address-${index}`}>Dirección Sede:</label>
              <input type="text" id={`branch-address-${index}`} name="address" value={branch.address} onChange={(e) => handleBranchChange(index, e)} />
            </div>
            <div className="form-group">
              <label htmlFor={`branch-phone-${index}`}>Teléfono Sede:</label>
              <input type="text" id={`branch-phone-${index}`} name="phone" value={branch.phone} onChange={(e) => handleBranchChange(index, e)} />
            </div>
            <div className="form-group">
              <label htmlFor={`branch-service_code-${index}`}>Código de Servicio Sede:</label>
              <input type="text" id={`branch-service_code-${index}`} name="service_code" value={branch.service_code} onChange={(e) => handleBranchChange(index, e)} />
            </div>
            <button type="button" onClick={() => removeBranch(index)} className="btn-remove-branch">Eliminar Sede</button>
          </div>
        ))}
        <button type="button" onClick={addBranch} className="btn-add-branch">Añadir Sede</button>
        <br />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Clínica' : 'Añadir Clínica')}
        </button>
        <button type="button" onClick={() => navigate('/dashboard/list-clinics')} className="btn-secondary">
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default ClinicForm;
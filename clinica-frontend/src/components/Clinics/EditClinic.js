import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AddClinic.css'; // Reutilizamos los estilos del formulario de añadir

function EditClinic() {
  const { id } = useParams(); // Obtiene el ID de la clínica de la URL
  const navigate = useNavigate(); // Para redirigir después de la edición
  const { token } = useAuth();
  const [clinicData, setClinicData] = useState({
    name: '',
    nit: '',
    address: '',
    service_code: '',
    phone: '',
    email: '',
    logo: '',
    small_logo: '',
    branches: [],
    status: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar los datos de la clínica al montar el componente
  useEffect(() => {
    const fetchClinic = async () => {
      if (!token) {
        setError('No autorizado: No hay token disponible.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/clinics/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setClinicData(data);
        } else {
          setError(data.message || 'Error al cargar la clínica.');
        }
      } catch (err) {
        console.error('Error de red o del servidor:', err);
        setError('No se pudo conectar con el servidor para cargar la clínica.');
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [id, token]); // Se ejecuta cuando el ID de la URL o el token cambian

  const handleClinicChange = (e) => {
    const { name, value } = e.target;
    setClinicData({ ...clinicData, [name]: value });
  };

  const handleAddBranch = () => {
    setClinicData({
      ...clinicData,
      branches: [
        ...clinicData.branches,
        { name: '', address: '', phone: '', service_code: '' },
      ],
    });
  };

  const handleBranchChange = (index, e) => {
    const { name, value } = e.target;
    const updatedBranches = clinicData.branches.map((branch, i) =>
      i === index ? { ...branch, [name]: value } : branch
    );
    setClinicData({ ...clinicData, branches: updatedBranches });
  };

  const handleRemoveBranch = (index) => {
    const updatedBranches = clinicData.branches.filter((_, i) => i !== index);
    setClinicData({ ...clinicData, branches: updatedBranches });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5000/api/clinics/${id}`, {
        method: 'PUT', // ¡Método PUT para actualizar!
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clinicData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Clínica actualizada exitosamente.');
        // Opcional: redirigir al listado después de un tiempo
        setTimeout(() => navigate('/dashboard/list-clinics'), 2000);
      } else {
        setError(data.message || 'Error al actualizar la clínica.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="add-clinic-container">Cargando datos de la clínica...</div>;
  }

  if (error && !clinicData.name) { // Mostrar error si no se pudo cargar la clínica
    return <div className="add-clinic-container error-message">{error}</div>;
  }

  return (
    <div className="add-clinic-container">
      <h2>Editar Clínica: {clinicData.name}</h2>
      <form onSubmit={handleSubmit} className="add-clinic-form">
        {/* Campos de la Clínica Principal - Reutilizamos la estructura de AddClinic */}
        <div className="form-section">
          <h3>Datos de la Clínica Principal</h3>
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={clinicData.name}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="nit">NIT:</label>
            <input
              type="text"
              id="nit"
              name="nit"
              value={clinicData.nit}
              onChange={handleClinicChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Dirección:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={clinicData.address}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="service_code">Código de Servicio:</label>
            <input
              type="text"
              id="service_code"
              name="service_code"
              value={clinicData.service_code}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Teléfono:</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={clinicData.phone}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={clinicData.email}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="logo">URL Logo:</label>
            <input
              type="text"
              id="logo"
              name="logo"
              value={clinicData.logo}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="small_logo">URL Logo Pequeño:</label>
            <input
              type="text"
              id="small_logo"
              name="small_logo"
              value={clinicData.small_logo}
              onChange={handleClinicChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              name="status"
              value={clinicData.status} // El valor será el que viene de la DB
              onChange={handleClinicChange}
              required
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Suspendida</option>
            </select>
          </div>
        </div>

        {/* Sección de Sedes - Reutilizamos la estructura de AddClinic */}
        <div className="form-section">
          <h3>Sedes</h3>
          {clinicData.branches.map((branch, index) => (
            <div key={branch.id || `new-branch-${index}`} className="branch-group"> {/* Usar branch.id si existe, sino un key temporal */}
              <h4>Sede #{index + 1}</h4>
              <div className="form-group">
                <label htmlFor={`branch-name-${index}`}>Nombre Sede:</label>
                <input
                  type="text"
                  id={`branch-name-${index}`}
                  name="name"
                  value={branch.name}
                  onChange={(e) => handleBranchChange(index, e)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor={`branch-address-${index}`}>Dirección Sede:</label>
                <input
                  type="text"
                  id={`branch-address-${index}`}
                  name="address"
                  value={branch.address}
                  onChange={(e) => handleBranchChange(index, e)}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`branch-phone-${index}`}>Teléfono Sede:</label>
                <input
                  type="text"
                  id={`branch-phone-${index}`}
                  name="phone"
                  value={branch.phone}
                  onChange={(e) => handleBranchChange(index, e)}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`branch-service_code-${index}`}>Código Servicio Sede:</label>
                <input
                  type="text"
                  id={`branch-service_code-${index}`}
                  name="service_code"
                  value={branch.service_code}
                  onChange={(e) => handleBranchChange(index, e)}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBranch(index)}
                className="remove-button"
              >
                Eliminar Sede
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddBranch} className="add-button">
            + Añadir Otra Sede
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? 'Actualizando...' : 'Actualizar Clínica'}
        </button>
      </form>
    </div>
  );
}

export default EditClinic;
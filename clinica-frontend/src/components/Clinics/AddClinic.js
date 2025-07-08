import React, { useState } from 'react';
import './AddClinic.css'; // Crearemos este archivo CSS más adelante
import { useAuth } from '../../context/AuthContext';
function AddClinic() {
  const { token } = useAuth(); // Obtenemos el token del contexto de autenticación
  const [clinicData, setClinicData] = useState({
    name: '',
    nit: '',
    address: '',
    service_code: '',
    phone: '',
    email: '',
    logo: '',
    small_logo: '',
    branches: [], // Para manejar las sedes de la clínica
    status: 'active',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ¡Enviamos el token!
        },
        body: JSON.stringify(clinicData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Clínica creada exitosamente.');
        // Limpiar el formulario después del éxito
        setClinicData({
          name: '',
          nit: '',
          address: '',
          service_code: '',
          phone: '',
          email: '',
          logo: '',
          small_logo: '',
          branches: [],
          status: 'active',
        });
      } else {
        setError(data.message || 'Error al crear la clínica.');
      }
    } catch (err) {
      console.error('Error de red o del servidor:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-clinic-container">
      <h2>Añadir Nueva Clínica</h2>
      <form onSubmit={handleSubmit} className="add-clinic-form">
        {/* Campos de la Clínica Principal */}
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
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              name="status"
              value={clinicData.status}
              onChange={handleClinicChange}
              required
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Suspendida</option>
            </select>
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
        </div>

        {/* Sección de Sedes */}
        <div className="form-section">
          <h3>Sedes</h3>
          {clinicData.branches.map((branch, index) => (
            <div key={index} className="branch-group">
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

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Creando...' : 'Crear Clínica'}
        </button>
      </form>
    </div>
  );
}

export default AddClinic;
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

function ResetPassword() {
  const [nuevaClave, setNuevaClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleChange = (event) => {
    setNuevaClave(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch('http://localhost:5000/reset-password', { // Cambia el puerto según tu configuración del backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, nueva_clave: nuevaClave })
    });
    const result = await response.json();

    if (result.status) {
      setMensaje('Contraseña actualizada exitosamente');
    } else {
      setMensaje(result.message);
    }
  };

  return (
    <div>
      <h2>Restablecer Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nueva Contraseña:
          <input type="password" value={nuevaClave} onChange={handleChange} required />
        </label>
        <button type="submit">Actualizar Contraseña</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default ResetPassword;

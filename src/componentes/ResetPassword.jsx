import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/login.css'; // Asegúrate de que el archivo CSS esté importado

function ResetPassword() {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'nuevaClave') {
      setNuevaClave(value);
    } else if (name === 'confirmarClave') {
      setConfirmarClave(value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (nuevaClave !== confirmarClave) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('http://localhost/acproyect/endpoint/reset-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, nueva_clave: nuevaClave })
      });
      const result = await response.json();

      if (result.status) {
        setMensaje('Contraseña actualizada exitosamente');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/'); // Redirige al login
        }, 2000);
      } else {
        setMensaje(result.message);
      }
    } catch (error) {
      setMensaje('Error al actualizar la contraseña');
      console.error('Error:', error);
    }
  };

  return (
    <div className="login">
      <div className="row ">
        <div className="col-sm-3 offset-4 mt-5">
          <div className="card pt-5">
            <div className="card-header text-center">
              <h2>Restablecer Contraseña</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" id="basic-addon1">🔐</span>
                  </div>
                  <input
                    type="password"
                    name="nuevaClave"
                    className="form-control"
                    placeholder="Nueva Contraseña"
                    aria-label="Nueva Contraseña"
                    aria-describedby="basic-addon1"
                    value={nuevaClave}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" id="basic-addon2">🔐</span>
                  </div>
                  <input
                    type="password"
                    name="confirmarClave"
                    className="form-control"
                    placeholder="Confirmar Contraseña"
                    aria-label="Confirmar Contraseña"
                    aria-describedby="basic-addon2"
                    value={confirmarClave}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="d-flex justify-content-center">
                  <button type="submit" className="btn btn-success btn-lg w-50">
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
              {mensaje && <div className="alert alert-info mt-3">{mensaje}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

import React, { useState } from 'react';
import '../css/login.css'; // Usa el mismo CSS para mantener el formato consistente

const URL_RECOVER_PASSWORD = "http://localhost/aquamar/aquamar/login/recover-password.php";

const enviarData = async (url, data) => {
    const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await resp.json();
    return json;
}

export default function RecoverPassword({ volverAlLogin }) {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleRecoverPassword = async () => {
        setEnviando(true);
        const data = { email };
        const respuestaJson = await enviarData(URL_RECOVER_PASSWORD, data);
        setMensaje(respuestaJson.message);
        setEnviando(false);
    };

    return (
        <div className="login">
            <div className="row ">
                <div className="col-sm-3 offset-4 mt-5">
                    <div className="card pt-5">
                        <div className="car-header text-center">
                            <h2>Recuperar Contraseña</h2>
                        </div>
                        <div className="tarjeta-body">
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="basic-addon1">📧</span>
                                </div>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Correo electrónico"
                                    aria-label="Email"
                                    aria-describedby="basic-addon1"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {mensaje && <div className="alert alert-info">{mensaje}</div>}
                            <div className="d-flex justify-content-center">
                                <button
                                    onClick={handleRecoverPassword}
                                    disabled={enviando}
                                    className="btn btn-primary btn-lg w-50"
                                >
                                    Enviar enlace de recuperación
                                </button>
                            </div>
                            <div className="card-footer mt-2">
                                <a href="#" onClick={volverAlLogin}>Volver al Login</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

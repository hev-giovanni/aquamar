import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';
import usuarioImage from '../imagenes/usuario.png';

const URL_LOGN = "http://localhost/acproyect/login/login.php";

const enviarData = async (url, data) => {
    try {
        const resp = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            },
            // credentials: 'include' // Puedes probar quitando esto si no usas cookies
        });

        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }

        const json = await resp.json();
        return json;
    } catch (error) {
        console.error('Error en la solicitud:', error.message);
        return { error: error.message };
    }
}

export default function Login(props) {
    const [error, setError] = useState(null);
    const [espera, setEspera] = useState(false);
    const refUsuario = useRef(null);
    const refClave = useRef(null);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setEspera(true);
        const data = {
            usuario: refUsuario.current.value,
            clave: refClave.current.value
        };
        const respuestaJson = await enviarData(URL_LOGN, data);
        if (respuestaJson.error) {
            setError(respuestaJson.error);
        } else if (respuestaJson.conectado) {
            props.acceder(true);
            navigate('/menu'); // Redirige a /menu después de iniciar sesión
        } else {
            setError('Credenciales incorrectas');
        }
        setEspera(false);
    }

    const handleRecoverPassword = () => {
        navigate('/recuperar');
    };

    return (
        <div className="login">
            <div className="row ">
                <div className="col-sm-3 offset-4 mt-5">
                    <div className="card pt-5">
                        <div className="card-header text-center">
                            <h2>AQUAMAR & PETS</h2>
                        </div>
                        <div className='userImage'>
                            <img
                                src={usuarioImage}
                                className="img-circle"
                                width={150}
                                height={150}
                            />
                        </div>
                        
                        <div className="card-body">
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="basic-addon1">👤</span>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Username"
                                    aria-label="Username"
                                    aria-describedby="basic-addon1"
                                    ref={refUsuario}
                                />
                            </div>

                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="basic-addon1">🔐</span>
                                </div>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Password"
                                    aria-label="password"
                                    aria-describedby="basic-addon1"
                                    ref={refClave}
                                />
                            </div>
                            {
                                error &&
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            }
                            <div className="d-flex justify-content-center">
                                <button
                                    onClick={handleLogin}
                                    disabled={espera}
                                    className="btn btn-success btn-lg w-50"
                                >
                                    Iniciar Sesión
                                </button>
                            </div>
                            <div className="card-footer mt-2">
                                <span>¿Olvidó su contraseña? </span>
                                <a href="#" onClick={handleRecoverPassword}>Recuperar</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

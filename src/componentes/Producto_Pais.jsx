import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/producto_pais.css';
import LOGO from '../imagenes/logo1.png';


const URL_PRODUCTO_PAIS = "http://190.113.91.230:8082/acproyect/endpoint/producto-pais.php";

const Producto_Pais = () => {
    const [paises, setPaises] = useState([]);
    const [nuevoPais, setNuevoPais] = useState('');
    const [paisEditado, setPaisEditado] = useState({ idPais: '', pais: '' });
    const [token, setToken] = useState('');
    const [mostrarFormularioActualizar, setMostrarFormularioActualizar] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [mensaje, setMensaje] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchPaises(storedToken);
        } else {
            navigate('/login'); // Redirige si no hay token
        }
    }, [navigate]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 2000); // 2 segundos
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchPaises = async (token) => {
        try {
            const response = await fetch(URL_PRODUCTO_PAIS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // Imprimir en consola para depurar
            const responseText = await response.text();
            console.log('Response Text:', responseText); // Verifica lo que se recibe

            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/'); // Redirige si no está autorizado
                return;
            }

            // Intentar analizar la respuesta como JSON
            try {
                const data = JSON.parse(responseText);
                setPaises(data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setMensaje('Error al procesar la respuesta del servidor.');
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
            setMensaje('Error al obtener los países.');
        }
    };

    const handleCreate = async () => {
        try {
            const response = await fetch(URL_PRODUCTO_PAIS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pais: nuevoPais }),
            });

            const responseText = await response.text();
            console.log('Response Text on Create:', responseText); // Verifica lo que se recibe

            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/'); // Redirige si no está autorizado
                return;
            }

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    fetchPaises(token);
                    setNuevoPais('');
                    setSuccessMessage('País creado exitosamente.');
                    setShowCreateForm(false);
                } else {
                    setMensaje(data.error);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setMensaje('Error al procesar la respuesta del servidor.');
            }
        } catch (error) {
            console.error('Error creating country:', error);
            setMensaje('Error al crear el país.');
        }
    };

    const handleUpdate = async () => {
        try {
            const response = await fetch(URL_PRODUCTO_PAIS, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paisEditado),
            });

            const responseText = await response.text();
            console.log('Response Text on Update:', responseText); // Verifica lo que se recibe

            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/'); // Redirige si no está autorizado
                return;
            }

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    fetchPaises(token);
                    setPaisEditado({ idPais: '', pais: '' });
                    setMostrarFormularioActualizar(false);
                    setSuccessMessage('País actualizado exitosamente.');
                } else {
                    setMensaje(data.error);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setMensaje('Error al procesar la respuesta del servidor.');
            }
        } catch (error) {
            console.error('Error updating country:', error);
            setMensaje('Error al actualizar el país.');
        }
    };

    const handleDelete = async (idPais) => {
        try {
            const response = await fetch(`${URL_PRODUCTO_PAIS}?id=${idPais}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const responseText = await response.text();
            console.log('Response Text on Delete:', responseText); // Verifica lo que se recibe

            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/'); // Redirige si no está autorizado
                return;
            }

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    fetchPaises(token);
                    setSuccessMessage('País eliminado exitosamente.');
                } else {
                    setMensaje(data.error);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setMensaje('Error al procesar la respuesta del servidor.');
            }
        } catch (error) {
            console.error('Error deleting country:', error);
            setMensaje('Error al eliminar el país.');
        }
    };

    const handleEditClick = (pais) => {
        setPaisEditado(pais);
        setMostrarFormularioActualizar(true);
    };

    const handleGoToMenu = () => {
        navigate('/menu');
    };

    if (!isAuthorized) {
        return <div>No tienes permiso para acceder a esta página.</div>;
    }

    return (
        <div className="producto-pais-gral">
            <div className="header">
                <h1 className="h1-pais">País de Origen del Producto</h1>
                <img src={LOGO} alt="LOGO AQUAMAR" />
            </div>
            <div className="main-container">
                <div className="lista-y-formulario">
                    <div className="formularios">
                        <div className="formulario-crear">
                            {successMessage && <div className="alert alert-success">{successMessage}</div>}
                            {mensaje && <div className="mensaje">{mensaje}</div>}
                            
                            <h2 className="h2-pais">Crear País</h2>
                            <input 
                                type="text"
                                value={nuevoPais}
                                onChange={(e) => setNuevoPais(e.target.value)}
                                placeholder="Nuevo País"
                            />
                            <button onClick={handleCreate} className="btn-create">Crear País</button>
                            <button onClick={handleGoToMenu} className="btn-create">Regresar al Menú</button>
                        </div>
                        {mostrarFormularioActualizar && (
                            <div className="formulario-editar">
                                <input
                                    type="text"
                                    value={paisEditado.pais}
                                    onChange={(e) => setPaisEditado({ ...paisEditado, pais: e.target.value })}
                                    placeholder="Editar País"
                                />
                                <button onClick={handleUpdate} className="btn-create">Actualizar País</button>
                            </div>
                        )}
                    </div>
                    <div className="lista-paises">
                        <ul className="ul-pais">
                            {paises.map((pais) => (
                                <li key={pais.idPais}>
                                    {pais.pais}
                                    <div className="button-container">
                                        <button onClick={() => handleEditClick(pais)} className="btn-edit">Editar</button>
                                        <button onClick={() => handleDelete(pais.idPais)} className="btn-delete">Eliminar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Producto_Pais;

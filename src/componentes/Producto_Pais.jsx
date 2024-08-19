import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/producto_pais.css';
import '../css/style.css';

const URL_PRODUCTO_PAIS = "http://localhost/acproyect/endpoint/producto-pais.php";

const Producto_Pais = () => {
    const [paises, setPaises] = useState([]);
    const [nuevoPais, setNuevoPais] = useState('');
    const [paisEditado, setPaisEditado] = useState({ idPais: '', pais: '' });
    const [token, setToken] = useState('');
    const [mostrarFormularioActualizar, setMostrarFormularioActualizar] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchPaises(storedToken);
        } else {
            navigate('/login'); // Redirige si no hay token
        }
    }, []);

    const fetchPaises = async (token) => {
        try {
            const response = await fetch(URL_PRODUCTO_PAIS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/no-access'); // Redirige si no está autorizado
                return;
            }
            const data = await response.json();
            setPaises(data);
        } catch (error) {
            console.error('Error fetching countries:', error);
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
            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/no-access'); // Redirige si no está autorizado
                return;
            }
            const data = await response.json();
            if (data.success) {
                fetchPaises(token);
                setNuevoPais('');
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('Error creating country:', error);
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
            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/no-access'); // Redirige si no está autorizado
                return;
            }
            const data = await response.json();
            if (data.success) {
                fetchPaises(token);
                setPaisEditado({ idPais: '', pais: '' });
                setMostrarFormularioActualizar(false);
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('Error updating country:', error);
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
            if (response.status === 403) {
                setIsAuthorized(false);
                navigate('/no-access'); // Redirige si no está autorizado
                return;
            }
            const data = await response.json();
            if (data.success) {
                fetchPaises(token);
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('Error deleting country:', error);
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
        <div>
            <div className="header">
                <h1 className="h1-pais">País de Origen del Producto</h1>
            </div>
            <div className="main-container">
                <div className="lista-y-formulario">
                    <div className="formularios">
                        <div className="formulario-crear">
                            <h2 className="h2-pais">Crear País</h2>
                            <input
                                type="text"
                                value={nuevoPais}
                                onChange={(e) => setNuevoPais(e.target.value)}
                                placeholder="Nuevo País"
                            />
                            <button onClick={handleCreate} className="btn-createpais">Crear País</button>
                            <button onClick={handleGoToMenu} className="btn-createpais">Regresar al Menú</button>
                        </div>
                        {mostrarFormularioActualizar && (
                            <div className="formulario-editar">
                                <input
                                    type="text"
                                    value={paisEditado.pais}
                                    onChange={(e) => setPaisEditado({ ...paisEditado, pais: e.target.value })}
                                    placeholder="Editar País"
                                />
                                <button onClick={handleUpdate} className="btn-updatepais">Actualizar País</button>
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

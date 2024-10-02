import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_unidad.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_DISPOSITIVO = "http://aquamar.xgt2.com:8080/acproyect/endpoint/dispositivo.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php"; 

export default function Dispositivo() {
    const [dispositivo, setDispositivo] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newDispositivo, setNewDispositivo] = useState({
        codigoDispositivo: '',
        descripcion: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchDispositivo = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const permisosResponse = await fetch(URL_PERMISOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!permisosResponse.ok) {
                throw new Error(`HTTP error! status: ${permisosResponse.status}`);
            }

            const permisosData = await permisosResponse.json();
            const permisosMap = permisosData.reduce((acc, permiso) => {
                if (!acc[permiso.moduloNombre]) {
                    acc[permiso.moduloNombre] = [];
                }
                acc[permiso.moduloNombre].push(permiso.permiso);
                return acc;
            }, {});

            setPermisos(permisosMap);

            const dispositivoResponse = await fetch(URL_DISPOSITIVO, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!dispositivoResponse.ok) {
                throw new Error(`HTTP error! status: ${dispositivoResponse.status}`);
            }

            const dispositivoData = await dispositivoResponse.json();

            if (dispositivoData.error) {
                setError(dispositivoData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setDispositivo(dispositivoData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchDispositivo();
    }, [navigate]);

    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage]);

    const handleCreate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_DISPOSITIVO, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDispositivo)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchDispositivo();
                setNewDispositivo({
                    codigoDispositivo: '',
                    descripcion: '',
                }); 
                setSuccessMessage('Dispositivo creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el sensor.');
        }
    };

    const handleChange = (e) => {
        setNewDispositivo({
            ...newDispositivo,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.codigoDispositivo || !editing.descripcion) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_DISPOSITIVO, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editing)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setDispositivo(dispositivo.map(s => s.idDispositivo === editing.idDispositivo ? data : s));
                setEditing(null);
                await fetchDispositivo();
                setSuccessMessage('Dispositivo actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Dispositivo.');
        }
    };

    const handleEdit = (dispositivo) => {
        setEditing({ ...dispositivo });
    };

    const handleSave = () => {
        handleUpdate();
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(`${URL_DISPOSITIVO}?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setDispositivo(dispositivo.filter(s => s.idDispositivo !== id));
                await fetchDispositivo();
                setSuccessMessage('Dispositivo eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Dispostivo.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Dispositivo'] && permisos['Dispositivo'].includes(permiso);  //PERMISOS DEL MODULO CREADO EN MODULOS
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Gestión de Dispositivos</h1>
                <img src={LOGO} alt="LOGO" />
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
    
                {hasPermission('Escribir') && !showCreateForm && !editing && (
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                        Crear 
                    </button>
                )}
                <button onClick={() => navigate('/menu')} className="btn-menum">
                    Menú
                </button>

                {showCreateForm && (
                    <div className="create-form">
                        <h2>Crear Dispositivo</h2>
                        <label htmlFor="unidad">
                            Descripcion - Unidad :
                            <input
                                type="codigoDispositivo"
                                id="codigoDispositivo"
                                name="codigoDispositivo"
                                value={newDispositivo.codigoDispositivo}
                                onChange={handleChange}
                            />
                        </label>
                        <label htmlFor="descripcion">
                            Descripcion:
                            <input
                                type="descripcion"
                                id="descripcion"
                                name="descripcion"
                                value={newDispositivo.descripcion}
                                onChange={handleChange}
                            />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Dispositivo</h2>
                        <label htmlFor="codigoDispositivo">
                            Codigo Dispositivo:
                            <input
                                type="text"
                                id="codigoDispositivo"
                                name="codigoDispositivo"
                                value={editing.codigoDispositivo}
                                onChange={(e) => setEditing({ ...editing, codigoDispositivo: e.target.value })}
                            />
                        </label>
                        <label htmlFor="descripcion">
                            Descripcion:
                            <input
                                type="text"
                                id="descripcion"
                                name="descripcion"
                                value={editing.descripcion}
                                onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                            />
                        </label>
                        <button onClick={handleSave}>Guardar</button>
                        <button onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                )}

                <div className="container3">
                    {!showCreateForm && !editing && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Codigo</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dispositivo.map((dispositivo) => (
                                    <tr key={dispositivo.idDispositivo}>
                                        <td>{dispositivo.codigoDispositivo}</td>
                                        <td>{dispositivo.descripcion}</td>
                                        <td>
                                            {hasPermission('Escribir') && (
                                                <button onClick={() => handleEdit(dispositivo)} className='btn-edit'>Editar</button>
                                            )}
                                            {hasPermission('Borrar') && (
                                                <button onClick={() => handleDelete(dispositivo.idDispositivo)} className='btn-delete'>Eliminar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

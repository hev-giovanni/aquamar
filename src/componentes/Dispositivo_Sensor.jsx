import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_unidad.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_DISPOSITIVO_SENSOR = "http://localhost/acproyect/endpoint/dispositivoSensor.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; 

export default function Sensor() {
    const [dispositivoSensor, setDispositivoSensor] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newDispositivoSensor, setNewDispositivoSensor] = useState({
        idDispositivo: '',
        idSensor: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchDispositivoSensor = async () => {
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

            const dispositivoSensorResponse = await fetch(URL_DISPOSITIVO_SENSOR, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!dispositivoSensorResponse.ok) {
                throw new Error(`HTTP error! status: ${dispositivoSensorResponse.status}`);
            }

            const dispositivoSensorData = await dispositivoSensorResponse.json();

            if (dispositivoSensorData.error) {
                setError(dispositivoSensorData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setDispositivoSensor(dispositivoSensorData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchDispositivoSensor();
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
            const response = await fetch(URL_DISPOSITIVO_SENSOR, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDispositivoSensor)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchDispositivoSensor();
                setNewDispositivoSensor({
                    idDispositivo: '',
                    idSensor: '',
                }); 
                setSuccessMessage('Dispositivo creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el sensor.');
        }
    };

    const handleChange = (e) => {
        setNewDispositivoSensor({
            ...newDispositivoSensor,
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
            const response = await fetch(URL_DISPOSITIVO_SENSOR, {
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
                setDispositivoSensor(dispositivoSensor.map(s => s.idDispositivo === editing.idDispositivo ? data : s));
                setEditing(null);
                await fetchDispositivoSensor();
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
            const response = await fetch(`${URL_DISPOSITIVO_SENSOR}?id=${id}`, {
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
                setDispositivoSensor(dispositivoSensor.filter(s => s.idDispositivo !== id));
                await fetchDispositivoSensor();
                setSuccessMessage('Dispositivo eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Dispostivo.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Dispositivo_Sensor'] && permisos['Dispositivo_Sensor'].includes(permiso);  //PERMISOS DEL MODULO CREADO EN MODULOS
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Asignación de Sensores a Dispositivos</h1>
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
                        <h2>Asignación de Sensores</h2>
                        <label htmlFor="idDispositivo">
                            Dispositivo :
                            <input
                                type="text"
                                id="idDispositivo"
                                name="idDispositivo"
                                value={newDispositivoSensor.idDispositivo}
                                onChange={handleChange}
                            />
                        </label>
                        <label htmlFor="idSensor">
                            Sensor:
                            <input
                                type="text"
                                id="idSensor"
                                name="idSensor"
                                value={newDispositivoSensor.idSensor}
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
                                    <th>Dispositivo</th>
                                    <th>Sensor Asignado</th>
                                    <th>Descripcion</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dispositivoSensor.map((dispositivo) => (
                                    <tr key={dispositivo.idAsignacionD}>
                                        <td>{dispositivo.codigoDispositivo}</td>
                                        <td>{dispositivo.modelo}</td>
                                        <td>{dispositivo.tipo}</td>
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_unidad.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_SENSOR_UNIDAD = "https://190.113.90.230/acproyect/endpoint/sensorUnidad.php";
const URL_PERMISOS = "https://190.113.90.230/acproyect/endpoint/menu-usuario.php"; 

export default function SensorUnidad() {
    const [sensores, setSensores] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newSensor, setNewSensor] = useState({
        simbolo: '',
        unidad: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchSensores = async () => {
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

            const sensoresResponse = await fetch(URL_SENSOR_UNIDAD, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!sensoresResponse.ok) {
                throw new Error(`HTTP error! status: ${sensoresResponse.status}`);
            }

            const sensoresData = await sensoresResponse.json();

            if (sensoresData.error) {
                setError(sensoresData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setSensores(sensoresData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchSensores();
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
            const response = await fetch(URL_SENSOR_UNIDAD, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSensor)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchSensores();
                setNewSensor({
                    simbolo: '',
                    unidad: '',
                }); 
                setSuccessMessage('Sensor creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el sensor.');
        }
    };

    const handleChange = (e) => {
        setNewSensor({
            ...newSensor,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.simbolo || !editing.unidad) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_SENSOR_UNIDAD, {
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
                setSensores(sensores.map(s => s.idSensorUnidad === editing.idSensorUnidad ? data : s));
                setEditing(null);
                await fetchSensores();
                setSuccessMessage('Sensor actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el sensor.');
        }
    };

    const handleEdit = (sensor) => {
        setEditing({ ...sensor });
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
            const response = await fetch(`${URL_SENSOR_UNIDAD}?id=${id}`, {
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
                setSensores(sensores.filter(s => s.idSensorUnidad !== id));
                await fetchSensores();
                setSuccessMessage('Sensor eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el sensor.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Sensor_Unidad'] && permisos['Sensor_Unidad'].includes(permiso);
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Gestión de Sensores</h1>
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
                        <h2>Crear Unidad de Medida de Sensor</h2>
                        <label htmlFor="unidad">
                            Descripcion - Unidad :
                            <input
                                type="text"
                                id="unidad"
                                name="unidad"
                                value={newSensor.unidad}
                                onChange={handleChange}
                            />
                        </label>
                        <label htmlFor="simbolo">
                            Simbolo:
                            <input
                                type="text"
                                id="simbolo"
                                name="simbolo"
                                value={newSensor.simbolo}
                                onChange={handleChange}
                            />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Sensor</h2>
                        <label htmlFor="unidad">
                            Descripcion - Unidad:
                            <input
                                type="text"
                                id="unidad"
                                name="unidad"
                                value={editing.unidad}
                                onChange={(e) => setEditing({ ...editing, unidad: e.target.value })}
                            />
                        </label>
                        <label htmlFor="simbolo">
                            Simbolo:
                            <input
                                type="text"
                                id="simbolo"
                                name="simbolo"
                                value={editing.simbolo}
                                onChange={(e) => setEditing({ ...editing, simbolo: e.target.value })}
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
                                    <th>Unidad</th>
                                    <th>Simbolo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sensores.map((sensor) => (
                                    <tr key={sensor.idSensorUnidad}>
                                        <td>{sensor.unidad}</td>
                                        <td>{sensor.simbolo}</td>
                                        <td>
                                            {hasPermission('Escribir') && (
                                                <button onClick={() => handleEdit(sensor)} className='btn-edit'>Editar</button>
                                            )}
                                            {hasPermission('Borrar') && (
                                                <button onClick={() => handleDelete(sensor.idSensorUnidad)} className='btn-delete'>Eliminar</button>
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

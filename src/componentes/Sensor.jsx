import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/producto_marca.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_SENSOR = "http://localhost/acproyect/endpoint/sensor.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; 
const URL_SENSOR_TIPO = "http://localhost/acproyect/endpoint/sensorTipo.php"; // Endpoint para obtener países
const URL_SENSOR_UNIDAD = "http://localhost/acproyect/endpoint/sensorUnidad.php"; // Endpoint para obtener países

export default function Sensor() {
    const [sensor, setSensor] = useState([]);
    const [tipoSensor, setTipoSensor] = useState([]);
    const [sensorUnidad, setSensorUnidad] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newSensor, setNewSensor] = useState({
        modelo: '',
        idTipoSensor: '',
        idSensorUnidad: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();
    
    const fetchSensor = async () => {
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

            const sensorResponse = await fetch(URL_SENSOR, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!sensorResponse.ok) {
                throw new Error(`HTTP error! status: ${sensorResponse.status}`);
            }

            const sensorData = await sensorResponse.json();

            if (sensorData.error) {
                setError(sensorData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setSensor(sensorData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    const fetchTipoSensor = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_SENSOR_TIPO, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tipoSensorData = await response.json();
            if (tipoSensorData.error) {
                setError(tipoSensorData.error);
            } else {
                setTipoSensor(tipoSensorData);
            }
        } catch (error) {
            setError('Error al obtener los Tipos.');
        }
    };
    const fetchSensorUnidad = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_SENSOR_UNIDAD, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sensorUnidadData = await response.json();
            if (sensorUnidadData.error) {
                setError(sensorUnidadData.error);
            } else {
                setSensorUnidad(sensorUnidadData);
            }
        } catch (error) {
            setError('Error al obtener las Unidades.');
        }
    };


    useEffect(() => {
        fetchSensor();
        fetchTipoSensor();
        fetchSensorUnidad();
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
            const response = await fetch(URL_SENSOR, {
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
                await fetchSensor();
                setNewSensor({
                    modelo: '',
                    idTipoSensor: '',
                    idSensorUnidad: '',
                }); // Limpiar el formulario
                setSuccessMessage('Sensor creado correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear el Sensor.');
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

        // Verificar que todos los campos requeridos estén presentes
        if (!editing.modelo|| !editing.idTipoSensor || !editing.idSensorUnidad) {
            setError('Todos los campos deben estar completos.');
            return;
        }

        try {
            const response = await fetch(URL_SENSOR, {
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
                setSensor(sensor.map(p => p.idSensor === editing.idSensor ? data : p));
                setEditing(null);
                await fetchSensor();
                setSuccessMessage('Sensor actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Sensor.');
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
            const response = await fetch(`${URL_SENSOR}?id=${id}`, {
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
                setSensor(sensor.filter(p => p.idSensor !== id));
                await fetchSensor();
                setSuccessMessage('Sensor eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Sensor.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Sensor'] && permisos['Sensor'].includes(permiso);
    };

    return (
        <div className="marcas-container">
            <h1>GESTION DE SENSORES</h1>
            <img src={LOGO} alt="LOGO AQUAMAR" />
    
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
        <h2>Crear Sensor</h2>
        <label htmlFor="modelo">
            Modelo:
            <input
                type="text"
                id="modelo"
                name="modelo"
                value={newSensor.modelo}
                onChange={handleChange}
            />
        </label>
        <label htmlFor="idTipoSensor">
            Tipo de Sensor:
            <select
                id="idTipoSensor"
                name="idTipoSensor"
                value={newSensor.idTipoSensor}
                onChange={handleChange}
            >
                <option value="">Seleccione un tipo</option>
                {tipoSensor.map(tipo => (
                    <option key={tipo.idTipoSensor} value={tipo.idTipoSensor}>
                        {tipo.tipo}
                    </option>
                ))}
            </select>
        </label>
        <label htmlFor="idSensorUnidad">
            Unidad de Medida:
            <select
                id="idSensorUnidad"
                name="idSensorUnidad"
                value={newSensor.idSensorUnidad}
                onChange={handleChange}
            >
                <option value="">Seleccione una Medida</option>
                {sensorUnidad.map(unidad => (
                    <option key={unidad.idSensorUnidad} value={unidad.idSensorUnidad}>
                        {unidad.unidad}
                    </option>
                ))}
            </select>
        </label>
        <button onClick={handleCreate}>Crear</button>
        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
    </div>
)}

            {editing && (
                <div className="edit-form">
                    <h2>Editar Sensor</h2>
                    <label htmlFor="sensor">
                        Modelo:
                        <input
                            type="text"
                            id="modelo"
                            name="modelo"
                            value={editing.modelo}
                            onChange={(e) => setEditing({ ...editing, modelo: e.target.value })}
                        />
                    </label>
                    <label htmlFor="idTipoSensor">
                        Tipo de Sensor:
                        <select
                            id="idTipoSensor"
                            name="idTipoSensor"
                            value={editing.idTipoSensor}
                            onChange={(e) => setEditing({ ...editing, idTipoSensor: e.target.value })}
                        >
                            <option value="">Seleccione un Tipo</option>
                            {tipoSensor.map(tipo => (
                                <option key={tipo.idTipoSensor} value={tipo.idTipoSensor}>
                                    {tipo.tipo}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label htmlFor="idSensorUnidad">
                        Sensor Unidad:
                        <select
                            id="idSensorUnidad"
                            name="idSensorUnidad"
                            value={editing.idSensorUnidad}
                            onChange={(e) => setEditing({ ...editing, idSensorUnidad: e.target.value })}
                        >
                            <option value="">Seleccione Unidad de Medida</option>
                            {sensorUnidad.map(unidad => (
                                <option key={unidad.idSensorUnidad} value={unidad.idSensorUnidad}>
                                    {unidad.simbolo}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleSave}>Guardar</button>
                    <button onClick={() => setEditing(null)}>Cancelar</button>
                </div>
            )}
       <div  className="container-marca2">
            {!showCreateForm && !editing && (
                <table>
                    <thead>
                        <tr>
                            <th>Modelo</th>
                            <th>Tipo Sensor</th>
                            <th>Unidad</th>
                            <th>Simbolo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sensor.map((sensor) => (
                            <tr key={sensor.idSensor}>
                                <td>{sensor.modelo}</td>
                                <td>{sensor.tipo}</td>
                                <td>{sensor.unidad}</td>
                                <td>{sensor.simbolo}</td>
                                <td>
                                    {hasPermission('Escribir') && (
                                        <button onClick={() => handleEdit(sensor)} className="btn-edit">Editar</button>
                                    )}
                                    {hasPermission('Borrar') && (
                                        <button onClick={() => handleDelete(sensor.idSensor)} className="btn-delete">Eliminar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            </div>
        </div>
    );
    
}

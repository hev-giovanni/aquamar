import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_unidad.css'; 
import '../css/dispositivoSensor.css'; 

import LOGO from '../imagenes/logo1.png';

const URL_DISPOSITIVO_SENSOR = "http://aquamar.xgt2.com:8080/acproyect/endpoint/dispositivoSensor.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php"; 
const URL_SENSOR = "http://aquamar.xgt2.com:8080/acproyect/endpoint/sensor.php";
const URL_DISPOSITIVO = "http://aquamar.xgt2.com:8080/acproyect/endpoint/dispositivo.php";

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
    const [sensors, setSensors] = useState([]);
    const [dispositivos, setDispositivos] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
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

            const [dispositivoSensorResponse, sensorsResponse, dispositivosResponse] = await Promise.all([
                fetch(URL_DISPOSITIVO_SENSOR, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_SENSOR, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_DISPOSITIVO, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!dispositivoSensorResponse.ok || !sensorsResponse.ok || !dispositivosResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const dispositivoSensorData = await dispositivoSensorResponse.json();
            const sensorsData = await sensorsResponse.json();
            const dispositivosData = await dispositivosResponse.json();

            if (dispositivoSensorData.error) {
                setError(dispositivoSensorData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setDispositivoSensor(dispositivoSensorData);
            }

            setSensors(sensorsData);
            setDispositivos(dispositivosData);

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

    const handleSelectChange = (selectedId) => {
        const selectedDispositivo = dispositivoSensor.find(d => d.idAsignacionD === selectedId);
        if (selectedDispositivo) {
            // Aquí puedes hacer algo con el dispositivo seleccionado
            console.log('Dispositivo seleccionado:', selectedDispositivo);
        }
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }
    
        if (!editing.idDispositivo || !editing.idSensor) {
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

    // Filtrar datos basados en el término de búsqueda
    const filteredDispositivoSensor = dispositivoSensor.filter(dispositivo =>
        (dispositivo.codigoDispositivo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dispositivo.modelo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dispositivo.tipo || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Asignación de Sensores a Dispositivos</h1>
                <img src={LOGO} alt="LOGO" />
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
    
                {hasPermission('Escribir') && !showCreateForm && !editing && (
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                        Asignar
                    </button>
                )}
                <button onClick={() => navigate('/menu')} className="btn-menum">
                    Menú
                </button>
                {showCreateForm && (
                    <div className="create-form">
                        <h2>Agregar Nuevo Dispositivo Sensor</h2>
                        <label>ID Dispositivo:</label>
                        <select
                            name="idDispositivo"
                            value={newDispositivoSensor.idDispositivo}
                            onChange={handleChange}
                        >
                            <option value="">Seleccionar Dispositivo</option>
                            {dispositivos.map((dispositivo) => (
                                <option key={dispositivo.idDispositivo} value={dispositivo.idDispositivo}>
                                    {dispositivo.codigoDispositivo}
                                </option>
                            ))}
                        </select>
    
                        <label>ID Sensor:</label>
                        <select
                            name="idSensor"
                            value={newDispositivoSensor.idSensor}
                            onChange={handleChange}
                        >
                            <option value="">Seleccionar Sensor</option>
                            {sensors.map((sensor) => (
                                <option key={sensor.idSensor} value={sensor.idSensor}>
                                    {sensor.modelo}
                                </option>
                            ))}
                        </select>
    
                        <button onClick={handleCreate} className="btn-submit">Crear</button>
                        <button onClick={() => setShowCreateForm(false)} className="btn-cancel">Cancelar</button>
                    </div>
                )}
                
                <div className="container3">
                    {/* Conditionally render search-container */}
                    {!showCreateForm && !editing && (
                        <div className="search-container">
                            <h6>Filtro</h6>
                            <input 
                                type="text" 
                                placeholder="Dispositivo/Sensor/Tipo"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                         <p>&nbsp;</p>  
                        </div>
                    )}
    
                    {!showCreateForm && !editing && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Dispositivo</th>
                                    <th>Sensor Asignado</th>
                                    <th>Tipo de Sensor</th>
                                    {hasPermission('Escribir') && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDispositivoSensor.map((item) => (
                                    <tr key={item.idAsignacionD}>
                                        <td>{item.codigoDispositivo}</td>
                                        <td>{item.modelo}</td>
                                        <td>{item.tipo}</td>
                                        {hasPermission('Escribir') && (
                                            <td>
                                                <button onClick={() => handleEdit(item)} className='btn-edit'>Editar</button>
                                                <button onClick={() => handleDelete(item.idAsignacionD)} className='btn-delete'>Eliminar</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
    
                {editing && (
                    <div className="edit-form">
                        <h2>Editar Dispositivo Sensor</h2>
                        <label>Dispositivo:</label>
                        <select
                            name="idDispositivo"
                            value={editing.idDispositivo}
                            onChange={(e) => setEditing({ ...editing, idDispositivo: e.target.value })}
                        >
                            <option value="">Seleccionar Dispositivo</option>
                            {dispositivos.map((dispositivo) => (
                                <option key={dispositivo.idDispositivo} value={dispositivo.idDispositivo}>
                                    {dispositivo.codigoDispositivo}
                                </option>
                            ))}
                        </select>
    
                        <label>Sensor:</label>
                        <select
                            name="idSensor"
                            value={editing.idSensor}
                            onChange={(e) => setEditing({ ...editing, idSensor: e.target.value })}
                        >
                            <option value="">Seleccionar Sensor</option>
                            {sensors.map((sensor) => (
                                <option key={sensor.idSensor} value={sensor.idSensor}>
                                    {sensor.modelo}
                                </option>
                            ))}
                        </select>
    
                        <button onClick={handleSave} className="btn-save">Guardar</button>
                        <button onClick={() => setEditing(null)} className="btn-cancel">Cancelar</button>
                    </div>
                )}
            </div>
        </div>
    );
}    
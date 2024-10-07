import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_tipo.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_SENSOR_TIPO = "https://190.113.90.230/acproyect/endpoint/sensorTipo.php";
const URL_PERMISOS = "https://190.113.90.230/acproyect/endpoint/menu-usuario.php"; 

export default function SensorTipo() {
    const [sensores, setSensores] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newSensor, setNewSensor] = useState({
       tipo: '',
        
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

            const sensoresResponse = await fetch(URL_SENSOR_TIPO, {
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
            const response = await fetch(URL_SENSOR_TIPO, {
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
                    tipo: '',
                }); 
                setSuccessMessage('Tipo Sensor creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el tipo de sensor.');
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

        if (!editing.tipo) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_SENSOR_TIPO, {
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
                setSensores(sensores.map(s => s.idTipoSensor === editing.idTipoSensor ? data : s));
                setEditing(null);
                await fetchSensores();
                setSuccessMessage('Tipo Sensor actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Tipo de sensor.');
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
            const response = await fetch(`${URL_SENSOR_TIPO}?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Puedes eliminar 'Content-Type': 'application/json' si no estás enviando un cuerpo
                }
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            // Si la respuesta no tiene cuerpo, puedes omitir el parseo a JSON
            // Si necesitas hacer algo con la respuesta, revisa si el servidor está devolviendo algún dato útil
            // const data = await response.json();
            // if (data.error) {
            //     setError(data.error);
            // } else {
                setSensores(sensores.filter(s => s.idTipoSensor !== id));
                await fetchSensores();
                setSuccessMessage('Tipo Sensor eliminado correctamente.');
            // }
        } catch (error) {
            setError('Error al eliminar el Tipo sensor.');
            console.error(error); // Añade esto para depurar cualquier error
        }
        
    };

    const hasPermission = (permiso) => {
        return permisos['Sensor_Tipo'] && permisos['Sensor_Tipo'].includes(permiso);
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Gestión de Tipo de Sensores</h1>
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
                        <h2>Crear Tipo de Sensor</h2>
                        <label htmlFor="tipo">
                            Tipo de Sensor:
                            <input
                                type="text"
                                id="tipo"
                                name="tipo"
                                value={newSensor.tipo}
                                onChange={handleChange}
                            />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Tipo de Sensor</h2>
                        <label htmlFor="tipo">
                            Tipo de Sensor:
                            <input
                                type="text"
                                id="tipo"
                                name="tipo"
                                value={editing.tipo}
                                onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}
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
                                    <th>Tipo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sensores.map((sensor) => (
                                    <tr key={sensor.idTipoSensor}>
                                        <td>{sensor.tipo}</td>
                                        <td>
                                            {hasPermission('Escribir') && (
                                                <button onClick={() => handleEdit(sensor)} className='btn-edit'>Editar</button>
                                            )}
                                            {hasPermission('Borrar') && (
                                                <button onClick={() => handleDelete(sensor.idTipoSensor)} className='btn-delete'>Eliminar</button>
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_unidad.css'; 
import '../css/dispositivoSensor.css'; 

import LOGO from '../imagenes/logo1.png';

const URL_ALTA_MONITOREO = "http://localhost/acproyect/endpoint/altaMonitoreo.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; 
const URL_SENSOR = "http://localhost/acproyect/endpoint/sensor.php";
const URL_DISPOSITIVO = "http://localhost/acproyect/endpoint/dispositivo.php";

export default function AltaMonitoreo() {
    const [altaMonitoreo, setAltaMonitoreo] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newAltaMonitoreo, setNewAltaMonitoreo] = useState({
        idUsuario: '',
        codigo: '',
        idAsignacionD: '',
        limite: '',
    });
    const [sensors, setSensors] = useState([]);
    const [dispositivos, setDispositivos] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); 
    const navigate = useNavigate();

    const fetchAltaMonitoreo = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const permisosResponse = await fetch(URL_PERMISOS, {
                method: 'GET',
                headers: {
                    'Authorization': Bearer ${token},
                    'Content-Type': 'application/json'
                }
            });

            if (!permisosResponse.ok) {
                throw new Error(HTTP error! status: ${permisosResponse.status});
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

            const [altaMonitoreoResponse, sensorsResponse, dispositivosResponse] = await Promise.all([
                fetch(URL_ALTA_MONITOREO, {
                    method: 'GET',
                    headers: {
                        'Authorization': Bearer ${token},
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_SENSOR, {
                    method: 'GET',
                    headers: {
                        'Authorization': Bearer ${token},
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_DISPOSITIVO, {
                    method: 'GET',
                    headers: {
                        'Authorization': Bearer ${token},
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!altaMonitoreoResponse.ok || !sensorsResponse.ok || !dispositivosResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const altaMonitoreoData = await altaMonitoreoResponse.json();
            const sensorsData = await sensorsResponse.json();
            const dispositivosData = await dispositivosResponse.json();

            if (altaMonitoreoData.error) {
                setError(altaMonitoreoData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setAltaMonitoreo(altaMonitoreoData);
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
        fetchAltaMonitoreo();
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
            const response = await fetch(URL_ALTA_MONITOREO, {
                method: 'POST',
                headers: {
                    'Authorization': Bearer ${token},
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAltaMonitoreo)
            });

            if (!response.ok) {
                throw new Error(HTTP error! status: ${response.status});
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchAltaMonitoreo();
                setNewAltaMonitoreo({
                    idUsuario: '',
                    codigo: '',
                    idAsignacionD: '',
                    limite: '',
                }); 
                setSuccessMessage('Alta creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el alta de monitoreo.');
        }
    };

    const handleChange = (e) => {
        setNewAltaMonitoreo({
            ...newAltaMonitoreo,
            [e.target.name]: e.target.value
        });
    };

    const handleSelectChange = (selectedId) => {
        const selectedDispositivo = dispositivos.find(d => d.idAsignacionD === selectedId);
        if (selectedDispositivo) {
            console.log('Dispositivo seleccionado:', selectedDispositivo);
        }
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }
    
        if (!editing.idUsuario || !editing.idAsignacionD) {
            setError('Datos incompletos.');
            return;
        }
    
        try {
            const response = await fetch(URL_ALTA_MONITOREO, {
                method: 'PUT',
                headers: {
                    'Authorization': Bearer ${token},
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editing)
            });
    
            if (!response.ok) {
                throw new Error(HTTP error! status: ${response.status});
            }
    
            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setAltaMonitoreo(altaMonitoreo.map(a => a.idAsignacionD === editing.idAsignacionD ? data : a));
                setEditing(null);
                await fetchAltaMonitoreo();
                setSuccessMessage('Alta actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el alta de monitoreo.');
        }
    };

    const handleEdit = (alta) => {
        setEditing({ ...alta });
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
            const response = await fetch(${URL_ALTA_MONITOREO}?id=${id}, {
                method: 'DELETE',
                headers: {
                    'Authorization': Bearer ${token},
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(HTTP error! status: ${response.status});
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setAltaMonitoreo(altaMonitoreo.filter(a => a.idAsignacionD !== id));
                await fetchAltaMonitoreo();
                setSuccessMessage('Eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el alta de monitoreo.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Alta_Monitoreo'] && permisos['Alta_Monitoreo'].includes(permiso);
    };

    // Filtrar datos basados en el término de búsqueda
    const filteredAltaMonitoreo = altaMonitoreo.filter(item =>
        (item.codigo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.idAsignacionD || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="monitor-container">
            <img src={LOGO} alt="Logo" />
            <h1>Alta Monitoreo</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            
            {hasPermission('Crear') && (
                <button onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? 'Cancelar' : 'Crear Alta'}
                </button>
            )}
            
            {showCreateForm && (
                <div className="create-form">
                    <input
                        type="text"
                        name="idUsuario"
                        value={newAltaMonitoreo.idUsuario}
                        onChange={handleChange}
                        placeholder="ID Usuario"
                    />
                    <input
                        type="text"
                        name="codigo"
                        value={newAltaMonitoreo.codigo}
                        onChange={handleChange}
                        placeholder="Código"
                    />
                    <input
                        type="text"
                        name="idAsignacionD"
                        value={newAltaMonitoreo.idAsignacionD}
                        onChange={handleChange}
                        placeholder="ID Asignación"
                    />
                    <input
                        type="number"
                        name="limite"
                        value={newAltaMonitoreo.limite}
                        onChange={handleChange}
                        placeholder="Límite"
                    />
                    <button onClick={handleCreate}>Guardar</button>
                </div>
            )}
            
            <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Código</th>
                        <th>Dispositivo</th>
                        <th>Modelo</th>
                        <th>Tipo</th>
                        <th>Limite</th>
                        <th>Acciones</th>
                        {hasPermission('Editar') && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredAltaMonitoreo.map((item) => (
                        <tr key={item.idAsignacionD}>
                            <td>{item.usuario}</td>
                            <td>{item.codigo}</td>
                            <td>{item.codigoDispositivo}</td>
                            <td>{item.modelo}</td>
                            <td>{item.tipo}</td>
                            <td>{item.limite}</td>
                            {hasPermission('Editar') && (
                                <td>
                                    <button onClick={() => handleEdit(item)}>Editar</button>
                                    <button onClick={() => handleDelete(item.idAsignacionD)}>Eliminar</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {editing && (
                <div className="edit-form">
                    <h2>Editar Alta</h2>
                    <input
                        type="text"
                        name="idUsuario"
                        value={editing.idUsuario}
                        onChange={(e) => setEditing({ ...editing, idUsuario: e.target.value })}
                    />
                    <input
                        type="text"
                        name="codigo"
                        value={editing.codigo}
                        onChange={(e) => setEditing({ ...editing, codigo: e.target.value })}
                    />
                    <input
                        type="text"
                        name="idAsignacionD"
                        value={editing.idAsignacionD}
                        onChange={(e) => setEditing({ ...editing, idAsignacionD: e.target.value })}
                    />
                    <input
                        type="number"
                        name="limite"
                        value={editing.limite}
                        onChange={(e) => setEditing({ ...editing, limite: e.target.value })}
                    />
                    <button onClick={handleSave}>Guardar Cambios</button>
                </div>
            )}
        </div>
    );
}
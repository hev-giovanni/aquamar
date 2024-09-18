import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';
import '../css/sensor_unidad.css';
import '../css/dispositivoSensor.css';

import LOGO from '../imagenes/logo1.png';

const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php";
const URL_ALTA_PERMISO = "http://localhost/acproyect/endpoint/altaRolPermiso.php";
const URL_ROLES = "http://localhost/acproyect/endpoint/roles.php";
const URL_MODULO = "http://localhost/acproyect/endpoint/modulo.php";
const URL_PERMISOS_LISTADO = "http://localhost/acproyect/endpoint/permisosListado.php";

export default function AltaRolPermiso() {
    const [altaRolPermiso, setAltaRolPermiso] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newAltaRolPermiso, setNewAltaRolPermiso] = useState({
        idRol: '',
        idModulo: '',
        idPermiso: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchAltaRolPermiso = async () => {
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

            const altaRolPermisoResponse = await fetch(URL_ALTA_PERMISO, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!altaRolPermisoResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const altaRolPermisoData = await altaRolPermisoResponse.json();
            if (altaRolPermisoData.error) {
                setError(altaRolPermisoData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setAltaRolPermiso(altaRolPermisoData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchAltaRolPermiso();
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
            const response = await fetch(URL_ALTA_PERMISO, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAltaRolPermiso)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchAltaRolPermiso();
                setNewAltaRolPermiso({
                    idRol: '',
                    idModulo: '',
                    idPermiso: '',
                });
                setSuccessMessage('Alta correctamente.');
                setShowCreateForm(false);
            }
        } catch (error) {
            setError('Error al asignar.');
        }
    };

    const handleChange = (e) => {
        setNewAltaRolPermiso({
            ...newAltaRolPermiso,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.idRol || !editing.idModulo || !editing.idPermiso) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_ALTA_PERMISO, {
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
                setAltaRolPermiso(altaRolPermiso.map(s => s.idRol === editing.idRol ? data : s));
                setEditing(null);
                await fetchAltaRolPermiso();
                setSuccessMessage('Actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar.');
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(`${URL_ALTA_PERMISO}?id=${id}`, {
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
                setAltaRolPermiso(altaRolPermiso.filter(s => s.idRol !== id));
                await fetchAltaRolPermiso();
                setSuccessMessage('Dispositivo eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el dispositivo.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Alta_Modulos-Roles'] && permisos['Alta_Modulos-Roles'].includes(permiso);
    };

    const filteredAltaRolPermiso = altaRolPermiso.filter(item =>
        (item.idRol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.idModulo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.idPermiso || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>ALTA DE PERMISOS</h1>
                <img src={LOGO} alt="LOGO" />
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {hasPermission('Escribir') && !showCreateForm && !editing && (
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                        Asignar
                    </button>
                )}
                <button onClick={() => navigate('/menu')} className="btn-menum">Menú</button>
                
                {showCreateForm && (
                    <div className="create-form">
                        <h2>AGREGAR NUEVO</h2>
                        <label>ID ROL:</label>
                        <select
                            name="idRol"
                            value={newAltaRolPermiso.idRol}
                            onChange={handleChange}
                        >
                        </select>

                        <label>ID MODULO:</label>
                        <select
                            name="idModulo"
                            value={newAltaRolPermiso.idModulo}
                            onChange={handleChange}
                        >
                        </select>

                        <label>ID PERMISO:</label>
                        <select
                            name="idPermiso"
                            value={newAltaRolPermiso.idPermiso}
                            onChange={handleChange}
                        >
                        </select>

                        <button onClick={handleCreate} className="btn-submit">Crear</button>
                        <button onClick={() => setShowCreateForm(false)} className="btn-cancel">Cancelar</button>
                    </div>
                )}

                <div className="container3">
                    {!showCreateForm && !editing && (
                        <div className="search-container">
                            <h6>Filtro</h6>
                            <input 
                                type="text" 
                                placeholder="Dispositivo" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                    )}

                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>ID ROL</th>
                                <th>ID MODULO</th>
                                <th>ID PERMISO</th>
                                {hasPermission('Escribir') && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAltaRolPermiso.length > 0 ? (
                                filteredAltaRolPermiso.map(item => (
                                    <tr key={item.idRol}>
                                        <td>{item.idRol}</td>
                                        <td>{item.idModulo}</td>
                                        <td>{item.idPermiso}</td>
                                        {hasPermission('Escribir') && (
                                            <td>
                                                <button 
                                                    onClick={() => setEditing(item)} 
                                                    className="btn-edit"
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.idRol)} 
                                                    className="btn-delete"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>No hay permisos asignados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

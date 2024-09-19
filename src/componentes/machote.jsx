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
    const [roles, setRoles] = useState([]);
    const [modulos, setModulos] = useState([]);
    const [permisosListado, setPermisosListado] = useState([]);
    const [newAltaRolPermiso, setNewAltaRolPermiso] = useState({
        idRol: '',
        idModulo: '',
        idPermiso: '',
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [userPermissions, setUserPermissions] = useState([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const [altaRolPermisoResponse, rolesResponse, modulosResponse, permisosListadoResponse, permisosUsuarioResponse] = await Promise.all([
                fetch(URL_ALTA_PERMISO, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(URL_ROLES, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(URL_MODULO, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(URL_PERMISOS_LISTADO, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(URL_PERMISOS, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
            ]);

            if (!altaRolPermisoResponse.ok || !rolesResponse.ok || !modulosResponse.ok || !permisosListadoResponse.ok || !permisosUsuarioResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const altaRolPermisoData = await altaRolPermisoResponse.json();
            const rolesData = await rolesResponse.json();
            const modulosData = await modulosResponse.json();
            const permisosListadoData = await permisosListadoResponse.json();
            const permisosUsuarioData = await permisosUsuarioResponse.json();

            setAltaRolPermiso(altaRolPermisoData);
            setRoles(rolesData);
            setModulos(modulosData);
            setPermisosListado(permisosListadoData);
            setUserPermissions(permisosUsuarioData.map(p => p.nombre));  // Ajustar si la estructura es diferente

        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchData();
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
                await fetchData();
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
                setAltaRolPermiso(altaRolPermiso.map(s => s.id === editing.id ? data : s));
                setEditing(null);
                await fetchData();
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
                setAltaRolPermiso(altaRolPermiso.filter(s => s.id !== id));
                await fetchData();
                setSuccessMessage('Eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar.');
        }
    };

    const filteredAltaRolPermiso = altaRolPermiso.filter(item =>
        (item.idRol || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.idModulo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.idPermiso || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRolNombre = (idRol) => {
        const rol = roles.find(r => r.id === idRol);
        return rol ? rol.nombre : 'Desconocido';
    };

    const getModuloNombre = (idModulo) => {
        const modulo = modulos.find(m => m.id === idModulo);
        return modulo ? modulo.nombre : 'Desconocido';
    };

    const getPermisoNombre = (idPermiso) => {
        const permiso = permisosListado.find(p => p.id === idPermiso);
        return permiso ? permiso.permiso : 'Desconocido';
    };

    const hasPermission = (permissionName) => {
        return userPermissions.includes(permissionName);
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center">Gestión de Rol y Permiso</h2>
            <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar por Rol, Módulo o Permiso"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />

            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            <table className="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>Rol</th>
                        <th>Módulo</th>
                        <th>Permiso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAltaRolPermiso.map(item => (
                        <tr key={item.id}>
                            <td>{getRolNombre(item.idRol)}</td>
                            <td>{getModuloNombre(item.idModulo)}</td>
                            <td>{getPermisoNombre(item.idPermiso)}</td>
                            <td>
                                {hasPermission('Editar') && (
                                    <button
                                        className="btn btn-primary btn-sm me-2"
                                        onClick={() => setEditing(item)}
                                    >
                                        Editar
                                    </button>
                                )}
                                {hasPermission('Eliminar') && (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {hasPermission('Crear') && (
                <div className="text-center mt-4">
                    <button className="btn btn-success" onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? 'Cancelar' : 'Nuevo Rol-Permiso'}
                    </button>
                </div>
            )}

            {showCreateForm && (
                <div className="mt-4">
                    <h3>Nuevo Alta de Rol y Permiso</h3>
                    <form>
                        <div className="mb-3">
                            <label>Rol</label>
                            <select
                                className="form-control"
                                name="idRol"
                                value={newAltaRolPermiso.idRol}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione un Rol</option>
                                {roles.map(rol => (
                                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>Módulo</label>
                            <select
                                className="form-control"
                                name="idModulo"
                                value={newAltaRolPermiso.idModulo}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione un Módulo</option>
                                {modulos.map(modulo => (
                                    <option key={modulo.id} value={modulo.id}>{modulo.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>Permiso</label>
                            <select
                                className="form-control"
                                name="idPermiso"
                                value={newAltaRolPermiso.idPermiso}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione un Permiso</option>
                                {permisosListado.map(permiso => (
                                    <option key={permiso.id} value={permiso.id}>{permiso.permiso}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-center">
                            <button type="button" className="btn btn-success" onClick={handleCreate}>
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {editing && (
                <div className="mt-4">
                    <h3>Editar Rol y Permiso</h3>
                    <form>
                        <div className="mb-3">
                            <label>Rol</label>
                            <select
                                className="form-control"
                                name="idRol"
                                value={editing.idRol}
                                onChange={e => setEditing({ ...editing, idRol: e.target.value })}
                            >
                                <option value="">Seleccione un Rol</option>
                                {roles.map(rol => (
                                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>Módulo</label>
                            <select
                                className="form-control"
                                name="idModulo"
                                value={editing.idModulo}
                                onChange={e => setEditing({ ...editing, idModulo: e.target.value })}
                            >
                                <option value="">Seleccione un Módulo</option>
                                {modulos.map(modulo => (
                                    <option key={modulo.id} value={modulo.id}>{modulo.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>Permiso</label>
                            <select
                                className="form-control"
                                name="idPermiso"
                                value={editing.idPermiso}
                                onChange={e => setEditing({ ...editing, idPermiso: e.target.value })}
                            >
                                <option value="">Seleccione un Permiso</option>
                                {permisosListado.map(permiso => (
                                    <option key={permiso.id} value={permiso.id}>{permiso.permiso}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-center">
                            <button type="button" className="btn btn-primary" onClick={handleUpdate}>
                                Actualizar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

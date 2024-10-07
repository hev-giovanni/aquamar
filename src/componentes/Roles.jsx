import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/sensor_tipo.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_ROLES = "https://190.113.90.230/acproyect/endpoint/Roles.php";
const URL_PERMISOS = "https://190.113.90.230/acproyect/endpoint/menu-usuario.php"; 

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newRol, setNewRol] = useState({
       nombre: '',
        
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchRoles = async () => {
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

            const rolesResponse = await fetch(URL_ROLES, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!rolesResponse.ok) {
                throw new Error(`HTTP error! status: ${rolesResponse.status}`);
            }

            const rolesData = await rolesResponse.json();

            if (rolesData.error) {
                setError(rolesData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setRoles(rolesData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchRoles();
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
            const response = await fetch(URL_ROLES, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newRol)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchRoles();
                setNewRol({
                    nombre: '',
                }); 
                setSuccessMessage('Rol creado correctamente.');
                setShowCreateForm(false); 
            }
        } catch (error) {
            setError('Error al crear el Rol.');
        }
    };

    const handleChange = (e) => {
        setNewRol({
            ...newRol,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.nombre) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_ROLES, {
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
                setRoles(roles.map(s => s.idRol === editing.idRol ? data : s));
                setEditing(null);
                await fetchRoles();
                setSuccessMessage('Rol actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Rol.');
        }
    };

    const handleEdit = (rol) => {
        setEditing({ ...rol });
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
            const response = await fetch(`${URL_ROLES}?id=${id}`, {
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
                setRoles(roles.filter(s => s.idRol !== id));
                await fetchRoles();
                setSuccessMessage('Rol eliminado correctamente.');
            // }
        } catch (error) {
            setError('Error al eliminar el Rol.');
            console.error(error); // Añade esto para depurar cualquier error
        }
        
    };

    const hasPermission = (permiso) => {
        return permisos['Roles'] && permisos['Roles'].includes(permiso);
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Gestión de Tipo de Roles de Usuarios</h1>
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
                        <h2>Crear un Rol</h2>
                        <label htmlFor="nombre">
                            Nombre del Rol:
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={newRol.nombre}
                                onChange={handleChange}
                            />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Rol</h2>
                        <label htmlFor="tipo">
                            Nombre del Rol:
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={editing.nombre}
                                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
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
                                    <th>Nombre</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((rol) => (
                                    <tr key={rol.idRol}>
                                        <td>{rol.nombre}</td>
                                        <td>
                                            {hasPermission('Escribir') && (
                                                <button onClick={() => handleEdit(rol)} className='btn-edit'>Editar</button>
                                            )}
                                            {hasPermission('Borrar') && (
                                                <button onClick={() => handleDelete(rol.idRol)} className='btn-delete'>Eliminar</button>
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

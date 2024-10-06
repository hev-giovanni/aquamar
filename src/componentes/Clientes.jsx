import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';
import '../css/sensor_unidad.css';
import LOGO from '../imagenes/logo1.png';

const URL_CLIENTES = "http://190.113.91.230:8082/acproyect/endpoint/cliente.php";
const URL_PERMISOS = "http://190.113.91.230:8082/acproyect/endpoint/menu-usuario.php";

export default function Cliente() {
    const [cliente, setCliente] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newCliente, setNewCliente] = useState({
        nombre: '',
        nit: '',
        telefono: '',
        correo: '',
        direccion: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchCliente = async () => {
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

            const clienteResponse = await fetch(URL_CLIENTES, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!clienteResponse.ok) {
                throw new Error(`HTTP error! status: ${clienteResponse.status}`);
            }

            const clienteData = await clienteResponse.json();

            if (clienteData.error) {
                setError(clienteData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setCliente(clienteData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchCliente();
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
            const response = await fetch(URL_CLIENTES, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCliente)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchCliente();
                setNewCliente({
                    nombre: '',
                    nit: '',
                    telefono: '',
                    correo: '',
                    direccion: '',
                });
                setSuccessMessage('Cliente creado correctamente.');
                setShowCreateForm(false);
            }
        } catch (error) {
            setError('Error al crear el Cliente.');
        }
    };

    const handleChange = (e) => {
        setNewCliente({
            ...newCliente,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (
            !editing.nombre || 
            !editing.nit || 
            !editing.telefono || 
            !editing.correo || 
            !editing.direccion
        ) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_CLIENTES, {
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
                setCliente(cliente.map(s => s.idCliente === editing.idCliente ? data : s));
                setEditing(null);
                await fetchCliente();
                setSuccessMessage('Cliente actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Cliente.');
        }
    };

    const handleEdit = (cliente) => {
        setEditing({ ...cliente });
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
            const response = await fetch(`${URL_CLIENTES}?id=${id}`, {
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
                setCliente(cliente.filter(s => s.idCliente !== id));
                await fetchCliente();
                setSuccessMessage('Cliente eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Cliente.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Clientes'] && permisos['Clientes'].includes(permiso);
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>Gestión de Clientes</h1>
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
                        <h2>Crear Cliente</h2>
                        <label htmlFor="nombre">Nombre:
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={newCliente.nombre}
                                onChange={handleChange} />
                        </label>

                        <label htmlFor="nit">Nit:
                            <input
                                type="text"
                                id="nit"
                                name="nit"
                                value={newCliente.nit}
                                onChange={handleChange} />
                        </label>

                        <label htmlFor="telefono">Telefono:
                            <input
                                type="text"
                                id="telefono"
                                name="telefono"
                                value={newCliente.telefono}
                                onChange={handleChange} />
                        </label>
                        <label htmlFor="correo">Correo:
                            <input
                                type="text"
                                id="correo"
                                name="correo"
                                value={newCliente.correo}
                                onChange={handleChange} />
                        </label>

                        <label htmlFor="direccion">Direccion:
                            <input
                                type="text"
                                id="direccion"
                                name="direccion"
                                value={newCliente.direccion}
                                onChange={handleChange} />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Cliente</h2>
                        <label htmlFor="nombre">Nombre:
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={editing.nombre}
                                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} />
                        </label>

                        <label htmlFor="nit">Nit:
                            <input
                                type="text"
                                id="nit"
                                name="nit"
                                value={editing.nit}
                                onChange={(e) => setEditing({ ...editing, nit: e.target.value })} />
                        </label>

                        <label htmlFor="telefono">Telefono:
                            <input
                                type="text"
                                id="telefono"
                                name="telefono"
                                value={editing.telefono}
                                onChange={(e) => setEditing({ ...editing, telefono: e.target.value })} />
                        </label>
                        <label htmlFor="correo">Correo:
                            <input
                                type="text"
                                id="correo"
                                name="correo"
                                value={editing.correo}
                                onChange={(e) => setEditing({ ...editing, correo: e.target.value })} />
                        </label>

                        <label htmlFor="direccion">Direccion:
                            <input
                                type="text"
                                id="direccion"
                                name="direccion"
                                value={editing.direccion}
                                onChange={(e) => setEditing({ ...editing, direccion: e.target.value })} />
                        </label>
                        <button onClick={handleSave}>Guardar</button>
                        <button onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                )}

                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Nit</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Dirección</th>
                            {hasPermission('Escribir') && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {cliente.map((c) => (
                            <tr key={c.idCliente}>
                                <td>{c.nombre}</td>
                                <td>{c.nit}</td>
                                <td>{c.telefono}</td>
                                <td>{c.correo}</td>
                                <td>{c.direccion}</td>
                                {hasPermission('Escribir') && (
                                    <td>
                                        <button onClick={() => handleEdit(c)} className='btn-edit'>Editar</button>
                                        <button onClick={() => handleDelete(c.idCliente)}className='btn-delete'>Eliminar</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/proveedores.css'; // Asegúrate de que este archivo CSS exista

const URL_PROVEEDORES = "http://localhost/acproyect/endpoint/proveedores.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; // Cambia esta URL si es necesario

export default function Proveedores() {
    const [proveedores, setProveedores] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newProveedor, setNewProveedor] = useState({
        nombre: '',
        nit: '',
        telefono: '',
        contacto: '',
        celular: '',
        direccion: '',
        web: ''
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchProveedores = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            // Obtén los permisos del usuario
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

            // Luego, obtiene la lista de proveedores
            const proveedoresResponse = await fetch(URL_PROVEEDORES, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!proveedoresResponse.ok) {
                throw new Error(`HTTP error! status: ${proveedoresResponse.status}`);
            }

            const proveedoresData = await proveedoresResponse.json();

            if (proveedoresData.error) {
                setError(proveedoresData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setProveedores(proveedoresData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchProveedores();
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
            const response = await fetch(URL_PROVEEDORES, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProveedor)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                // Refrescar la lista de proveedores después de la creación
                await fetchProveedores(); // Llamar a la función que obtiene los proveedores
                setNewProveedor({
                    nombre: '',
                    nit: '',
                    telefono: '',
                    contacto: '',
                    celular: '',
                    direccion: '',
                    web: ''
                }); // Limpiar el formulario
                setSuccessMessage('Proveedor creado correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear el proveedor.');
        }
    };

    const handleChange = (e) => {
        setNewProveedor({
            ...newProveedor,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_PROVEEDORES, {
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
                setProveedores(proveedores.map(p => p.idProveedor === editing.idProveedor ? data : p));
                setEditing(null);
                await fetchProveedores();
                setSuccessMessage('Proveedor actualizado correctamente.');
              
            }
        } catch (error) {
            setError('Error al actualizar el proveedor.');
        }
    };

    const handleEdit = (proveedor) => {
        setEditing({ ...proveedor });
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
            const response = await fetch(`${URL_PROVEEDORES}?id=${id}`, {
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
                setProveedores(proveedores.filter(p => p.idProveedor !== id));
            }
        } catch (error) {
            setError('Error al borrar el proveedor.');
        }
    };

    // Revisa los permisos almacenados
    const hasPermission = (permiso) => {
        return permisos['Proveedores'] && permisos['Proveedores'].includes(permiso);
    };

    return (
        <div className="proveedores-container">
            <h1>Proveedores</h1>
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            {/* Botón para crear un nuevo proveedor */}
            {hasPermission('Escribir') && !showCreateForm && !editing && (
                <button onClick={() => setShowCreateForm(true)} className="btn-create">
                    Crear Proveedor
                </button>
            )}

            {/* Formulario para crear un nuevo proveedor */}
            {showCreateForm && (
                <div className="create-form">
                    <h2>Crear Proveedor</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={newProveedor.nombre}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="direccion">
                        Dirección:
                        <input
                            type="text"
                            id="direccion"
                            name="direccion"
                            value={newProveedor.direccion}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="nit">
                        NIT:
                        <input
                            type="text"
                            id="nit"
                            name="nit"
                            value={newProveedor.nit}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="telefono">
                        Teléfono:
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={newProveedor.telefono}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="contacto">
                        Contacto:
                        <input
                            type="text"
                            id="contacto"
                            name="contacto"
                            value={newProveedor.contacto}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="celular">
                        Celular:
                        <input
                            type="text"
                            id="celular"
                            name="celular"
                            value={newProveedor.celular}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="web">
                        Web:
                        <input
                            type="text"
                            id="web"
                            name="web"
                            value={newProveedor.web}
                            onChange={handleChange}
                        />
                    </label>
                    <button onClick={handleCreate} disabled={!hasPermission('Escribir')}>Crear</button>
                    <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                </div>
            )}

            {/* Formulario para editar un proveedor */}
            {editing && (
                <div className="edit-form">
                    <h2>Editar Proveedor</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={editing.nombre || ''}
                            onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                        />
                    </label>
                    <label htmlFor="direccion">
                        Dirección:
                        <input
                            type="text"
                            id="direccion"
                            name="direccion"
                            value={editing.direccion || ''}
                            onChange={(e) => setEditing({ ...editing, direccion: e.target.value })}
                        />
                    </label>
                    <label htmlFor="nit">
                        NIT:
                        <input
                            type="text"
                            id="nit"
                            name="nit"
                            value={editing.nit || ''}
                            onChange={(e) => setEditing({ ...editing, nit: e.target.value })}
                        />
                    </label>
                    <label htmlFor="telefono">
                        Teléfono:
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={editing.telefono || ''}
                            onChange={(e) => setEditing({ ...editing, telefono: e.target.value })}
                        />
                    </label>
                    <label htmlFor="contacto">
                        Contacto:
                        <input
                            type="text"
                            id="contacto"
                            name="contacto"
                            value={editing.contacto || ''}
                            onChange={(e) => setEditing({ ...editing, contacto: e.target.value })}
                        />
                    </label>
                    <label htmlFor="celular">
                        Celular:
                        <input
                            type="text"
                            id="celular"
                            name="celular"
                            value={editing.celular || ''}
                            onChange={(e) => setEditing({ ...editing, celular: e.target.value })}
                        />
                    </label>
                    <label htmlFor="web">
                        Web:
                        <input
                            type="text"
                            id="web"
                            name="web"
                            value={editing.web || ''}
                            onChange={(e) => setEditing({ ...editing, web: e.target.value })}
                        />
                    </label>
                    <button onClick={handleSave} disabled={!hasPermission('Escribir')}>Guardar</button>
                    <button onClick={() => setEditing(null)} disabled={!hasPermission('Escribir')}>Cancelar</button>
                </div>
            )}

            {/* Tabla de proveedores */}
            {!showCreateForm && !editing && (
               <table>
               <thead>
                   <tr>
                       <th>Nombre</th>
                       <th>NIT</th>
                       <th>Teléfono</th>
                       <th>Contacto</th>
                       <th>Celular</th>
                       <th>Dirección</th>
                       <th>Web</th>
                       <th>Acciones</th>
                   </tr>
               </thead>
               <tbody>
                   {proveedores.map((prov) => (
                       <tr key={prov.idProveedor}>
                           <td>{prov.nombre}</td>
                           <td>{prov.nit}</td>
                           <td>{prov.telefono}</td>
                           <td>{prov.contacto}</td>
                           <td>{prov.celular}</td>
                           <td>{prov.direccion}</td>
                           <td>{prov.web}</td>
                           <td>
                               {hasPermission('Escribir') && (
                                   <button onClick={() => handleEdit(prov)}>Editar</button>
                               )}
                               {hasPermission('Borrar') && (
                                   <button onClick={() => handleDelete(prov.idProveedor)}>Borrar</button>
                               )}
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
           
            )}
        </div>
    );
}

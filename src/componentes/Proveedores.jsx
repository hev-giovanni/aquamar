import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/proveedores.css'; // Asegúrate de que este archivo CSS exista
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';

const URL_PROVEEDORES = "http://aquamar.xgt2.com:8080/acproyect/endpoint/proveedores.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php"; // Cambia esta URL si es necesario

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
        web: '',
        idStatus: 1 // Por defecto, se asume el estado 'activo'
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
                // Filtrar proveedores para excluir aquellos con idStatus == "3"
                const filteredProveedores = proveedoresData.filter(prov => prov.idStatus !== "3");
                setProveedores(filteredProveedores);
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
                await fetchProveedores();
                setNewProveedor({
                    nombre: '',
                    nit: '',
                    telefono: '',
                    contacto: '',
                    celular: '',
                    direccion: '',
                    web: '',
                    idStatus: 1 // Por defecto, se asume el estado 'activo'
                    
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
                await fetchProveedores();
                setSuccessMessage('Proveedor Eliminado! ');
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
            <img src={LOGO} alt="LOGO AQUAMAR" />
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Botón para crear un nuevo proveedor */}
          {hasPermission('Escribir') && !showCreateForm && !editing && (
    <>
        <button onClick={() => setShowCreateForm(true)} className="btn-create">
            Crear
        </button>
        </>
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
                    <label htmlFor="idStatus">
    Estado:
    <div className="radio-group">
        <label>
            <input
                type="radio"
                id="activo"
                name="idStatus"
                value="1"
                checked={newProveedor.idStatus === "1"}
                onChange={handleChange}
            />
            <span className="radio-button"></span> Activo
        </label>
        <label>
            <input
                type="radio"
                id="inactivo"
                name="idStatus"
                value="2"
                checked={newProveedor.idStatus === "2"}
                onChange={handleChange}
            />
            <span className="radio-button"></span> Inactivo
        </label>
        
    </div>
</label>

                    <button onClick={handleCreate} className="btn-save">
                        Guardar
                    </button>
                    <button onClick={() => setShowCreateForm(false)} className="btn-cancel">
                        Cancelar
                    </button>
                </div>
            )}

            {/* Tabla de proveedores */}
            <button onClick={() => navigate('/menu')} className="btn-menu">
            Menú
        </button>
            {!showCreateForm && !editing && (
                <table className="table-proveedores">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>NIT</th>
                            <th>Teléfono</th>
                            <th>Contacto</th>
                            <th>Celular</th>
                            <th>Dirección</th>
                            <th>Web</th>
                            {hasPermission('Escribir') && <th>Acciones</th>}
    
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.map(prov => (
                            prov.idProveedor ? (
                            <tr key={prov.idProveedor} className={prov.highlight ? "highlight-row" : ""}>
                                <td>{prov.nombre}</td>
                                <td>{prov.nit}</td>
                                <td>{prov.telefono}</td>
                                <td>{prov.contacto}</td>
                                <td>{prov.celular}</td>
                                <td>{prov.direccion}</td>
                                <td>{prov.web}</td>
                                {hasPermission('Escribir') && (
                                    <td>
                                        <button onClick={() => handleEdit(prov)} className="btn-edit">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDelete(prov.idProveedor)} className="btn-delete">
                                            Eliminar
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ) : null 
                    ))}
                    </tbody>
                </table>
            )}

            {/* Formulario para editar proveedor */}
            {editing && (
                <div className="edit-form">
                    <h2>Editar Proveedor</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={editing.nombre}
                            onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                        />
                    </label>
                    <label htmlFor="direccion">
                        Dirección:
                        <input
                            type="text"
                            id="direccion"
                            name="direccion"
                            value={editing.direccion}
                            onChange={(e) => setEditing({ ...editing, direccion: e.target.value })}
                        />
                    </label>
                    <label htmlFor="nit">
                        NIT:
                        <input
                            type="text"
                            id="nit"
                            name="nit"
                            value={editing.nit}
                            onChange={(e) => setEditing({ ...editing, nit: e.target.value })}
                        />
                    </label>
                    <label htmlFor="telefono">
                        Teléfono:
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={editing.telefono}
                            onChange={(e) => setEditing({ ...editing, telefono: e.target.value })}
                        />
                    </label>
                    <label htmlFor="contacto">
                        Contacto:
                        <input
                            type="text"
                            id="contacto"
                            name="contacto"
                            value={editing.contacto}
                            onChange={(e) => setEditing({ ...editing, contacto: e.target.value })}
                        />
                    </label>
                    <label htmlFor="celular">
                        Celular:
                        <input
                            type="text"
                            id="celular"
                            name="celular"
                            value={editing.celular}
                            onChange={(e) => setEditing({ ...editing, celular: e.target.value })}
                        />
                    </label>
                    <label htmlFor="web">
                        Web:
                        <input
                            type="text"
                            id="web"
                            name="web"
                            value={editing.web}
                            onChange={(e) => setEditing({ ...editing, web: e.target.value })}
                        />
                    </label>
                    <label htmlFor="idStatus" className='Estado'>
                        Estado:
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    id="activo"
                                    name="idStatus"
                                    value="1"
                                    checked={editing.idStatus === "1"}
                                    onChange={(e) => setEditing({ ...editing, idStatus: e.target.value })}
                                />
                                <span className="radio-button"></span> Activo
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    id="inactivo"
                                    name="idStatus"
                                    value="2"
                                    checked={editing.idStatus === "2"}
                                    onChange={(e) => setEditing({ ...editing, idStatus: e.target.value })}
                                />
                                <span className="radio-button"></span> Inactivo
                            </label>
                          
                        </div>
                    </label>

                    <button onClick={handleSave} className="btn-save">
                        Guardar
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-cancel">
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/tipo_producto.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_TIPOS = "https://190.113.90.230/acproyect/endpoint/producto-tipo.php";
const URL_PERMISOS = "https://190.113.90.230/acproyect/endpoint/menu-usuario.php"; 

export default function Tipos() {
    const [tipos, setTipos] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newTipo, setNewTipo] = useState({
        nombre: '',
        
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();
    
    const fetchTipos = async () => {
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

            const tiposResponse = await fetch(URL_TIPOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!tiposResponse.ok) {
                throw new Error(`HTTP error! status: ${tiposResponse.status}`);
            }

            const tiposData = await tiposResponse.json();

            if (tiposData.error) {
                setError(tiposData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setTipos(tiposData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchTipos();
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
            const response = await fetch(URL_TIPOS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTipo)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchTipos();
                setNewTipo({
                    nombre: '',
                    
                }); // Limpiar el formulario
                setSuccessMessage('Tipo Creado correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear el Tipo');
        }
    };

    const handleChange = (e) => {
        setNewTipo({
            ...newTipo,
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
        if (!editing.nombre ) {
            setError('Dato incompleto o Erroneo');
            return;
        }

        try {
            const response = await fetch(URL_TIPOS, {
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
                setTipos(tipos.map(p => p.idTipo === editing.idTipo ? data : p));
                setEditing(null);
                await fetchTipos();
                setSuccessMessage('Tipo actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el tipo.');
        }
    };

    const handleEdit = (tipo) => {
        setEditing({ ...tipo });
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
            const response = await fetch(`${URL_TIPOS}?id=${id}`, {
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
                setTipos(tipos.filter(p => p.idTipo !== id));
                await fetchTipos();
                setSuccessMessage('Tipo eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Tipo.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Producto_Tipo'] && permisos['Producto_Tipo'].includes(permiso);
    };

    return (
        
        <div className="tipos-container">
             <div className="tipos-container2">
            <h1>Tipo de Producto</h1>
            <img src={LOGO} alt="LOGO AQUAMAR" />
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
    
            {hasPermission('Escribir') && !showCreateForm && !editing && (
                <button onClick={() => setShowCreateForm(true)} className="btn-create">
                    Crear Tipo
                </button>
            )}
            <button onClick={() => navigate('/menu')} className="btn-menum">
                Regreso al menú
            </button>

            {showCreateForm && (
                <div className="create-form">
                    <h2>Crear Tipo</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={newTipo.nombre}
                            onChange={handleChange}
                        />
                    </label>
                    <button onClick={handleCreate}>Crear</button>
                    <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                </div>
            )}
    
            {editing && (
                <div className="edit-form">
                    <h2>Editar Tipo</h2>
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
                    <button onClick={handleSave}>Guardar</button>
                    <button onClick={() => setEditing(null)}>Cancelar</button>
                </div>
            )}
       <div  className="container3">
            {!showCreateForm && !editing && (
                <table>
                    <thead>
                        <tr>
                              <th>Nombre</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tipos.map((tipo) => (
                            <tr key={tipo.idTipoProducto}>
                                <td>{tipo.nombre}</td>
                                <td>
                                    {hasPermission('Escribir') && (
                                        <button onClick={() => handleEdit(tipo)} className="btn-edit">Editar</button>
                                    )}
                                    {hasPermission('Borrar') && (
                                        <button onClick={() => handleDelete(tipo.idTipoProducto)} className="btn-delete">Eliminar</button>
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

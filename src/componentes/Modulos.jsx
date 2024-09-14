import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/proveedores.css'; // Asegúrate de que este archivo CSS exista
import '../css/style.css';
import '../css/modulos.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_MODULOS = "http://localhost/acproyect/endpoint/modulo.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; // Cambia esta URL si es necesario

export default function Modulos() {
    const [modulos, setModulos] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newModulo, setNewModulo] = useState({
        nombre: '',
        idStatus: 1 // Por defecto, se asume el estado 'activo'
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();
    const fetchModulos = async () => {
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
        
            // Luego, obtiene la lista de proveedores-----------------------------------------------------------xxxxxxxxxxxxxxxxxxxxx
            const modulosResponse = await fetch(URL_MODULOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        
            if (!modulosResponse.ok) {
                throw new Error(`HTTP error! status: ${modulosResponse.status}`);
            }
        
            const modulosData = await modulosResponse.json();
        
            if (modulosData.error) {
                setError(modulosData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                // Filtrar proveedores para excluir aquellos con idStatus == "3"
                const filteredModulos = modulosData.filter(prov => prov.idStatus !== "3");
                setModulos(filteredModulos);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
        
    };

    useEffect(() => {
        fetchModulos();
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
            const response = await fetch(URL_MODULOS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newModulo)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchModulos();
                setNewModulo({
                    nombre: '',
                    idStatus: 1 // Por defecto, se asume el estado 'activo'
                    
                }); // Limpiar el formulario
                setSuccessMessage('Modulo creado correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear el Modulo.');
        }
    };

    const handleChange = (e) => {
        setNewModulo({
            ...newModulo,
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
            const response = await fetch(URL_MODULOS, {
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
                setModulos(modulos.map(p => p.idModulo === editing.idModulo ? data : p));
                setEditing(null);
                await fetchModulos();
                setSuccessMessage('Modulor actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el Modulo.');
        }
    };

    const handleEdit = (modulo) => {
        setEditing({ ...modulo});
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
            const response = await fetch(`${URL_MODULOS}?id=${id}`, {
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
                setModulos(modulos.filter(p => p.idModulo !== id));
                await fetchModulos();
                setSuccessMessage('Momdulo Eliminado! ');
            }
        } catch (error) {
            setError('Error al borrar el proveedor.');
        }
    };

    // Revisa los permisos almacenados
    const hasPermission = (permiso) => {
        return permisos['Modulos'] && permisos['Modulos'].includes(permiso);
    };

    return (
        <div className="proveedores-container">
             <div className="sensores-container2">
            <h1>Modulos</h1>
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
                    <h2>Crear Modulo</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={newModulo.nombre}
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
                checked={newModulo.idStatus === "1"}
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
                checked={newModulo.idStatus === "2"}
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

        <div className="container3">
            {!showCreateForm && !editing && (
                <table className="table-proveedores">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            {hasPermission('Escribir') && <th>Acciones</th>}
    
                        </tr>
                    </thead>
                    <tbody>
                        {modulos.map(prov => (
                            prov.idModulo ? (
                            <tr key={prov.idModulo} className={prov.highlight ? "highlight-row" : ""}>
                                <td>{prov.nombre}</td>
                                {hasPermission('Escribir') && (
                                    <td>
                                        <button onClick={() => handleEdit(prov)} className="btn-edit">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDelete(prov.idModulo)} className="btn-delete">
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
 </div>

    
    


            {/* Formulario para editar proveedor */}
            {editing && (
                <div className="edit-form">
                    <h2>Editar Módulo</h2>
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
        </div>
    );
}

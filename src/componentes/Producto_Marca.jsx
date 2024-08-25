import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/proveedores.css'; // Asegúrate de que este archivo CSS exista

const URL_MARCAS = "http://localhost/acproyect/endpoint/marca.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php"; // Cambia esta URL si es necesario

export default function ProductoMarca() {
    const [marcas, setMarcas] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newMarca, setNewMarca] = useState({
        nombre: '',
        // Otros campos si es necesario
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchMarcas = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found.');
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

            console.log('Permisos response status:', permisosResponse.status);

            if (!permisosResponse.ok) {
                throw new Error(`HTTP error! status: ${permisosResponse.status}`);
            }

            const permisosData = await permisosResponse.json();
            console.log('Permisos data:', permisosData);

            const permisosMap = permisosData.reduce((acc, permiso) => {
                if (!acc[permiso.moduloNombre]) {
                    acc[permiso.moduloNombre] = [];
                }
                acc[permiso.moduloNombre].push(permiso.permiso);
                return acc;
            }, {});

            console.log('Permisos map:', permisosMap);

            setPermisos(permisosMap);

            // Luego, obtiene la lista de marcas
            const marcasResponse = await fetch(URL_MARCAS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Marcas response status:', marcasResponse.status);

            if (!marcasResponse.ok) {
                throw new Error(`HTTP error! status: ${marcasResponse.status}`);
            }

            const marcasData = await marcasResponse.json();
            console.log('Marcas data:', marcasData);

            if (marcasData.error) {
                setError(marcasData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setMarcas(marcasData);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchMarcas();
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
            console.log('No token found.');
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_MARCAS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarca)
            });

            console.log('Create response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Create response data:', data);

            if (data.error) {
                setError(data.error);
            } else {
                await fetchMarcas();
                setNewMarca({
                    nombre: '',
                    // Otros campos si es necesario
                }); // Limpiar el formulario
                setSuccessMessage('Marca creada correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            console.error('Create error:', error);
            setError('Error al crear la marca.');
        }
    };

    const handleChange = (e) => {
        setNewMarca({
            ...newMarca,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found.');
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_MARCAS, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editing)
            });

            console.log('Update response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Update response data:', data);

            if (data.error) {
                setError(data.error);
            } else {
                setMarcas(marcas.map(m => m.idMarca === editing.idMarca ? data : m));
                setEditing(null);
                await fetchMarcas();
                setSuccessMessage('Marca actualizada correctamente.');
            }
        } catch (error) {
            console.error('Update error:', error);
            setError('Error al actualizar la marca.');
        }
    };

    const handleEdit = (marca) => {
        console.log('Edit marca:', marca);
        setEditing({ ...marca });
    };

    const handleSave = () => {
        handleUpdate();
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found.');
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(`${URL_MARCAS}?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Delete response data:', data);

            if (data.error) {
                setError(data.error);
            } else {
                setMarcas(marcas.filter(m => m.idMarca !== id));
                await fetchMarcas();
                setSuccessMessage('Marca eliminada.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setError('Error al borrar la marca.');
        }
    };

    // Revisa los permisos almacenados
    const hasPermission = (permiso) => {
        return permisos['Marcas'] && permisos['Marcas'].includes(permiso);
    };

    return (
        <div className="marcas-container">
            <h1>Marcas</h1>
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Botón para crear una nueva marca */}
            {hasPermission('Escribir') && !showCreateForm && !editing && (
                <>
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                        Crear Marca
                    </button>
                </>
            )}

            {/* Formulario para crear una nueva marca */}
            {showCreateForm && (
                <div className="create-form">
                    <h2>Crear Marca</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={newMarca.nombre}
                            onChange={handleChange}
                        />
                    </label>
                    {/* Otros campos si es necesario */}
                    <button onClick={handleCreate} className="btn-save">
                        Guardar
                    </button>
                    <button onClick={() => setShowCreateForm(false)} className="btn-cancel">
                        Cancelar
                    </button>
                </div>
            )}

            {/* Tabla de marcas */}
            <button onClick={() => navigate('/menu')} className="btn-menu">
                Regreso al menú
            </button>
            {!showCreateForm && !editing && (
                <table className="table-marcas">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            {/* Otros encabezados si es necesario */}
                            {hasPermission('Escribir') && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {marcas.map(marca => (
                            <tr key={marca.idMarca} className={marca.highlight ? 'highlight-row' : ''}>
                                <td>{marca.nombre}</td>
                                {/* Otros campos si es necesario */}
                                {hasPermission('Escribir') && (
                                    <td>
                                        <button onClick={() => handleEdit(marca)} className="btn-edit">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDelete(marca.idMarca)} className="btn-delete">
                                            Eliminar
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Formulario para editar una marca */}
            {editing && (
                <div className="edit-form">
                    <h2>Editar Marca</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={editing.nombre}
                            onChange={(e) => setEditing({
                                ...editing,
                                [e.target.name]: e.target.value
                            })}
                        />
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import '../css/producto_marca.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_MARCAS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/marca.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php"; 
const URL_PAISES = "http://aquamar.xgt2.com:8080/acproyect/endpoint/producto-pais.php"; // Endpoint para obtener países

export default function Marcas() {
    const [marcas, setMarcas] = useState([]);
    const [paises, setPaises] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newMarca, setNewMarca] = useState({
        nombre: '',
        web: '',
        idPais: '',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();
    
    const fetchMarcas = async () => {
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

            const marcasResponse = await fetch(URL_MARCAS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!marcasResponse.ok) {
                throw new Error(`HTTP error! status: ${marcasResponse.status}`);
            }

            const marcasData = await marcasResponse.json();

            if (marcasData.error) {
                setError(marcasData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setMarcas(marcasData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    const fetchPaises = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_PAISES, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const paisesData = await response.json();
            if (paisesData.error) {
                setError(paisesData.error);
            } else {
                setPaises(paisesData);
            }
        } catch (error) {
            setError('Error al obtener los países.');
        }
    };

    useEffect(() => {
        fetchMarcas();
        fetchPaises();
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
            const response = await fetch(URL_MARCAS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMarca)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchMarcas();
                setNewMarca({
                    nombre: '',
                    web: '',
                    idPais: '',
                }); // Limpiar el formulario
                setSuccessMessage('Marca creada correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear la Marca.');
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
            setError('No token provided.');
            return navigate('/');
        }

        // Verificar que todos los campos requeridos estén presentes
        if (!editing.nombre || !editing.web || !editing.idPais) {
            setError('Todos los campos deben estar completos.');
            return;
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setMarcas(marcas.map(p => p.idMarca === editing.idMarca ? data : p));
                setEditing(null);
                await fetchMarcas();
                setSuccessMessage('Marca actualizada correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar la Marca.');
        }
    };

    const handleEdit = (marca) => {
        setEditing({ ...marca });
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
            const response = await fetch(`${URL_MARCAS}?id=${id}`, {
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
                setMarcas(marcas.filter(p => p.idMarca !== id));
                await fetchMarcas();
                setSuccessMessage('Marca eliminada correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar la Marca.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Producto_Marca'] && permisos['Producto_Marca'].includes(permiso);
    };

    return (
        <div className="marcas-container">
            <h1>Marca del Producto</h1>
            <img src={LOGO} alt="LOGO AQUAMAR" />
    
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
    
            {hasPermission('Escribir') && !showCreateForm && !editing && (
                <button onClick={() => setShowCreateForm(true)} className="btn-create">
                    Crear Marca
                </button>
            )}
            <button onClick={() => navigate('/menu')} className="btn-menum">
                Regreso al menú
            </button>
    
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
                    <label htmlFor="web">
                        Web:
                        <input
                            type="text"
                            id="web"
                            name="web"
                            value={newMarca.web}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="idPais">
                        País:
                        <select
                            id="idPais"
                            name="idPais"
                            value={newMarca.idPais}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione un país</option>
                            {paises.map(pais => (
                                <option key={pais.idPais} value={pais.idPais}>
                                    {pais.pais}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleCreate}>Crear</button>
                    <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                </div>
            )}
    
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
                            onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
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
                    <label htmlFor="idPais">
                        País:
                        <select
                            id="idPais"
                            name="idPais"
                            value={editing.idPais}
                            onChange={(e) => setEditing({ ...editing, idPais: e.target.value })}
                        >
                            <option value="">Seleccione un país</option>
                            {paises.map(pais => (
                                <option key={pais.idPais} value={pais.idPais}>
                                    {pais.pais}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button onClick={handleSave}>Guardar</button>
                    <button onClick={() => setEditing(null)}>Cancelar</button>
                </div>
            )}
       <div  className="container-marca2">
            {!showCreateForm && !editing && (
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Web</th>
                            <th>País</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {marcas.map((marca) => (
                            <tr key={marca.idMarca}>
                                <td>{marca.nombre}</td>
                                <td>{marca.web}</td>
                                <td>{marca.pais}</td>
                                <td>
                                    {hasPermission('Escribir') && (
                                        <button onClick={() => handleEdit(marca)} className="btn-edit">Editar</button>
                                    )}
                                    {hasPermission('Borrar') && (
                                        <button onClick={() => handleDelete(marca.idMarca)} className="btn-delete">Eliminar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            </div>
        </div>
    );
    
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/productos.css'; // Asegúrate de que este archivo CSS exista
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';

const URL_PRODUCTOS = "http://localhost/acproyect/endpoint/productos.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php";// Nueva URL para tipos de producto

export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newProducto, setNewProducto] = useState({
        nombre: '',
        descripcion: '',
        precioVenta: '',
        existencia: '',
        minimo: '',
        idTipoProducto: '',
        idMarca: '',
        idStatus: 1 // Por defecto, se asume el estado 'activo'
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchProductos = async () => {
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
            const productosResponse = await fetch(URL_PRODUCTOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!productosResponse.ok) {
                throw new Error(`HTTP error! status: ${productosResponse.status}`);
            }

            const productosData = await productosResponse.json();

            if (productosData.error) {
                setError(productosData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                // Filtrar proveedores para excluir aquellos con idStatus == "3"
                const filteredProductos = productosData.filter(prov => prov.idStatus !== "3");
                setProductos(filteredProductos);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }

    };

    useEffect(() => {
        fetchProductos();
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
            const response = await fetch(URL_PRODUCTOS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProducto)


            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchProductos();
                setNewProducto({
                    nombre: '',
                    descripcion: '',
                    precioVenta: '',
                    existencia: '',
                    minimo: '',
                    idTipoProducto: '',
                    idMarca: '',
                    idStatus: 1 // Por defecto, se asume el estado 'activo'
                }); // Limpiar el formulario
                setSuccessMessage('Producdto creado correctamente.');
                setShowCreateForm(false); // Oculta el formulario después de crear
            }
        } catch (error) {
            setError('Error al crear el producto.');
        }
    };

    const handleChange = (e) => {
        setNewProducto({
            ...newProducto,
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
            const response = await fetch(URL_PRODUCTOS, {
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
                setProductos(productos.map(p => p.idProducto === editing.idProducto ? data : p));
                setEditing(null);
                await fetchProductos();
                setSuccessMessage('Producto actualizado correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar el producto.');
        }
    };

    const handleEdit = (producto) => {
        setEditing({ ...producto });
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
            const response = await fetch(`${URL_PRODUCTOS}?id=${id}`, {
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
                setProductos(productos.filter(p => p.idProducto !== id));
                await fetchProductos();
                setSuccessMessage('Producto Eliminado! ');
            }
        } catch (error) {
            setError('Error al borrar el producto.');
        }
    };

    // Revisa los permisos almacenados
    const hasPermission = (permiso) => {
        return permisos['Productos'] && permisos['Productos'].includes(permiso);
    };

    return (
        <div className="producto-container">
            <h1>Productos</h1>
            <img src={LOGO} alt="LOGO AQUAMAR" />
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Botón para crear un nuevo proveedor */}
            {hasPermission('Escribir') && !showCreateForm && !editing && (
                <>
                    <button onClick={() => setShowCreateForm(true)} className="btn-create">
                        Crear Producto
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
                            value={newProducto.nombre}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="descripcion">
                        Descripción:
                        <input
                            type="text"
                            id="descripcion"
                            name="descripcion"
                            value={newProducto.descripcion}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="Precio Venta">
                        Precio Venta:
                        <input
                                 type="text"
                            id="precioVenta"
                            name="precioVenta"
                            value={newProducto.precioVenta}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="existencia">
                        Existencia:
                        <input
                            type="number"
                            id="existencia"
                            name="existencia"
                            value={newProducto.existencia}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="minimo">
                        Minimo:
                        <input
                            type="number"
                            id="minimo"
                            name="minimo"
                            value={newProducto.minimo}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="idTipoProducto">
                        Tipo Producto:
                        <input
                            type="text"
                            id="idTipoProducto"
                            name="idTipoProducto"
                            value={newProducto.idTipoProducto}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="idMarca">
                        Marca:
                        <input
                            type="text"
                            id="idMarca"
                            name="idMarca"
                            value={newProducto.idMarca}
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
                                    checked={newProducto.idStatus === "1"}
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
                                    checked={newProducto.idStatus === "2"}
                                    onChange={handleChange}
                                />
                                <span className="radio-button"></span> Inactivo
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    id="eliminado"
                                    name="idStatus"
                                    value="3"
                                    checked={newProducto.idStatus === "3"}
                                    onChange={handleChange}
                                />
                                <span className="radio-button"></span> Eliminado
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
            <button onClick={() => navigate('/menu')} className="btn-menum">
                Regreso al menú
            </button>
            {!showCreateForm && !editing && (
                <table className="table-productos">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripcion</th>
                            <th>Precio Venta</th>
                            <th>Existencia</th>
                            <th>Minimo</th>
                            <th>Tipo Producto</th>
                            <th>Marca</th>
                            <th>Status2</th>
                            {hasPermission('Escribir') && <th>Acciones</th>}

                        </tr>
                    </thead>
                    <tbody>
                        {productos.map(prov => (
                            prov.idProducto ? (
                                <tr key={prov.idProducto} className={prov.highlight ? "highlight-row" : ""}>
                                    <td>{prov.nombre}</td>
                                    <td>{prov.descripcion}</td>
                                    <td>{prov.precioVenta}</td>
                                    <td>{prov.existencia}</td>
                                    <td>{prov.minimo}</td>
                                    <td>{prov.tipoProductoNombre}</td>
                                    <td>{prov.marcaNombre}</td>
                                    <td>{prov.statusNombre}</td>
                                    {hasPermission('Escribir') && (
                                        <td>
                                            <button onClick={() => handleEdit(prov)} className="btn-edit">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(prov.idProducto)} className="btn-delete">
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
                    <h2>Editar Producto</h2>
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
                    <label htmlFor="descripcion">
                        Descripcion:
                        <input
                            type="text"
                            id="descripcion"
                            name="descripcion"
                            value={editing.descripcion}
                            onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                        />
                    </label>
                    <label htmlFor="precioVenta">
                        Precio Venta:
                        <input
                                 type="text"
                            id="precioVenta"
                            name="precioVenta"
                            value={editing.precioVenta}
                            onChange={(e) => setEditing({ ...editing, precioVenta: e.target.value })}
                        />
                    </label>
                    <label htmlFor="existencia">
                        Existencia:
                        <input
                                   type="text"
                            id="existencia"
                            name="existencia"
                            value={editing.existencia}
                            onChange={(e) => setEditing({ ...editing, existencia: e.target.value })}
                        />
                    </label>
                    <label htmlFor="minimo">
                        Minimo:
                        <input
                            type="number"
                            id="minimo"
                            name="minimo"
                            value={editing.minimo}
                            onChange={(e) => setEditing({ ...editing, minimo: e.target.value })}
                        />
                    </label>
                    <label htmlFor="idProducto">
                        Producto :
                        <input
                            type="text"
                            id="idProducto"
                            name="idProducto"
                            value={editing.idProducto}
                            onChange={(e) => setEditing({ ...editing, idProducto: e.target.value })}
                        />
                    </label>
                    <label htmlFor="idMarca">
                        marca:
                        <input
                            type="text"
                            id="idMarca"
                            name="idMarca"
                            value={editing.idMarca}
                            onChange={(e) => setEditing({ ...editing, idMarca: e.target.value })}
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
                            <label>
                                <input
                                    type="radio"
                                    id="eliminado"
                                    name="idStatus"
                                    value="3"
                                    checked={editing.idStatus === "3"}
                                    onChange={(e) => setEditing({ ...editing, idStatus: e.target.value })}
                                />
                                <span className="radio-button"></span> Eliminado
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

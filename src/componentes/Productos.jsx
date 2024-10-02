
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/productos.css'; // Asegúrate de que este archivo CSS exista
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';

const URL_PRODUCTOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/productos.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php";// Nueva URL para tipos de producto
const URL_TIPOPRODUCTOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/producto-tipo.php";// 1 DE 5 -  AGREGAR LA URL
const URL_MARCAS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/marca.php";

export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [tipoProductos, setTipoProductos] = useState([]);//2 DE 5 - DECLARAR LA FUNCIÓN
    const [marcas, setMarcas] = useState([]);
    const [newMarcas] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [filters, setFilters] = useState({
        productoCodigo: '',
        nombre: '',
        descripcion: '',
        precioVenta: '',
        existencia: '',
        minimo: '',
        tipoProductoNombre: '',
        marcaNombre: '',
        statusNombre: ''
    });
    const [newProducto, setNewProducto] = useState({
        productoCodigo: '',
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
    // 3 DE 5 -  ESTA PARTE PARA ALGO AVERIGUAR

    useEffect(() => {
        const fetchTipoProductos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(URL_TIPOPRODUCTOS, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTipoProductos(data);
                } else {
                    throw new Error('Error al obtener los tipos de productos');
                }
            } catch (error) {
                setError('Error al obtener los tipos de productos.');
            }
        };

        const fetchMarcas = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(URL_MARCAS, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMarcas(data);  // Asegúrate de tener un estado para almacenar las marcas
                } else {
                    throw new Error('Error al obtener las marcas');
                }
            } catch (error) {
                setError('Error al obtener las marcas.');
            }
        };

        // Llamar ambas funciones de fetch
        fetchTipoProductos();
        fetchMarcas();
    }, []); // Solo se ejecutará al montar el componente

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
                    productoCodigo: '',
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
                        Crear
                    </button>
                </>
            )}

            {/* Formulario para crear un nuevo proveedor */}
            {showCreateForm && (
                <div className="create-form">
                    <h2>Crear Productor</h2>
                    <label htmlFor="productoCodigo">
                        Codigo:
                        <input
                            type="text"
                            id="productoCodigo"
                            name="productoCodigo"
                            value={newProducto.productoCodigo}
                            onChange={handleChange}
                        />
                    </label>
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
                    <label htmlFor="idTipoProducto">                    {/* 4 DE 5 -  TIPO DE PRODUCTO */}
                        Tipo Producto:
                        <select
                            id="idTipoProducto"
                            name="idTipoProducto"
                            value={newProducto.idTipoProducto}
                            onChange={handleChange}
                        >
                            <option value="">Seleccione un tipo de producto</option>
                            {tipoProductos.map(tipo => (
                                <option key={tipo.idTipoProducto} value={tipo.idTipoProducto}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label htmlFor="idMarca">
                        Marca:
                        <select
                            id="idMarca"
                            name="idMarca"
                            value={newMarcas.idMarca}  // Asegúrate de que "newMarcas" esté definido correctamente y tenga "idMarca"
                            onChange={handleChange}
                        >
                            <option value="">Seleccione Marca</option>
                            {marcas.map(marca => (  // Cambié "tipo" a "marca" para mayor claridad
                                <option key={marca.idMarca} value={marca.idMarca}>
                                    {marca.nombre}
                                </option>
                            ))}
                        </select>

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
                Menú
            </button>
            {!showCreateForm && !editing && (
    <table className="table-productos">
        <thead>
            <tr>
                <th>
                    Codigo
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.productoCodigo}
                        onChange={(e) => setFilters({ ...filters, productoCodigo: e.target.value })}
                    />
                </th>
                <th>
                    Nombre
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.nombre}
                        onChange={(e) => setFilters({ ...filters, nombre: e.target.value })}
                    />
                </th>
                <th>
                    Descripcion
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.descripcion}
                        onChange={(e) => setFilters({ ...filters, descripcion: e.target.value })}
                    />
                </th>
                <th>
                    Precio Venta
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.precioVenta}
                        onChange={(e) => setFilters({ ...filters, precioVenta: e.target.value })}
                    />
                </th>
                <th>
                    Existencia
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.existencia}
                        onChange={(e) => setFilters({ ...filters, existencia: e.target.value })}
                    />
                </th>
                <th>
                    Minimo
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.minimo}
                        onChange={(e) => setFilters({ ...filters, minimo: e.target.value })}
                    />
                </th>
                <th>
                    Tipo Producto
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.tipoProductoNombre}
                        onChange={(e) => setFilters({ ...filters, tipoProductoNombre: e.target.value })}
                    />
                </th>
                <th>
                    Marca
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.marcaNombre}
                        onChange={(e) => setFilters({ ...filters, marcaNombre: e.target.value })}
                    />
                </th>
                <th>
                    Status
                    <input
                        type="text"
                        placeholder="Filtrar"
                        value={filters.statusNombre}
                        onChange={(e) => setFilters({ ...filters, statusNombre: e.target.value })}
                    />
                </th>
                {hasPermission('Escribir') && <th className='acciones-col'>Acciones</th>}
              
            </tr>
        </thead>
        <tbody>
    {productos
        .filter(prov => 
            (prov.productoCodigo || '').toLowerCase().includes(filters.productoCodigo.toLowerCase()) &&
            (prov.nombre || '').toLowerCase().includes(filters.nombre.toLowerCase()) &&
            (prov.descripcion || '').toLowerCase().includes(filters.descripcion.toLowerCase()) &&
            (prov.precioVenta || '').toString().includes(filters.precioVenta) &&
            (prov.existencia || '').toString().includes(filters.existencia) &&
            (prov.minimo || '').toString().includes(filters.minimo) &&
            (prov.tipoProductoNombre || '').toLowerCase().includes(filters.tipoProductoNombre.toLowerCase()) &&
            (prov.marcaNombre || '').toLowerCase().includes(filters.marcaNombre.toLowerCase()) &&
            (prov.statusNombre || '').toLowerCase().includes(filters.statusNombre.toLowerCase())
        )
        .map(prov => (
            <tr key={prov.idProducto}>
                <td>{prov.productoCodigo}</td>
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
                        <button onClick={() => handleEdit(prov)} className="btn-edit">Editar</button>
                        <button onClick={() => handleDelete(prov.idProducto)} className="btn-delete">Eliminar</button>
                    </td>
                )}
            </tr>
        ))}
</tbody>

    </table>
)}

            {/* Formulario para editar proveedor */}
            {editing && (
                <div className="edit-form">
                    <h2>Editar Producto</h2>
                    <label htmlFor="productoCodigo">
                        Codigo:
                        <input
                            type="text"
                            id="productoCodigo"
                            name="productoCodigo"
                            value={editing.productoCodigo}
                            onChange={(e) => setEditing({ ...editing, productoCodigo: e.target.value })}
                        />
                    </label>
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
                        <select                                         //* 5 DE 5 -  TIPO DE PRODUCTO ENVIAR EL ID NO EL NOMBRE */
                            id="idTipoProducto"
                            name="idTipoProducto"
                            value={editing.idTipoProducto}  // Cambiado de newProducto a editing
                            onChange={(e) => setEditing({ ...editing, idTipoProducto: e.target.value })} // Asegúrate de que actualice idTipoProducto
                        >
                            <option value="">Seleccione un tipo de producto</option>
                            {tipoProductos.map(tipo => (
                                <option key={tipo.idTipoProducto} value={tipo.idTipoProducto}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label htmlFor="idMarca">
                        marca:
                        <select
                            id="idMarca"
                            name="idMarca"
                            value={editing.idMarca}  // Asegúrate de que esté usando el estado correcto
                            onChange={(e) => setEditing({ ...editing, idMarca: e.target.value })} // Actualiza idMarca en el estado
                        >
                            <option value="">Seleccione Marca</option>
                            {marcas.map(marca => (  // Cambia `tipo` a `marca` para coincidir con el nombre de la variable
                                <option key={marca.idMarca} value={marca.idMarca}>
                                    {marca.nombre}
                                </option>
                            ))}
                        </select>

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

	

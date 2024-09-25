
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';
import '../css/sensor_unidad.css';
import LOGO from '../imagenes/logo1.png';

const URL_VENTAS = "http://localhost/acproyect/endpoint/venta.php";
const URL_CLIENTES = "http://localhost/acproyect/endpoint/cliente.php";
const URL_PRODUCTOS = "http://localhost/acproyect/endpoint/productos.php";
const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php";

export default function Venta() {
    const [venta, setVenta] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [editing2, setEditing2] = useState(null);
    const [newVenta, setNewVenta] = useState({
        "total": '',
        "idMoneda": '',
        "idCliente": '',
        "idUsuario": '',
        "idStatus": '',
        "idFactura": '',
        "noAutorizacion": '',
        "noSerie": '',
        "noDTE": '',
        "fechaEmision": '',
        "fechaCertificacion": '',
        "articulos": [
            {
                "cantidad": '',
                "precioVenta": '',
                "subtotal": '',
                "idProducto": ''
            },
            {
                "cantidad": '',
                "precioVenta": '',
                "subtotal": '',
                "idProducto": ''
            },
            {
                "cantidad": '',
                "precioVenta": '',
                "subtotal": '',
                "idProducto": ''
            }
        ]

    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const fetchVenta = async () => {
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



            const ventasResponse = await fetch(URL_VENTAS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!ventasResponse.ok) {
                throw new Error(`HTTP error! status: ${ventasResponse.status}`);
            }

            const ventaData = await ventasResponse.json();

            if (ventaData.error) {
                setError(ventaData.error);
                localStorage.removeItem('token');
                navigate('/');
            } else {
                setVenta(ventaData);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchVenta();
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
            const response = await fetch(URL_VENTAS, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newVenta)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchVenta();
                setNewVenta({
                    "total": '',
                    "idMoneda": '',
                    "idCliente": '',
                    "idUsuario": '',
                    "idStatus": '',
                    "idFactura": '',
                    "noAutorizacion": '',
                    "noSerie": '',
                    "noDTE": '',
                    "fechaEmision": '',
                    "fechaCertificacion": '',
                    "articulos": [
                        {
                            "cantidad": '',
                            "precioVenta": '',
                            "subtotal": '',
                            "idProducto": ''
                        },
                        {
                            "cantidad": '',
                            "precioVenta": '',
                            "subtotal": '',
                            "idProducto": ''
                        },
                        {
                            "cantidad": '',
                            "precioVenta": '',
                            "subtotal": '',
                            "idProducto": ''
                        }
                    ]
                });
                setSuccessMessage('Factura creada correctamente.');
                setShowCreateForm(false);
            }
        } catch (error) {
            setError('Error al crear el sensor.');
        }
    };

    const handleChange = (e) => {
        setNewVenta({
            ...newVenta,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.noAutorizacion||
            !editing.noSerie ||
            !editing.noDTE ||
            !editing.fechaEmision ||
            !editing.fechaCertificacion ||
            !editing.total ||
            !editing.idMoneda ||
            !editing.idCliente ||
            !editing.idUsuario || 
            !editing.idStatus ||
            !editing.cantidad ||
            !editing.precioVenta ||
            !editing.subtotal ||
            !editing.idProducto) {
            setError('Datos incompletos.');
            return;
        }

        try {
            const response = await fetch(URL_VENTAS, {
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
                setVenta(venta.map(s => s.idFactura === editing.idFactura ? data : s));
                setEditing(null);
                await fetchVenta();
                setSuccessMessage('Factura actualizada correctamente.');
            }
        } catch (error) {
            setError('Error al actualizar la Factura.');
        }
    };

    const handleEdit = (venta) => {
        setEditing({ ...venta });
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
            const response = await fetch(`${URL_VENTAS}?id=${id}`, {
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
                setVenta(venta.filter(s => s.idFactura !== id));
                await fetchVenta();
                setSuccessMessage('Factura eliminada correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar la Factura.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Venta'] && permisos['Venta'].includes(permiso);
    };

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>GESTION DE VENTAS</h1>
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
                        <h2>Crear Unidad de Medida de Sensor</h2>
                        <label htmlFor="unidad">
                            Descripcion - Unidad :
                            <input
                                type="text"
                                id="unidad"
                                name="unidad"
                                value={newVenta.unidad}
                                onChange={handleChange}
                            />
                        </label>
                        <label htmlFor="simbolo">
                            Simbolo:
                            <input
                                type="text"
                                id="simbolo"
                                name="simbolo"
                                value={newVenta.simbolo}
                                onChange={handleChange}
                            />
                        </label>
                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}

{editing && (
    <div className='edit-master'>
        <div className='edit-master2'>
            <div className="edit-form2">
                <h2>Editar Pedido</h2>
                <label htmlFor="idFactura">
                No. Pedido:
                <span id="idFactura">{editing.idFactura}</span>
                </label>
                <label htmlFor="noDTE">
                    DTE:
                    <input
                        type="text"
                        id="noDTE"
                        name="noDTE"
                        value={editing.noDTE}
                        onChange={(e) => setEditing({ ...editing, noDTE: e.target.value })} />
                </label>
                <label htmlFor="noAutorizacion">
                    Autorizacion:
                    <input
                        type="text"
                        id="noAutorizacion"
                        name="noAutorizacion"
                        value={editing.noAutorizacion}
                        onChange={(e) => setEditing({ ...editing, noAutorizacion: e.target.value })} />
                </label>
                <label htmlFor="noSerie">
                    Serie:
                    <input
                        type="text"
                        id="noSerie"
                        name="noSerie"
                        value={editing.noSerie} // Cambié aquí para reflejar correctamente el valor
                        onChange={(e) => setEditing({ ...editing, noSerie: e.target.value })} />
                </label>
                <label htmlFor="fechaEmision">
                    Fecha Emision:
                    <input
                        type="date"
                        id="fechaEmision"
                        name="fechaEmision"
                        value={editing.fechaEmision}
                        onChange={(e) => setEditing({ ...editing, fechaEmision: e.target.value })} />
                </label>
                <label htmlFor="fechaCertificacion">
                    Fecha Certificacion
                    <input
                        type="date"
                        id="fechaCertificacion"
                        name="fechaCertificacion"
                        value={editing.fechaCertificacion}
                        onChange={(e) => setEditing({ ...editing, fechaCertificacion: e.target.value })} />
                </label>
            </div>
            <div className='datosPedido'>
                <label htmlFor="producto">
                    Producto
                    <input
                        type="text"
                        id="producto"
                        name="producto"
                        value={editing.idProducto}
                        onChange={(e) => setEditing({ ...editing, idProducto: e.target.value })} />
                </label>
                
                <label htmlFor="idMoneda">
                    Moneda
                    <input
                        type="text"
                        id="idMoneda"
                        name="idMoneda"
                        value={editing.idMoneda}
                        onChange={(e) => setEditing({ ...editing, idMoneda: e.target.value })} />
                </label>
                <label htmlFor="idCliente">
                    Cliente
                    <input
                        type="text"
                        id="idCliente"
                        name="idCliente"
                        value={editing.idCliente}
                        onChange={(e) => setEditing({ ...editing, idCliente: e.target.value })} />
                </label>
                <label htmlFor="idUsuario">
                    Usuario
                    <input
                        type="text"
                        id="idUsuario"
                        name="idUsuario"
                        value={editing.idUsuario}
                        onChange={(e) => setEditing({ ...editing, idUsuario: e.target.value })} />
                </label>
                <label htmlFor="idStatus">
                    Status
                    <input
                        type="text"
                        id="idStatus"
                        name="idStatus"
                        value={editing.idStatus}
                        onChange={(e) => setEditing({ ...editing, idStatus: e.target.value })} />
                </label>
                <div className='datosPedido2'>
                    <label htmlFor="cantidad">
                        Cantidad
                        <input
                            type="number"
                            id="cantidad"
                            name="cantidad"
                            value={editing.cantidad}
                            onChange={(e) => setEditing({ ...editing, cantidad: e.target.value })} />
                    </label>
                    <label htmlFor="precioVenta">
                        Precio
                        <input
                            type="number"
                            id="precioVenta"
                            name="precioVenta"
                            value={editing.precioVenta}
                            onChange={(e) => setEditing({ ...editing, precioVenta: e.target.value })} />
                    </label>
                    <label htmlFor="subtotal">
                        Subtotal
                        <span id="total">{editing.subtotal}</span>
                    </label>
                    <label htmlFor="total">
                    Total :  
                    <span id="total">{editing.total}</span>
                </label>
                </div>
            </div>
        </div>
        <button onClick={handleSave}>Guardar</button>
        <button onClick={() => setEditing(null)}>Cancelar</button>
    </div>
)}

                {/* Muestra el listado de registros para el idFactura seleccionado */}
                {editing && (
                    <div className="containerc">
                        <h3>Registros para el Pedido ID: {editing.idFactura}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Cantidad</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                            {venta.filter(v => v.idFactura === editing.idFactura) // Filtra por idFactura
    .map((venta, index) => ( // Añadido el índice como segundo parámetro
        <tr key={venta.idFactura}>
            <td>{index + 1}</td> {/* Aquí se muestra el contador, iniciando en 1 */}
            <td>{venta.cantidad}</td>
            <td>{venta.productoNombre}</td>
            <td>{venta.precioVenta ? parseFloat(venta.precioVenta).toFixed(2) : 'N/A'}</td>

            <td>{venta.subtotal}</td>
            <td>
                {hasPermission('Escribir') && (
                    <button onClick={() => handleEdit(venta)} className='btn-edit'>Editar</button>
                )}
                {hasPermission('Borrar') && (
                    <button onClick={() => handleDelete(venta.idFactura)} className='btn-delete'>Eliminar</button>
                )}
            </td>
        </tr>
    ))}

                            </tbody>
                        </table>
                    </div>
                )}
                {!showCreateForm && !editing && (
                    <div className="containerc">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Autorizacion</th>
                                    <th>Serie</th>
                                    <th>DTE</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Nit</th>
                                    <th>Direccion</th>
                                    <th>Total</th>
                                    <th>Vendedor</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const seen = new Set(); // Crea un Set para almacenar IDs ya vistos
                                    return venta.filter((v) => {
                                        if (!seen.has(v.idFactura)) {
                                            seen.add(v.idFactura); // Añade el ID al Set
                                            return true; // Mantiene el registro en el filtrado
                                        }
                                        return false; // Filtra el registro duplicado
                                    })
                                        .map((venta) => (
                                            <tr key={venta.idFactura}>
                                                <td>{venta.idFactura}</td>
                                                <td>{venta.noAutorizacion}</td>
                                                <td>{venta.noSerie}</td>
                                                <td>{venta.noDTE}</td>
                                                <td>{venta.fechaCreacion}</td>
                                                <td>{venta.nombre}</td>
                                                <td>{venta.nit}</td>
                                                <td>{venta.direccion}</td>
                                                <td>{venta.total}</td>
                                                <td>{venta.usuario}</td>
                                                <td>
                                                    {hasPermission('Escribir') && (
                                                        <button onClick={() => handleEdit(venta)} className='btn-info'>Detalle</button>
                                                    )}
                                                    {hasPermission('Borrar') && (
                                                        <button onClick={() => handleDelete(venta.idFactura)} className='btn-delete'>Eliminar</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}



            </div>
        </div>
    );
}

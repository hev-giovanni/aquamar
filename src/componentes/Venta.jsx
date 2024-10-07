
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/venta.css';
import LOGO from '../imagenes/logo1.png';

const URL_VENTAS = "https://190.113.90.230/acproyect/endpoint/venta.php";
const URL_CLIENTES = "https://190.113.90.230/acproyect/endpoint/cliente.php";
const URL_PRODUCTOS = "https://190.113.90.230/acproyect/endpoint/productos.php";
const URL_USUARIOS = "https://190.113.90.230/acproyect/endpoint/usuario.php";
const URL_MONEDAS = "https://190.113.90.230/acproyect/endpoint/moneda.php";
const URL_PERMISOS = "https://190.113.90.230/acproyect/endpoint/menu-usuario.php";

export default function Venta() {
    const [venta, setVenta] = useState([]);
    const [producto, setProducto] = useState([]);
    const [cliente, setCliente] = useState([]);
    const [usuario, setUsuario] = useState([]);
    const [moneda, setMoneda] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);


    const [newVenta, setNewVenta] = useState({
        total: '',
        idMoneda: '',
        idCliente: '',
        idUsuario: '',
        idStatus: '1',
        noAutorizacion: '',
        noSerie: '',
        noDTE: '',
        fechaEmision: '',
        fechaCertificacion: '',
        articulos: [
            {
                idProducto: '',
                cantidad: '',
                precioVenta: '',
                subtotal: '',
            }

        ],
        total: 0 // Inicializa el total en 0  // Comienza con un array vacío para agregar artículos dinámicamente
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


    const fetchProducto = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_PRODUCTOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const productoData = await response.json();
            if (productoData.error) {
                setError(productoData.error);
            } else {
                setProducto(productoData);
            }
        } catch (error) {
            setError('Error al obtener los Tipos.');
        }
    };



    const fetchCliente = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_CLIENTES, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const clienteData = await response.json();
            if (clienteData.error) {
                setError(clienteData.error);
            } else {
                setCliente(clienteData);
            }
        } catch (error) {
            setError('Error al obtener los Clientes.');
        }
    };

    const fetchUsuario = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_USUARIOS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const usuarioData = await response.json();
            if (usuarioData.error) {
                setError(usuarioData.error);
            } else {
                setUsuario(usuarioData);
            }
        } catch (error) {
            setError('Error al obtener los VENDEDORES.');
        }
    };

    const fetchMoneda = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_MONEDAS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const monedaData = await response.json();
            if (monedaData.error) {
                setError(monedaData.error);
            } else {
                setMoneda(monedaData);
            }
        } catch (error) {
            setError('Error al obtener los MONEDAS.');
        }
    };




    useEffect(() => {
        fetchVenta();
        fetchProducto();
        fetchCliente();
        fetchUsuario();
        fetchMoneda();
    }, [navigate]);

    // Dependencias del useEffect


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
                    "totalProducto": '',
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
        const { name, value } = e.target;
        const finalValue = name === "idStatus" && (value === "" || value === undefined) ? 1 : value;
        console.log(`Nombre del campo: ${name}, Valor enviado: ${finalValue}`); // Imprime el nombre del campo y su valor

        setNewVenta((prevVenta) => ({
            ...prevVenta,
            [name]: finalValue
        }));
    };



    const addArticulo = () => {
        setNewVenta((prevVenta) => ({
            ...prevVenta,
            articulos: [
                ...prevVenta.articulos,
                {
                    idProducto: '',
                    cantidad: '',
                    precioVenta: '',
                    subtotal: '',
                }
            ]
        }));
    };




    const handleArticuloChange = (index, e) => {
        const { name, value } = e.target;

        // Convierte la cantidad y precioVenta a número si es necesario
        const numericValue = name === 'cantidad' || name === 'precioVenta' ? parseFloat(value) || 0 : value;

        // Actualiza los artículos en el estado
        const updatedArticulos = newVenta.articulos.map((articulo, i) => {
            if (i === index) {
                // Al actualizar, también recalcula subtotal y totalProducto
                const updatedArticulo = { ...articulo, [name]: numericValue };

                // Calcular subtotal y totalProducto
                const cantidad = updatedArticulo.cantidad || 0;
                const precioVenta = updatedArticulo.precioVenta || 0;
                const subtotal = cantidad * precioVenta;
                const descuento = (subtotal * (updatedArticulo.descuento / 100)) || 0;
                const totalProducto = subtotal - descuento;

                return {
                    ...updatedArticulo,
                    subtotal,
                    totalProducto
                };
            }
            return articulo; // Si no es el índice que se está editando, devuelve el artículo original
        });

        // Calcular el total de todos los productos
        const total = updatedArticulos.reduce((acc, articulo) => acc + (articulo.totalProducto || 0), 0);

        // Actualiza el estado de newVenta
        setNewVenta({ ...newVenta, articulos: updatedArticulos, total }); // Actualiza el total también
    };




    const removeArticulo = (index) => {
        const updatedArticulos = newVenta.articulos.filter((_, i) => i !== index);
        setNewVenta({ ...newVenta, articulos: updatedArticulos });
    };

    // Función para enviar el pedido

    /*
        const handleChange = (e) => {
            const { name, value } = e.target;
            setEditing((prev) => {
                const updatedEditing = { ...prev, [name]: value };
    
                // Calcula el subtotal si se cambia cantidad o precioVenta
                if (name === "cantidad" || name === "precioVenta") {
                    const cantidad = parseFloat(updatedEditing.cantidad) || 0;
                    const precioVenta = parseFloat(updatedEditing.precioVenta) || 0;
                    updatedEditing.subtotal = (cantidad * precioVenta).toFixed(2); // Actualiza el subtotal
    
                    console.log("Cantidad:", updatedEditing.cantidad);
                    console.log("PrecioVenta:", updatedEditing.precioVenta);
                    console.log("Subtotal calculado:", updatedEditing.subtotal);
    
    
    
    
                }
    
                return updatedEditing;
            });
        };
    */


    const Venta = ({ facturas }) => {
        console.log(facturas); // Verificar el valor de facturas

        if (!facturas) {
            return <p>No hay facturas disponibles</p>;
        }

        const facturasFiltradas = facturas.filter(factura => factura && factura.idFactura);

        return (
            <div>
                {facturasFiltradas.map(factura => (
                    <p key={factura.idFactura}>Factura ID: {factura.idFactura}</p>
                ))}
            </div>
        );
    };


    const totalFactura = venta && editing && editing.idFactura
        ? venta.filter(v => v.idFactura === editing.idFactura)
            .reduce((acc, v) => acc + parseFloat(v.totalProducto || 0), 0)
        : 0;




    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        if (!editing.fechaCreacion ||
            !editing.idFactura ||
            !editing.idDetalleFact ||
            !editing.noAutorizacion ||
            !editing.noSerie ||
            !editing.noDTE ||
            !editing.idMoneda ||
            !editing.moneda ||
            !editing.idCliente ||
            !editing.nombre ||
            !editing.nit ||
            !editing.direccion ||
            !editing.idUsuario ||
            !editing.usuario ||
            !editing.cantidad ||
            !editing.precioVenta ||
            !editing.subtotal ||
            !editing.idProducto ||
            !editing.productoNombre ||
            !editing.total ||
            !editing.totalProducto ||
            !editing.idStatus ||
            !editing.nombreStatus) {
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
                setSuccessMessage('Registro actualizada correctamente.');
            }

        } catch (error) {
            setError('Error al actualizar el Registro.');
        }
    };


    const handleEdit = (venta) => {
        setEditing({ ...venta });
    };

    const handleSave = () => {
        handleUpdate();
    };

    const handleDelete1 = async (id, noSerie, noDTE, total) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        // Crear el objeto JSON que se enviará al backend
        const payload = {
            noSerie: noSerie,
            noDTE: noDTE,
            total: total
        };

        // Imprimir el JSON que se enviará
        console.log(`Enviando JSON al backend: ${JSON.stringify(payload)}`);

        try {
            const response = await fetch(`${URL_VENTAS}?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload) // Enviar el JSON en el cuerpo
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



    const handleDelete2 = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        // Crear el objeto JSON que se enviará al backend
        const payload = { idDetalleFact: id };

        try {
            const response = await fetch(`${URL_VENTAS}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload) // Enviar el JSON en el cuerpo
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setVenta(venta.filter(s => s.idDetalleFact !== id));
                await fetchVenta();
                setSuccessMessage('Registro eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Registro.');
        }
    };


    const hasPermission = (permiso) => {
        return permisos['Proveedores'] && permisos['Proveedores'].includes(permiso);
    };




    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <img src={LOGO} alt="LOGO" />
                <h1>REGISTRO DE VENTAS</h1>
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
                <hr></hr>
                {showCreateForm && (
                    <div className="cedit-master">
                        <div className="cedit-master2">
                            <div className="cdit-form2">
                                <h2>Crear Pedido</h2>
                                <label htmlFor="noDTE">DTE:
                                    <input
                                        type="text"
                                        id="noDTE"
                                        name="noDTE"
                                        value={newVenta.noDTE}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label htmlFor="noAutorizacion">Autorización:
                                    <input
                                        type="text"
                                        id="noAutorizacion"
                                        name="noAutorizacion"
                                        value={newVenta.noAutorizacion}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label htmlFor="noSerie">Serie:
                                    <input
                                        type="text"
                                        id="noSerie"
                                        name="noSerie"
                                        value={newVenta.noSerie}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label htmlFor="fechaEmision">Fecha Emisión:
                                    <input
                                        type="datetime-local"
                                        id="fechaEmision"
                                        name="fechaEmision"
                                        value={newVenta.fechaEmision}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label htmlFor="fechaCertificacion">Fecha Certificación:
                                    <input
                                        type="datetime-local"
                                        id="fechaCertificacion"
                                        name="fechaCertificacion"
                                        value={newVenta.fechaCertificacion}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>
                            <div className="cdatosPedido">
                                <label htmlFor="cliente">Cliente:
                                    <select
                                        id="cliente"
                                        name="idCliente"
                                        value={newVenta.idCliente}
                                        onChange={(e) => handleChange(e)}  // Cambiamos para manejar sólo el cliente
                                    >
                                        <option value="">Seleccione</option>
                                        {cliente.map((cliente) => (
                                            <option key={cliente.idCliente} value={cliente.idCliente}>
                                                {cliente.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label htmlFor="idUsuario">Vendedor:
                                    <select
                                        id="usuario"
                                        name="idUsuario"
                                        value={newVenta.idUsuario}
                                        onChange={(e) => handleChange(e)}  // Cambiamos para manejar sólo el cliente
                                    >
                                        <option value="">Seleccione</option>
                                        {usuario.map((usuario) => (
                                            <option key={usuario.idUsuario} value={usuario.idUsuario}>
                                                {usuario.usuario}
                                            </option>
                                        ))}
                                    </select>
                                </label>



<label htmlFor="idStatus">
    <input
        type="number"
        id="idStatus"
        name="idStatus"
        value={newVenta.idStatus === undefined ? 1 : newVenta.idStatus} // Muestra 1 si idStatus es undefined
        onChange={handleChange}
        style={{ display: 'none' }} 
        
    />
</label>

                                <label htmlFor="idUsuario">Moneda:
                                    <select
                                        id="idMoneda"
                                        name="idMoneda"
                                        value={newVenta.idMoneda}
                                        onChange={(e) => handleChange(e)}  // Cambiamos para manejar sólo el cliente
                                    >
                                        <option value="">Seleccione</option>
                                        {moneda.map((moneda) => (
                                            <option key={moneda.idMoneda} value={moneda.idMoneda}>
                                                {moneda.moneda}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="formArticulos">


                                {
                                    newVenta.articulos.map((articulo, index) => (
                                        <div key={index} className="articulo">
                                            <h3>Producto</h3>
                                            <label htmlFor={`idProducto-${index}`}>Producto:
                                                <select
                                                    id="idProducto"
                                                    name="idProducto"
                                                    value={articulo.idProducto}
                                                    onChange={(e) => handleArticuloChange(index, e)}  // Pasamos el índice y el evento
                                                >
                                                    <option value="">Seleccione</option>
                                                    {producto.map((producto) => (
                                                        <option key={producto.idProducto} value={producto.idProducto}>
                                                            {producto.nombre}
                                                        </option>
                                                    )
                                                    )}
                                                </select>

                                            </label>





                                            <label htmlFor={`cantidad-${index}`}>Cantidad:
                                                <input
                                                    type="number"
                                                    id={`cantidad-${index}`}
                                                    name="cantidad"
                                                    value={articulo.cantidad}
                                                    onChange={(e) => handleArticuloChange(index, e)}
                                                />
                                            </label>
                                            <label htmlFor={`precioVenta-${index}`}>Precio:
                                                <input
                                                    type="number"
                                                    id={`precioVenta-${index}`}
                                                    name="precioVenta"
                                                    value={articulo.precioVenta}
                                                    onChange={(e) => handleArticuloChange(index, e)}
                                                />

                                            </label>


                                            <label htmlFor={`subtotal-${index}`}>Subtotal:
                                                <span id={`subtotal-${index}`} style={{ display: 'block', border: '5px solid #ccc', backgroundColor: '#ced1d1 ', width: '100px', marginTop: '5px' }}>
                                                    {articulo.subtotal ? articulo.subtotal.toFixed(2) : '0.00'}</span>
                                            </label>

                                            <label htmlFor={`descuento-${index}`}>Descuento:
                                                <input
                                                    type="number"
                                                    id={`descuento-${index}`}
                                                    name="descuento"
                                                    value={articulo.descuento}
                                                    onChange={(e) => handleArticuloChange(index, e)}
                                                />
                                            </label>

                                            <div >
                                                <p>Total Producto:</p>
                                                <span id={`totalProducto-${index}`} style={{ display: 'block', border: '5px solid #ccc', backgroundColor: '#ced1d1 ', width: '100px', marginTop: '5px' }}>
                                                    {articulo.totalProducto ? articulo.totalProducto.toFixed(2) : '0.00'}
                                                </span>
                                            </div>

                                            <button type="button" onClick={() => removeArticulo(index)}>Eliminar Artículo</button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div className='otro'>
                            <button type="button" onClick={addArticulo}>Agregar Artículo</button>
                            <label htmlFor="totalPedido">
                                Total Pedido:
                                <input
                                    type="number"
                                    id="total"
                                    name="total"
                                    value={newVenta.total.toFixed(2)} // Muestra el total con 2 decimales
                                    readOnly // Hacemos que el campo de total sea solo de lectura
                                />
                            </label>
                        </div>

                        <button onClick={handleCreate}>Crear</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                    </div>
                )}


                {!showCreateForm && editing && (
                    <div className='edit-master'>
                        <div className='edit-master2'>
                            <div className="edit-form2">
                                <h2>Editar Pedido</h2>
                                <hr></hr>
                                <br></br>
                                <label htmlFor="idFactura" style={{ fontSize: '20px' }}>
                                    No. Pedido:
                                    <span id="vtotal2">{editing.idFactura}</span>
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
                                        type="datetime-local"
                                        id="fechaEmision"
                                        name="fechaEmision"
                                        value={editing.fechaEmision}
                                        onChange={(e) => setEditing({ ...editing, fechaEmision: e.target.value })} />
                                </label>
                                <label htmlFor="fechaCertificacion">
                                    Fecha Certificacion
                                    <input
                                        type="datetime-local"
                                        id="fechaCertificacion"
                                        name="fechaCertificacion"
                                        value={editing.fechaCertificacion}
                                        onChange={(e) => setEditing({ ...editing, fechaCertificacion: e.target.value })} />
                                </label>

                            </div>
                            <div className='datosPedido'>
                                <label htmlFor="idCliente">
                                    Cliente
                                    <span id="vtotal">{editing.nombre}</span> </label>
                                <label htmlFor="idUsuario">
                                    Vendedor
                                    <span id="vtotal">{editing.usuario}</span> </label>
                                <label htmlFor="idStatus">
                                    Status
                                    <span id="vtotal">{editing.nombreStatus}</span> </label>
                                <label htmlFor="idMoneda">
                                    Moneda :
                                    <span id="vtotal">{editing.moneda}</span>
                                </label>
                                <label htmlFor="idDetalleFact">
                                    REGISTRO No.
                                    <input
                                        type="text"
                                        id="idDetalleFact"
                                        name="idDetalleFact"
                                        value={editing.idDetalleFact}
                                        onChange={(e) => setEditing({ ...editing, idDetalleFact: e.target.value })}
                                        style={{ display: 'none' }} // Esto oculta el campo de entrada
                                    />
                                </label>
                                <span id="vtotal22">
                                    {selectedIndex !== null && (
                                        <p>{selectedIndex + 1}</p> // Mostrar el índice seleccionado
                                    )}</span><br></br>



                                <label htmlFor="total">
                                    TOTAL FACTURA
                                    <span id="vtotal">{totalFactura.toFixed(2)}</span> {/* Muestra el total formateado */}
                                </label>

                            </div>
                            <div className='datosPedido2'>
                                <label htmlFor="idProducto">
                                    Producto :
                                    <select
                                        id="idProducto"
                                        name="idProducto"
                                        value={editing.idProducto}
                                        onChange={(e) => setEditing({ ...editing, idProducto: e.target.value })} >
                                        <option value="">Seleccione un Tipo</option>
                                        {producto.map(producto => (
                                            <option key={producto.idProducto} value={producto.idProducto}>
                                                {producto.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label htmlFor="cantidad">
                                    Cantidad
                                    <input
                                        type="number"
                                        id="cantidad"
                                        name="cantidad"
                                        value={editing.cantidad}
                                        onChange={(e) => {
                                            const cantidad = parseFloat(e.target.value) || 0; // Convertir a número, manejar NaN
                                            const subtotal = editing.precioVenta * cantidad; // Calcular subtotal
                                            const descuento = (subtotal * (editing.descuento / 100)); // Calcular el descuento
                                            const totalProducto = subtotal - descuento; // Calcular total
                                            setEditing({ ...editing, cantidad, totalProducto, subtotal }); // Actualizar el estado
                                        }}
                                        step="0.00" // Permitir entradas decimales
                                    />
                                </label>

                                <label htmlFor="precioVenta">
                                    Precio
                                    <input
                                        type="number"
                                        id="precioVenta"
                                        name="precioVenta"
                                        value={editing.precioVenta}
                                        onChange={(e) => {
                                            const precioVenta = parseFloat(e.target.value) || 0; // Convertir a número, manejar NaN
                                            const subtotal = precioVenta * editing.cantidad; // Calcular subtotal
                                            const descuento = (subtotal * (editing.descuento / 100)); // Calcular el descuento
                                            const totalProducto = subtotal - descuento; // Calcular total
                                            setEditing({ ...editing, precioVenta, subtotal, totalProducto, descuento }); // Actualizar el estado
                                        }}
                                        step="0.01" // Permitir entradas decimales
                                    />
                                </label>

                                <label htmlFor="subtotal">
                                    Subtotal :
                                    <span id="vtotal">{editing.subtotal ? parseFloat(editing.subtotal).toFixed(2) : 0}</span>
                                </label>

                                <label htmlFor="descuento">
                                    Descuento %
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            id="descuento"
                                            name="descuento"
                                            value={editing.descuento}
                                            onChange={(e) => {
                                                const descuento = parseFloat(e.target.value) || 0; // Convertir a número, manejar NaN
                                                // Asegurarse de que el descuento esté entre 0 y 100
                                                const validDescuento = Math.max(0, Math.min(100, descuento));
                                                const subtotal = editing.precioVenta * editing.cantidad; // Calcular subtotal
                                                const totalProducto = subtotal - (subtotal * (validDescuento / 100)); // Calcular total con el nuevo descuento
                                                setEditing({ ...editing, descuento: validDescuento, subtotal, totalProducto }); // Actualizar el estado
                                            }}
                                            min="0" // Valor mínimo
                                            max="100" // Valor máximo
                                            style={{ width: '80px', marginRight: '5px' }}
                                        />
                                        <span>%</span> {/* Mostrar el símbolo de porcentaje */}
                                    </div>
                                </label>

                                <label htmlFor="totalProducto">
                                    Total Producto:
                                    <span id="vtotal">{editing.totalProducto ? parseFloat(editing.totalProducto).toFixed(2) : 'N/A'}</span>
                                </label>
                                <br></br>
                                <button onClick={handleSave} className="btn-create">Guardar</button>
                                <button onClick={() => setEditing(null)} className="btn-create">Cancelar</button>

                            </div>

                        </div>
                    </div>
                )}<hr></hr><br></br>

                {/* Muestra el listado de registros para el idFactura seleccionado */}
                {editing && (
                    <div className="containerc">
                        <h3>Registros para el Pedido ID: {editing.idFactura}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Registro</th>
                                    <th>Cantidad</th>
                                    <th>Codigo</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                    <th> Descuento %</th>
                                    <th>Total Producto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {venta.filter(v => v.idFactura === editing.idFactura)
                                    .map((venta, index) => (
                                        <tr key={venta.idFactura}>
                                            <td>{index + 1}</td>
                                            <td>{venta.cantidad}</td>
                                            <td>{venta.productoCodigo}</td>
                                            <td>{venta.productoNombre}</td>
                                            <td>{venta.precioVenta}</td>
                                            <td>{venta.subtotal}</td>
                                            <td>{venta.descuento}</td>
                                            <td>{venta.totalProducto}</td>
                                            <td>
                                                {hasPermission('Escribir') && (
                                                    <button
                                                        onClick={() => {
                                                            handleEdit(venta);
                                                            setSelectedIndex(index);
                                                            window.scrollTo(0, 110); // Desplazar el cursor al inicio de la página
                                                        }}
                                                        className='btn-edit'
                                                    >
                                                        Editar
                                                    </button>

                                                )}
                                                {hasPermission('Borrar') && (
                                                    <button onClick={() => handleDelete2(venta.idDetalleFact)} className='btn-delete'>Eliminar</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                            <div style={{ marginBottom: '60px' }}></div> {/* Espacio adicional */}
                        </table>
                    </div>
                )
                }

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
                                                <td>{venta.usuario}</td>
                                                <td>
                                                    {hasPermission('Escribir') && (
                                                        <button onClick={() => handleEdit(venta)} className='btn-info'>Detalle</button>
                                                    )}
                                                    {hasPermission('Borrar') && (
                                                        <button onClick={() => handleDelete1(venta.idFactura, venta.noSerie, venta.noDTE, venta.total)} className='btn-delete'>Eliminar</button>
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

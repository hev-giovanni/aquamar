import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css'; 
import LOGO from '../imagenes/logo1.png';

const URL_USUARIOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/usuario.php";
const URL_PERMISOS = "http://aquamar.xgt2.com:8080/acproyect/endpoint/menu-usuario.php"; 
const URL_SUCURSAL = "http://aquamar.xgt2.com:8080/acproyect/endpoint/sucursal.php"; 

const URL_SENSOR = "http://aquamar.xgt2.com:8080/acproyect/endpoint/sensor.php";
const URL_DISPOSITIVO = "http://aquamar.xgt2.com:8080/acproyect/endpoint/dispositivo.php";

export default function Sensor() {
    const [usuario, setUsuario] = useState([]);
    const [permisos, setPermisos] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [newUsuario, setNewUsuario] = useState({
        primerNombre: '', segundoNombre: '', otrosNombres: '',
        primerApellido: '', segundoApellido: '', fechaNacimiento: '',
        telefono: '', nit: '', usuario: '', email: '', idGenero: '',
        idSucursal: '', idStatus: '', fechaModificacion: '', usuarioModificacion: '',
        idUsuario: ''
    });
    const [sensors, setSensors] = useState([]);
    const [dispositivos, setDispositivos] = useState([]);
    const [sucursales, setSucursales] = useState([]); // Estado para sucursales
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); 
    const navigate = useNavigate();

    const fetchUsuario = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const permisosResponse = await fetch(URL_PERMISOS, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!permisosResponse.ok) throw new Error(`HTTP error! status: ${permisosResponse.status}`);
            
            const permisosData = await permisosResponse.json();
            const permisosMap = permisosData.reduce((acc, permiso) => {
                if (!acc[permiso.moduloNombre]) acc[permiso.moduloNombre] = [];
                acc[permiso.moduloNombre].push(permiso.permiso);
                return acc;
            }, {});
            setPermisos(permisosMap);

            const [usuarioResponse, sensorsResponse, dispositivosResponse, sucursalesResponse] = await Promise.all([
                fetch(URL_USUARIOS, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),

                fetch(URL_SENSOR, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),
                fetch(URL_DISPOSITIVO, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                }),                fetch(URL_SUCURSAL, { // Nueva solicitud para obtener sucursales
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
            ]);

            if (!usuarioResponse.ok || !sensorsResponse.ok || !dispositivosResponse.ok || !sucursalesResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }


            const usuarioData = await usuarioResponse.json();
            const sensorsData = await sensorsResponse.json();
            const dispositivosData = await dispositivosResponse.json();
            const sucursalesData = await sucursalesResponse.json(); // Obtener datos de sucursales

            if (usuarioData.error) {
                setError(usuarioData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setUsuario(usuarioData);
            }

            setSensors(sensorsData);
            setDispositivos(dispositivosData);
            setSucursales(sucursalesData); // Guardar sucursales en el estado
            

        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchUsuario();
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
            const response = await fetch(URL_USUARIOS, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(newUsuario)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchUsuario();
                setNewUsuario({
                    primerNombre: '', segundoNombre: '', otrosNombres: '',
                    primerApellido: '', segundoApellido: '', fechaNacimiento: '',
                    telefono: '', nit: '', usuario: '', email: '', idGenero: '',
                    idSucursal: '', idStatus: '', fechaModificacion: '', usuarioModificacion: '',
                    idUsuario: ''
                });
                setSuccessMessage('Usuario creado correctamente.');
                setShowCreateForm(false); 
                setTimeout(() => {
                    window.location.reload();
                }, 1000); // 2 segundos de retraso
            }} catch (error) {
            setError('Error al crear el Usuario.');
        }
    };

    const handleChange = (e) => {
        setNewUsuario({ ...newUsuario, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const response = await fetch(URL_USUARIOS, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editing)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setUsuario(usuario.map(u => u.idUsuario === editing.idUsuario ? data : u));
                setEditing(null);
                setSuccessMessage('Usuario actualizado correctamente.');
                fetchUsuario()
            }
        } catch (error) {
            setError('Error al actualizar el Usuario.');
        }
    };

    const handleEdit = (usuario) => {
        setEditing({ ...usuario });
        fetchUsuario(); 
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
            const response = await fetch(`${URL_USUARIOS}?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setUsuario(usuario.filter(u => u.idUsuario !== id));
                await fetchUsuario();
                setSuccessMessage('Usuario eliminado correctamente.');
            }
        } catch (error) {
            setError('Error al eliminar el Usuario.');
        }
    };

    const hasPermission = (permiso) => {
        return permisos['Usuarios'] && permisos['Usuarios'].includes(permiso);
    };

    const filteredUsuario = usuario.filter(u =>
        (u.primerNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.segundoNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.primerApellido || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="sensores-container">
       
                <h1>Gestión de Usuarios</h1>
                <img src={LOGO} alt="LOGO" />
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <input 
                    type="text" 
                    placeholder="Buscar usuario" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />

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
                        <h2>Agregar Nuevo Usuario</h2>
                        <input name="primerNombre" 
                        placeholder="Primer Nombre" value={newUsuario.primerNombre} onChange={handleChange} />
                        <input name="segundoNombre" 
                        placeholder="Segundo Nombre" value={newUsuario.segundoNombre} onChange={handleChange} />
                        <input name="otrosNombres"      placeholder="Otros Nombres" value={newUsuario.otrosNombres} onChange={handleChange} />
                        <input name="primerApellido"    placeholder="Primer Apellido" value={newUsuario.primerApellido} onChange={handleChange} />
                        <input name="segundoApellido"   placeholder="Segundo Apellido" value={newUsuario.segundoApellido} onChange={handleChange} />
                        <input type="date" name="fechaNacimiento" value={newUsuario.fechaNacimiento} onChange={handleChange} />
                        <input name="telefono"          placeholder="Teléfono" value={newUsuario.telefono} onChange={handleChange} />
                        <input name="nit"               placeholder="NIT" value={newUsuario.nit} onChange={handleChange} />
                        <input name="usuario"           placeholder="Usuario" value={newUsuario.usuario} onChange={handleChange} />
                        <input name="clave" type="password"placeholder="Password" value={newUsuario.clave} onChange={handleChange} />
                        <input name="email"             placeholder="Email" value={newUsuario.email} onChange={handleChange} />
                        <select name="idGenero" value={newUsuario.idGenero} onChange={handleChange}>
                            <option value="">Seleccione Género</option>
                            <option value="1">Masculino</option>
                            <option value="2">Femenino</option>
                        </select>
                        <select name="idSucursal" value={newUsuario.idSucursal} onChange={handleChange}>
                            <option value="">Seleccione Sucursal</option>
                            {sucursales.map(sucursal => (
                                <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                                    {sucursal.nombre}
                                </option>
                            ))}
                        </select>
                        <select name="idStatus" value={newUsuario.idStatus} onChange={handleChange}>
                            <option value="">Seleccione Estado</option>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                        <button onClick={handleCreate}>Crear Usuario</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
                        
                    </div>
                )}

                {editing && (
                    <div className="edit-form">
                        <h2>Editar Usuario</h2>
                        <input name="primerNombre" placeholder="Primer Nombre" value={editing.primerNombre} onChange={(e) => setEditing({ ...editing, primerNombre: e.target.value })} />
                        <input name="segundoNombre" placeholder="Segundo Nombre" value={editing.segundoNombre} onChange={(e) => setEditing({ ...editing, segundoNombre: e.target.value })} />
                        <input name="otrosNombres" placeholder="Otros Nombres" value={editing.otrosNombres} onChange={(e) => setEditing({ ...editing, otrosNombres: e.target.value })} />
                        <input name="primerApellido" placeholder="Primer Apellido" value={editing.primerApellido} onChange={(e) => setEditing({ ...editing, primerApellido: e.target.value })} />
                        <input name="segundoApellido" placeholder="Segundo Apellido" value={editing.segundoApellido} onChange={(e) => setEditing({ ...editing, segundoApellido: e.target.value })} />
                        <input type="date" name="fechaNacimiento" value={editing.fechaNacimiento} onChange={(e) => setEditing({ ...editing, fechaNacimiento: e.target.value })} />
                        <input name="telefono" placeholder="Teléfono" value={editing.telefono} onChange={(e) => setEditing({ ...editing, telefono: e.target.value })} />
                        <input name="nit" placeholder="NIT" value={editing.nit} onChange={(e) => setEditing({ ...editing, nit: e.target.value })} />
                        <input name="usuario" placeholder="Usuario" value={editing.usuario} onChange={(e) => setEditing({ ...editing, usuario: e.target.value })} />
                        <input name="email" placeholder="Email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                        <select name="idGenero" value={editing.idGenero} onChange={(e) => setEditing({ ...editing, idGenero: e.target.value })}>
                            <option value="">Seleccione Género</option>
                            <option value="1">Masculino</option>
                            <option value="2">Femenino</option>
                        </select>
                        <select name="idSucursal" value={editing.idSucursal} onChange={(e) => setEditing({ ...editing, idSucursal: e.target.value })}>
                            <option value="">Seleccionar Sucursal</option>
                            {sucursales.map(sucursal => (
                                <option key={sucursal.idSucursal} value={sucursal.idSucursal}>
                                    {sucursal.nombre}
                                </option>
                            ))}
                        </select>
                        <select name="idStatus" value={editing.idStatus} onChange={(e) => setEditing({ ...editing, idStatus: e.target.value })}>
                            <option value="1">Activo</option>
                            <option value="0">Inactivo</option>
                        </select>
                        <button onClick={handleSave}>Actualizar Usuario</button>
                        <button onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                )}
                <div className='container-otro'>
{!showCreateForm && !editing && ( 
                <table className="usuario-table">
                    <thead>
                        <tr>
                            <th>Fecha Nacimiento</th>
                            <th>Género</th>
                            <th>Apellidos</th>
                            <th>Nombres</th>
                            <th>Teléfono</th>
                            <th>NIT</th>
                            <th>Usuario</th>
                            <th>Estado</th>
                            <th>Email</th>
                            {hasPermission('Escribir') && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsuario.map((u) => (
                            <tr key={u.idUsuario}>
                                <td>{u.fechaNacimiento}</td>
                                <td>{u.nombreGenero}</td>
                                <td>{u.primerApellido} {u.segundoApellido}</td>
                                <td>{u.primerNombre} {u.segundoNombre}</td>
                                <td>{u.telefono}</td>
                                <td>{u.nit}</td>
                                <td>{u.usuario}</td>
                                <td>{u.nombreStatus}</td>
                                <td>{u.email}</td>
                                {hasPermission('Escribir') && (
                                    <td>
                                        <button onClick={() => handleEdit(u)} className="btn-edit">Editar</button>
                                        <button onClick={() => handleDelete(u.idUsuario)} className="btn-delete">Eliminar</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            </div>
            </div>
    );
}

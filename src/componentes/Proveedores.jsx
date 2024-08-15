import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/proveedores.css'; // Asegúrate de crear este archivo CSS

const URL_PROVEEDORES = "http://localhost/acproyect/endpoint/proveedores.php";

export default function Proveedores() {
    const [proveedores, setProveedores] = useState([]);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProveedores = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token provided.');
                return navigate('/');
            }

            try {
                const response = await fetch(URL_PROVEEDORES, {
                    method: 'GET',
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
                    localStorage.removeItem('token');
                    navigate('/');
                } else {
                    setProveedores(data);
                }
            } catch (error) {
                setError('Error al obtener la información de proveedores.');
                localStorage.removeItem('token');
                navigate('/');
            }
        };

        fetchProveedores();
    }, [navigate]);

    useEffect(() => {
        if (error) {
            // Mostrar mensaje de error y redirigir después de un breve retraso
            const timer = setTimeout(() => {
                navigate('/proveedores'); // Asegúrate de que esta sea la ruta correcta
            }, 3000); // Espera 3 segundos antes de redirigir

            // Limpia el timer si el componente se desmonta
            return () => clearTimeout(timer);
        }
    }, [error, navigate]);

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
                console.error('HG Error en la solicitud:', error);
            } else {
                setProveedores(proveedores.filter(p => p.idProveedor !== id));
            }
        } catch (error) {
            setError('Error al borrar el proveedor.');
            console.error('Error en la solicitud:', error);
        }
    };

    const handleUpdate = async (id, updatedData) => {
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
                body: JSON.stringify({ idProveedor: id, ...updatedData }) // Enviar idProveedor junto con los datos actualizados
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setProveedores(proveedores.map(p => p.idProveedor === id ? { ...p, ...updatedData } : p));
                setEditing(null);
            }
        } catch (error) {
            setError('Error al actualizar el proveedor.');
            console.error('Error en la solicitud:', error);
        }
    };

    const handleEdit = (proveedor) => {
        setEditing({ ...proveedor }); // Asegúrate de que `editing` sea una copia del objeto
    };

    const handleSave = () => {
        if (editing) {
            handleUpdate(editing.idProveedor, {
                nombre: editing.nombre,
                direccion: editing.direccion
            });
        }
    };

    const handleChange = (e) => {
        setEditing({
            ...editing,
            [e.target.name]: e.target.value
        });
    };

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div className="proveedores-container">
            <h1>Proveedores</h1>
            {editing ? (
                <div className="edit-form">
                    <h2>Editar Proveedor</h2>
                    <label htmlFor="nombre">
                        Nombre:
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={editing.nombre || ''}
                            onChange={handleChange}
                        />
                    </label>
                    <label htmlFor="direccion">
                        Dirección:
                        <input
                            type="text"
                            id="direccion"
                            name="direccion"
                            value={editing.direccion || ''}
                            onChange={handleChange}
                        />
                    </label>
                    <button onClick={handleSave}>Guardar</button>
                    <button onClick={() => setEditing(null)}>Cancelar</button>
                </div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.map((prov) => (
                            <tr key={prov.idProveedor}>
                                <td>{prov.nombre}</td>
                                <td>{prov.direccion}</td>
                                <td>
                                    <button onClick={() => handleEdit(prov)}>Editar</button>
                                    <button onClick={() => handleDelete(prov.idProveedor)}>Borrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

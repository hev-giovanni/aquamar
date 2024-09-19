import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';
import '../css/altaModulo.css';
import '../css/sensor_unidad.css';
import '../css/dispositivoSensor.css';

import LOGO from '../imagenes/logo1.png';

const URL_PERMISOS = "http://localhost/acproyect/endpoint/menu-usuario.php";
const URL_ALTA_PERMISO = "http://localhost/acproyect/endpoint/altaRolPermiso.php";

export default function AltaRolPermiso() {
    const [altaRolPermiso, setAltaRolPermiso] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterOptions, setFilterOptions] = useState([]);
    const navigate = useNavigate();

    // Función para obtener permisos y rol-módulo-permiso desde el backend
    const fetchAltaRolPermiso = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            // Obtener datos de permisos asignados al rol y módulo
            const response = await fetch(URL_ALTA_PERMISO, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const altaRolPermisoData = await response.json();
            if (altaRolPermisoData.error) {
                setError(altaRolPermisoData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setAltaRolPermiso(altaRolPermisoData);
                // Definir opciones para el filtro
                const options = [...new Set(altaRolPermisoData.map(item => item.moduloNombre))];
                setFilterOptions(options);
            }
        } catch (error) {
            setError('Error al obtener la información.');
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    useEffect(() => {
        fetchAltaRolPermiso();
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

    const handleTogglePermission = async (item, permiso) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const exists = item.permisos.includes(permiso);
            const method = exists ? 'DELETE' : 'POST'; // Si existe, lo borra; si no, lo crea

            const response = await fetch(URL_ALTA_PERMISO, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idRol: item.idRol,
                    idModulo: item.idModulo,
                    idPermiso: permiso
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                await fetchAltaRolPermiso(); // Refrescar la lista
                setSuccessMessage(exists ? 'Permiso eliminado correctamente.' : 'Permiso asignado correctamente.');
            }
        } catch (error) {
            setError('Error al cambiar el permiso.');
        }
    };

    const filteredAltaRolPermiso = altaRolPermiso.filter(item =>
        item.moduloNombre === selectedFilter
    );

    // Agrupar por rol y módulo y mostrar los permisos en una fila
    const groupedPermissions = Object.values(
        filteredAltaRolPermiso.reduce((acc, item) => {
            const key = `${item.rolNombre}-${item.moduloNombre}`;
            if (!acc[key]) {
                acc[key] = {
                    rolNombre: item.rolNombre,
                    moduloNombre: item.moduloNombre,
                    permisos: [] // Cambiado a una lista para mostrar los permisos
                };
            }
            // Añadir el permiso a la lista si no está ya incluido
            if (!acc[key].permisos.includes(item.permiso)) {
                acc[key].permisos.push(item.permiso);
            }
            return acc;
        }, {})
    );

    return (
        <div className="sensores-container">
            <div className="sensores-container2">
                <h1>ALTA DE PERMISOS</h1>
                <img src={LOGO} alt="LOGO" />
                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <button onClick={() => navigate('/menu')} className="btn-menum">Menú</button>

                <div className="container3">
                    <div className="search-container">
                        <h6>Filtro</h6>
                        <select
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                        >
                            <option value="">Selecciona un módulo</option>
                            {filterOptions.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Rol</th>
                                <th>Módulo</th>
                                <th>Permisos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedPermissions.length > 0 ? (
                                groupedPermissions.map((item) => (
                                    <tr key={`${item.rolNombre}-${item.moduloNombre}`}>
                                        <td>{item.rolNombre}</td>
                                        <td>{item.moduloNombre}</td>
                                        <td>
                                            {item.permisos.length > 0 ? (
                                                item.permisos.join(', ') // Mostrar permisos separados por coma
                                            ) : (
                                                'Ninguno'
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3}>No hay permisos asignados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

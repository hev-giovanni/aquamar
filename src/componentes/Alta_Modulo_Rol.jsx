import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';
import '../css/altaModulo.css';
import '../css/sensor_unidad.css';
import '../css/dispositivoSensor.css';

import LOGO from '../imagenes/logo1.png';

const URL_ALTA_PERMISO = "https://190.113.90.230/acproyect/endpoint/altaRolPermiso.php";
const URL_ROLES = "https://190.113.90.230/acproyect/endpoint/roles.php";
const URL_MODULOS = "https://190.113.90.230/acproyect/endpoint/modulo.php";
const URL_PERMISOS_LISTADO = "https://190.113.90.230/acproyect/endpoint/permisosListado.php";

export default function AltaRolPermiso() {
    const [altaRolPermiso, setAltaRolPermiso] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterOptions, setFilterOptions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [modulos, setModulos] = useState([]);
    const [permisos, setPermisos] = useState([]);
    const [selectedRol, setSelectedRol] = useState('');
    const [selectedModulo, setSelectedModulo] = useState('');
    const [selectedPermiso, setSelectedPermiso] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const navigate = useNavigate();

    // Función para obtener datos iniciales y permisos asignados
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }

        try {
            const [altaRolPermisoResponse, rolesResponse, modulosResponse, permisosResponse] = await Promise.all([
                fetch(URL_ALTA_PERMISO, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_ROLES, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_MODULOS, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(URL_PERMISOS_LISTADO, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!altaRolPermisoResponse.ok || !rolesResponse.ok || !modulosResponse.ok || !permisosResponse.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }

            const altaRolPermisoData = await altaRolPermisoResponse.json();
            const rolesData = await rolesResponse.json();
            const modulosData = await modulosResponse.json();
            const permisosData = await permisosResponse.json();

            if (altaRolPermisoData.error) {
                setError(altaRolPermisoData.error);
                localStorage.removeItem('token');
                return navigate('/');
            } else {
                setAltaRolPermiso(altaRolPermisoData);
                setRoles(rolesData);
                setModulos(modulosData);
                setPermisos(permisosData);
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
        fetchData();
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
        if (!selectedRol || !selectedModulo || !selectedPermiso) {
            alert('Por favor, seleccione todos los campos.');
            return;
        }

        try {
            const newRecord = {
                idRol: selectedRol,
                idModulo: selectedModulo,
                idPermiso: selectedPermiso
            };

            const token = localStorage.getItem('token');
            if (!token) {
                setError('No token provided.');
                return navigate('/');
            }

            const response = await fetch(URL_ALTA_PERMISO, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newRecord)
            });
            const data = await response.json();
            console.log('Create response data:', data);

            if (!response.ok) {
                throw new Error('Error al crear el registro.');
            }

            await fetchData();
            setSuccessMessage('Registro creado exitosamente');
            setSelectedRol('');
            setSelectedModulo('');
            setSelectedPermiso('');
            setIsFormVisible(false);
        } catch (error) {
            console.error('Error creating record', error);
            setError('Error al crear el registro');
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
    };

    const handleToggle = async (rol, modulo, idPermiso, isChecked) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token provided.');
            return navigate('/');
        }
    
        try {
            const url = `${URL_ALTA_PERMISO}?id=${rol},${modulo},${idPermiso}`;
            const method = isChecked ? 'DELETE' : 'POST';
            const body = isChecked ? undefined : JSON.stringify({ idRol: rol, idModulo: modulo, idPermiso: idPermiso });
    
            console.log('Toggle Request Details:', {
                url,
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });
    
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });
    
            const data = await response.json();
            console.log('Toggle response data:', data);
    
            if (!response.ok) {
                throw new Error(isChecked ? 'Error al Quitar el Permiso.' : 'Error al Asignar el Permiso.');
            }
    
            if (data.error) {
                throw new Error(data.error);
            }
    
            await fetchData();
            setSuccessMessage(isChecked ? 'Permiso Desasignado Correctamente' : 'Permiso Asignado Correctamente');
        } catch (error) {
            console.error('Error handling toggle', error);
            setError(isChecked ? 'Error Quitar el Permiso' : 'Error al Asignar el Permiso');
        }
    };
    

    const filteredAltaRolPermiso = altaRolPermiso.filter(item =>
        item.moduloNombre === selectedFilter
    );

    const groupedPermissions = Object.values(
        filteredAltaRolPermiso.reduce((acc, item) => {
            const key = `${item.rolNombre}-${item.moduloNombre}`;
            if (!acc[key]) {
                acc[key] = {
                    rolNombre: item.rolNombre,
                    moduloNombre: item.moduloNombre,
                    permisos: [],
                    idRol: item.idRol,
                    idModulo: item.idModulo
                };
            }
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

                {isFormVisible ? (
                    <div className="form-container">
                        <h5>Crear Nuevo Registro</h5>
                        <div>
                            <label htmlFor="rol">Rol:</label>
                            <select id="rol" value={selectedRol} onChange={(e) => setSelectedRol(e.target.value)}>
                                <option value="">Seleccionar Rol</option>
                                {roles.map(role => (
                                    <option key={role.idRol} value={role.idRol}>{role.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="modulo">Módulo:</label>
                            <select id="modulo" value={selectedModulo} onChange={(e) => setSelectedModulo(e.target.value)}>
                                <option value="">Seleccionar Módulo</option>
                                {modulos.map(modulo => (
                                    <option key={modulo.idModulo} value={modulo.idModulo}>{modulo.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="permiso">Permiso:</label>
                            <select
                                id="permiso"
                                value={selectedPermiso}
                                onChange={(e) => {
                                    setSelectedPermiso(e.target.value); // Actualiza el estado
                                    console.log("hever", e.target.value); // Imprime el valor en la consola
                                }}
                            >
                                <option value="">Seleccionar Permiso</option>
                                {permisos.map(permiso => (
                                    <option key={permiso.idPermiso} value={permiso.idPermiso}>
                                        {permiso.permiso}
                                    </option>
                                ))}
                            </select>

                        </div>
                        <button onClick={handleCreate} className="btn-create">Asignar</button>
                        <button onClick={handleCancel} className="btn-create">Cancelar</button>
                    </div>
                ) : (
                    <div className="container3">
                        <div className="search-container">
                            <h6>Filtro</h6>
                            <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
                                <option value="">Selecciona un módulo</option>
                                {filterOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={() => setIsFormVisible(true)} className="btn-create">Nuevo Rol a Modulo</button>
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
        groupedPermissions.map(item => {
            // Imprimir los permisos en la consola
        

            
            return (
                <tr key={`${item.rolNombre}-${item.moduloNombre}`}>
                    <td>{item.rolNombre}</td>
                    <td>{item.moduloNombre}</td>
                    <td>
                        {['Leer', 'Escribir', 'Borrar'].map(permiso => {
                            // Mapeo estático de permisos a ID
                            const permisoIdMap = {
                                'Leer': 1,
                                'Escribir': 2,
                                'Borrar': 3,
                            };
            
                            const permisoId = permisoIdMap[permiso];
            
                            return (
                                <label key={permiso} className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={item.permisos.includes(permiso)}
                                        onChange={() => {
                                            console.log(`HEVER`);
                                            console.log(`Rol: ${item.rolNombre}, Módulo: ${item.moduloNombre}, Permiso: ${permiso}`);
                                            console.log(`Rol: ${item.idRol}, Módulo: ${item.idModulo}, Permiso: ${permisoId}`);
            
                                            handleToggle(item.idRol, item.idModulo, permisoId, item.permisos.includes(permiso));
                                        }}
                                    />
                                    <span className="slider"></span>
                                    <span className="toggle-text">{permiso}</span>
                                </label>
                            );
                        })}
                    </td>
                </tr>
            );
            


        })
    ) : (
        <tr>
            <td colSpan={3}>No hay permisos asignados.</td>
        </tr>
    )}
</tbody>

                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

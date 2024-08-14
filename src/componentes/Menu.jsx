import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/menu.css';

const URL_USER_INFO = "http://localhost/acproyect/login/menu-usuario.php";

export default function Menu() {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem('token');
            console.log('Token:', token); // Verifica si el token está presente

            if (!token) {
                setError('No token provided.');
                return navigate('/');
            }

            try {
                const response = await fetch(URL_USER_INFO, {
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
                    console.error('Error en la solicitud:', data.error);
                    localStorage.removeItem('token');
                    navigate('/');
                } else {
                    setUserInfo(data);
                }
            } catch (error) {
                setError('Error al obtener la información del usuario.');
                console.error('Error en la solicitud:', error);
                localStorage.removeItem('token');
                navigate('/');
            }
        };

        fetchUserInfo();
    }, [navigate]);

    const uniqueModules = (data) => {
        const modules = data.map(item => ({ nombre: item.moduloNombre, status: item.moduloStatus }));
        const uniqueModules = [];
        const map = new Map();
        for (const item of modules) {
            if (!map.has(item.nombre)) {
                map.set(item.nombre, true);
                uniqueModules.push(item);
            }
        }
        return uniqueModules;
    };

    const uniquePermissions = (data) => {
        const permissions = data.map(item => item.permiso);
        return [...new Set(permissions)];
    };

    const getModuleStatusStyle = (status) => {
        switch (status) {
            case 'Inactivo':
                return { color: 'orange' }; // Texto rojo para inactivo
            case 'Eliminado':
                return { color: 'red', textDecoration: 'line-through' }; // Texto rojo tachado para eliminado
            default:
                return {}; // El estado activo no tiene estilo específico, se mantiene el color por defecto
        }
    };

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!userInfo) {
        return <div>Cargando...</div>;
    }

    const modules = uniqueModules(userInfo);
    const permissions = uniquePermissions(userInfo);

    return (
        <div className="menu-container">
            <div className="menu-sidebar">
                <h2>Menú</h2>
                <ul>
                    {modules.map((modulo, index) => (
                        <li key={index}>
                            <a href={`/${modulo.nombre.toLowerCase()}`} style={getModuleStatusStyle(modulo.status)}>
                                {modulo.nombre}
                            </a>
                        </li>
                    ))}
                    <li><a href="/">Cerrar sesión</a></li>
                </ul>
            </div>
            <div className="menu-content">
                <h1>Bienvenido, {userInfo[0].primerNombre || 'Usuario'}</h1>
                <p>Apellido: {userInfo[0].primerApellido}</p>
                <p>Usuario: {userInfo[0].usuario}</p>
                <h2>Roles y Permisos</h2>
                <ul>
                    <li>Rol: {userInfo[0].rolNombre}</li>
                    <li>Permisos:
                        <ul>
                            {permissions.map((permiso, index) => (
                                <li key={index}>{permiso}</li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
}

import React from 'react';
import '../css/menu.css';

export default function Menu({ userInfo }) {
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
                return { color: 'orange' };
            case 'Eliminado':
                return { color: 'red', textDecoration: 'line-through' };
            default:
                return {};
        }
    };

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

import React from 'react';
import '../css/menu.css';
import LOGO from '../imagenes/logo1.png';

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
                            <a href={`/${modulo.nombre.toLowerCase()}`}>
                                {modulo.nombre}
                            </a>
                        </li>
                    ))}
                    <li><a href="/">Cerrar sesión</a></li>
                </ul>
            </div>
            <div className="menu-content">
            <img src={LOGO} alt="LOGO AQUAMAR" />
                <h1>Bienvenido, {userInfo[0].primerNombre || 'Usuario'} {userInfo[0].primerApellido}<hr /></h1> 
                <p>Empresa: {userInfo[0].primerApellido}</p>
                <p>Sucursal: {userInfo[0].usuario}</p>
                <p>Fecha: {new Date().toLocaleDateString('us-US', {
                            year: 'numeric', // Año en formato numérico
                            month: 'long', // Nombre completo del mes
                            day: 'numeric' // Día del mes
            })}</p>
            </div>
        </div>
    );
}

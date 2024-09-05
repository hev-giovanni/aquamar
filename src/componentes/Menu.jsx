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

    if (!userInfo) {
        return <div>Cargando...</div>;
    }

    const modules = uniqueModules(userInfo);

    // Agrupar módulos que comienzan con "producto" y "sensor"
    const groupedModules = modules.reduce((acc, modulo) => {
        if (modulo.nombre.toLowerCase().startsWith('producto')) {
            if (!acc.producto) acc.producto = [];
            acc.producto.push(modulo);
        } else if (modulo.nombre.toLowerCase().startsWith('sensor')) {
            if (!acc.sensor) acc.sensor = [];
            acc.sensor.push(modulo);
        } else {
            if (!acc.otros) acc.otros = [];
            acc.otros.push(modulo);
        }
        return acc;
    }, {});

    return (
        <div className="menu-container">
            <div className="menu-sidebar">
                <h2>Menú</h2>
                <ul>
                    {groupedModules.otros && groupedModules.otros.map((modulo, index) => (
                        <li key={index}>
                            <a href={`/${modulo.nombre.toLowerCase()}`}>
                                {modulo.nombre}
                            </a>
                        </li>
                    ))}
                    {groupedModules.sensor && (
                        <li>
                            <span>Sensores</span>
                            <ul>
                                {groupedModules.sensor.map((modulo, index) => (
                                    <li key={index}>
                                        <a href={`/${modulo.nombre.toLowerCase()}`}>
                                            {modulo.nombre}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    )}
                    {groupedModules.producto && (
                        <li>
                            <span>Producto</span>
                            <ul>
                                {groupedModules.producto.map((modulo, index) => (
                                    <li key={index}>
                                        <a href={`/${modulo.nombre.toLowerCase()}`}>
                                            {modulo.nombre}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    )}
                    <li>
                        <a href="/" onClick={() => localStorage.removeItem('token')}>
                            Cerrar sesión
                        </a>
                    </li>
                </ul>
            </div>
            <div className="menu-content">
                <img src={LOGO} alt="LOGO AQUAMAR" />
                <h1>Bienvenido, {userInfo[0].primerNombre || 'Usuario'} {userInfo[0].primerApellido}<hr /></h1>
                <p>Empresa: {userInfo[0].primerApellido}</p>
                <p>Sucursal: {userInfo[0].usuario}</p>
                <p>Fecha: {new Date().toLocaleDateString('us-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import '../css/menu.css';
import LOGO from '../imagenes/logo1.png';

export default function Menu({ userInfo }) {
    // Estados para controlar la expansión de los módulos
    const [expandirSensores, setExpandirSensores] = useState(false);
    const [expandirProducto, setExpandirProducto] = useState(false);

    // Función para obtener módulos únicos
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

                    {/* Lista de Sensores con funcionalidad de expandir/contraer */}
                    {groupedModules.sensor && (
                        <li>
                            <div 
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer'
                                }} 
                                onClick={() => setExpandirSensores(!expandirSensores)}
                            >
                                <span>Sensores</span>
                                <span style={{ marginLeft: '37px',fontSize:'15px' }}>
                                    {expandirSensores ? '-' : '+'}
                                </span>
                            </div>
                            {expandirSensores && (
                                <ul>
                                    {groupedModules.sensor.map((modulo, index) => (
                                        <li key={index}>
                                            <a href={`/${modulo.nombre.toLowerCase()}`}>
                                                {modulo.nombre}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    )}

                    {/* Lista de Producto con funcionalidad de expandir/contraer */}
                    {groupedModules.producto && (
                        <li>
                            <div 
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer'
                                }} 
                                onClick={() => setExpandirProducto(!expandirProducto)}
                            >
                                <span>Producto</span>
                                <span style={{ marginLeft: '35px',fontSize:'15px'}}>
                                    {expandirProducto ? '-' : '+'}
                                </span>
                            </div>
                            {expandirProducto && (
                                <ul>
                                    {groupedModules.producto.map((modulo, index) => (
                                        <li key={index}>
                                            <a href={`/${modulo.nombre.toLowerCase()}`}>
                                                {modulo.nombre}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    )}
                    <div className='cerrar_Session'>
                    <li>
                        <a href="/" onClick={() => localStorage.removeItem('token')}>
                            Cerrar sesión
                        </a>
                    </li>
                    </div>
                </ul>
            </div>

            <div className="menu-content">
                <img src={LOGO} alt="LOGO AQUAMAR" />
                <h1>Bienvenido, {userInfo[0].primerNombre || 'Usuario'} {userInfo[0].primerApellido}<hr /></h1>
                <p>Empresa: {userInfo[0].empresaNombre}</p>
                <p>Sucursal: {userInfo[0].sucursalNombre}</p>
                <p>Fecha: {new Date().toLocaleDateString('us-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
                <p>Direccion: {userInfo[0].direccion}</p>
            </div>
        </div>
    );
}

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

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!userInfo) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="menu-container">
            <div className="menu-sidebar">
                <h2>Menú</h2>
                <ul>
                    <li><a href="/profile">Perfil</a></li>
                    <li><a href="/settings">Configuración</a></li>
                    <li><a href="/">Cerrar sesión</a></li>
                    {/* Agrega más enlaces aquí */}
                </ul>
            </div>
            <div className="menu-content">
                <h1>Bienvenido, {userInfo.primerNombre || 'Usuario'}</h1>
                <p>Apellido: {userInfo.primerApellido}</p>
                <p>Usuario: {userInfo.usuario}</p>
            </div>
        </div>
    );
}

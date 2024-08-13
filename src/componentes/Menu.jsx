import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const URL_USER_INFO = "http://localhost/acproyect/login/user-info.php";

export default function Menu() {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch(URL_USER_INFO, {
                    method: 'GET',
                    credentials: 'include' // Incluye las credenciales para que se mantenga la sesión
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                    console.error('Error en la solicitud:', data.error); // Registra el error correctamente
                    navigate('/'); // Redirige al login si hay un error
                } else {
                    setUserInfo(data);
                }
            } catch (error) {
                setError('Error al obtener la información del usuario.');
                console.error('Error en la solicitud:', error); // Registra el error correctamente
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
        <div>
            <h1>Bienvenido, {userInfo.primerNombre || 'Usuario'}</h1>
            <p>Apellido: {userInfo.primerApellido}</p>
            <p>Usuario: {userInfo.usuario}</p>
            {/* Puedes agregar más información o componentes aquí */}
        </div>
    );
}

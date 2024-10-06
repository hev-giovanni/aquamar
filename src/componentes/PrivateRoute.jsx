import React, { useEffect, useState } from 'react';
import { Route, Navigate } from 'react-router-dom';
import Menu from './Menu';

const URL_USER_INFO = "http://190.113.91.230:8082/acproyect/endpoint/menu-usuario.php";

const PrivateRoute = ({ element: Component, ...rest }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!token) {
                setError('No token provided.');
                setLoading(false);
                return;
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
                    localStorage.removeItem('token');
                } else {
                    setUserInfo(data);
                }
            } catch (error) {
                setError('Error al obtener la información del usuario.');
                console.error('Error en la solicitud:', error);
                localStorage.removeItem('token');
            }
            setLoading(false);
        };

        fetchUserInfo();
    }, [token]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <Navigate to="/" />;
    }

    return <Component userInfo={userInfo} />;
};

export default PrivateRoute;

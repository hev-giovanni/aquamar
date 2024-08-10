import React, { useEffect, useState } from 'react';

const URL_USER_INFO = "http://localhost/aquamar/aquamar/login/user-info.php"; // Verifica la URL

const Menu = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const resp = await fetch(URL_USER_INFO, {
                    method: 'GET',
                    credentials: 'include' // Incluye las credenciales en la solicitud
                });

                if (!resp.ok) {
                    throw new Error(`HTTP error! Status: ${resp.status}`);
                }

                const json = await resp.json();
                setUserInfo(json);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchUserInfo();
    }, []); // Se ejecuta una vez al montar el componente

    return (
        <div>
            {error && <div>Error: {error}</div>}
            {userInfo && <div>Bienvenido, {userInfo.primerNombre}</div>}
        </div>
    );
};

export default Menu;

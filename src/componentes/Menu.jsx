import React, { useEffect, useState } from 'react';

const URL_USER_INFO = "http://localhost/acproyect/login/user-info.php"; // Verifica la URL

const Menu = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                console.log('Fetching user info from:', URL_USER_INFO); // Verifica la URL

                const resp = await fetch(URL_USER_INFO, {
                    method: 'GET',
                    credentials: 'include', // Asegúrate de que las cookies se envían
                });

                console.log('Response Status:', resp.status); // Verifica el estado de la respuesta

                if (!resp.ok) {
                    throw new Error(`HTTP error! Status: ${resp.status}`);
                }

                const json = await resp.json();
                console.log('User Info:', json); // Verifica la información recibida

                if (json.error) {
                    // Maneja el caso en que la respuesta contiene un error
                    setError(json.error);
                    setUserInfo(null);
                } else {
                    // Maneja el caso en que la respuesta contiene datos de usuario
                    setUserInfo(json);
                    setError(null);
                }
            } catch (error) {
                console.error('Fetch Error:', error); // Verifica el error en la consola
                setError(error.message);
                setUserInfo(null);
            }
        };

        fetchUserInfo();
    }, []); // Se ejecuta una vez al montar el componente

    return (
        <div>
            {error && <div>Error: {error}</div>}
            {userInfo && userInfo.length > 0 && (
                <div>Bienvenido, {userInfo[0].primerNombre}</div> // Asumiendo que es una lista de usuarios
            )}
        </div>
    );
};

export default Menu;

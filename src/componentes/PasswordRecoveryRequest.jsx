import React, { useState } from 'react';
import axios from 'axios';

const PasswordRecoveryRequest = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('/api/recover-password', { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error al enviar el correo de recuperación.');
        }
    };

    return (
        <div>
            <h2>Recuperar Contraseña</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingrese su correo electrónico"
                    required
                />
                <button type="submit">Enviar</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default PasswordRecoveryRequest;

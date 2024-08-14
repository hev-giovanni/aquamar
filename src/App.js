import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Importa Navigate para redirigir
import Login from './componentes/Login';
import Menu from './componentes/Menu';
import RecoverPassword from './componentes/RecoverPassword';
import ResetPassword from './componentes/ResetPassword'; // Importa el componente
import Proveedores from './componentes/Proveedores'; // Asegúrate de que esta ruta es correcta

function App() {
  const [conectado, setConectado] = useState(false);

  const acceder = (estado) => {
    console.log('Estado de conexión:', estado);
    setConectado(estado);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={conectado ? <Navigate to="/menu" /> : <Login acceder={acceder} />}
        />
        <Route path="/menu" element={conectado ? <Menu /> : <Navigate to="/" />} />
        <Route path="/recuperar" element={<RecoverPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/proveedores" element={<Proveedores />} /> {/* Agregada ruta para Proveedores */}
      </Routes>
    </Router>
  );
}

export default App;

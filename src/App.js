import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Importa Navigate para redirigir
import Login from './componentes/Login';
import Menu from './componentes/Menu';
import RecoverPassword from './componentes/RecoverPassword';
import ResetPassword from './componentes/ResetPassword'; // Importa el componente

function App() {
  const [conectado, setConectado] = useState(false);

  const acceder = (estado) => {
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
      </Routes>
    </Router>
  );
}

export default App;

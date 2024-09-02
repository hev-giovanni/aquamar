import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './componentes/Login';
import Menu from './componentes/Menu';
import RecoverPassword from './componentes/RecoverPassword';
import ResetPassword from './componentes/ResetPassword';
import PrivateRoute from './componentes/PrivateRoute'; // Importa el nuevo componente
import Proveedores from './componentes/Proveedores';
import Productos from './componentes/Productos';
import Producto_Pais from './componentes/Producto_Pais';
import Producto_Marca from './componentes/Producto_Marca';
import Producto_Tipo from './componentes/Producto_Tipo';

function App() {
  const [conectado, setConectado] = useState(false);

  const acceder = (estado) => {
    console.log('Estado de conexión:', estado);
    setConectado(estado);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={conectado ? <Navigate to="/menu" /> : <Login acceder={acceder} />} />
        <Route path="/recuperar" element={<RecoverPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/proveedores" element={<PrivateRoute element={Proveedores} />} /> 
        <Route path="/menu" element={<PrivateRoute element={Menu} />} /> 
        <Route path="/productos" element={<PrivateRoute element={Productos} />} /> 
        <Route path="/producto_pais" element={<PrivateRoute element={Producto_Pais} />} /> 
        <Route path="/producto_marca" element={<PrivateRoute element={Producto_Marca} />} /> 
        <Route path="/producto_tipo" element={<PrivateRoute element={Producto_Tipo} />} /> 
      </Routes>
    </Router>
  );
}

export default App;

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
import Sensor from './componentes/Sensor';
import Sensor_Unidad from './componentes/Sensor_Unidad';
import Sensor_Tipo from './componentes/Sensor_Tipo';
import Dispositivo from './componentes/Dispositivo';
import Dispositivo_Sensor from './componentes/Dispositivo_Sensor';
import Modulos from './componentes/Modulos';
import Cliente_Monitor from './componentes/Cliente_Monitor.jsx';
import Grafico from './componentes/Grafico.jsx';
import Alta_Monitoreo from './componentes/Alta_Monitoreo.jsx';
import Roles from './componentes/Roles.jsx';
import  Alta_Modulo_Rol from './componentes/Alta_Modulo_Rol.jsx';
import  Usuarios from './componentes/Usuarios.jsx';


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
        <Route path="/sensor_unidad" element={<PrivateRoute element={Sensor_Unidad} />} />
        <Route path="/sensor_tipo" element={<PrivateRoute element={Sensor_Tipo} />} />
        <Route path="/sensor" element={<PrivateRoute element={Sensor} />} />
        <Route path="/dispositivo" element={<PrivateRoute element={Dispositivo} />} />
        <Route path="/dispositivo_sensor" element={<PrivateRoute element={Dispositivo_Sensor} />} />
        <Route path="/modulos" element={<PrivateRoute element={Modulos} />} /> 
        <Route path="/monitoreo" element={<PrivateRoute element={Cliente_Monitor} />} /> 
        <Route path="/grafico" element={<PrivateRoute element={Grafico} />} /> 
        <Route path="/alta_monitoreo" element={<PrivateRoute element={Alta_Monitoreo} />} /> 
        <Route path="/roles" element={<PrivateRoute element={Roles} />} /> 
        <Route path="/alta_modulos-roles" element={<PrivateRoute element={Alta_Modulo_Rol} />} /> 
        <Route path="/usuarios" element={<PrivateRoute element={Usuarios} />} />

      </Routes>
    </Router>
  );
}

export default App;

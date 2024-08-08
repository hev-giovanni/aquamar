import React, { useState } from "react";
import Login from "./componentes/Login";
import Menu from "./componentes/Menu";
import RecoverPassword from "./componentes/RecoverPassword"; // Asegúrate de que este archivo exista

function App() {
  const [conectado, setConectado] = useState(false);
  const [recuperar, setRecuperar] = useState(false);

  const acceder = (estado) => {
    setConectado(estado);
  };

  const mostrarRecuperar = () => {
    setRecuperar(true);
  };

  const volverAlLogin = () => {
    setRecuperar(false);
  };

  return (
    <div>
      {conectado ? (
        <Menu />
      ) : recuperar ? (
        <RecoverPassword volverAlLogin={volverAlLogin} />
      ) : (
        <Login acceder={acceder} mostrarRecuperar={mostrarRecuperar} />
      )}
    </div>
  );
}

export default App;

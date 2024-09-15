import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/monitor.css'; 
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';
import SensorChart from './Grafico'; // Asegúrate de que la ruta sea correcta según tu estructura de carpetas

const Cliente_Monitor = () => {
  const [sensorType, setSensorType] = useState(''); // Inicialmente vacío, se actualizará con datos del backend
  const [sensorOptions, setSensorOptions] = useState([]); // Lista de tipos de sensores
  const [symbol, setSymbol] = useState('');
  const [yAxisLimit, setYAxisLimit] = useState(35); // Límite por defecto
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sensorDetails, setSensorDetails] = useState(null); // Almacena los detalles del sensor
  const navigate = useNavigate();

  // Función para obtener los tipos de sensores y datos del backend
  const fetchSensorData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    try {
      // Obtener la lista de sensores disponibles
      const sensorResponse = await fetch(`http://localhost/acproyect/endpoint/clienteMonitor.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!sensorResponse.ok) {
        throw new Error(`Error ${sensorResponse.status}: ${sensorResponse.statusText}`);
      }

      const sensorData = await sensorResponse.json();
      console.log('Datos de sensores recibidos del backend:', sensorData);

      // Extraer tipos de sensores únicos
      const uniqueSensors = Array.from(new Set(sensorData.map(item => item.tipo)));
      setSensorOptions(uniqueSensors);

      // Si hay un tipo de sensor seleccionado, actualizar los datos y el límite del eje Y
      if (sensorType) {
        const filteredData = sensorData.filter(item => item.tipo === sensorType);
        if (filteredData.length > 0) {
          const { simbolo, codigoDispositivo, modelo, primerNombre, primerApellido, codigoIdent, descripcion } = filteredData[0];
          setSymbol(simbolo);
          setYAxisLimit(getYAxisLimit(sensorType));

          // Guardar detalles del sensor
          setSensorDetails({
            codigoDispositivo,
            modelo,
            primerNombre,
            primerApellido,
            codigoIdent,
            descripcion,
          });
        } else {
          // Manejo en caso de que no haya datos
          setSymbol('');
          setYAxisLimit(0);
          setSensorDetails(null);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error al obtener los datos del sensor:', error);
      setDataLoaded(true); // Marca como cargado incluso si hay un error
    }
  };

  useEffect(() => {
    fetchSensorData(); // Carga los datos al montar el componente
  }, []); // Ejecutar solo una vez al montar el componente

  useEffect(() => {
    if (sensorType) {
      fetchSensorData(); // Carga los datos cuando cambie el tipo de sensor
    }
  }, [sensorType]); // Ejecutar cuando cambie el tipo de sensor

  // Define el límite del eje Y basado en el tipo de sensor
  const getYAxisLimit = (type) => {
    switch (type) {
      case 'Temperatura':
        return 28; // Límite para Temperatura
      case 'Distancia':
        return 40; // Límite para Distancia
      default:
        return 0;
    }
  };

  const handleSensorTypeChange = (event) => {
    const newType = event.target.value;
    setSensorType(newType);
    setDataLoaded(false); // Marca como no cargado para mostrar "Cargando datos..."
  };
  return (
    <div className="monitor-container">
      <h2>Monitoreo de Sensores</h2>
      <img src={LOGO} alt="LOGO AQUAMAR" />
      <div className="sensor-detalles">
            {sensorDetails && (
              <div>
                <h5><strong>Nombre: {sensorDetails.primerNombre} {sensorDetails.primerApellido}</strong></h5>
                <hr></hr>
                <p>Mod:  {sensorDetails.modelo}</p>
                <p>Disp: {sensorDetails.codigoDispositivo}</p>
                <p>Código: {sensorDetails.codigoIdent}</p>
                <p>Descripción: {sensorDetails.descripcion}</p>
              
              </div>
            )}
          </div>
          <button onClick={() => navigate('/menu')} className="btn-menu">
            Menú
        </button>
      <select value={sensorType} onChange={handleSensorTypeChange}>
        <option value="">Seleccione un sensor</option>
        {sensorOptions.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>

      {dataLoaded ? (
        <>
          <SensorChart 
            sensorType={sensorType} 
            symbol={symbol} 
            yAxisLimit={yAxisLimit}
          />
        </>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default Cliente_Monitor;
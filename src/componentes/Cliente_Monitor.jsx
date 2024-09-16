import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/monitor.css'; 
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';
import SensorChart from './Grafico'; // Asegúrate de que la ruta sea correcta según tu estructura de carpetas

const Cliente_Monitor = () => {
  const [sensorType, setSensorType] = useState(''); // Tipo de sensor seleccionado
  const [sensorOptions, setSensorOptions] = useState([]); // Lista de tipos de sensores
  const [symbol, setSymbol] = useState('');
  const [yAxisLimit, setYAxisLimit] = useState(35); // Límite por defecto
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sensorDetails, setSensorDetails] = useState(null); // Almacena los detalles del sensor
  const [userSensors, setUserSensors] = useState([]); // Códigos de sensores asignados al usuario
  const [filteredSensorData, setFilteredSensorData] = useState([]); // Datos filtrados por tipo de sensor
  const navigate = useNavigate();

  // Función para obtener las asignaciones del usuario
  const fetchUserSensors = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    try {
      const response = await fetch(`http://localhost/acproyect/endpoint/altaMonitoreo.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos de asignaciones recibidos del backend:', data);

      // Filtrar sensores únicos asignados al usuario
      const uniqueSensors = Array.from(new Set(data.map(item => item.codigoDispositivo)));
      console.log('Sensores únicos asignados:', uniqueSensors);
      setUserSensors(uniqueSensors);

      // Obtener datos de sensores después de obtener las asignaciones
      fetchSensorData(uniqueSensors);

    } catch (error) {
      console.error('Error al obtener las asignaciones del usuario:', error);
      setDataLoaded(true);
    }
  };

  // Función para obtener los datos de los sensores
  const fetchSensorData = async (assignedSensors) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    try {
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

      // Filtrar los datos de sensores basados en los códigos asignados al usuario
      const filteredData = sensorData.filter(item => 
        assignedSensors.includes(item.codigoDispositivo)
      );

      console.log('Datos de sensores filtrados:', filteredData);

      // Obtener tipos de sensores únicos de los sensores filtrados
      const uniqueSensorTypes = Array.from(new Set(filteredData.map(item => item.tipo)));
      console.log('Tipos de sensores únicos:', uniqueSensorTypes);
      setSensorOptions(uniqueSensorTypes);

      // Filtrar los datos según el tipo de sensor seleccionado
      if (sensorType) {
        const sensorTypeFilteredData = filteredData.filter(item => item.tipo === sensorType);
        setFilteredSensorData(sensorTypeFilteredData);
        if (sensorTypeFilteredData.length > 0) {
          const { simbolo, codigoDispositivo, modelo, primerNombre, primerApellido, codigoIdent, descripcion } = sensorTypeFilteredData[0];
          setSymbol(simbolo);
          setYAxisLimit(getYAxisLimit(sensorType));

          setSensorDetails({
            codigoDispositivo,
            modelo,
            primerNombre,
            primerApellido,
            codigoIdent,
            descripcion,
          });
        } else {
          setSymbol('');
          setYAxisLimit(0);
          setSensorDetails(null);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error al obtener los datos del sensor:', error);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchUserSensors(); // Carga las asignaciones al montar el componente
  }, []); // Ejecutar solo una vez al montar el componente

  useEffect(() => {
    if (userSensors.length > 0 && sensorType) {
      fetchSensorData(userSensors); // Carga los datos cuando cambie el tipo de sensor o las asignaciones del usuario
    }
  }, [sensorType, userSensors]); // Ejecutar cuando cambie el tipo de sensor o las asignaciones del usuario

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
            <hr />
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
        {sensorOptions.length > 0 ? (
          sensorOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))
        ) : (
          <option value="">No hay sensores disponibles</option>
        )}
      </select>

      {dataLoaded ? (
        filteredSensorData.length > 0 ? (
          <SensorChart 
            sensorType={sensorType} 
            symbol={symbol} 
            yAxisLimit={yAxisLimit}
          />
        ) : (
          <p>No hay sensores disponibles para el tipo seleccionado</p>
        )
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default Cliente_Monitor;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/monitor.css'; 
import '../css/style.css';
import LOGO from '../imagenes/logo1.png';
import SensorChart from './Grafico';

const Cliente_Monitor = () => {
  const [sensorType, setSensorType] = useState('');
  const [sensorOptions, setSensorOptions] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [yAxisLimit, setYAxisLimit] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sensorDetails, setSensorDetails] = useState(null);
  const [userSensors, setUserSensors] = useState([]);
  const [filteredSensorData, setFilteredSensorData] = useState([]);
  const [limitValue, setLimitValue] = useState(null);
  const [exceededLimit, setExceededLimit] = useState(false);
  const [limits, setLimits] = useState({});
  const [userName, setUserName] = useState('');

  const navigate = useNavigate();

  const fetchUserSensors = useCallback(async () => {
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

      if (Array.isArray(data)) {
        const uniqueSensors = Array.from(new Set(data.map(item => item.codigoDispositivo)));
        const newLimits = data.reduce((acc, item) => {
          if (item.limite && item.tipo) {
            acc[item.tipo] = item.limite;
          }
          return acc;
        }, {});

        setUserSensors(uniqueSensors);
        setSensorOptions(Object.keys(newLimits));
        setLimits(newLimits);
        fetchSensorData(uniqueSensors, newLimits);
      } else {
        console.error('Los datos recibidos no son un array.');
      }

    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      setDataLoaded(true);
    }
  }, []);

  const fetchSensorData = async (assignedSensors, limits) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    try {
      const response = await fetch(`http://localhost/acproyect/endpoint/clienteMonitor.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const sensorData = await response.json();

      const filteredData = sensorData.filter(item => assignedSensors.includes(item.codigoDispositivo));

      const uniqueSensorTypes = Array.from(new Set(filteredData.map(item => item.tipo)));
      setSensorOptions(uniqueSensorTypes);

      if (sensorType) {
        const sensorTypeFilteredData = filteredData.filter(item => item.tipo === sensorType);
        setFilteredSensorData(sensorTypeFilteredData);

        if (sensorTypeFilteredData.length > 0) {
          const { simbolo, codigoDispositivo, modelo, primerNombre, primerApellido, codigoIdent, descripcion } = sensorTypeFilteredData[0];

          const limit = limits[sensorType];
          const parsedLimit = parseFloat(limit);

          if (!isNaN(parsedLimit)) {
            setLimitValue(parsedLimit);
            setSymbol(simbolo);
          } else {
            setLimitValue(null);
            setSymbol('');
          }

          setSensorDetails({
            codigoDispositivo,
            modelo,
            primerNombre,
            primerApellido,
            codigoIdent,
            descripcion,
          });

          // Filtrar datos de la última hora
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentData = sensorTypeFilteredData.filter(item => {
            const itemDate = new Date(item.fechaHora); 
            return itemDate >= oneHourAgo;  // Solo datos dentro de la última hora
          });

          console.log('Datos recientes (última hora):', recentData);

          // Si hay datos en la última hora, verificar si se ha superado el límite
          if (recentData.length > 0) {
            const valuesAboveLimit = recentData.some(item => {
              const itemValue = parseFloat(item.valor);
              return !isNaN(itemValue) && itemValue > parsedLimit;
            });

            setExceededLimit(valuesAboveLimit);
          } else {
            // Si no hay datos recientes, no se debe mostrar ninguna advertencia
            setExceededLimit(false);
          }

        } else {
          setSymbol('');
          setLimitValue(null);
          setSensorDetails(null);
          setExceededLimit(false);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error al obtener los datos del sensor:', error);
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchUserSensors();
  }, [fetchUserSensors]);

  useEffect(() => {
    if (userSensors.length > 0 && sensorType) {
      fetchSensorData(userSensors, limits);
    }
  }, [sensorType, userSensors, limits, fetchSensorData]);

  const handleSensorTypeChange = useCallback((event) => {
    setSensorType(event.target.value);
    setDataLoaded(false);
  }, []);

  return (
    <div className="monitor-container">
      <h2>Monitoreo de Sensores</h2>
      <img src={LOGO} alt="LOGO AQUAMAR" />
      <div className="sensor-detalles">
        {sensorDetails && (
          <div>
            <h5><strong>Nombre: {sensorDetails.primerNombre} {sensorDetails.primerApellido}</strong></h5>
            <hr />
            <p>Mod: {sensorDetails.modelo}</p>
            <p>Disp: {sensorDetails.codigoDispositivo}</p>
            <p>Código: {sensorDetails.codigoIdent}</p>
            <p>Descripción: {sensorDetails.descripcion}</p>
            {limitValue !== null && (
              <p><strong>Límite asignado: {limitValue} {symbol}</strong></p>
            )}
          </div>
        )}
      </div>
      <button onClick={() => navigate('/menu')} className="btn-menu">
        Menú
      </button>
      <label htmlFor="sensor-select">Seleccione un sensor:</label>
      <select id="sensor-select" value={sensorType} onChange={handleSensorTypeChange}>
        <option value="">Seleccione un sensor</option>
        {sensorOptions.length > 0 ? (
          sensorOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))
        ) : (
          <option value="">No hay sensores disponibles</option>
        )}
      </select>

      {exceededLimit && (
        <div className="error-message">
          <p style={{ color: 'red' }}>¡Advertencia: Se ha superado el límite de {limitValue} {symbol} en la última hora!</p>
        </div>
      )}

      {dataLoaded ? (
        filteredSensorData.length > 0 ? (
          <SensorChart 
            sensorType={sensorType} 
            symbol={symbol} 
            yAxisLimit={limitValue}
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

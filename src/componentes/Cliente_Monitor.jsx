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
  const [limitValue, setLimitValue] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [sensorDetails, setSensorDetails] = useState(null);
  const [userSensors, setUserSensors] = useState([]);
  const [filteredSensorData, setFilteredSensorData] = useState([]);
  const [exceededLimit, setExceededLimit] = useState(false);
  const [limits, setLimits] = useState({});
  const [userId, setUserId] = useState(null);
  const [lastEmailSent, setLastEmailSent] = useState(0);

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
        headers: { 'Authorization': `Bearer ${token}` },
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
        setUserId(data[0]?.idUsuario);
      } else {
        console.error('Los datos recibidos no son un array.');
      }

    } catch (error) {
      console.error('Error al obtener asignaciones:', error);
      setDataLoaded(true);
    }
  }, []);

  const fetchSensorData = async (assignedSensors) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    try {
      const response = await fetch(`http://localhost/acproyect/endpoint/clienteMonitor.php`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const sensorData = await response.json();
      const filteredData = sensorData.filter(item => assignedSensors.includes(item.codigoDispositivo));

      if (sensorType) {
        const sensorTypeFilteredData = filteredData.filter(item => item.tipo === sensorType);
        setFilteredSensorData(sensorTypeFilteredData);

        if (sensorTypeFilteredData.length > 0) {
          const { simbolo, codigoDispositivo, modelo, primerNombre, primerApellido, codigoIdent, descripcion } = sensorTypeFilteredData[0];
          const limit = limits[sensorType];
          const parsedLimit = parseFloat(limit);

          console.log('Símbolo obtenido:', simbolo);

          if (!isNaN(parsedLimit)) {
            setLimitValue(parsedLimit);
            setSymbol(simbolo);
          } else {
            setLimitValue(null);
            setSymbol('');
          }

          setSensorDetails({ codigoDispositivo, modelo, primerNombre, primerApellido, codigoIdent, descripcion });

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentData = sensorTypeFilteredData.filter(item => new Date(item.fechaHora) >= oneHourAgo);

          if (recentData.length > 0) {
            const valuesAboveLimit = recentData.some(item => {
              const itemValue = parseFloat(item.valor);
              return !isNaN(itemValue) && itemValue > parsedLimit;
            });

            setExceededLimit(valuesAboveLimit);

            if (valuesAboveLimit) {
              const currentTime = Date.now();
              if (currentTime - lastEmailSent > 10 * 60 * 1000) {
                setTimeout(() => {
                  sendWarningEmail(codigoDispositivo, simbolo);
                }, 0);
                setLastEmailSent(currentTime);
              }
            }
          } else {
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

  const sendWarningEmail = async (sensorCode, symbol) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token JWT no encontrado.');
      return;
    }

    const mensaje = `¡Alerta! El Dispositivo ${sensorCode}, Sensor: ${sensorType} ha superado el límite de ${limits[sensorType]} ${symbol}`;
    console.log('Símbolo antes de enviar correo:', symbol); // Debugging

    try {
      const response = await fetch('http://localhost/acproyect/endpoint/enviarAlertasCorreo.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          idUsuario: userId,
          limiteSuperado: true,
          mensaje: mensaje,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar correo: ${response.statusText}`);
      }

      console.log('Correo de advertencia enviado.');
    } catch (error) {
      console.error('Error al enviar el correo de advertencia:', error);
    }
  };

  useEffect(() => {
    fetchUserSensors();
  }, [fetchUserSensors]);

  useEffect(() => {
    if (userSensors.length > 0 && sensorType) {
      fetchSensorData(userSensors);
    }
  }, [sensorType, userSensors]);

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
            data={filteredSensorData} 
          />
        ) : (
          <p>No se encontraron datos para el sensor seleccionado.</p>
        )
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default Cliente_Monitor;

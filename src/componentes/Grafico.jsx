import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { startOfHour, subHours } from 'date-fns';

const SensorChart = ({ sensorType, symbol, yAxisLimit }) => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState({
    lastHour: {},
    lastDay: {},
    lastMonth: {},
  });
  const [error, setError] = useState(null);
  const [limitExceeded, setLimitExceeded] = useState(false); // Para la última hora

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Token JWT no encontrado.');
        return;
      }

      try {
        const response = await fetch('http://190.113.91.230:8082/acproyect/endpoint/clienteMonitor.php', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Datos recibidos del backend:', result);

        setData(result);

        // Filtra los datos según el tipo de sensor
        const filteredData = result.filter(item => item.tipo === sensorType);

        // Calcula los tiempos de inicio para los gráficos
        const now = new Date();
        const startHour = subHours(now, 1); // Última hora

        // Transformar datos para gráficos
        const transformData = (data, startTime) => {
          const filtered = data.filter(item => new Date(item.fechaHora) >= startTime);
          const fechas = filtered.map(item => item.fechaHora);
          const valores = filtered.map(item => parseFloat(item.valor));

          return {
            labels: fechas,
            datasets: [
              {
                label: sensorType,
                data: valores,
                borderColor: sensorType === 'Temperatura' ? '#ff5733' : '#33b5e5',
                backgroundColor: sensorType === 'Temperatura' ? 'rgba(255, 87, 51, 0.2)' : 'rgba(51, 181, 229, 0.2)',
                borderWidth: 2,
                tension: 0.1,
              },
            ],
          };
        };

        // Crear datos para las gráficas de diferentes periodos
        const lastHourData = transformData(filteredData, startHour);

        setChartData({
          lastHour: lastHourData,
          lastDay: transformData(filteredData, subHours(now, 24)), // Gráfica de 1 día
          lastMonth: transformData(filteredData, subHours(now, 24 * 30)), // Gráfica de 1 mes
        });

        // Verificar si en la última hora se ha superado el límite
        const valoresUltimaHora = lastHourData.datasets[0].data;
        if (valoresUltimaHora.some(value => value > yAxisLimit)) {
          setLimitExceeded(true);
        } else {
          setLimitExceeded(false);
        }

      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [sensorType, yAxisLimit]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ width: '70%' }}>
      {data.length > 0 ? (
        <div>
          {/* Mensaje solo si se ha superado el límite en la última hora */}
          {/*limitExceeded && <p style={{ color: 'red' }}>¡Advertencia: Se ha superado el límite en la última hora!</p>*/}
          <h3>Última Hora</h3>
          <div style={{ width: '100%', height: '400px' }}>
            <Line
              data={chartData.lastHour}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                    },
                  },
                  y: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                      callback: (value) => `${value} ${symbol}`,
                    },
                    suggestedMax: yAxisLimit,
                  },
                },
              }}
            />
          </div>
          {/* Otras gráficas (último día, último mes) */}
          <h3>Último Día</h3>
          <div style={{ width: '100%', height: '400px' }}>
            <Line
              data={chartData.lastDay}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                    },
                  },
                  y: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                      callback: (value) => `${value} ${symbol}`,
                    },
                    suggestedMax: yAxisLimit,
                  },
                },
              }}
            />
          </div>
          <h3>Último Mes</h3>
          <div style={{ width: '100%', height: '400px' }}>
            <Line
              data={chartData.lastMonth}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                    },
                  },
                  y: {
                    grid: {
                      color: '#64646488',
                    },
                    ticks: {
                      color: '#1f1e1e',
                      callback: (value) => `${value} ${symbol}`,
                    },
                    suggestedMax: yAxisLimit,
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default SensorChart;

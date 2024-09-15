import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { startOfHour, startOfDay, startOfMonth, subHours, subDays, subMonths } from 'date-fns';

const SensorChart = ({ sensorType, symbol, yAxisLimit }) => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState({
    lastHour: {},
    lastDay: {},
    lastMonth: {},
  });
  const [error, setError] = useState(null);
  const [limitExceeded, setLimitExceeded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Token JWT no encontrado.');
        return;
      }

      try {
        const response = await fetch('http://localhost/acproyect/endpoint/clienteMonitor.php', {
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
        const startHour = startOfHour(now);
        const startDay = startOfDay(now);
        const startMonth = startOfMonth(now);

        // Transformar datos para gráficos
        const transformData = (data, startTime) => {
          const filtered = data.filter(item => new Date(item.fechaHora) >= startTime);
          const fechas = filtered.map(item => item.fechaHora);
          const valores = filtered.map(item => parseFloat(item.valor));

          // Verifica si algún valor excede el límite
          if (valores.some(value => value > yAxisLimit)) {
            setLimitExceeded(true);
          } else {
            setLimitExceeded(false);
          }

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

        setChartData({
          lastHour: transformData(filteredData, subHours(now, 1)),
          lastDay: transformData(filteredData, subDays(now, 1)),
          lastMonth: transformData(filteredData, subMonths(now, 1)),
        });
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
          {limitExceeded && <p style={{ color: 'red' }}>¡Advertencia: Se ha superado el límite de valor!</p>}
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

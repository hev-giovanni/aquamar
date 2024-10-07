import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import '../css/venta.css';
import { useNavigate } from 'react-router-dom';
import LOGO from '../imagenes/logo1.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registra los componentes de Chart.js y el plugin de etiquetas de datos
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const Reporte_Venta = () => {
    const [ventas, setVentas] = useState([]);
    const [mesSeleccionado, setMesSeleccionado] = useState(10);
    const [anioSeleccionado, setAnioSeleccionado] = useState(2024);
    const [graficoData, setGraficoData] = useState({ labels: [], datasets: [] });
    const [graficoCircularData, setGraficoCircularData] = useState({ labels: [], datasets: [] });
    const [totalVentas, setTotalVentas] = useState(0);
    const [totalesPorUsuario, setTotalesPorUsuario] = useState({});
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    useEffect(() => {
        const obtenerVentas = async () => {
            try {
                const response = await fetch('https://190.113.90.230/acproyect/endpoint/venta.php', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Error en la solicitud');
                }

                const data = await response.json();
                setVentas(data);
            } catch (error) {
                console.error('Error al obtener las ventas:', error);
            }
        };

        obtenerVentas();
    }, [token]);

    useEffect(() => {
        const crearDatosGrafico = () => {
            const usuarios = {};
            const diasDelMes = new Date(anioSeleccionado, mesSeleccionado, 0).getDate();
            let sumaTotal = 0;

            for (let dia = 1; dia <= diasDelMes; dia++) {
                const fechaString = `${anioSeleccionado}-${mesSeleccionado}-${dia < 10 ? '0' : ''}${dia}`;
                const ventasDelDia = ventas.filter(venta => {
                    const fecha = new Date(venta.fechaCreacion);
                    return (
                        fecha.getDate() === dia &&
                        fecha.getMonth() + 1 === mesSeleccionado &&
                        fecha.getFullYear() === anioSeleccionado
                    );
                });

                ventasDelDia.forEach(venta => {
                    const nombreUsuario = venta.usuario;
                    const clave = `${dia}-${nombreUsuario}`;

                    if (!usuarios[clave]) {
                        usuarios[clave] = 0;
                    }
                    const totalProducto = parseFloat(venta.totalProducto);
                    if (!isNaN(totalProducto)) {
                        usuarios[clave] += totalProducto;
                        sumaTotal += totalProducto;
                    }
                });
            }

            const labels = Array.from({ length: diasDelMes }, (_, index) => {
                const dia = index + 1;
                return `${dia}/${mesSeleccionado}/${anioSeleccionado}`;
            });

            const groupedData = {};
            const totalesPorUsuario = {};

            Object.keys(usuarios).forEach(clave => {
                const [dia, nombreUsuario] = clave.split('-');
                if (!groupedData[nombreUsuario]) {
                    groupedData[nombreUsuario] = new Array(diasDelMes).fill(0);
                }
                groupedData[nombreUsuario][parseInt(dia) - 1] = usuarios[clave];

                if (!totalesPorUsuario[nombreUsuario]) {
                    totalesPorUsuario[nombreUsuario] = 0;
                }
                totalesPorUsuario[nombreUsuario] += usuarios[clave];
            });

            const datasets = Object.keys(groupedData).map((nombreUsuario, index) => {
                const color = `hsl(${index * 120}, 70%, 50%)`;
                return {
                    label: nombreUsuario,
                    data: groupedData[nombreUsuario],
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1,
                };
            });

            setGraficoData({
                labels: labels,
                datasets: datasets,
            });
            setTotalVentas(sumaTotal);
            setTotalesPorUsuario(totalesPorUsuario);

            // Crea los datos para la gráfica circular
            const labelsCircular = Object.keys(totalesPorUsuario);
            const dataCircular = Object.values(totalesPorUsuario);
            const datasetsCircular = [{
                label: 'Ventas por Usuario',
                data: dataCircular,
                backgroundColor: labelsCircular.map((_, index) => `hsl(${index * 120}, 70%, 50%)`),
                hoverOffset: 4,
            }];
            setGraficoCircularData({
                labels: labelsCircular,
                datasets: datasetsCircular,
            });
        };

        crearDatosGrafico();
    }, [ventas, mesSeleccionado, anioSeleccionado]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        return `${tooltipItem.dataset.label}: Q${tooltipItem.raw.toFixed(2)}`;
                    },
                },
            },
            datalabels: {
                anchor: 'end',
                align: 'end',
                color: 'black',
                formatter: (value) => {
                    return value === 0 ? '' : `Q${value.toFixed(2)}`;
                },
                font: {
                    weight: 'bold',
                    size: 10,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.3)',
                },
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.3)',
                },
            },
        },
    };

    const optionsCircular = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        return `${tooltipItem.label}: Q${tooltipItem.raw.toFixed(2)}`;
                    },
                },
            },
        },
    };

    return (
        <div className='producto-container'>
            <div className='cdit-form2'>
                <img src={LOGO} alt="LOGO" />
                <h1>Reporte de Ventas</h1>
                <button onClick={() => navigate('/menu')} className="btn-menum">
                    Menú
                </button>
                <br />
                <hr />
                <label>
                    <p>Seleccionar Mes:</p>
                    <select value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))}>
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                    </select>
                </label>
                <label>
                    <p>Seleccionar Año:</p>
                    <input
                        type="number"
                        value={anioSeleccionado}
                        onChange={e => setAnioSeleccionado(Number(e.target.value))}
                    />
                </label>
                <h3>Ventas del Mes {mesSeleccionado} del Año {anioSeleccionado}</h3>
                <h3>Total: Q{totalVentas.toFixed(2)}</h3>

                {/* Muestra totales por usuario */}
                <div>
                    <h3>Totales por Usuario:</h3>
                    <li>
                    {Object.entries(totalesPorUsuario).map(([usuario, total]) => (
                        <p key={usuario}>{usuario}: Q{total.toFixed(2)}</p>
                    ))}
                    </li>
                </div>


                <div style={{ display: 'flex', justifyContent: 'center', height: '300px', width: '100%' }}>
    <Pie 
        data={{
            ...graficoCircularData,
            datasets: [{
                ...graficoCircularData.datasets[0],
                backgroundColor: [
                    'rgba(255, 165, 0, 0.6)', // Naranja
                    'rgba(54, 162, 235, 0.6)', // Azul
                    'rgba(54, 162, 235, 0.6)', // Azul frío
                    'rgba(201, 203, 207, 0.6)', // Gris (puedes eliminar este o cambiarlo)
                ],
            }]
        }} 
        options={optionsCircular} 
    />
</div>
                <div style={{ height: '300px', width: '100%' }}>
                    <Bar data={graficoData} options={options} />
                </div>
                <hr />


            </div>
        </div>
    );
};

export default Reporte_Venta;

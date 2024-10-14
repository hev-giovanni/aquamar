<?php
require '../vendor/autoload.php'; 
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;



function obtenerVentasDiariasYMensuales($conexion, $mes, $anio) {
    $ventasPorUsuario = [];

    // Consulta para obtener las ventas del día actual
    $fechaHoy = date('Y-m-d');
    $queryHoy = "SELECT 
    usuario.usuario AS nombreUsuario, 
    SUM(detalleFact.totalProducto) AS totalDia
FROM 
    facturaElectronica
INNER JOIN 
    usuario ON facturaElectronica.idUsuario = usuario.idUsuario
INNER JOIN 
    detalleFact ON facturaElectronica.idFactura = detalleFact.idFactura
WHERE 
    DATE(facturaElectronica.fechaCreacion) = date(now())
GROUP BY 
    usuario.usuario;
";
    $resultadoHoy = $conexion->query($queryHoy);
    
    while ($fila = $resultadoHoy->fetch_assoc()) {
        $usuario = $fila['nombreUsuario'];
        $ventasPorUsuario[$usuario]['totalDia'] = $fila['totalDia'];
    }

    // Consulta para obtener las ventas acumuladas del mes
// Consulta para obtener las ventas acumuladas del mes
$queryMes = "SELECT 
    usuario.usuario AS nombreUsuario, 
    SUM(detalleFact.totalProducto) AS totalMes
FROM 
    facturaElectronica
INNER JOIN 
    usuario ON facturaElectronica.idUsuario = usuario.idUsuario
INNER JOIN 
    detalleFact ON facturaElectronica.idFactura = detalleFact.idFactura
WHERE 
    MONTH(facturaElectronica.fechaCreacion) = $mes 
    AND YEAR(facturaElectronica.fechaCreacion) = $anio
GROUP BY 
    usuario.usuario;";

// Ejecutar la consulta y verificar errores
$resultadoMes = $conexion->query($queryMes);
if (!$resultadoMes) {
    // Manejo de errores en caso de que la consulta falle
    die("Error en la consulta: " . $conexion->error);
}


while ($fila = $resultadoMes->fetch_assoc()) {
    // Usar 'nombreUsuario' para acceder al valor
    $usuario = $fila['nombreUsuario'];
    $ventasPorUsuario[$usuario]['totalMes'] = $fila['totalMes'];
}

// Retornar el array con las ventas por usuario
return $ventasPorUsuario;

}
function enviarCorreo($ventasPorUsuario) {
    $mail = new PHPMailer(true);
    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'aquamarypets@gmail.com'; // Tu correo
        $mail->Password = 'wjzcicpilnoczrtm'; // Contraseña de la app
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Remitente
        $mail->setFrom('aquamarypets@gmail.com', 'Reporte de Ventas');

        // Destinatario
        $mail->addAddress('hev.giovanni@gmail.com', 'Destinatario');

        // Contenido del correo
        $mail->isHTML(true);
        $mail->Subject = 'Reporte Diario de Ventas';
        $mail->addEmbeddedImage('../src/imagenes/logo1.png', 'logo_cid');
        $cuerpo = ""; 

        // Crear cuerpo del correo con estilos CSS
        $cuerpo .= "<img src='cid:logo_cid' alt='Logo' style='width: 150px; height: auto; margin-bottom: 20px;'>";
        $cuerpo = "<h1 style='color: #333;'>Reporte de Ventas AQUAMAR & PETS</h1>";
        $cuerpo .= "<table style='width: 100%; border-collapse: collapse;'>
                        <tr style='background-color: #f2f2f2;'>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Usuario</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Total del Día</th>
                            <th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Total del Mes</th>
                        </tr>";

        foreach ($ventasPorUsuario as $usuario => $totales) {
            $totalDia = isset($totales['totalDia']) ? number_format($totales['totalDia'], 2) : '0.00';
            $totalMes = isset($totales['totalMes']) ? number_format($totales['totalMes'], 2) : '0.00';

            $cuerpo .= "<tr>
                            <td style='padding: 10px; border: 1px solid #ddd;'>$usuario</td>
                            <td style='padding: 10px; border: 1px solid #ddd;'>Q$totalDia</td>
                            <td style='padding: 10px; border: 1px solid #ddd;'>Q$totalMes</td>
                        </tr>";
        }

        $cuerpo .= "</table>";
        $mail->Body = $cuerpo;

        // Enviar correo
        $mail->send();
        echo 'Correo enviado correctamente.';
    } catch (Exception $e) {
        echo "Error al enviar el correo: {$mail->ErrorInfo}";
    }
}

// Configuración de la conexión a la base de datos
$conexion = new mysqli('localhost', 'hgiovanni', 'guatemala21', 'aquamar');


if ($conexion->connect_error) {
    die('Error en la conexión: ' . $conexion->connect_error);
}

// Obtener ventas diarias y acumuladas del mes
$mesActual = date('m');
$anioActual = date('Y');
$ventasPorUsuario = obtenerVentasDiariasYMensuales($conexion, $mesActual, $anioActual);

// Enviar el correo
enviarCorreo($ventasPorUsuario);

$conexion->close();
?>

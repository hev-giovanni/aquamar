<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Ajusta el origen según tu configuración
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    exit(0);
}

include 'conectar.php';
$mysqli = conectarDB();
session_start();
$mysqli->set_charset('utf8');

// Verificar el estado de la sesión
if (!isset($_SESSION['idUsuario'])) {
    echo json_encode(array('error' => 'Usuario no autenticado.'));
    exit();
}

$idUsuario = $_SESSION['idUsuario'];

$query = "
SELECT 
  usuario.primerNombre,
  usuario.primerApellido, 
  usuario.usuario, 
  usuario.idUsuario,
  usuario.idStatus
FROM usuario
WHERE usuario.idUsuario = ?
";

if ($nueva_consulta = $mysqli->prepare($query)) {
    $nueva_consulta->bind_param('i', $idUsuario);
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();

    $datos = $resultado->fetch_assoc();
    echo json_encode($datos);

    $nueva_consulta->close();
} else {
    echo json_encode(array('error' => 'No se pudo conectar a BD'));
}

$mysqli->close();
?>

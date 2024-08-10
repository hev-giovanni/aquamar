<?php
// Permitir solo el origen específico y permitir credenciales
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    exit(0); // Responder a las solicitudes preflight CORS
}

include 'conectar.php';
$mysqli = conectarDB();
session_start();
$mysqli->set_charset('utf8');

// Verificar si hay una sesión activa
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
  usuarioRol.idRole,
  rol.nombre AS rolNombre,
  permiso.permiso
FROM usuario
INNER JOIN usuarioRol ON usuario.idUsuario = usuarioRol.idUsuario
INNER JOIN rol ON usuarioRol.idRole = rol.idRol
INNER JOIN rolModuloPermiso ON rol.idRol = rolModuloPermiso.idRol
INNER JOIN permiso ON rolModuloPermiso.idPermiso = permiso.idPermiso
WHERE usuario.idUsuario = ?
";

if ($nueva_consulta = $mysqli->prepare($query)) {
    $nueva_consulta->bind_param('i', $idUsuario);
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();

    $datos = array();
    while ($fila = $resultado->fetch_assoc()) {
        $datos[] = $fila;
    }

    echo json_encode($datos);
    $nueva_consulta->close();
} else {
    echo json_encode(array('error' => 'No se pudo conectar a la base de datos'));
}

$mysqli->close();
?>

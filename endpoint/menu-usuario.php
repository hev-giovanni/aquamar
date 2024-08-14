<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Ajusta el origen según tu configuración
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization"); // Incluye 'Authorization'
header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php'; // Ajusta la ruta según la estructura de tu proyecto

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Obtener el token del encabezado Authorization
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader); // Extraer el token del encabezado
} else {
    echo json_encode(array('error' => 'Token no proporcionado.'));
    exit();
}

// Configura tu clave secreta para JWT
$key = "aquamar2024";

try {
    // Decodificar el token JWT
    $decoded = JWT::decode($token, new Key($key, 'HS256'));

    // Acceder a los datos decodificados
    $userId = $decoded->data->userId;

    // Obtener información del usuario desde la base de datos
    $query = "
    SELECT 
      usuario.primerNombre,
      usuario.primerApellido, 
      usuario.usuario, 
      usuario.idUsuario,
      usuarioRol.idRole,
      rol.nombre AS rolNombre,
      permiso.permiso,
      modulo.nombre AS moduloNombre,
      status.nombre AS moduloStatus
    FROM usuario
    INNER JOIN usuarioRol ON usuario.idUsuario = usuarioRol.idUsuario
    INNER JOIN rol ON usuarioRol.idRole = rol.idRol
    INNER JOIN rolModuloPermiso ON rol.idRol = rolModuloPermiso.idRol
    INNER JOIN permiso ON rolModuloPermiso.idPermiso = permiso.idPermiso
    INNER JOIN modulo ON rolModuloPermiso.idModulo = modulo.idModulo
    INNER JOIN status ON modulo.idStatus = status.idStatus
    WHERE usuario.idUsuario = ?
    ";

    if ($nueva_consulta = $mysqli->prepare($query)) {
        $nueva_consulta->bind_param('i', $userId);
        $nueva_consulta->execute();
        $resultado = $nueva_consulta->get_result();

        $datos = $resultado->fetch_all(MYSQLI_ASSOC);
        echo json_encode($datos);

        $nueva_consulta->close();
    } else {
        echo json_encode(array('error' => 'No se pudo conectar a BD'));
    }
} catch (Exception $e) {
    echo json_encode(array('error' => 'Token inválido o expirado.'));
}

$mysqli->close();
?>

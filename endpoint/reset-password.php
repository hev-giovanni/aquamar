<?php
require '../vendor/autoload.php'; // Incluye el autoload de Composer para PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Content-Type: application/json; charset=utf-8");

// Verificar el método de solicitud
$method = $_SERVER['REQUEST_METHOD'];
if ($method != "POST") {
    echo json_encode(array('status' => false, 'message' => 'Método no permitido'));
    exit();
}

include './conectar.php'; // Asegúrate de que la ruta a tu archivo de conexión es correcta
$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Leer los datos de entrada
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['token']) || !isset($data['nueva_clave'])) {
    echo json_encode(array('status' => false, 'message' => 'Token y nueva contraseña requeridos'));
    exit();
}

$token = $data['token'];
$nueva_clave = password_hash($data['nueva_clave'], PASSWORD_DEFAULT);

// Verificar el token
if ($consulta = $mysqli->prepare("SELECT idUsuario, expiracion FROM recuperacion_clave WHERE token = ? AND expiracion > NOW()")) {
    $consulta->bind_param('s', $token);
    $consulta->execute();
    $resultado = $consulta->get_result();

    if ($resultado->num_rows == 1) {
        $datos = $resultado->fetch_assoc();
        $idUsuario = $datos['idUsuario'];

        // Actualizar la contraseña del usuario
        if ($actualizacion = $mysqli->prepare("UPDATE usuario SET clave = ? WHERE idUsuario = ?")) {
            $actualizacion->bind_param('si', $nueva_clave, $idUsuario);
            $actualizacion->execute();
            $actualizacion->close();
        } else {
            echo json_encode(array('status' => false, 'message' => 'No se pudo actualizar la contraseña'));
            exit();
        }

        // Eliminar el token utilizado
        if ($borrado = $mysqli->prepare("DELETE FROM recuperacion_clave WHERE token = ?")) {
            $borrado->bind_param('s', $token);
            $borrado->execute();
            $borrado->close();
        } else {
            echo json_encode(array('status' => false, 'message' => 'No se pudo eliminar el token'));
            exit();
        }

        echo json_encode(array('status' => true, 'message' => 'Contraseña actualizada exitosamente'));
    } else {
        echo json_encode(array('status' => false, 'message' => 'Token inválido o expirado'));
    }
    $consulta->close();
} else {
    echo json_encode(array('status' => false, 'message' => 'No se pudo preparar la consulta'));
}

$mysqli->close();
?>

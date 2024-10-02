<?php
header( 'Access-Control-Allow-Origin: *' ); // Ajusta el origen según tu configuración
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method == "OPTIONS") {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php'; // Ajusta la ruta según la estructura de tu proyecto


use \Firebase\JWT\JWT;

$mysqli = conectarDB();

$JSONData = file_get_contents('php://input');
$dataObject = json_decode($JSONData);

session_start();
$mysqli->set_charset('utf8');

// Verificar si se recibieron los datos esperados
if (!isset($dataObject->usuario) || !isset($dataObject->clave)) {
    echo json_encode(array('conectado' => false, 'error' => 'Datos incompletos.'));
    exit();
}

$usuario = $dataObject->usuario;
$clave = $dataObject->clave;

// Configura tu clave secreta para JWT
$key = "aquamar2024";


$issuedAt = time();
$expiration = $issuedAt + 28800; // Tiempo de vida del token

if ($nueva_consulta = $mysqli->prepare("SELECT 
    usuario.usuario, 
    usuario.idUsuario,
    usuario.clave
    FROM usuario 
    WHERE usuario.usuario = ?")) {

    $nueva_consulta->bind_param('s', $usuario);
    $nueva_consulta->execute();
    $resultado = $nueva_consulta->get_result();

    if ($resultado->num_rows == 1) {
        $datos = $resultado->fetch_assoc();
        $encriptado_db = $datos['clave'];

        if (password_verify($clave, $encriptado_db)) {
            // Generacion del Token
            $token = [
                "iat" => $issuedAt,
                "exp" => $expiration,
                "data" => [
                    "userId" => $datos['idUsuario'],
                    "usuario" => $datos['usuario']
                ]
            ];
            $jwt = JWT::encode($token, $key, 'HS256');

            echo json_encode(array(
                'conectado' => true,
                'token' => $jwt
            ));
        } else {
            echo json_encode(array('conectado' => false, 'error' => 'Credenciales Incorrectas'));
        }
    } else {
        echo json_encode(array('conectado' => false, 'error' => 'Credenciales Incorrectas'));
    }
    $nueva_consulta->close();
} else {
    echo json_encode(array('conectado' => false, 'error' => 'No se pudo conectar a BD'));
}

$mysqli->close();
?>

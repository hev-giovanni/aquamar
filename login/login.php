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

if ($nueva_consulta = $mysqli->prepare("SELECT 
    usuario.usuario, 
    usuario.primerNombre, 
    usuario.primerApellido, 
    usuario.idUsuario,
    usuario.idStatus,
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
            $_SESSION['idUsuario'] = $datos['idUsuario']; // Establece la sesión
            echo json_encode(array(
                'conectado' => true,
                'usuario' => $datos['usuario'],
                'nombre' => $datos['primerNombre'],
                'apellido' => $datos['primerApellido'],
                'idUsuario' => $datos['idUsuario'],
                'status' => $datos['idStatus']
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

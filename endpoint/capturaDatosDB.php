<?php
header( 'Access-Control-Allow-Origin: *' ); // Ajusta el origen según tu configuración
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if (!isset($dataObject->clave) || !isset($dataObject->valor) || !isset($dataObject->idUsuario) || !isset($dataObject->codigoIdent) || !isset($dataObject->idAsignacionD)) {
    echo json_encode(array('error' => 'Datos incompletos.'));
    exit();
}

$clave = $dataObject->clave;
$valor = $dataObject->valor;
$idUsuario = $dataObject->idUsuario;
$codigoIdent = $dataObject->codigoIdent;
$idAsignacionD = $dataObject->idAsignacionD;
$fechaHora = date('Y-m-d H:i:s');

// Obtener la clave secreta almacenada en la base de datos
if ($stmt = $mysqli->prepare("SELECT clave FROM claveDispositivo LIMIT 1")) {
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($claveEncriptada);

    if ($stmt->num_rows == 1) {
        $stmt->fetch();
        
        // Verificar la clave recibida usando PASSWORD_DEFAULT
        if (password_verify($clave, $claveEncriptada)) {
            // Insertar los datos en la tabla lecturaSensor
            $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
            $date->modify( '-6 hours' );
            $fechaHora = $date->format( 'Y-m-d H:i:s' );


            if ($insert = $mysqli->prepare("INSERT INTO lecturaSensor (fechaHora, valor, idUsuario, codigoIdent,idAsignacionD) VALUES (?, ?, ?, ?, ?)")) {
                $insert->bind_param('sssss', $fechaHora, $valor, $idUsuario, $codigoIdent, $idAsignacionD);
                $insert->execute();
                $insert->close();
                echo json_encode(array('success' => 'Datos insertados correctamente.'));
            } else {
                echo json_encode(array('error' => 'No se pudo insertar los datos.'));
            }
        } else {
            echo json_encode(array('error' => 'Clave incorrecta.'));
        }
    } else {
        echo json_encode(array('error' => 'No se encontró la clave secreta.'));
    }
    $stmt->close();
} else {
    echo json_encode(array('error' => 'No se pudo conectar a la base de datos.'));
}

$mysqli->close();
?>

<?php
// Configurar encabezados CORS
header('Access-Control-Allow-Origin: http://localhost:3000'); // Cambia esto por el origen correcto de tu frontend
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Manejo de solicitudes OPTIONS (preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset( 'utf8' );

// Obtener el token del header de autorización
$headers = apache_request_headers();
if ( isset( $headers[ 'Authorization' ] ) ) {
    $authHeader = $headers[ 'Authorization' ];
    $token = str_replace( 'Bearer ', '', $authHeader );

} else {
    echo json_encode( [ 'error' => 'Token no proporcionado.' ] );
    exit();
}

$key = 'aquamar2024';

try {
    // Decodificar el token JWT
    $decoded = JWT::decode( $token, new Key( $key, 'HS256' ) );
    $userId = $decoded->data->userId;

    error_log( "User ID from token: $userId" );

    // Obtener permisos del usuario
    $query = "
    SELECT permiso.permiso
    FROM usuario
    INNER JOIN usuarioRol ON usuario.idUsuario = usuarioRol.idUsuario
    INNER JOIN rol ON usuarioRol.idRole = rol.idRol
    INNER JOIN rolModuloPermiso ON rol.idRol = rolModuloPermiso.idRol
    INNER JOIN permiso ON rolModuloPermiso.idPermiso = permiso.idPermiso
    WHERE usuario.idUsuario = ? AND rolModuloPermiso.idModulo = (SELECT idModulo FROM modulo WHERE nombre = 'Monitoreo')
    ";
    //cambiar ' producto_marca'

    if ( $perm_query = $mysqli->prepare( $query ) ) {
        $perm_query->bind_param( 'i', $userId );
        $perm_query->execute();
        $perm_result = $perm_query->get_result();

        $permisos = [];
        while ( $row = $perm_result->fetch_assoc() ) {
            $permisos[] = $row[ 'permiso' ];
        }

        error_log( 'Permisos obtenidos: ' . implode( ', ', $permisos ) );

        $perm_query->close();

        switch ( $method ) {
            case 'GET':
            if ( in_array( 'Leer', $permisos ) ) {
                $query = "SELECT 
    dispositivo.codigoDispositivo,
    sensor.modelo,
    usuario.primerNombre,
    usuario.primerApellido,
    tipoSensor.tipo,
    lecturaSensor.valor,
    sensorUnidad.simbolo,
    lecturaSensor.fechaHora,
    lecturaSensor.codigoIdent,
    dispositivo.descripcion
FROM lecturaSensor
INNER JOIN usuario ON lecturaSensor.idUsuario = usuario.idUsuario
INNER JOIN asignacionD ON lecturaSensor.idAsignacionD = asignacionD.idAsignacionD
INNER JOIN dispositivo ON asignacionD.idDispositivo = dispositivo.idDispositivo
INNER JOIN sensor ON asignacionD.idSensor = sensor.idSensor
INNER JOIN tipoSensor ON sensor.idTipoSensor = tipoSensor.idTipoSensor
INNER JOIN sensorUnidad ON sensor.idSensorUnidad = sensorUnidad.idSensorUnidad;

";
                $result = $mysqli->query( $query );

                $response = [];
                while ( $row = $result->fetch_assoc() ) {
                    // Solo agregar la fila al array de respuesta sin campos adicionales
                    $response[] = $row;
                }

                echo json_encode( $response );
            } else {
                echo json_encode( [ 'error' => 'No tienes permiso para leer datos.' ] );
            }
            break;

            }
    } else {
        echo json_encode( [ 'error' => 'No se pudo conectar a la BD' ] );
    }
} catch ( Exception $e ) {
    error_log( 'Error al decodificar el token: ' . $e->getMessage() );
    echo json_encode( [ 'error' => 'Token inválido o expirado.', 'message' => $e->getMessage() ] );
}

$mysqli->close();
?>

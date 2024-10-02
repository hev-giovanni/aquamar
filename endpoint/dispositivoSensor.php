<?php
header( 'Access-Control-Allow-Origin: *' );

header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
header( 'Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization' );
header( 'Access-Control-Allow-Credentials: true' );

header( 'Content-Type: application/json; charset=utf-8' );

$method = $_SERVER[ 'REQUEST_METHOD' ];

if ( $method === 'OPTIONS' ) {
    exit( 0 );
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
    WHERE usuario.idUsuario = ? AND rolModuloPermiso.idModulo = (SELECT idModulo FROM modulo WHERE nombre = 'Dispositivo_Sensor')
    ";
    //cambiar ' producto_marca como esta dado de alta en Modulos'

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
                asignacionD.idAsignacionD,
                asignacionD.idDispositivo,
                dispositivo.codigoDispositivo,
                asignacionD.idSensor,
                sensor.modelo,
                tipoSensor.tipo
                FROM asignacionD
                INNER JOIN dispositivo ON asignacionD.idDispositivo = dispositivo.idDispositivo
                INNER JOIN sensor ON asignacionD.idSensor = sensor.idSensor
                INNER JOIN tipoSensor ON sensor.idTipoSensor = tipoSensor.idTipoSensor;
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

            case 'POST':
            if ( in_array( 'Escribir', $permisos ) ) {
                $data = json_decode( file_get_contents( 'php://input' ), true );

                // Validar datos
                if ( !isset( $data[ 'idDispositivo' ], $data[ 'idSensor' ] ) ) {
                    echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                    exit();
                }

                $idDispositivo = $data[ 'idDispositivo' ];
                $idSensor = $data[ 'idSensor' ];

                // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
                $date->modify( '-6 hours' );
                $fechaCreacion = $date->format( 'Y-m-d H:i:s' );

                $usuarioCreacion = $userId;

                // Insertar en la tabla marca
                $query = 'INSERT INTO asignacionD (idDispositivo, idSensor, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?)';

                if ( $insert_query = $mysqli->prepare( $query ) ) {
                    $insert_query->bind_param( 'iiss',  $idDispositivo, $idSensor,  $fechaCreacion, $usuarioCreacion );
                    if ( $insert_query->execute() ) {
                        echo json_encode( [ 'success' => 'Asignación Dispositivo creado.' ] );
                    } else {
                        echo json_encode( [ 'error' => 'No se pudo crear Asignación de Dispositivo.' ] );
                    }
                    $insert_query->close();
                } else {
                    echo json_encode( [ 'error' => 'No se pudo preparar la consulta.' ] );
                }
            } else {
                echo json_encode( [ 'error' => 'No tienes permiso para crear datos.' ] );
            }
            break;

            case 'PUT':
            if ( in_array( 'Escribir', $permisos ) ) {
                $data = json_decode( file_get_contents( 'php://input' ), true );

                // Validar datos
                if ( !isset( $data[ 'idAsignacionD' ], $data[ 'idDispositivo' ], $data[ 'idSensor' ] ) ) {
                    echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                    exit();
                }

                $idAsignacionD = $data[ 'idAsignacionD' ];
                $idDispositivo = $data[ 'idDispositivo' ];
                $idSensor = $data[ 'idSensor' ];
                // Utilizamos idPais directamente

                // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
                $date->modify( '-6 hours' );
                $fechaModificacion = $date->format( 'Y-m-d H:i:s' );

                $usuarioModificacion = $userId;
                // ID del usuario del token

                // Actualizar en la tabla marca
                $query = 'UPDATE asignacionD SET  idDispositivo = ?, idSensor = ?,  fechaModificacion = ?, usuarioModificacion = ? WHERE idAsignacionD = ?';

                if ( $update_query = $mysqli->prepare( $query ) ) {
                    $update_query->bind_param( 'iissi',  $idDispositivo, $idSensor,  $fechaModificacion, $usuarioModificacion, $idAsignacionD );
                    if ( $update_query->execute() ) {
                        echo json_encode( [ 'success' => 'Asignación  actualizada.' ] );
                    } else {
                        echo json_encode( [ 'error' => 'No se pudo actualizar la Asignación' ] );
                    }
                    $update_query->close();
                } else {
                    echo json_encode( [ 'error' => 'No se pudo preparar la consulta.' ] );
                }
            } else {
                echo json_encode( [ 'error' => 'No tienes permiso para actualizar datos.' ] );
            }
            break;

            case 'DELETE':
            if ( in_array( 'Borrar', $permisos ) ) {
                $id = $_GET[ 'id' ];

                // Validar id
                if ( empty( $id ) || !is_numeric( $id ) ) {
                    echo json_encode( [ 'error' => 'ID inválido.' ] );
                    exit();
                }

                $query = 'DELETE FROM asignacionD WHERE idAsignacionD = ?';

                if ( $delete_query = $mysqli->prepare( $query ) ) {
                    $delete_query->bind_param( 'i', $id );

                    if ( $delete_query->execute() ) {
                        if ( $delete_query->affected_rows > 0 ) {
                            echo json_encode( [ 'success' => 'Asignacion eliminada.' ] );
                        } else {
                            echo json_encode( [ 'error' => 'Asignacion no encontrado.' ] );
                        }
                    } else {
                        echo json_encode( [ 'error' => 'No se pudo ejecutar la consulta.' ] );
                        error_log( 'Error en la ejecución de la consulta: ' . $mysqli->error );
                    }

                    $delete_query->close();
                } else {
                    echo json_encode( [ 'error' => 'No se pudo preparar la consulta.' ] );
                    error_log( 'Error al preparar la consulta: ' . $mysqli->error );
                }
            } else {
                echo json_encode( [ 'error' => 'No tienes permiso para borrar datos.' ] );
            }
            break;

            default:
            echo json_encode( [ 'error' => 'Método no soportado.' ] );
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

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
include 'permisos.php';
// Incluir el archivo de permisos
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

    // Obtener permisos del usuario para el módulo 'Producto_Tipo'
    $permisos = obtenerPermisos( $userId, 'Alta_Modulos-Roles', $mysqli );

    error_log( 'Permisos obtenidos: ' . implode( ', ', $permisos ) );

    switch ( $method ) {
        case 'GET':
        if ( in_array( 'Leer', $permisos ) ) {
            $query = "SELECT 
                rol.idRol,
                rol.nombre AS rolNombre,
                modulo.idModulo,
                modulo.nombre AS moduloNombre,
                permiso.idPermiso,
                permiso.permiso
                FROM rolModuloPermiso
                INNER JOIN rol ON rolModuloPermiso.idRol = rol.idRol
                INNER JOIN modulo ON rolModuloPermiso.idModulo = modulo.idModulo
                INNER JOIN permiso ON rolModuloPermiso.idPermiso = permiso.idPermiso;";
            $result = $mysqli->query( $query );

            $response = [];
            while ( $row = $result->fetch_assoc() ) {
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

            if ( !isset( $data[ 'idRol' ],$data[ 'idModulo' ],$data[ 'idPermiso' ] ) ) {
                echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                exit();
            }

            $idRol = $data[ 'idRol' ];
            $idModulo = $data[ 'idModulo' ];
            $idPermiso = $data[ 'idPermiso' ];
            $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
            $date->modify( '-6 hours' );
            $fechaCreacion = $date->format( 'Y-m-d H:i:s' );

            $usuarioCreacion = $userId;

            $query = 'INSERT INTO rolModuloPermiso (idRol, idModulo, idPermiso, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?, ?)';

            if ( $insert_query = $mysqli->prepare( $query ) ) {
                $insert_query->bind_param( 'sssss', $idRol, $idModulo, $idPermiso, $fechaCreacion, $usuarioCreacion );
                if ( $insert_query->execute() ) {
                    echo json_encode( [ 'success' => 'Asignacion  creada.' ] );
                } else {
                    echo json_encode( [ 'error' => 'No se pudo crear  el Permiso.' ] );
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

            error_log( print_r( $data, true ) );

            if ( !isset( $data[ 'idRol' ], $data[ 'idModulo' ], $data[ 'idPermiso' ], $data[ 'rolModuloPermiso' ] ) ) {
                echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                exit();
            }

            $idRol = $data[ 'idRol' ];
            $idModulo = $data[ 'idModulo' ];
            $idPermiso = $data[ 'idPermiso' ];
          
            $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
            $date->modify( '-6 hours' );
            $fechaModificacion = $date->format( 'Y-m-d H:i:s' );
            $usuarioModificacion = $userId;

            $query = 'UPDATE rolModuloPermiso SET idRol = ?, idModulo = ?, idPermiso = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idRol = ?, | $ |idModulo = ?';

            if ( $update_query = $mysqli->prepare( $query ) ) {
                $update_query->bind_param( 'sssssi', $idRol, $idModulo, $idPermiso, $fechaModificacion, $usuarioModificacion, $idPermiso );
                if ( $update_query->execute() ) {
                    echo json_encode( [ 'success' => 'Asignacion actualizado.' ] );
                } else {
                    echo json_encode( [ 'error' => 'No se pudo actualizar el Permiso.' ] );
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
            if (in_array('Borrar', $permisos)) {
                // Obtener los parámetros de la URL
                $id = isset($_GET['id']) ? explode(',', $_GET['id']) : [];
        
                // Validar que se recibieron los 3 IDs necesarios
                if (count($id) !== 3 || !array_filter($id, 'is_numeric')) {
                    echo json_encode(['error' => 'IDs inválidos.']);
                    exit();
                }
        
                // Desempaquetar los IDs
                list($idRol, $idModulo, $idPermiso) = $id;
        
                // Preparar la consulta SQL
                $query = 'DELETE FROM rolModuloPermiso WHERE idRol = ? AND idModulo = ? AND idPermiso = ?';
        
                if ($delete_query = $mysqli->prepare($query)) {
                    $delete_query->bind_param('iii', $idRol, $idModulo, $idPermiso);
        
                    if ($delete_query->execute()) {
                        if ($delete_query->affected_rows > 0) {
                            echo json_encode(['success' => 'Asignación eliminada.']);
                        } else {
                            echo json_encode(['error' => 'Asignación no encontrada.']);
                        }
                    } else {
                        echo json_encode(['error' => 'No se pudo ejecutar la consulta.']);
                        error_log('Error en la ejecución de la consulta: ' . $mysqli->error);
                    }
        
                    $delete_query->close();
                } else {
                    echo json_encode(['error' => 'No se pudo preparar la consulta.']);
                    error_log('Error al preparar la consulta: ' . $mysqli->error);
                }
            } else {
                echo json_encode(['error' => 'No tienes permiso para borrar datos.']);
            }
            break;
        
        default:
        echo json_encode( [ 'error' => 'Método no soportado.' ] );
        break;
    }
} catch ( Exception $e ) {
    error_log( 'Error al decodificar el token: ' . $e->getMessage() );
    echo json_encode( [ 'error' => 'Token inválido o expirado.', 'message' => $e->getMessage() ] );
}

$mysqli->close();
?>

<?php
header( 'Access-Control-Allow-Origin: http://localhost:3000' );

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
    WHERE usuario.idUsuario = ? AND rolModuloPermiso.idModulo = (SELECT idModulo FROM modulo WHERE nombre = 'Productos')
    ";

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
                $query = "
                   SELECT 
  producto.idProducto,
  producto.productoCodigo,
  producto.nombre,
  producto.descripcion, 
  producto.precioVenta, 
  producto.existencia, 
  producto.minimo,
  tipoProducto.idTipoProducto, 
  tipoProducto.nombre as tipoProductoNombre,
  marca.idMarca,
  marca.nombre as marcaNombre,
  status.idStatus,
  status.nombre as statusNombre
FROM producto
INNER JOIN tipoProducto ON producto.idTipoProducto = tipoProducto.idTipoProducto
INNER JOIN marca ON producto.idMarca = marca.idMarca
INNER JOIN status ON producto.idStatus = status.idStatus;                  
                    ";
                $result = $mysqli->query( $query );

                // Inicializamos el array de respuesta
                $response = [];

                // Iteramos sobre los resultados y los agregamos al array de respuesta
                if ( $result->num_rows > 0 ) {
                    while ( $row = $result->fetch_assoc() ) {
                        $response[] = $row;
                    }
                }

                // Enviamos la respuesta como JSON
                echo json_encode( $response );
            } else {
                echo json_encode( [ 'error' => 'No tienes permiso para leer datos.' ] );
            }
            break;

            case 'POST':
                if ( in_array( 'Escribir', $permisos ) ) {
                    $data = json_decode( file_get_contents( 'php://input' ), true );
            
                    // Validar datos
                    if ( !isset($data[ 'productoCodigo' ], $data[ 'nombre' ], $data[ 'descripcion' ], $data[ 'precioVenta' ], $data[ 'existencia' ], $data[ 'minimo' ], $data[ 'idTipoProducto' ], $data[ 'idMarca' ], $data[ 'idStatus' ] ) ) {
                        echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                        exit();
                    }
                    $productoCodigo = $data[ 'productoCodigo' ];
                    $nombre = $data[ 'nombre' ];
                    $descripcion = $data[ 'descripcion' ];
                    $precioVenta = $data[ 'precioVenta' ];
                    $existencia = $data[ 'existencia' ];
                    $minimo = $data[ 'minimo' ];
                    $idTipoProducto = $data[ 'idTipoProducto' ];
                    $idMarca = $data[ 'idMarca' ];
                    $idStatus = $data[ 'idStatus' ];
            
                    // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                    $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
                    $date->modify( '-6 hours' );
                    $fechaCreacion = $date->format( 'Y-m-d H:i:s' );
            
                    $usuarioCreacion = $userId;
            
                    // Asegúrate de que los parámetros son correctos
                    $query = 'INSERT INTO producto (productoCodigo, nombre, descripcion, precioVenta, existencia, minimo, idTipoProducto, idMarca, idStatus, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            
                    if ( $insert_query = $mysqli->prepare( $query ) ) {
                        $insert_query->bind_param( 'ssssiiiisss', $productoCodigo, $nombre, $descripcion, $precioVenta, $existencia, $minimo, $idTipoProducto, $idMarca, $idStatus, $fechaCreacion, $usuarioCreacion );
                        if ( $insert_query->execute() ) {
                            echo json_encode( [ 'success' => 'Producto creado.' ] );
                        } else {
                            echo json_encode( [ 'error' => 'No se pudo crear el producto.' ] );
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
                if ( !isset( $data[ 'idProducto' ], $data[ 'productoCodigo' ], $data[ 'nombre' ], $data[ 'descripcion' ], $data[ 'precioVenta' ], $data[ 'existencia' ], $data[ 'minimo' ], $data[ 'idTipoProducto' ], $data[ 'idMarca' ], $data[ 'idStatus' ] ) ) {
                    echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                    exit();
                }

                $id = $data[ 'idProducto' ];
                $productoCodigo = $data[ 'productoCodigo' ];
                $nombre = $data[ 'nombre' ];
                $descripcion = $data[ 'descripcion' ];
                $precioVenta = $data[ 'precioVenta' ];
                $existencia = $data[ 'existencia' ];
                $minimo = $data[ 'minimo' ];
                $idTipoProducto = $data[ 'idTipoProducto' ];
                $idMarca = $data[ 'idMarca' ];
                $idStatus = $data[ 'idStatus' ];

                // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
                $date->modify( '-6 hours' );
                $fechaModificacion = $date->format( 'Y-m-d H:i:s' );

                $usuarioModificacion = $userId;
                // ID del usuario del token

                $query = 'UPDATE producto SET productoCodigo = ?, nombre = ?, descripcion = ?, precioVenta = ?, existencia = ?, minimo = ?, idTipoProducto = ?, idMarca = ?, idStatus = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idProducto = ?';

                if ( $update_query = $mysqli->prepare( $query ) ) {
                    $update_query->bind_param( 'sssssssssssi', $productoCodigo, $nombre, $descripcion, $precioVenta, $existencia, $minimo, $idTipoProducto, $idMarca, $idStatus, $fechaModificacion, $usuarioModificacion, $id );
                    if ( $update_query->execute() ) {
                        echo json_encode( [ 'success' => 'Producto actualizado.' ] );
                    } else {
                        echo json_encode( [ 'error' => 'No se pudo actualizar el producto.' ] );
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

                $query = 'UPDATE producto SET idStatus = ? WHERE idProducto = ?';

                if ( $delete_query = $mysqli->prepare( $query ) ) {
                    $idStatusEliminado = 3;
                    // ID del status 'Eliminado'
                    $delete_query->bind_param( 'ii', $idStatusEliminado, $id );

                    if ( $delete_query->execute() ) {
                        if ( $delete_query->affected_rows > 0 ) {
                            echo json_encode( [ 'success' => 'Producto marcado como eliminado.' ] );
                        } else {
                            echo json_encode( [ 'error' => 'Producto no encontrado o ya está eliminado.' ] );
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

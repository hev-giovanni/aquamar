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
    $permisos = obtenerPermisos( $userId, 'Venta', $mysqli );

    error_log( 'Permisos obtenidos: ' . implode( ', ', $permisos ) );

    switch ( $method ) {
        case 'GET':
        if ( in_array( 'Leer', $permisos ) ) {
            $query = " SELECT 
	            facturaElectronica.fechaCreacion,
                facturaElectronica.idFactura,
                facturaElectronica.noAutorizacion,
                facturaElectronica.noSerie,
                facturaElectronica.noDTE,
                facturaElectronica.fechaEmision,
                facturaElectronica.fechaCertificacion,
                facturaElectronica.idMoneda,
                moneda.moneda,
                facturaElectronica.idCliente,
                cliente.nombre,
                cliente.nit,
                cliente.direccion,               
                facturaElectronica.idUsuario,
                usuario.usuario,  
                detalleFact.cantidad,
                detalleFact.precioVenta,
                detalleFact.subtotal,
                detalleFact.idProducto,
                detalleFact.idDetalleFact,
                producto.productoCodigo,
                producto.nombre as productoNombre, -- Agregué el campo para mostrar el nombre del producto, si lo necesitas.
                facturaElectronica.total,
                facturaElectronica.idStatus,
                status.nombre as nombreStatus
                FROM facturaElectronica
                INNER JOIN moneda ON facturaElectronica.idMoneda = moneda.idMoneda
                INNER JOIN cliente ON facturaElectronica.idCliente = cliente.idCliente
                INNER JOIN usuario ON facturaElectronica.idUsuario = usuario.idUsuario
                INNER JOIN status ON facturaElectronica.idStatus = status.idStatus
                INNER JOIN detalleFact ON facturaElectronica.idFactura = detalleFact.idFactura
                iNNER JOIN producto ON detalleFact.idProducto = producto.idProducto;
                ";
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

            // Verificar que se hayan recibido todos los datos necesarios
            if ( !isset(
                $data[ 'total' ],
                $data[ 'idMoneda' ],
                $data[ 'idCliente' ],
                $data[ 'idUsuario' ],
                $data[ 'articulos' ], // Validar que exista el array de artículos
                $data[ 'idStatus' ],
                $data[ 'idFactura' ]
            ) ) {
                echo json_encode( [ 'error' => 'Datos incompletos.' ] );
                exit();
            }

            // Asignar variables, permitir NULL si no vienen los datos opcionales
            $noAutorizacion     = isset( $data[ 'noAutorizacion' ] ) ? $data[ 'noAutorizacion' ] : null;
            $noSerie            = isset( $data[ 'noSerie' ] ) ? $data[ 'noSerie' ] : null;
            $noDTE              = isset( $data[ 'noDTE' ] ) ? $data[ 'noDTE' ] : null;
            $fechaEmision       = isset( $data[ 'fechaEmision' ] ) ? $data[ 'fechaEmision' ] : null;
            $fechaCertificacion = isset( $data[ 'fechaCertificacion' ] ) ? $data[ 'fechaCertificacion' ] : null;

            // Variables obligatorias para la factura
            $total = $data[ 'total' ];
            $idMoneda = $data[ 'idMoneda' ];
            $idCliente = $data[ 'idCliente' ];
            $idUsuario = $data[ 'idUsuario' ];
            $idFactura = $data[ 'idFactura' ];
            $idStatus = $data[ 'idStatus' ];
            $articulos = $data[ 'articulos' ];
            // Array de artículos

            // Obtener la fecha y hora en UTC y ajustar a la zona horaria deseada
            $date = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
            $date->modify( '-6 hours' );
            $fechaCreacion = $date->format( 'Y-m-d H:i:s' );

            $usuarioCreacion = $userId;

            // Iniciar transacción
            $mysqli->begin_transaction();
            $insert_query1 = null;
            $insert_query2 = null;

            try {
                // Insertar en 'facturaElectronica'
                $query1 = 'INSERT INTO facturaElectronica (noAutorizacion, noSerie, noDTE, fechaEmision, fechaCertificacion, total, idMoneda, idCliente, idUsuario, idStatus, fechaCreacion, usuarioCreacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

                $insert_query1 = $mysqli->prepare( $query1 );
                if ( !$insert_query1 ) {
                    throw new Exception( 'Error preparando la consulta 1: ' . $mysqli->error );
                }

                $insert_query1->bind_param(
                    'ssssssiiiiss',
                    $noAutorizacion, $noSerie, $noDTE, $fechaEmision, $fechaCertificacion, $total,
                    $idMoneda, $idCliente, $idUsuario, $idStatus, $fechaCreacion, $usuarioCreacion
                );

                $insert_query1->execute();
                if ( $insert_query1->error ) {
                    throw new Exception( 'Error ejecutando la consulta 1: ' . $insert_query1->error );
                }

                // Obtener el último ID insertado para la factura
                $idFacturaInsertada = $mysqli->insert_id;

                // Preparar la consulta de inserción para los artículos en 'detalleFact'
                $query2 = 'INSERT INTO detalleFact (cantidad, precioVenta, subtotal, idProducto, idFactura, fechaCreacion, usuarioCreacion)
                               VALUES (?, ?, ?, ?, ?, ?, ?)';

                $insert_query2 = $mysqli->prepare( $query2 );
                if ( !$insert_query2 ) {
                    throw new Exception( 'Error preparando la consulta 2: ' . $mysqli->error );
                }

                // Insertar cada artículo
                foreach ( $articulos as $articulo ) {
                    $cantidad = $articulo[ 'cantidad' ];
                    $precioVenta = $articulo[ 'precioVenta' ];
                    $subtotal = $articulo[ 'subtotal' ];
                    $idProducto = $articulo[ 'idProducto' ];

                    $insert_query2->bind_param(
                        'idiiiss',
                        $cantidad, $precioVenta, $subtotal, $idProducto, $idFacturaInsertada, $fechaCreacion, $usuarioCreacion
                    );

                    $insert_query2->execute();
                    if ( $insert_query2->error ) {
                        throw new Exception( 'Error ejecutando la consulta 2: ' . $insert_query2->error );
                    }
                }

                // Confirmar la transacción si todo sale bien
                $mysqli->commit();

                echo json_encode( [ 'success' => 'Factura Creada' ] );
            } catch ( Exception $e ) {
                // Revertir la transacción en caso de error
                $mysqli->rollback();
                echo json_encode( [ 'error' => 'No se pudo crear la Factura.', 'detalle' => $e->getMessage() ] );
            }
        } else {
            echo json_encode( [ 'error' => 'No tienes permiso para crear datos.' ] );
        }
        break;

        case 'PUT':
            if (in_array('Escribir', $permisos)) {
                $data = json_decode(file_get_contents('php://input'), true);
        
                // Definir un array con las claves necesarias
                $required_keys = [
                    'idFactura', 'total', 'idMoneda', 'idCliente', 
                    'idUsuario', 'cantidad', 'precioVenta', 
                    'subtotal', 'idStatus', 'idProducto', 'idDetalleFact' // Asegúrate de incluir idDetalleFact
                ];
        
                // Verificar que se hayan recibido todos los datos necesarios
                foreach ($required_keys as $key) {
                    if (!isset($data[$key])) {
                        echo json_encode(['error' => 'Datos incompletos.']);
                        exit();
                    }
                }
        
                // Filtrar datos necesarios
                $filtered_data = array_intersect_key($data, array_flip($required_keys));
        
                // Asignar variables, permitiendo NULL si no vienen los datos opcionales
                $noAutorizacion     = $data['noAutorizacion'] ?? null;
                $noSerie            = $data['noSerie'] ?? null;
                $noDTE              = $data['noDTE'] ?? null;
                $fechaEmision       = $data['fechaEmision'] ?? null;
                $fechaCertificacion = $data['fechaCertificacion'] ?? null;
        
                // Variables obligatorias
                $idFactura   = $filtered_data['idFactura'];
                $total       = $filtered_data['total'];
                $idMoneda    = $filtered_data['idMoneda'];
                $idCliente    = $filtered_data['idCliente'];
                $idUsuario    = $filtered_data['idUsuario'];
                $cantidad     = $filtered_data['cantidad'];
                $precioVenta  = $filtered_data['precioVenta'];
                $subtotal     = $filtered_data['subtotal'];
                $idStatus     = $filtered_data['idStatus'];
                $idProducto    = $filtered_data['idProducto'];
                $idDetalleFact = $filtered_data['idDetalleFact']; // Asegúrate de obtener esto también
        
                // Obtener la fecha y hora en UTC y ajustar a la zona horaria deseada
                $date = new DateTime('now', new DateTimeZone('UTC'));
                $date->modify('-6 hours');
                $fechaActualizacion = $date->format('Y-m-d H:i:s');
        
                $usuarioActualizacion = $userId;
        
                // Iniciar transacción
                $mysqli->begin_transaction();
        
                try {
                    // Actualizar la tabla 'facturaElectronica'
                    $query1 = 'UPDATE facturaElectronica SET
                                noAutorizacion = ?,
                                noSerie = ?,
                                noDTE = ?,
                                fechaEmision = ?,
                                fechaCertificacion = ?,
                                total = ?,
                                idMoneda = ?,
                                idCliente = ?,
                                idUsuario = ?,
                                idStatus = ?,
                                fechaModificacion = ?,
                                usuarioModificacion = ?
                                WHERE idFactura = ?';
        
                    $update_query1 = $mysqli->prepare($query1);
                    $update_query1->bind_param(
                        'sssssdiiiissi',
                        $noAutorizacion, $noSerie, $noDTE, $fechaEmision, $fechaCertificacion, $total,
                        $idMoneda, $idCliente, $idUsuario, $idStatus, $fechaActualizacion, $usuarioActualizacion, $idFactura
                    );
        
                    $update_query1->execute();
                    $update_query1->close();
        
                    // Actualizar la tabla 'detalleFact'
                    $query2 = 'UPDATE detalleFact SET
                                cantidad = ?,
                                precioVenta = ?,
                                subtotal = ?,
                                idProducto = ?,
                                fechaModificacion = ?,
                                usuarioModificacion = ?
                                WHERE idFactura = ? AND idDetalleFact = ?;';
        
                    $update_query2 = $mysqli->prepare($query2);
                    // Cambiar 'iddissi' a 'ididdisi' si subtotal es un decimal
                    $update_query2->bind_param(
                        'dddisiii', // Tipo de datos: i=integer, d=double, s=string
                        $cantidad,
                        $precioVenta,
                        $subtotal,
                        $idProducto,
                        $fechaActualizacion,
                        $usuarioActualizacion,
                        $idFactura,
                        $idDetalleFact // Asegúrate de que esto esté correctamente asignado
                    );
        
                    $update_query2->execute();
                    $update_query2->close(); // Cierra la consulta
        
                    // Confirmar transacción
                    $mysqli->commit();
        
                    echo json_encode(['success' => 'Factura y detalles actualizados.']);
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $mysqli->rollback();
                    echo json_encode(['error' => 'No se pudo actualizar la Factura y los detalles.', 'detalle' => $e->getMessage()]);
                }
            } else {
                echo json_encode(['error' => 'No tienes permiso para actualizar datos.']);
            }
            break;
        
        

            case 'DELETE':
                if (in_array('Borrar', $permisos)) {
                    // Obtener los parámetros de la URL o del cuerpo de la solicitud
                    $data = json_decode(file_get_contents('php://input'), true);
            
                    // Verificar que se hayan recibido los parámetros necesarios
                    if (!isset($data['noSerie'], $data['noDTE'], $data['total'])) {
                        echo json_encode(['error' => 'Datos incompletos. Se requieren noSerie, noDTE y total.']);
                        exit();
                    }
            
                    // Asignar los parámetros recibidos
                    $noSerie = $data['noSerie'];
                    $noDTE = $data['noDTE'];
                    $total = $data['total'];
            
                    // Iniciar transacción
                    $mysqli->begin_transaction();
            
                    try {
                        // Obtener el idFactura asociado a los valores noSerie, noDTE y total
                        $query1 = 'SELECT idFactura FROM facturaElectronica WHERE noSerie = ? AND noDTE = ? AND total = ?';
                        $select_query = $mysqli->prepare($query1);
                        $select_query->bind_param('ssi', $noSerie, $noDTE, $total);
                        $select_query->execute();
                        $select_query->store_result();
            
                        // Verificar si existe una factura con los parámetros proporcionados
                        if ($select_query->num_rows > 0) {
                            $select_query->bind_result($idFactura);
                            $select_query->fetch();
                            $select_query->close();
            
                            // Actualizar el registro en la tabla 'facturaElectronica' estableciendo idStatus en 3
                            $query3 = 'UPDATE facturaElectronica SET idStatus = 3 WHERE idFactura = ?';
                            $update_query3 = $mysqli->prepare($query3);
                            $update_query3->bind_param('i', $idFactura);
                            $update_query3->execute();
                            $update_query3->close();
            
                            // Confirmar transacción
                            $mysqli->commit();
                            echo json_encode(['success' => 'Factura  eliminada exitosamente.']);
                        } else {
                            echo json_encode(['error' => 'Factura no encontrada con los parámetros proporcionados.']);
                        }
            
                    } catch (Exception $e) {
                        // Revertir transacción en caso de error
                        $mysqli->rollback();
                        echo json_encode(['error' => 'No se pudo actualizar la Factura.']);
                    }
                } else {
                    echo json_encode(['error' => 'No tienes permiso para borrar datos.']);
                }
                break;
            
    }
} catch ( Exception $e ) {
    error_log( 'Error al decodificar el token: ' . $e->getMessage() );
    echo json_encode( [ 'error' => 'Token inválido o expirado.', 'message' => $e->getMessage() ] );
}

$mysqli->close();
?>

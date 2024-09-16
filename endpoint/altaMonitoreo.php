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
    WHERE usuario.idUsuario = ? AND rolModuloPermiso.idModulo = (SELECT idModulo FROM modulo WHERE nombre = 'Alta_Monitoreo')
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
                    usuario.idUsuario,               
                    usuario.usuario,
                    altaMonitoreo.idAltaMonitoreo,
                     altaMonitoreo.idAsignacionD,
                    altaMonitoreo.codigo,
                    altaMonitoreo.limite,
                    asignacionD.idDispositivo,
                    tipoSensor.tipo,
                    dispositivo.codigoDispositivo,
                    asignacionD.idSensor,
                    sensor.modelo,
                    tipoSensor.tipo
                    FROM altaMonitoreo
                    INNER JOIN usuario ON altaMonitoreo.idUsuario = usuario.idUsuario
                    INNER JOIN asignacionD ON altaMonitoreo.idAsignacionD = asignacionD.idAsignacionD  
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
                if (in_array('Escribir', $permisos)) {
                    $data = json_decode(file_get_contents('php://input'), true);
            
                    // Validar datos
                    if (!isset($data['idUsuario'], $data['codigo'], $data['idAsignacionD'], $data['limite'])) {
                        echo json_encode(['error' => 'Datos incompletos.']);
                        exit();
                    }
            
                    $idUsuario = intval($data['idUsuario']); // Convertir a entero
                    $codigo = $data['codigo'];
                    $idAsignacionD = intval($data['idAsignacionD']); // Convertir a entero
                    $limite = floatval($data['limite']); // Convertir a decimal
            
                    // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                    $date = new DateTime('now', new DateTimeZone('UTC'));
                    $date->modify('-6 hours');
                    $fechaCreacion = $date->format('Y-m-d H:i:s');
            
                    // Asignar usuario de creación (debe estar definido anteriormente)
                    $usuarioCreacion = $userId; // Asegúrate de que $userId esté definido
            
                    // Preparar la consulta
                    $query = 'INSERT INTO altaMonitoreo (idUsuario, codigo, idAsignacionD, limite, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?, ?, ?)';
            
                    if ($insert_query = $mysqli->prepare($query)) {
                        // Enlazar los parámetros: i = entero, s = cadena, d = decimal
                        $insert_query->bind_param('isidss', $idUsuario, $codigo, $idAsignacionD, $limite, $fechaCreacion, $usuarioCreacion);
            
                        if ($insert_query->execute()) {
                            echo json_encode(['success' => 'Asignación Dispositivo creado.']);
                        } else {
                            echo json_encode(['error' => 'No se pudo crear Asignación de Dispositivo.']);
                        }
            
                        $insert_query->close();
                    } else {
                        echo json_encode(['error' => 'No se pudo preparar la consulta.']);
                    }
                } else {
                    echo json_encode(['error' => 'No tienes permiso para crear datos.']);
                }
                break;
            

                case 'PUT':
                    if (in_array('Escribir', $permisos)) {
                        $data = json_decode(file_get_contents('php://input'), true);
                
                        // Validar datos
                        if (!isset($data['idUsuario'], $data['codigo'], $data['idAsignacionD'], $data['limite'], $data['idAltaMonitoreo'])) {
                            echo json_encode(['error' => 'Datos incompletos.']);
                            exit();
                        }
                
                        $idUsuario = intval($data['idUsuario']); // Convertir a entero
                        $codigo = $data['codigo'];
                        $idAsignacionD = intval($data['idAsignacionD']); // Convertir a entero
                        $limite = floatval($data['limite']); // Convertir a decimal
                        $idAltaMonitoreo = intval($data['idAltaMonitoreo']); // Convertir a entero
                
                        // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
                        $date = new DateTime('now', new DateTimeZone('UTC'));
                        $date->modify('-6 hours');
                        $fechaModificacion = $date->format('Y-m-d H:i:s');
                
                        // Asegúrate de que $userId esté definido y no sea nulo
                        if (!isset($userId) || $userId === null) {
                            echo json_encode(['error' => 'ID de usuario no definido.']);
                            exit();
                        }
                        $usuarioModificacion = $userId;
                
                        // Preparar la consulta
                        $query = 'UPDATE altaMonitoreo SET idUsuario = ?, codigo = ?, idAsignacionD = ?, limite = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idAltaMonitoreo = ?';
                
                        if ($update_query = $mysqli->prepare($query)) {
                            // Enlazar los parámetros: i = entero, s = cadena, d = decimal
                            $update_query->bind_param('isidssi', $idUsuario, $codigo, $idAsignacionD, $limite, $fechaModificacion, $usuarioModificacion, $idAltaMonitoreo);
                
                            if ($update_query->execute()) {
                                echo json_encode(['success' => 'Asignación actualizada.']);
                            } else {
                                echo json_encode(['error' => 'No se pudo actualizar la Asignación.']);
                                error_log('Error en la ejecución de la consulta: ' . $mysqli->error); // Para depuración
                            }
                
                            $update_query->close();
                        } else {
                            echo json_encode(['error' => 'No se pudo preparar la consulta.']);
                            error_log('Error al preparar la consulta: ' . $mysqli->error); // Para depuración
                        }
                    } else {
                        echo json_encode(['error' => 'No tienes permiso para actualizar datos.']);
                    }
                    break;
                
                    case 'DELETE':
                        if (in_array('Borrar', $permisos)) {
                            $id = isset($_GET['id']) ? intval($_GET['id']) : 0; // Convertir a entero
                    
                            // Validar id
                            if (empty($id) || !is_numeric($id)) {
                                echo json_encode(['error' => 'ID inválido.']);
                                exit();
                            }
                    
                            $query = 'DELETE FROM altaMonitoreo WHERE idAltaMonitoreo = ?';
                    
                            if ($delete_query = $mysqli->prepare($query)) {
                                $delete_query->bind_param('i', $id);
                    
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

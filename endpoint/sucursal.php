<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
header("Access-Control-Allow-Credentials: true"); 
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "OPTIONS") {
    exit(0);
}

include 'conectar.php';
include 'permisos.php'; // Incluir el archivo de permisos
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Obtener el token del header de autorización
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader); 
} else {
    echo json_encode(['error' => 'Token no proporcionado.']);
    exit();
}

$key = "aquamar2024";

try {
    // Decodificar el token JWT
    $decoded = JWT::decode($token, new Key($key, 'HS256'));
    $userId = $decoded->data->userId;

    error_log("User ID from token: $userId");

    // Obtener permisos del usuario para el módulo "Producto_Tipo"
    $permisos = obtenerPermisos($userId, 'Sucursal', $mysqli);

    error_log("Permisos obtenidos: " . implode(", ", $permisos));

    switch ($method) {
        case 'GET':
            if (in_array('Leer', $permisos)) {
                $query = "SELECT 
                    sucursal.idSucursal, 
                    sucursal.nombre, 
                    sucursal.direccion, 
                    sucursal.telefono, 
                    sucursal.idEmpresa,
                    sucursal.idStatus,
                    status.nombre as statusNombre,
                    empresa.idEmpresa,
                    empresa.nombre as empresaNombre                    
                    FROM sucursal
                    INNER JOIN empresa ON sucursal.idEmpresa = empresa.idEmpresa
                    INNER JOIN status ON sucursal.idStatus = status.idStatus
                ;";
        
                $result = $mysqli->query($query);
        
                $response = [];
                while ($row = $result->fetch_assoc()) {
                    $response[] = $row;
                }
        
                echo json_encode($response);
            } else {
                echo json_encode(['error' => 'No tienes permiso para leer datos.']);
            }
            break;
        

        case 'POST':
            if (in_array('Escribir', $permisos)) {
                $data = json_decode(file_get_contents('php://input'), true);
        
                if (!isset($data['nombre'],$data['direccion'],$data['telefono'],$data['idEmpresa'],$data['idStatus'])) {
                    echo json_encode(['error' => 'Datos incompletos.']);
                    exit();
                }
        
                $nombre = $data['nombre'];
                $direccion = $data['direccion'];
                $telefono = $data['telefono'];
                $idEmpresa = $data['idEmpresa'];
                $idStatus = $data['idStatus'];
                $date = new DateTime('now', new DateTimeZone('UTC'));
                $date->modify('-6 hours');
                $fechaCreacion = $date->format('Y-m-d H:i:s');
                
                $usuarioCreacion = $userId;
        
                $query = "INSERT INTO sucursal (nombre, direccion, telefono, idEmpresa, idStatus, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?,?,?,?)";
        
                if ($insert_query = $mysqli->prepare($query)) {
                    $insert_query->bind_param('sssssss', $nombre, $direccion, $telefono, $idEmpresa, $idStatus, $fechaCreacion, $usuarioCreacion);
                    if ($insert_query->execute()) {
                        echo json_encode(['success' => 'Sucursal creada.']);
                    } else {
                        echo json_encode(['error' => 'No se pudo crear la Sucursal.']);
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
            
                    error_log(print_r($data, true)); // Depuración: eliminar en producción si no es necesario
            
                    if (!isset($data['idSucursal'], $data['nombre'], $data['direccion'], $data['telefono'], $data['idEmpresa'], $data['idStatus'])) {
                        echo json_encode(['error' => 'Datos incompletos.']);
                        exit();
                    }
            
                    $idSucursal = $data['idSucursal'];
                    $nombre = $data['nombre'];
                    $direccion = $data['direccion'];
                    $telefono = $data['telefono'];
                    $idEmpresa = $data['idEmpresa'];
                    $idStatus = $data['idStatus'];
            
                    $date = new DateTime('now', new DateTimeZone('UTC'));
                    $date->modify('-6 hours');
                    $fechaModificacion = $date->format('Y-m-d H:i:s');
                    $usuarioModificacion = $userId; // Asegúrate de que $userId esté definido
            
                    $query = "UPDATE sucursal SET nombre = ?, direccion = ?, telefono = ?, idEmpresa = ?, idStatus = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idSucursal = ?";
            
                    if ($update_query = $mysqli->prepare($query)) {
                        $update_query->bind_param('sssssssi', $nombre, $direccion, $telefono, $idEmpresa, $idStatus, $fechaModificacion, $usuarioModificacion, $idSucursal);
                        if ($update_query->execute()) {
                            echo json_encode(['success' => 'Sucursal actualizada.']);
                        } else {
                            echo json_encode(['error' => 'No se pudo actualizar la Sucursal.']);
                        }
                        $update_query->close();
                    } else {
                        echo json_encode(['error' => 'No se pudo preparar la consulta.']);
                    }
                } else {
                    echo json_encode(['error' => 'No tienes permiso para actualizar datos.']);
                }
                break;
            

        case 'DELETE':
            if (in_array('Borrar', $permisos)) {
                $id = $_GET['id'];

                if (empty($id) || !is_numeric($id)) {
                    echo json_encode(['error' => 'ID inválido.']);
                    exit();
                }

                $query = "DELETE FROM sucursal WHERE idSucursal = ?";

                if ($delete_query = $mysqli->prepare($query)) {
                    $delete_query->bind_param('i', $id);

                    if ($delete_query->execute()) {
                        if ($delete_query->affected_rows > 0) {
                            echo json_encode(['success' => 'Sucursal eliminada.']);
                        } else {
                            echo json_encode(['error' => 'Sucursal no encontrada.']);
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
            echo json_encode(['error' => 'Método no soportado.']);
            break;
    }
} catch (Exception $e) {
    error_log('Error al decodificar el token: ' . $e->getMessage());
    echo json_encode(['error' => 'Token inválido o expirado.', 'message' => $e->getMessage()]);
}

$mysqli->close();
?>

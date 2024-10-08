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
    $permisos = obtenerPermisos($userId, 'Empresa', $mysqli);

    error_log("Permisos obtenidos: " . implode(", ", $permisos));

    switch ($method) {
        case 'GET':
            if (in_array('Leer', $permisos)) {
                $query = "SELECT idEmpresa, nombre, nit, telefono, direccion, idStatus from  empresa;";
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
        
                if (!isset($data['nombre'],$data['nit'],$data['telefono'],$data['direccion'],$data['idStatus'])) {
                    echo json_encode(['error' => 'Datos incompletos.']);
                    exit();
                }
        
                $nombre = $data['nombre'];
                $nit = $data['nit'];
                $telefono = $data['telefono'];
                $direccion = $data['direccion'];
                $idStatus = $data['idStatus'];
                $date = new DateTime('now', new DateTimeZone('UTC'));
                $date->modify('-6 hours');
                $fechaCreacion = $date->format('Y-m-d H:i:s');
                
                $usuarioCreacion = $userId;
        
                $query = "INSERT INTO empresa (nombre, nit, telefono, direccion, idStatus, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?, ?,?,?,?)";
        
                if ($insert_query = $mysqli->prepare($query)) {
                    $insert_query->bind_param('sssssss', $nombre, $nit, $telefono, $direccion, $idStatus, $fechaCreacion, $usuarioCreacion);
                    if ($insert_query->execute()) {
                        echo json_encode(['success' => 'Empresa creada.']);
                    } else {
                        echo json_encode(['error' => 'No se pudo crear la empresa.']);
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

                error_log(print_r($data, true));

                if (!isset($data['idEmpresa'], $data['nombre'], $data['nit'], $data['telefono'], $data['direccion'], $data['idStatus'])) {
                    echo json_encode(['error' => 'Datos incompletos.']);
                    exit();
                }

                $idEmpresa = $data['idEmpresa'];
                $nombre = $data['nombre'];
                $nit = $data['nit'];
                $telefono = $data['telefono'];
                $direccion = $data['direccion'];
                $idStatus = $data['idStatus'];

                $date = new DateTime('now', new DateTimeZone('UTC'));
                $date->modify('-6 hours');
                $fechaModificacion = $date->format('Y-m-d H:i:s');
                $usuarioModificacion = $userId;

                $query = "UPDATE empresa SET nombre = ?, nit = ?, telefono = ?, direccion = ?, idStatus = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idEmpresa = ?";

                if ($update_query = $mysqli->prepare($query)) {
                    $update_query->bind_param('sssssssi', $nombre, $nit, $telefono, $direccion, $idStatus, $fechaModificacion, $usuarioModificacion, $idEmpresa);
                    if ($update_query->execute()) {
                        echo json_encode(['success' => 'Empresa actualizada.']);
                    } else {
                        echo json_encode(['error' => 'No se pudo actualizar la Empresa.']);
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

                $query = "DELETE FROM empresa WHERE idEmpresa = ?";

                if ($delete_query = $mysqli->prepare($query)) {
                    $delete_query->bind_param('i', $id);

                    if ($delete_query->execute()) {
                        if ($delete_query->affected_rows > 0) {
                            echo json_encode(['success' => 'Empresa eliminada.']);
                        } else {
                            echo json_encode(['error' => 'Empresa no encontrada.']);
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

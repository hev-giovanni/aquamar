<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
header("Access-Control-Allow-Credentials: true"); 
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "OPTIONS") {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Obtener el token del header de autorización
$headers = apache_request_headers();
$token = '';
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader);
}

$key = "aquamar2024";

try {
    // Decodificar el token JWT si se proporciona
    if ($token) {
        $decoded = JWT::decode($token, new Key($key, 'HS256'));
        $userId = $decoded->data->userId;
        error_log("User ID from token: $userId");
    } else {
        $userId = null; // No se proporciona token, no se requiere autorización
    }

    switch ($method) {
        case 'GET':
            $query = "SELECT * FROM pais";
            $result = $mysqli->query($query);

            $response = [];
            while ($row = $result->fetch_assoc()) {
                $response[] = $row;
            }
            
            echo json_encode($response);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            // Validar datos
            if (!isset($data['pais'])) {
                echo json_encode(['error' => 'Datos incompletos.']);
                exit();
            }

            $pais = $data['pais'];

            // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
            $date = new DateTime('now', new DateTimeZone('UTC'));
            $date->modify('-6 hours');
            $fechaCreacion = $date->format('Y-m-d H:i:s');
            
            $usuarioCreacion = $userId;

            $query = "INSERT INTO pais (pais, fechaCreacion, usuarioCreacion) VALUES (?, ?, ?)";

            if ($insert_query = $mysqli->prepare($query)) {
                $insert_query->bind_param('sss', $pais, $fechaCreacion, $usuarioCreacion);
                if ($insert_query->execute()) {
                    echo json_encode(['success' => 'País creado.']);
                } else {
                    echo json_encode(['error' => 'No se pudo crear el país.']);
                }
                $insert_query->close();
            } else {
                echo json_encode(['error' => 'No se pudo preparar la consulta.']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);

            // Validar datos
            if (!isset($data['idPais'], $data['pais'])) {
                echo json_encode(['error' => 'Datos incompletos.']);
                exit();
            }

            $idPais = $data['idPais'];
            $pais = $data['pais'];

            // Obtener la fecha y hora actual en UTC y ajustar a UTC-6
            $date = new DateTime('now', new DateTimeZone('UTC'));
            $date->modify('-6 hours');
            $fechaModificacion = $date->format('Y-m-d H:i:s');

            $usuarioModificacion = $userId;

            $query = "UPDATE pais SET pais = ?, fechaModificacion = ?, usuarioModificacion = ? WHERE idPais = ?";

            if ($update_query = $mysqli->prepare($query)) {
                $update_query->bind_param('sssi', $pais, $fechaModificacion, $usuarioModificacion, $idPais);
                if ($update_query->execute()) {
                    echo json_encode(['success' => 'País actualizado.']);
                } else {
                    echo json_encode(['error' => 'No se pudo actualizar el país.']);
                }
                $update_query->close();
            } else {
                echo json_encode(['error' => 'No se pudo preparar la consulta.']);
            }
            break;
            
        case 'DELETE':
            $idPais = $_GET['id'];
            
            // Validar id
            if (empty($idPais) || !is_numeric($idPais)) {
                echo json_encode(['error' => 'ID inválido.']);
                exit();
            }
    
            $query = "DELETE FROM pais WHERE idPais = ?";
    
            if ($delete_query = $mysqli->prepare($query)) {
                $delete_query->bind_param('i', $idPais);
                
                if ($delete_query->execute()) {
                    if ($delete_query->affected_rows > 0) {
                        echo json_encode(['success' => 'País eliminado.']);
                    } else {
                        echo json_encode(['error' => 'País no encontrado.']);
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

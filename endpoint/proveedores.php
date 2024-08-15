<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
header("Access-Control-Allow-Credentials: true"); 
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == "OPTIONS") {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset('utf8');

$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader); 
} else {
    echo json_encode(array('error' => 'Token no proporcionado.'));
    exit();
}

$key = "aquamar2024";

try {
    $decoded = JWT::decode($token, new Key($key, 'HS256'));
    $userId = $decoded->data->userId;

    error_log("User ID from token: $userId");

    $query = "
    SELECT permiso.permiso
    FROM usuario
    INNER JOIN usuarioRol ON usuario.idUsuario = usuarioRol.idUsuario
    INNER JOIN rol ON usuarioRol.idRole = rol.idRol
    INNER JOIN rolModuloPermiso ON rol.idRol = rolModuloPermiso.idRol
    INNER JOIN permiso ON rolModuloPermiso.idPermiso = permiso.idPermiso
    WHERE usuario.idUsuario = ? AND rolModuloPermiso.idModulo = (SELECT idModulo FROM modulo WHERE nombre = 'Proveedores')
    ";

    if ($perm_query = $mysqli->prepare($query)) {
        $perm_query->bind_param('i', $userId);
        $perm_query->execute();
        $perm_result = $perm_query->get_result();

        $permisos = [];
        while ($row = $perm_result->fetch_assoc()) {
            $permisos[] = $row['permiso'];
        }

        error_log("Permisos obtenidos: " . implode(", ", $permisos));

        $perm_query->close();
        
        $response = [];

        switch ($method) {
            case 'GET':
                if (in_array('Leer', $permisos)) {
                    $query = "SELECT * FROM proveedor";
                    $result = $mysqli->query($query);

                    while ($row = $result->fetch_assoc()) {
                        $response[] = $row;
                    }
                    
                    echo json_encode($response);
                } else {
                    echo json_encode(array('error' => 'No tienes permiso para leer datos.'));
                }
                break;

            case 'DELETE':
                if (in_array('Borrar', $permisos)) {
                    $id = $_GET['id'];
                    $query = "DELETE FROM proveedor WHERE idProveedor = ?";
                    
                    if ($delete_query = $mysqli->prepare($query)) {
                        $delete_query->bind_param('i', $id);
                        if ($delete_query->execute()) {
                            echo json_encode(array('success' => 'Proveedor borrado.'));
                        } else {
                            echo json_encode(array('error' => 'No se pudo borrar el proveedor.'));
                        }
                        $delete_query->close();
                    } else {
                        echo json_encode(array('error' => 'No se pudo conectar a la BD'));
                    }
                } else {
                    echo json_encode(array('error' => 'No tienes permiso para borrar datos.'));
                }
                break;

            case 'PUT':
                if (in_array('Escribir', $permisos)) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $id = $data['idProveedor'];
                    $nombre = $data['nombre'];
                    $direccion = $data['direccion'];
                    
                    $query = "UPDATE proveedor SET nombre = ?, direccion = ? WHERE idProveedor = ?";
                    
                    if ($update_query = $mysqli->prepare($query)) {
                        $update_query->bind_param('ssi', $nombre, $direccion, $id);
                        if ($update_query->execute()) {
                            echo json_encode(array('success' => 'Proveedor actualizado.'));
                        } else {
                            echo json_encode(array('error' => 'No se pudo actualizar el proveedor.'));
                        }
                        $update_query->close();
                    } else {
                        echo json_encode(array('error' => 'No se pudo conectar a la BD'));
                    }
                } else {
                    echo json_encode(array('error' => 'No tienes permiso para actualizar datos.'));
                }
                break;

            default:
                echo json_encode(array('error' => 'Método no soportado.'));
                break;
        }
    } else {
        echo json_encode(array('error' => 'No se pudo conectar a la BD'));
    }
} catch (Exception $e) {
    echo json_encode(array('error' => 'Token inválido o expirado.', 'message' => $e->getMessage()));
}

$mysqli->close();
?>

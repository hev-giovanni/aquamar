<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Ajusta el origen según tu configuración
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization"); // Incluye 'Authorization'
header("Access-Control-Allow-Credentials: true"); // Permitir credenciales
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];

// Manejo de solicitudes OPTIONS (preflight requests)
if ($method == "OPTIONS") {
    exit(0);
}

include 'conectar.php';
require_once '../vendor/autoload.php'; // Ajusta la ruta según la estructura de tu proyecto

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Obtener el token del encabezado Authorization
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $token = str_replace('Bearer ', '', $authHeader); // Extraer el token del encabezado
} else {
    echo json_encode(array('error' => 'Token no proporcionado.'));
    exit();
}

// Configura tu clave secreta para JWT
$key = "aquamar2024";

try {
    // Decodificar el token JWT
    $decoded = JWT::decode($token, new Key($key, 'HS256'));

    // Acceder a los datos decodificados
    $userId = $decoded->data->userId;

    // Obtener permisos del usuario
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

        $perm_query->close();
        
        // Determinar acción según el método de la solicitud
        $response = [];

        switch ($method) {
            case 'GET':
                if (in_array('leer', $permisos)) {
                    // Obtener datos de proveedores
                    $query = "SELECT * FROM proveedores";
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
                if (in_array('borrar', $permisos)) {
                    // Borrar proveedor
                    $id = $_GET['id'];
                    $query = "DELETE FROM proveedores WHERE idProveedor = ?";
                    
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
                if (in_array('escribir', $permisos)) {
                    // Actualizar proveedor
                    $data = json_decode(file_get_contents('php://input'), true);
                    $id = $data['idProveedor'];
                    $nombre = $data['nombre'];
                    $direccion = $data['direccion'];
                    
                    $query = "UPDATE proveedores SET nombre = ?, direccion = ? WHERE idProveedor = ?";
                    
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
    echo json_encode(array('error' => 'Token inválido o expirado.'));
}

$mysqli->close();
?>

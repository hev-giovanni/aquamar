<?php
include 'conectar.php';

// Clave para todos los dispositivos
$claveSecreta = 'SensoresAquamar'; // Cambia esto por una clave fuerte y segura

// Encriptar la clave secreta usando PASSWORD_DEFAULT
$claveEncriptada = password_hash($claveSecreta, PASSWORD_DEFAULT);

// Insertar la clave secreta en la base de datos (esto solo debe hacerse una vez)
$mysqli = conectarDB();
if ($stmt = $mysqli->prepare("INSERT INTO claveDispositivo (clave) VALUES (?)")) {
    $stmt->bind_param('s', $claveEncriptada);
    $stmt->execute();
    $stmt->close();
    echo json_encode(array('success' => 'Clave secreta almacenada correctamente.'));
} else {
    echo json_encode(array('error' => 'No se pudo conectar a la base de datos.'));
}

$mysqli->close();
?>

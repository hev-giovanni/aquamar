<?php
require '../vendor/autoload.php'; // Autoload de Composer para PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method != "POST") {
    echo json_encode(['status' => false, 'message' => 'Método no permitido']);
    exit();
}

include 'conectar.php';
$mysqli = conectarDB();
$mysqli->set_charset('utf8');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['idUsuario']) || !isset($data['mensaje']) || !isset($data['limiteSuperado'])) {
    echo json_encode(['status' => false, 'message' => 'Datos incompletos']);
    exit();
}

$idUsuario = $data['idUsuario'];
$mensaje = $data['mensaje'];
$limiteSuperado = $data['limiteSuperado'];

// Verificar el ID del usuario para obtener el correo
$query = "SELECT email, primerNombre FROM usuario WHERE idUsuario = ?";

if ($stmt = $mysqli->prepare($query)) {
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();
        $email = $usuario['email'];
        $nombre = $usuario['primerNombre'];

        if ($limiteSuperado) {
            // Configurar PHPMailer para enviar correo
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'aquamarypets@gmail.com'; // Tu correo
                $mail->Password = 'wjzcicpilnoczrtm'; // Contraseña de la app
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;

                // Configuración del correo
                $mail->setFrom('aquamarypets@gmail.com', 'Alerta de Monitoreo');
                $mail->addAddress($email, $nombre);

                $mail->isHTML(true);
                $mail->Subject = 'Limite Superado en el Monitor de Sensores';
                $mail->Body = "Hola $nombre,<br><br>$mensaje.<br><br>Gracias.";

                $mail->send();
                echo json_encode(['status' => true, 'message' => 'Correo enviado correctamente']);
            } catch (Exception $e) {
                echo json_encode(['status' => false, 'message' => 'Error al enviar el correo: ' . $mail->ErrorInfo]);
            }
        } else {
            echo json_encode(['status' => true, 'message' => 'No se ha superado el límite']);
        }
    } else {
        echo json_encode(['status' => false, 'message' => 'Usuario no encontrado']);
    }
    $stmt->close();
}
$mysqli->close();
?>

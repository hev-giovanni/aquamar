<?php
require '../vendor/autoload.php'; // Incluye el autoload de Composer para PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Access-Control-Allow-Origin: *"); // Permitir solicitudes desde cualquier origen
header("Access-Control-Allow-Methods: POST"); // Permitir solo el método POST
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method"); // Encabezados permitidos
header("Content-Type: application/json; charset=utf-8");

$method = $_SERVER['REQUEST_METHOD'];
if ($method != "POST") {
    echo json_encode(array('status' => false, 'message' => 'Método no permitido'));
    exit();
}

include 'conectar.php';
$mysqli = conectarDB();
$mysqli->set_charset('utf8');

// Leer los datos de entrada
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['email'])) {
    echo json_encode(array('status' => false, 'message' => 'Correo electrónico requerido'));
    exit();
}

$email = $data['email'];

// Verificar si el correo electrónico existe en la base de datos
if ($consulta = $mysqli->prepare("SELECT idUsuario, primerNombre FROM usuario WHERE email = ?")) {
    $consulta->bind_param('s', $email);
    $consulta->execute();
    $resultado = $consulta->get_result();

    if ($resultado->num_rows == 1) {
        $usuario = $resultado->fetch_assoc();
        $idUsuario = $usuario['idUsuario'];
        $nombre = $usuario['primerNombre'];

        // Generar un token único
        $token = bin2hex(random_bytes(16));
        $expiracion = date("Y-m-d H:i:s", strtotime('+1 hour')); // El token expira en 1 hora

        // Almacenar el token en la base de datos
        if ($insercion = $mysqli->prepare("INSERT INTO recuperacion_clave (idUsuario, token, expiracion) VALUES (?, ?, ?)")) {
            $insercion->bind_param('iss', $idUsuario, $token, $expiracion);
            $insercion->execute();
        }

        // Enviar el correo electrónico con el enlace de recuperación
        $mail = new PHPMailer(true);
        try {
            // Configuración del servidor de correo
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com'; // Cambia esto por el host SMTP de tu proveedor
            $mail->SMTPAuth = true;
            $mail->Username = 'aquamarypets@gmail.com'; // Tu dirección de correo electrónico
            $mail->Password = 'wjzcicpilnoczrtm'; // Tu contraseña de correo electrónico
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Destinatario y remitente
            $mail->setFrom('aquamarypets@gmail.com', 'Administrador');
            $mail->addAddress($email, $nombre);

            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = 'Software Aquamar';
            $mail->Body    = "Hola $nombre,<br><br>Haz clic en el siguiente enlace para recuperar tu contraseña:<br>
                   <a href='http://localhost:3000/aquamar/aquamar/reset-password?token=$token'>Recuperar Contraseña</a><br><br>
                   Este enlace es válido hasta $expiracion.";


            $mail->send();
            echo json_encode(array('status' => true, 'message' => 'Correo de recuperación enviado'));
        } catch (Exception $e) {
            echo json_encode(array('status' => false, 'message' => "Error al enviar el correo: {$mail->ErrorInfo}"));
        }

    } else {
        echo json_encode(array('status' => false, 'message' => 'Correo electrónico no registrado'));
    }
    $consulta->close();
} else {
    echo json_encode(array('status' => false, 'message' => 'No se pudo preparar la consulta'));
}

$mysqli->close();
?>

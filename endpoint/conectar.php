<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Content-Type: text/html; charset=utf-8");
$method = $_SERVER['REQUEST_METHOD'];

function conectarDB(){

  $servidor = "190.113.90.230";
  $usuario = "hgiovanni";
  $password = "guatemala21";
  $bd = "aquamar";
  $puerto = "10230";
  $conexion = mysqli_connect($servidor, $usuario, $password, $bd, $puerto);

/*/
$servidor = "localhost";
  $usuario = "root";
  $password = "root";
  $bd = "aquamar";
  $conexion = mysqli_connect($servidor, $usuario, $password, $bd);
*/


  
  if($conexion){
      echo "";
  }else{
      echo 'Ha sucedido un error inesperado en la conexión de la base de datos';
  }

  return $conexion;
}
?>

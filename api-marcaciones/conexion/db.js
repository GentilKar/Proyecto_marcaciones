/*const { Sequelize } = require('sequelize');

// Crea una instancia de Sequelize con la configuración proporcionada
const sequelize = new Sequelize({
  dialect: 'mysql', // Tipo de base de datos que estás utilizando (MySQL en este caso)
  host: process.env.DB_HOST, // Host de la base de datos obtenido de variables de entorno
  port: process.env.DB_PORT, // Puerto de la base de datos obtenido de variables de entorno
  username: process.env.DB_USER, // Nombre de usuario de la base de datos obtenido de variables de entorno
  password: process.env.DB_PASSWORD, // Contraseña de la base de datos obtenida de variables de entorno
  database: process.env.DB_NAME, // Nombre de la base de datos obtenido de variables de entorno
});

// Intenta autenticar la conexión a la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos exitosa.'); // Mensaje de éxito si la autenticación es exitosa
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error); // Mensaje de error si la autenticación falla
  });

  // Exporta la instancia de Sequelize para que pueda ser utilizada en otros archivos
module.exports = sequelize;*/
//--------------------------------------------------------

const mariadb = require('mariadb')
const pool = mariadb.createPool({
  host: process.env.DB_HOST, // Host de la base de datos obtenido de variables de entorno
  port: process.env.DB_PORT, // Puerto de la base de datos obtenido de variables de entorno
  username: process.env.DB_USER, // Nombre de usuario de la base de datos obtenido de variables de entorno
  password: process.env.DB_PASSWORD, // Contraseña de la base de datos obtenida de variables de entorno
  database: process.env.DB_NAME, 
  connectionLimit: 10,
});

module.exports(
  pool
)

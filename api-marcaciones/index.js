require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const { buscarDesdeReloj } = require('./controladores/mainController');
const { ruta } = require('./rutas/rutas');

const app = express();
app.options('*', cors());
// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Rutas
app.use('/', ruta);
app.get('/buscarDesdeReloj/:legajo', buscarDesdeReloj);


// Crear una conexión a la base de datos
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Ruta para insertar una nueva marcación
app.post('/insertarMarcacion', async (req, res) => {
    try {

        console.log('Solicitud recibida para insertar una marcación');
        const { legajo, fecha, hora, desde, control, remunerado } = req.body;
        console.log('Datos recibidos desde el reloj:', req.body);

        // Validar los campos requeridos
        if (!legajo || !fecha || !hora || desde === undefined || control === undefined || remunerado === undefined) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Determinar la observación y el número de reloj según la IP
        const ip = req.ip; // Obtener la IP del cliente
        let observacion, relojnro;

        switch (ip) {
            case '192.168.0.201':
                observacion = 'Huella';
                relojnro = 1;
                break;
            case '192.168.100.16':
                observacion = 'Huella';
                relojnro = 2;
                break;
            case '192.168.3.100':
                observacion = 'Facial';
                relojnro = 3;
                break;
            case '192.168.11.20':
                observacion = 'Huella';
                relojnro = 4;
                break;
            default:
                // Si la IP no coincide con ninguna conocida, se establecen valores predeterminados
                observacion = 'Desconocido';
                relojnro = 0;
        }

        // Realizar la inserción en la base de datos
        const query = 'INSERT INTO marcaciones (legajo, fecha, hora, desde, control, relojnro, remunerado, observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await connection.promise().query(query, [legajo, fecha, hora, desde, control, relojnro, remunerado, observacion]);

        console.log('Marcación creada exitosamente');
        res.status(201).json({ mensaje: 'Marcación creada exitosamente' });
    } catch (error) {
        console.error('Error al insertar marcación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`El servidor está corriendo en el puerto ${PORT}`);
});

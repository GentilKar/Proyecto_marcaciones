const moment = require('moment');
const ZKLib = require('zklib-32ble');
const mariadb = require('mariadb');
//const db = require('../conexion/db');
//const mysql = require('mysql2');

// Función para asignar el número de reloj según la dirección IP
function asignarReloj(ip) {
    switch(ip) {
        case '192.168.0.201':
            return 1;
        case '192.168.100.16':
            return 2;
        case '192.168.3.100':
            return 3;
        case '192.168.11.20':
            return 4;
        default:
            return 0; // Otra dirección IP, número de reloj desconocido
    }
}

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

exports.inicio = async (req, res) => {

    let zkInstance1 = new ZKLib('192.168.0.201', 4370, 5200, 5000);
    let zkInstance2 = new ZKLib('192.168.100.16', 4370, 5200, 5000);
    let zkInstance3 = new ZKLib('192.168.3.100', 4370, 5200, 5000);
    let zkInstance4 = new ZKLib('192.168.11.20', 4370, 5200, 5000);

    try {
        // Crear conexión a las máquinas
        await Promise.all([
            zkInstance1.createSocket(),
            zkInstance2.createSocket(),
            zkInstance3.createSocket(),
            zkInstance4.createSocket()
        ]);

        let datos1 = await zkInstance1.getAttendances();
        let datos2 = await zkInstance2.getAttendances();
        let datos3 = await zkInstance3.getAttendances();
        let datos4 = await zkInstance4.getAttendances();

        // Combinar datos de todas las máquinas
        let datos = {
            data: [
                ...datos1.data.map(item => ({...item, relojnro: asignarReloj(item.ip)})),
                ...datos2.data.map(item => ({...item, relojnro: asignarReloj(item.ip)})),
                ...datos3.data.map(item => ({...item, relojnro: asignarReloj(item.ip)})),
                ...datos4.data.map(item => ({...item, relojnro: asignarReloj(item.ip)}))
            ]
        };
    } catch (e) {
        console.log(e);
        if (e.code === 'EADDRINUSE') {
            // Manejar error de dirección en uso
        }
    }
}

exports.marcaciones = async (req, res) => {
    const { legajo, fechaInicio, fechaFin } = req.query;
    let zkInstance1 = new ZKLib('192.168.0.201', 4370, 5200, 5000);
    let zkInstance2 = new ZKLib('192.168.100.16', 4370, 5200, 5000);
    let zkInstance3 = new ZKLib('192.168.3.100', 4370, 5200, 5000);
    let zkInstance4 = new ZKLib('192.168.11.20', 4370, 5200, 5000);

    try {
        // Crear conexión a las máquinas
        await Promise.all([
            zkInstance1.createSocket(),
            zkInstance2.createSocket(),
            zkInstance3.createSocket(),
            zkInstance4.createSocket()
        ]);

        let marcaciones1 = await zkInstance1.getAttendances();
        let marcaciones2 = await zkInstance2.getAttendances();
        let marcaciones3 = await zkInstance3.getAttendances();
        let marcaciones4 = await zkInstance4.getAttendances();

        // Combinar datos de todas las máquinas
        let marcaciones = [
            ...(marcaciones1.data || []).map(item => ({...item, relojnro: asignarReloj(item.ip), observacion: 'Huella'})),
            ...(marcaciones2.data || []).map(item => ({...item, relojnro: asignarReloj(item.ip), observacion: 'Huella'})),
            ...(marcaciones3.data || []).map(item => ({...item, relojnro: asignarReloj(item.ip), observacion: 'Facial'})),
            ...(marcaciones4.data || []).map(item => ({...item, relojnro: asignarReloj(item.ip), observacion: 'Huella'}))
        ];

        // Filtrar las marcaciones por legajo si está presente en la consulta
        if (legajo) {
            marcaciones = marcaciones.filter(item => item.deviceUserId === legajo);
        }

        // Filtrar las marcaciones por rango de fechas si ambos están presentes en la consulta
        if (fechaInicio && fechaFin) {
            marcaciones = marcaciones.filter(item => {
                const fechaItem = moment.utc(item.recordTime).format('YYYY-MM-DD');
                return fechaItem >= fechaInicio && fechaItem <= fechaFin
            });
        }

        // Eliminar las marcaciones duplicadas
        marcaciones = eliminarMarcacionesDuplicadas(marcaciones);

        // Transformar los datos
        marcaciones.forEach(item => {
            let fechaHora = moment.utc(item.recordTime);
            item.fecha = fechaHora.format('YYYY-MM-DD');
            item.hora = fechaHora.format('HH:mm');
            item.legajo = item.deviceUserId; // Renombrar deviceUserId a legajo
            item.remunerado = 0; // Agregar campo remunerado y establecer su valor en 0
            item.desde = 1; // Agregar campo 'desde' y establecer su valor en 1
            item.control = 0; // Establecer el campo 'control' como 0
            delete item.recordTime;
            delete item.deviceUserId;
        });

        res.send({ data: marcaciones });
    } catch (e) {
        console.error('Error al obtener las marcaciones:', e);
        res.status(500).send({ error: 'Error al obtener las marcaciones' });
    }
}

exports.obtenerMarcacionesPaginadas = async (req, res) => {
    try {
        const { page = 1, pageSize = 30 } = req.query;
        const offset = (page - 1) * pageSize;

        const marcaciones = await Marcacion.findAndCountAll({
            limit: pageSize,
            offset: offset
        });

        res.json({
            total: marcaciones.count,
            totalPages: Math.ceil(marcaciones.count / pageSize),
            data: marcaciones.rows
        });
    } catch (error) {
        console.error('Error al obtener las marcaciones:', error);
        res.status(500).send('Error al obtener las marcaciones');
    }
};

function eliminarMarcacionesDuplicadas(marcaciones) {
    const marcacionesFiltradas = [];
    const marcacionesMap = new Map();

    for (const marcacion of marcaciones) {
        // Parsear el tiempo de registro como una fecha
        const recordTimeDate = new Date(marcacion.recordTime);
        // Verificar si la fecha es válida antes de continuar
        if (!isNaN(recordTimeDate.getTime())) {
            // Formatear la fecha utilizando Moment.js
            const clave = `${marcacion.deviceUserId}-${moment.utc(recordTimeDate).format('YYYY-MM-DD HH:mm')}`;
            if (!marcacionesMap.has(clave)) {
                marcacionesMap.set(clave, true);
                marcacionesFiltradas.push(marcacion);
            }
        } else {
            console.error(`Registro de tiempo no válido: ${marcacion.recordTime}`);
        }
    }
    return marcacionesFiltradas;
}
exports.insertarMarcacion = async (req, res) => {
    try {
        const marcacion = req.body;

        // Verificar si la marcación ya existe en la base de datos
        const existe = await verificarExistenciaMarcacion(marcacion);

        if (!existe) {
            // Si la marcación no existe, realizar la inserción en la base de datos
            const query = `INSERT INTO marcaciones (legajo, fecha, hora, desde, control, observacion, remunerado, relojnro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            await pool.query(query, [
                marcacion.legajo,
                marcacion.fecha,
                marcacion.hora,
                marcacion.desde,
                marcacion.control,
                marcacion.observacion,
                marcacion.remunerado,
                marcacion.relojnro
            ]);

            console.log('Marcación insertada correctamente en la base de datos.');
        } else {
            console.log('La marcación ya existe en la base de datos. Omitiendo inserción.');
        }
    } catch (error) {
        console.error('Error al insertar marcación en la base de datos:', error);
    }
};

const verificarExistenciaMarcacion = async (marcacion) => {
    try {
        const query = `SELECT COUNT(*) AS count FROM marcaciones WHERE legajo = ? AND fecha = ? AND hora = ?`;
        const result = await pool.query(query, [
            marcacion.legajo,
            marcacion.fecha,
            marcacion.hora
        ]);

        return result[0].count > 0; // Devuelve true si la marcación ya existe, false si no
    } catch (error) {
        console.error('Error al verificar la existencia de la marcación:', error);
        return false; // Devuelve false en caso de error
    }
};

function obtenerObservacion(ip) {
    return ip === '192.168.3.100' ? 'Facial' : 'Huella';
}

exports.buscarPorLegajo = async (req, res) => {
    try {
        const legajo = req.params.legajo;

        const query = 'SELECT legajo, fecha, hora FROM marcaciones WHERE legajo = ?';
        const results = await pool.query(query, [legajo]);

        res.json({ data: results });
    } catch (error) {
        console.error('Error al consultar datos por legajo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.buscarDesdeReloj = async (req, res) => {
    const { legajo } = req.params;
    const direccionesIP = ['192.168.0.201', '192.168.100.16', '192.168.3.100', '192.168.11.20'];

    let marcacionesFiltradas = [];

    try {
        for (const ip of direccionesIP) {
            const zkInstance = new ZKLib(ip, 4370, 5200, 5000);

            const connectPromise = zkInstance.createSocket();

            // Esperar a que la conexión se establezca
            await connectPromise;

            // Obtener las marcaciones desde el reloj
            const marcacionesReloj = await zkInstance.getAttendances();
            
            // Verificar si las marcaciones obtenidas no son null o undefined antes de filtrarlas
            if (marcacionesReloj && marcacionesReloj.data) {
                const marcacionesLegajo = marcacionesReloj.data.filter(marcacion => marcacion.deviceUserId === legajo);
                marcacionesFiltradas.push(...marcacionesLegajo);
            }
        }
        marcacionesFiltradas.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

        const marcacionesTransformadas = marcacionesFiltradas.map(marcacion => ({
            legajo: marcacion.deviceUserId,
            fecha: moment.utc(marcacion.recordTime).format('YYYY-MM-DD'),
            hora: moment.utc(marcacion.recordTime).format('HH:mm')
        }));
        res.json({ data: marcacionesTransformadas });
    } catch (error) {
        console.error('Error al buscar marcaciones desde el reloj:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.descargarMarcaciones = async (req, res) => {
    const { legajo, fechaInicio, fechaFin } = req.query;

    let marcacionesFiltradas = [];

    try {
        // Crear instancias de los relojes marcadores
        const zkInstances = [
            new ZKLib('192.168.0.201', 4370, 5200, 5000),
            new ZKLib('192.168.100.16', 4370, 5200, 5000),
            new ZKLib('192.168.3.100', 4370, 5200, 5000),
            new ZKLib('192.168.11.20', 4370, 5200, 5000)
        ];

        // Conectar a los relojes marcadores
        await Promise.all(zkInstances.map(instance => instance.createSocket()));

        // Obtener las marcaciones de cada reloj marcador y filtrarlas
        for (const zkInstance of zkInstances) {
            const marcaciones = await zkInstance.getAttendances();

            if (marcaciones && marcaciones.data) {
                // Filtrar por legajo si está presente en la consulta
                let marcacionesLegajo = marcaciones.data;
                if (legajo) {
                    marcacionesLegajo = marcacionesLegajo.filter(marcacion => marcacion.deviceUserId === legajo);
                }

                // Filtrar por rango de fechas si ambos están presentes en la consulta
                if (fechaInicio && fechaFin) {
                    marcacionesLegajo = marcacionesLegajo.filter(marcacion => {
                        const fechaItem = moment.utc(marcacion.recordTime).format('YYYY-MM-DD');
                        return fechaItem >= fechaInicio && fechaItem <= fechaFin;
                    });
                }

                marcacionesFiltradas.push(...marcacionesLegajo);
            }
        }

        // Ordenar las marcaciones por fecha
        marcacionesFiltradas.sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

        // Crear un libro de Excel y una hoja de cálculo
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(marcacionesFiltradas);

        // Agregar la hoja de cálculo al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Marcaciones');

        // Escribir el libro en un archivo
        const excelFilePath = 'marcaciones.xlsx';
        XLSX.writeFile(workbook, excelFilePath);

        res.download(excelFilePath); // Descargar el archivo Excel
    } catch (error) {
        console.error('Error al descargar las marcaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.insertarMarcaciones = async (req, res) => {
    try {
        const marcacion = req.body;

        // Verificar si ya existe una marcación con el mismo legajo, fecha y hora
        const existeMarcacion = await existeMarcacionEnBD(marcacion.legajo, marcacion.fecha, marcacion.hora);

        if (existeMarcacion) {
            console.log('La marcación ya existe en la base de datos. Omitiendo inserción.');
            return res.status(400).send('La marcación ya existe en la base de datos.');
        }

        // Si no existe, procedemos con la inserción
        const query = `INSERT INTO marcaciones (legajo, fecha, hora, desde, control, observacion, remunerado, relojnro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [
            marcacion.legajo,
            marcacion.fecha,
            marcacion.hora,
            marcacion.desde,
            marcacion.control,
            marcacion.observacion,
            marcacion.remunerado,
            marcacion.relojnro
        ]);
        console.log('Marcación insertada correctamente en la base de datos.');
        res.status(201).send('Marcación insertada correctamente en la base de datos.');
    } catch (error) {
        console.error('Error al insertar marcación en la base de datos:', error);
        res.status(500).send('Error al insertar marcación en la base de datos.');
    }
};

// Función para verificar si ya existe una marcación con el mismo legajo, fecha y hora en la base de datos
const existeMarcacionEnBD = async (legajo, fecha, hora) => {
    try {
        const query = `SELECT COUNT(*) AS count FROM marcaciones WHERE legajo = ? AND fecha = ? AND hora = ?`;
        const [rows] = await pool.query(query, [legajo, fecha, hora]);
        return rows[0].count > 0;
    } catch (error) {
        console.error('Error al verificar la existencia de la marcación en la base de datos:', error);
        throw error;
    }
};

// exports.verificarExistenciaMarcacion = async (req, res) => {
//     try {
//         const existe = true; // Esto es un ejemplo, debes cambiarlo con tu lógica real

//         if (existe) {
//             res.json({ existe: true }); // Envía una respuesta indicando que la marcación existe
//         } else {
//             console.log('No se encontraron datos de marcación.'); // Mensaje en la consola del servidor
//             res.json({ existe: false }); // Envía una respuesta indicando que la marcación no existe
//         }
//     } catch (error) {
//         console.error('Error al verificar la existencia de la marcación:', error);
//         res.status(500).json({ error: 'Error al verificar la existencia de la marcación' });
//     }
// };


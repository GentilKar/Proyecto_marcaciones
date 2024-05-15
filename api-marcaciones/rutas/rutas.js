const express = require('express');
const ruta = express.Router();
const controladorPrincipal = require('../controladores/mainController');
const { descargarMarcaciones } = controladorPrincipal;

ruta.get('/', controladorPrincipal.inicio);
ruta.get('/marcaciones', controladorPrincipal.marcaciones);
ruta.post('/insertarMarcacion', controladorPrincipal.insertarMarcacion); // Cambio realizado aquí
ruta.get('/buscarDesdeReloj/:legajo', controladorPrincipal.buscarDesdeReloj);
ruta.get('/buscarPorLegajo/:legajo', controladorPrincipal.buscarPorLegajo);
ruta.get('/descargarMarcaciones', descargarMarcaciones);



module.exports = {
    ruta
};


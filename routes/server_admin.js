var express = require('express');
var router = express.Router();
var login = require('./login').router

const { tecnico_tech_secret } = require('../util/DB.js')

var conectados = new Map(); //Clientes/servidores conectados

router.get('/server_admin/listar', login.validarSesion, async function(req, res, next) {
    try {
        var clientes = [...conectados.keys()]
        res.json({clientes})
        
    } catch (e) {
        console.error(e)
        next(e) 
    }   
})

/**
 * @param cliente nombre del cliente escuchando para imprimir
 */
router.post('/server_admin/:cliente', login.validarSesion, async function(req, res, next) {
    try {
        var tipo = req.body.tipo

        console.log('tipo ', tipo)

        //Se obtiene el cliente websocket conectado
        var cliente = conectados.get(req.params.cliente)

        if (cliente === undefined) 
            return res.status(400).send(`No se encuentra conectado el cliente con nombre ${req.params.cliente}`);

        var respuesta = await new Promise(resolve => {
            cliente.emit('pavimento', { tipo }, socket_res => resolve(socket_res))
        })
        
        return res.json({respuesta})

    } catch (e) {
        console.error(e)
        next(e) 
    }   
})


/**
 * 
 * @param {Object} socket websocket conectandose
 * @param {function} next Funcion que al ejecutarse deja pasar o rechaza la conexion
 */
function socketAuth(socket, next) {
    var server = socket.handshake.query.server;
    var secret = socket.handshake.query.secret;

    console.log(server, secret)

    if (server && server.length > 1 && secret === tecnico_tech_secret) {
        if (conectados.has(server)) {
            console.error('[socketAuth]', new Date(), `[ya existe un cliente con nombre ${server}]`)
            next(new Error(`Cliente: ${server} DUPLICADO`))
        } else {
            console.log('[socketAuth]', new Date(), `[Nuevo server, nombre ${server}]`)
            next()
        }        
    } else {
        next(new Error("401 Unauthorized"))
    }
}

/**
 * 
 * @param {Object} socket websocket conectado y escuchando
 */
function connectionCB (socket) {

    var server = socket.handshake.query.server;

    if (conectados.has(server)) {
        console.error('[connectionCB] ya existe', server)
        socket.disconnect(true)
    } else {
        conectados.set(server, socket)
    }

    socket.on('disconnect', function() {
        conectados.delete(server)
    })
}


module.exports = {
    router,
    socketAuth,
    connectionCB
}
angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", function ($stateProvider, $compileProvider) {
        $stateProvider
            .state('paquete', { //packin_zip
                templateUrl: '/tecnico/views/paquete.html',
                controller: 'paquete'
            })
            .state('multi_jars', { //packin_zip
                templateUrl: '/tecnico/views/multi_jars.html',
                controller: 'multi_jars'
            })
            .state('packin_zip', { //packin_zip
                templateUrl: '/tecnico/views/packin_zip.html',
                controller: 'packin_zip'
            })
            .state('link_servidores', { //packin_zip
                templateUrl: '/tecnico/views/link_servidores.html',
                controller: 'link_servidores'
            })
            .state('consola', {
                templateUrl: '/tecnico/views/consola.html', //impresion_itsc
                controller: 'consola'
            })
            .state('impresion_itsc', {
                templateUrl: '/tecnico/views/print.html', //impresion_itsc server_admin
                controller: 'impresion_itsc'
            })   
            .state('server_admin', {
                templateUrl: '/tecnico/views/server_admin.html', //impresion_itsc server_admin
                controller: 'server_admin'
            })            
    }])
    .run(["$state", "$http", "$templateCache", function ($state, $http, $templateCache) {
        loadTemplates($state, "link_servidores", $http, $templateCache)

    }])
    .controller("packin_zip" ,["$state", "$scope", function($state, $scope){
        $scope.servidores = []

        $scope.resultado = {}
        $scope.resultado.error = []
        $scope.resultado.exito = []

        $scope.seleccionar = function (servidor) {
            if (servidor.check)
                servidor.check = false;
            else
                servidor.check = true;
        }

        $scope.seleccionar_todos = () => $scope.servidores.forEach(servidor => servidor.check = true);
        $scope.cancelar = () => $scope.servidores.forEach(servidor => servidor.check = false);

        $scope.procesar = async function () {
            $scope.resultado = {}
            $scope.resultado.error = []
            $scope.resultado.exito = []

            try {
                if ($scope.servidores.every(s => s.check === false))
                    return alert("Seleccione al menos un servidor");

                if ($scope.servidores.filter(s => s.check).length > 2) {
                    var respuesta = prompt("La siguiente acción modificará recursos en MAS de DOS servidores lo cual podria tener graves implicaciones en caso de fallos o cambios no requeridos, desea continuar (SI/NO)?") 
                    if (respuesta && "si" === respuesta.toLowerCase()) {

                    } else {
                        return console.log("Proceso abortado");
                    }
                }
            
                var servers = $scope.servidores.filter(s => s.check === true).map(s => s.id);

                var url = new URL(`${document.URL}packin/`);
                url.search = new URLSearchParams({ servers });
                var data = new FormData()
                data.append('file_zip_tecnico', document.getElementById('archivo_zip').files[0])

                waitingDialog.show("Cargando Paquetes");

                var result = await fetch(url, {
                    credentials: "same-origin",
                    method: 'POST',
                    body: data
                })

                if (result.status === 401)
                    return location.reload();

                if (result.status !== 200)
                    throw new Error(await result.text())

                var resultado = await result.json()

                resultado.subidos.forEach(server => {
                    var dom = new DOMParser().parseFromString(server.body, "application/xml");
                    server.IsError = dom.getElementsByTagName('RunProcessResponse')[0].getAttribute('IsError')
                    
                    if (server.IsError === "true") {
                        var ErrorMsg = dom.getElementsByTagName('Error')[0];
                        server.Error = ErrorMsg ? ErrorMsg.textContent : "" 
                    } else if (server.IsError === "false") {
                        var SummaryMsg = dom.getElementsByTagName('Summary')[0];
                        server.Summary = SummaryMsg ? SummaryMsg.textContent : ""
                    }
                })

                $scope.resultado.error = resultado.error
                $scope.resultado.exito = resultado.subidos                
                
            } catch (e) {
                console.error(e)
                alert(`Error: ${e}`)
            } finally {
                setTimeout(function() {
                    waitingDialog.hide();
                    $scope.$apply()
                    $('#resultados_zip_modal').modal('show')
                }, 500)
            }
        }

        servidores().then(data => {
            $scope.servidores = data;
            $scope.servidores.forEach(s => s.check = false)
            $scope.$apply();
        })

    }])
    .controller("paquete" ,["$state", "$scope", function($state, $scope){

        $scope.servidores = []

        $scope.resultado = {}
        $scope.resultado.error = []
        $scope.resultado.exito = []

        $scope.seleccionar = function (servidor) {
            if (servidor.check)
                servidor.check = false;
            else
                servidor.check = true;
        }

        $scope.seleccionar_todos = () => $scope.servidores.forEach(servidor => servidor.check = true);
        $scope.cancelar = () => $scope.servidores.forEach(servidor => servidor.check = false);

        $scope.procesar = async function () {
            $scope.resultado = {}
            $scope.resultado.error = []
            $scope.resultado.exito = []

            try {
                if ($scope.servidores.every(s => s.check === false))
                    return alert("Seleccione al menos un servidor");
            
                var servers = $scope.servidores.filter(s => s.check === true).map(s => s.id);

                var url = new URL(`${document.URL}servidor/paquete`)
                url.search = new URLSearchParams({
                    servers: servers
                })
                var data = new FormData()
                data.append('file_jar_tecnico', document.getElementById('archivo').files[0])

                waitingDialog.show("Cargando Paquetes");

                var result = await fetch(url, {
                    credentials: "same-origin",
                    method: 'POST',
                    body: data
                })

                if (result.status === 401)
                    return location.reload();

                if (result.status !== 200)
                    throw new Error(await result.text())

                var resultado = await result.json()

                console.log("resultado", resultado)
                
                $scope.resultado.error = resultado.error
                $scope.resultado.exito = resultado.subidos                
                
            } catch (e) {
                console.error(e)
                alert(`Èrror ${e}`)
            } finally {
                setTimeout(function(){
                    waitingDialog.hide();
                    $scope.$apply()
                    $('#resultados_modal').modal('show')
                }, 500)
            }
        }

        servidores().then(data => {
            $scope.servidores = data;
            $scope.servidores.forEach(s => s.check = false)
            $scope.$apply();
        })

    }])
    .controller("multi_jars" ,["$state", "$scope", function($state, $scope){

        $scope.servidores = []

        $scope.resultado = {}
        $scope.resultado.error = []
        $scope.resultado.exito = []

        $scope.seleccionar = function (servidor) {
            if (servidor.check)
                servidor.check = false;
            else
                servidor.check = true;
        }

        $scope.cancelar = () => $scope.servidores.forEach(servidor => servidor.check = false);

        $scope.procesar = async function () {
            $scope.resultado = {}
            $scope.resultado.error = []
            $scope.resultado.exito = []

            if ($scope.servidores.filter(s => s.check === true).length !== 1)
                return alert('Debe haber solo 1 servidor seleccionado');

            try {
            
                var servers = $scope.servidores.filter(s => s.check === true).map(s => s.id);
                var files =  document.getElementById('archivo').files

                waitingDialog.show(`Cargando ${files.length} paquetes`);
                
                for (var file of files) {
                    var url = new URL(`${document.URL}servidor/paquete`)
                    url.search = new URLSearchParams({
                        servers: servers
                    })
                    var data = new FormData()
                    data.append('file_jar_tecnico', file)

                    waitingDialog.message(`Subiendo ${file.name}`);

                    var result = await fetch(url, {
                        credentials: "same-origin",
                        method: 'POST',
                        body: data
                    })

                    if (result.status === 401)
                        return location.reload();

                    if (result.status !== 200)
                        throw new Error(await result.text())

                    var resultado = await result.json()
                    var exito = resultado.subidos[0]
                    var error = resultado.error[0]

                    if (exito !== undefined) {
                        $scope.resultado.exito.push( file.name )
                    } else {
                        $scope.resultado.error.push({
                            archivo: file.name,
                            data: error.data
                        })
                    }                    
                }                    
                
            } catch (e) {
                console.error(e)
                alert(`Èrror ${e}`)
            } finally {
                setTimeout(function(){
                    waitingDialog.hide();
                    $scope.$apply()
                    $('#resultados_modal').modal('show')
                }, 500)
            }
        }

        servidores().then(data => {
            $scope.servidores = data;
            $scope.servidores.forEach(s => s.check = false)
            $scope.$apply();
        })

    }])
    .controller("link_servidores" ,["$state", "$scope", function($state, $scope){

        $scope.servidores = []

        servidores().then(data => {
            $scope.servidores = data;
            $scope.servidores.forEach(s => s.url += "/webui/")
            $scope.$apply();
        })

    }])
    .controller("server_admin" ,["$state", "$scope", function($state, $scope){

        $scope.servidores = []
        $scope.acciones = ["restart_idempiere", "restart_postgresql", "espacio_disco"]

        servidores_admin().then(data => {
            $scope.servidores = data;
            $scope.servidores.forEach(s => s.check = false)
            $scope.$apply();
        })

        $scope.procesar = async function (accion) {
            console.log(accion)

            if ($scope.servidores.filter(s => s.check === true).length !== 1)
                return alert('Debe haber solo 1 servidor seleccionado');

            try {        
                var server = $scope.servidores.filter(s => s.check === true).map(s => s.id);
                server = server[0];

                waitingDialog.show(`Ejecutando acción`);
                
                var url = new URL(`${document.URL}server_admin/${server}`)
                var data = {tipo: accion}

                var result = await fetch(url, {
                    credentials: "same-origin",
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify(data)
                })

                if (result.status === 401)
                    return location.reload();

                if (result.status !== 200)
                    throw new Error(await result.text())

                var resultado = await result.text()

                $scope.resultado = resultado                  
                
            } catch (e) {
                console.error(e)
                alert(`Èrror ${e}`)
            } finally {
                setTimeout(function(){
                    waitingDialog.hide();
                    $scope.$apply()
                    $('#resultados_modal').modal('show')
                }, 500)
            }
        }

        $scope.seleccionar = function (servidor) {
            if (servidor.check)
                servidor.check = false;
            else
                servidor.check = true;
        }

        $scope.seleccionar_todos = () => $scope.servidores.forEach(servidor => servidor.check = true);
        $scope.cancelar = () => $scope.servidores.forEach(servidor => servidor.check = false);

    }])
    .controller('consola', ["$scope", function($scope) {

        $scope.recargar = function () {
            document.getElementById('terminal_iframe').src = "/terminal/"
        }

    }])
    .controller('impresion_itsc', ["$scope", function($scope) {

    }])

    
async function loadTemplates($state, goState, $http, $templateCache) {
    try {
        var promises = []
        var states = $state.get()

        for (i = 1; i < states.length; i++) {
            var p = $http.get(states[i].templateUrl, { cache: $templateCache })
            promises.push(p)
            p.then(() => {}, error => console.log("Error template: ", error))
        }

        await Promise.all(promises)
                
    } catch (e) {
        console.log("Error templates catch: " + e)
    } finally {
        $state.go(goState) ///////////////////////// State inicial
        document.body.style.pointerEvents = "all"
    }    
}

/**
 * Funcion que retorna una lista de servidores disponibles
 * @returns {Promise<Array<{id:number, name:string, url:string}>>} servidores iDempiere
 */
async function servidores() {
    try {
        var data = await fetch('/servidor', {credentials: "same-origin"})
        var text = await data.text()

        if (data.ok) {
            return JSON.parse(text)
        } else if (data.status === 401){
            return location.replace('/logout/')
        } else {
            throw new Error(`Status: ${data.status}, ${data.statusText}`);
        }    

    } catch (e) {
        alert("error carga: " + e.message)
        console.error(e)
        return []
    }    
}

/**
 * Funcion que retorna una lista de servidores disponibles para administrar
 * @returns {Promise<Array<{id:number, name:string}>>} servidores iDempiere
 */
async function servidores_admin () {
    try {
        var data = await fetch('/servidor?tipo=SSH', {credentials: "same-origin"})
        var text = await data.text()

        if (data.ok) {
            return JSON.parse(text)
        } else if (data.status === 401){
            return location.replace('/logout/')
        } else {
            throw new Error(`Status: ${data.status}, ${data.statusText}`);
        }    

    } catch (e) {
        alert("error carga: " + e.message)
        console.error(e)
        return []
    }    
}
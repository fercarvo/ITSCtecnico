angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", function ($stateProvider, $compileProvider) {
        $stateProvider
            .state('paquete', { //packin_zip
                templateUrl: '/views/paquete.html',
                controller: 'paquete'
            })
            .state('packin_zip', { //packin_zip
                templateUrl: '/views/packin_zip.html',
                controller: 'packin_zip'
            })
            .state('link_servidores', { //packin_zip
                templateUrl: '/views/link_servidores.html',
                controller: 'link_servidores'
            })
            .state('consola', {
                templateUrl: '/views/consola.html',
                controller: 'consola'
            })
            .state('reinicio_server', {
                templateUrl: '/views/reinicio_server.html',
                controller: 'reinicio_server'
            })   
            .state('backup_db', {
                templateUrl: '/views/backup_db.html',
                controller: 'backup_db'
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

                var resultado = await result.json()

                if (result.status === 401)
                    return location.reload();

                console.log(resultado)

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
                console.log(e)
                $scope.resultado.error.push(e.message)
            } finally {
                waitingDialog.hide();
                $scope.$apply()
                $('#resultados_zip_modal').modal('show')
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
        $scope.resultado.error = null
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
            $scope.resultado.error = null
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

                var resultado = await result.json()

                console.log("resultado", resultado)
                
                $scope.resultado.error = resultado.error
                $scope.resultado.exito = resultado.subidos                
                
            } catch (e) {
                console.log(e)
                $scope.resultado.error.push(e.message)
            } finally {
                waitingDialog.hide();
                $scope.$apply()
                $('#resultados_modal').modal('show')
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
    .controller('consola', ["$scope", function($scope) {

        $scope.recargar = function () {
            document.getElementById('terminal_iframe').src = "/terminal/"
        }

    }])
    .controller('reinicio_server', [function(){
        console.log("reinicio servidor...")

    }])
    .controller('backup_db', [function(){
        console.log("reinicio servidor...")

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

async function servidores() {
    try {
        var data = await fetch('/servidor', {credentials: "same-origin"})
        var text = await data.text()

        if (data.ok) {
            return JSON.parse(text)
        } else if (data.status === 401){
            return location.reload()
        } else {
            throw new Error(`Status: ${data.status}, ${data.statusText}`);
        }    

    } catch (e) {
        alert("error carga: " + e.message)
        console.log(e)
        return []
    }    
}
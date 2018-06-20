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
        loadTemplates($state, "packin_zip", $http, $templateCache)


    }])
    .controller("packin_zip" ,["$state", "$scope", function($state, $scope){
        $scope.servidores = []

        $scope.resultado = {}
        $scope.resultado.error = null
        $scope.resultado.exito = []

        $scope.seleccionar = function (servidor) {
            servidor.check = true;
        }

        $scope.cancelar = function () {
            $scope.servidores.forEach(servidor => servidor.check = false);
        }

        $scope.procesar = async function () {
            try {
                if ($scope.servidores.every(s => s.check === false))
                    throw new Error("Seleccione al menos un servidor");
            
                var servers = $scope.servidores.filter(s => s.check === true).map(s => s.id);

                var url = new URL(`${document.URL}packin/`)
                url.search = new URLSearchParams({
                    servers: servers
                })
                var data = new FormData()
                data.append('file_zip_tecnico', document.getElementById('archivo_zip').files[0])

                waitingDialog.show("Cargando Paquetes");

                var result = await fetch(url, {
                    credentials: "same-origin",
                    method: 'POST',
                    body: data
                })

                var resultado = await result.json()
                resultado.subidos.forEach(server => {
                    var dom = new DOMParser().parseFromString(server.body, "application/xml");
                    server.IsError = dom.activeElement.firstChild.firstChild.firstChild.attributes.IsError.textContent
                    server.Error = dom.activeElement.firstChild.firstChild.firstChild.childNodes[0].textContent
                    server.Summary = dom.activeElement.firstChild.firstChild.firstChild.childNodes[1].textContent
                })

                console.log("resultado", resultado)
                $scope.resultado.error = resultado.error
                $scope.resultado.exito = resultado.subidos                
                
            } catch (e) {
                console.log(e)
                $scope.resultado.error = e.message
            } finally {
                waitingDialog.hide();
                $scope.$apply()
                $('#resultados_zip_modal').modal('show')
            }
        }

        servidores();

        async function servidores() {
            try {
                var data = await fetch('/servidor', {credentials: "same-origin"})
                var text = await data.text()

                if (data.ok) {
                    $scope.servidores = JSON.parse(text);
                    $scope.servidores.forEach(s => s.check = false)
                    $scope.$apply();
                }
                else
                    throw new Error(`Status: ${data.status}, ${data.statusText}`);

            } catch (e) {
                alert("error carga")
                console.log(e)
            }
            
        }
    }])
    .controller("paquete" ,["$state", "$scope", function($state, $scope){

        $scope.servidores = []

        $scope.resultado = {}
        $scope.resultado.error = null
        $scope.resultado.exito = []

        $scope.seleccionar = function (servidor) {
            servidor.check = true;
        }

        $scope.cancelar = function () {
            $scope.servidores.forEach(servidor => servidor.check = false);
        }

        $scope.procesar = async function () {
            try {
                if ($scope.servidores.every(s => s.check === false))
                    throw new Error("Seleccione al menos un servidor");
            
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

                var resultado = await result.json()

                console.log("resultado", resultado)
                
                $scope.resultado.error = resultado.error
                $scope.resultado.exito = resultado.subidos

                
                
            } catch (e) {
                console.log(e)
                $scope.resultado.error = e.message
            } finally {
                waitingDialog.hide();
                $scope.$apply()
                $('#resultados_modal').modal('show')
            }
        }

        servidores();

        async function servidores() {
            try {
                var data = await fetch('/servidor', {credentials: "same-origin"})
                var text = await data.text()

                if (data.ok) {
                    $scope.servidores = JSON.parse(text);
                    $scope.servidores.forEach(s => s.check = false)
                    $scope.$apply();
                }
                else
                    throw new Error(`Status: ${data.status}, ${data.statusText}`);

            } catch (e) {
                alert("error carga")
                console.log(e)
            }
            
        }

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
            p.then(function () { }, function (error) { console.log("Error template: ", error) })
        }

        await Promise.all(promises)
                
    } catch (e) {
        console.log("Error templates catch: " + e)
    } finally {
        $state.go(goState) ///////////////////////// State inicial
        document.body.style.pointerEvents = "all"
    }    
}
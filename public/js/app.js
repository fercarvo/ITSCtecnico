angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", function ($stateProvider, $compileProvider) {
        $stateProvider
            .state('paquete', {
                templateUrl: '/views/paquete.html',
                controller: 'paquete'
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
        loadTemplates($state, "paquete", $http, $templateCache)


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
            document.getElementById('terminal_iframe').src = document.getElementById('terminal_iframe').src
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
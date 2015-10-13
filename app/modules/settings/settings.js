angular.module('bookkeeping.settings', ['ui.router','ngResource'])

    .config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('settings',{
                url: '/settings',
                templateUrl: 'modules/settings/settings.html',
                controller: 'SettingsCtrl'
            })
            .state('settingBaseCurrency', {
                url: '/settings/baseCurrency/:settingId',
                templateUrl: 'modules/settings/baseCurrency.html',
                controller: 'SettingCtrl'

            })
        ;


    }])

    .service('Setting', ['$resource', function($resource){
        return $resource('/api/v1/settings/:settingId',{settingId: '@_id'});
    }])

    .controller('SettingsCtrl', ['$scope', 'Setting', '$state', function ($scope, Setting, $state) {
        $scope.settings = Setting.query();
        $scope.showDetail = function(setting){
            $state.go('setting' + setting.type, {settingId: setting._id});
        };

    }])

    .controller('SettingCtrl', ['$scope', '$stateParams', 'Setting', '$state', function($scope, $stateParams, Setting, $state){
        $scope.setting = Setting.get($stateParams);


        $scope.save = function() {
            $scope.setting.$save();
            $state.go('settings');
        };

        $scope.remove = function(){
            $scope.setting.$remove();
            $state.go('settings');
        };
    }]);

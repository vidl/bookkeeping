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

    .factory('settings', ['Setting', function(Setting){
        var settings = {};
        Setting.query(function(settingList){
            angular.forEach(settingList, function(setting){
                settings[setting.type] = setting.value;
            });
        });
        return settings;
    }])

    .controller('SettingsCtrl', ['$scope', 'Setting', '$state', function ($scope, Setting, $state) {
        $scope.settings = Setting.query();
        $scope.showDetail = function(setting){
            $state.go('setting' + setting.type, {settingId: setting._id});
        };

    }])

    .controller('SettingCtrl', ['$scope', '$stateParams', 'Setting', '$state', 'settings', function($scope, $stateParams, Setting, $state, settings){
        $scope.setting = Setting.get($stateParams);

        var success = function(){
        };

        $scope.save = function() {
            $scope.setting.$save(function(){
                settings[$scope.setting.type] = $scope.setting.value;
                $state.go('settings');
            });
        };

    }]);

angular.module('bookkeeping.entries', ['ui.router', 'ngResource', 'bookkeeping.date', 'bookkeeping.currency', 'bookkeeping.accounts', 'bookkeeping.settings'])

    .config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('entries', {
                url: '/entries',
                templateUrl: 'modules/entries/entries.html',
                controller: 'EntriesCtrl'
            })
            .state('entryDetail', {
                url: '/entries/:entryId',
                templateUrl: 'modules/entries/form.html',
                controller: 'EntryCtrl'
            });
    }])

    .service('Entry', ['$resource', function ($resource) {
        return $resource('/api/v1/entries/:entryId', {entryId: '@_id'});
    }])

    .controller('EntriesCtrl', ['$scope', 'Entry', '$state', function ($scope, Entry, $state) {
        $scope.entries =  Entry.query();

        $scope.showDetail = function (entry) {
            $state.go('entryDetail', {entryId: entry._id});
        };

    }])

    .controller('EntryCtrl', ['$scope', '$stateParams', 'Entry', '$state', 'errorTooltipHandler', 'Account', 'settings',
        function ($scope, $stateParams, Entry, $state, errorTooltipHandler, Account, settings) {
        $scope.accounts = Account.query();
        $scope.settings = settings;
        if ($stateParams.entryId) {
            $scope.entry = Entry.get($stateParams);
        } else {
            $scope.entry = new Entry();
            $scope.entry.date = moment().toDate();
        }
        var success = function() {
            $state.go('entries');
        };
        $scope.remove = function (event) {
            $scope.entry.$remove(success, errorTooltipHandler(event.target));
        };
        $scope.save = function() {
            angular.forEach($scope.entry.parts, function(part){
                part.account = part.account._id;
            });
            $scope.entry.$save(success, errorTooltipHandler(event.target));
        };
    }]);


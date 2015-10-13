angular.module('bookkeeping.entries', ['ui.router', 'ngResource', 'bookkeeping.date', 'bookkeeping.currency.filter'])

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
        /*$scope.entryParts = [];
        Entry.query(function(entries){
            angular.forEach(entries, function(entry) {
                angular.forEach(entry.parts, function(part){
                    $scope.entries.push(angular.extend(part, entry));
                })
            });
        });*/
        $scope.entries =  Entry.query({populate: 'parts.account'});

        $scope.showDetail = function (entry) {
            $state.go('entryDetail', {entryId: entry._id});
        };

    }])

    .controller('EntryCtrl', ['$scope', '$stateParams', 'Entry', '$state', 'errorTooltipHandler', function ($scope, $stateParams, Entry, $state, errorTooltipHandler) {
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
            $scope.entry.$save(success, errorTooltipHandler(event.target));
        };
    }]);


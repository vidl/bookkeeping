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
        $scope.entries =  Entry.query({populate: 'parts.account', sort: '-date'});

        $scope.showDetail = function (entry) {
            $state.go('entryDetail', {entryId: entry._id});
        };

    }])

    .controller('EntryCtrl', ['$scope', '$stateParams', 'Entry', '$state', 'errorTooltipHandler', 'Account', 'settings',
        function ($scope, $stateParams, Entry, $state, errorTooltipHandler, Account, settings) {
            $scope.accountCurrencies= {};
        $scope.accounts = Account.query(function(accounts){
            angular.forEach(accounts, function(account){
                $scope.accountCurrencies[account._id] = account.currency;
            });
        });
        $scope.settings = settings;
        if ($stateParams.entryId) {
            $scope.entry = Entry.get($stateParams);
        } else {
            $scope.entry = new Entry();
            $scope.entry.date = moment().toDate();
            $scope.entry.parts = [{}];
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
        $scope.syncBaseAmountIfDesired = function(part) {
            if ($scope.accountCurrencies[part.account] === settings.baseCurrency) {
                part.amount.baseCurrency = part.amount.accountCurrency;
            }
            if ($scope.entry.parts.length < 2) {
                $scope.addPart();
            }
        };
        $scope.addPart = function() {
            var sum = 0;
            var lastText = '';
            angular.forEach($scope.entry.parts, function(part){
                sum += part.amount.baseCurrency;
                lastText = part.text;
            });
            $scope.entry.parts.push({
                text: lastText,
                amount: {
                    accountCurrency: -sum,
                    baseCurrency: -sum
                }
            });
        };
    }]);


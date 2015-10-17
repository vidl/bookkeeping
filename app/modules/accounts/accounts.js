angular.module('bookkeeping.accounts', ['ui.router', 'ngResource', 'bookkeeping.date', 'bookkeeping.error', 'bookkeeping.stringarray.directive'])

    .config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('accounts', {
                url: '/accounts',
                templateUrl: 'modules/accounts/accounts.html',
                controller: 'AccountsCtrl'
            })
            .state('accountDetail', {
                url: '/accounts/:accountId',
                templateUrl: 'modules/accounts/form.html',
                controller: 'AccountCtrl'
            });
    }])
    .value('accountTypes', ['asset', 'liability', 'expense', 'revenue'])
    .filter('translateTypes', function () {
        var typeTranslations = {
            asset: 'Aktiv',
            liability: 'Passiv',
            expense: 'Aufwand',
            revenue: 'Ertrag'
        };
        return function (type) {
            return typeTranslations[type] || 'unbekannt';
        };
    })

    .service('Account', ['$resource', function ($resource) {
        return $resource('/api/v1/accounts/:accountId', {accountId: '@_id'});
    }])

    .controller('AccountsCtrl', ['$scope', 'Account', '$state', function ($scope, Account, $state) {
        $scope.accounts = Account.query();
        $scope.showDetail = function (account) {
            $state.go('accountDetail', {accountId: account._id});
        };

    }])

    .controller('AccountCtrl', ['$scope', '$stateParams', 'Account', '$state', 'accountTypes', 'errorTooltipHandler', function ($scope, $stateParams, Account, $state, accountTypes, errorTooltipHandler) {
        if ($stateParams.accountId) {
            $scope.account = Account.get($stateParams);
        } else {
            $scope.account = new Account();
            $scope.account.freezed = moment().toDate();
        }
        $scope.accountTypes = accountTypes;
        var success = function() {
            $state.go('accounts');
        };
        $scope.remove = function (event) {
            $scope.account.$remove(success, errorTooltipHandler(event.target));
        };
        $scope.save = function() {
            $scope.account.$save(success, errorTooltipHandler(event.target));
        };
    }]);


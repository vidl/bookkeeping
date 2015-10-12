(function() {
    'use strict';
    angular.module('bookkeeping', [
        'ngLocale',
        'ngAnimate',
        'mgcrea.ngStrap',
        'ui.router',
        'bookkeeping.settings',
        'bookkeeping.accounts'
    ])
    .config(['$urlRouterProvider', function($urlRouterProvider) {
        $urlRouterProvider.otherwise('/settings');
    }]);

})();
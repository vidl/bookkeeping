(function() {
    'use strict';
    angular.module('bookkeeping', [
        'ngLocale',
        'ngAnimate',
        'mgcrea.ngStrap',
        'ui.router',
        'bookkeeping.settings',
        'bookkeeping.accounts',
        'bookkeeping.entries'
    ])
    .config(['$urlRouterProvider', function($urlRouterProvider) {
        $urlRouterProvider.otherwise('/settings');
    }]);

})();
(function() {
    'use strict';
    angular.module('bookkeeping', [
        'ngAnimate',
        'mgcrea.ngStrap',
        'ui.router',
        'bookkeeping.settings'
    ])
    .config(['$urlRouterProvider', function($urlRouterProvider) {
        $urlRouterProvider.otherwise('/settings');
    }]);

})();
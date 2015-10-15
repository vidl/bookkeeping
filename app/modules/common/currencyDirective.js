angular.module('bookkeeping.currency.directive',['bookkeeping.currency.filter']).directive('currency', ['$filter', function($filter){
    // inspired by http://docs.angularjs.org/guide/forms
    var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elmement, attrs, ctrl) {
            var currency = $filter('bookkeepingCurrency');
            ctrl.$render = function() {
                elmement.val(currency(ctrl.$modelValue));
            };

            ctrl.$parsers.unshift(function(viewValue) {
                if (viewValue === '.') {
                    viewValue = '0.';
                    elmement.val(viewValue);
                }
                if (FLOAT_REGEXP.test(viewValue)) {
                    ctrl.$setValidity('float', true);
                    return currency(viewValue.replace(',', '.'));
                } else {
                    ctrl.$setValidity('float', false);
                    return undefined;
                }
            });
        }
    };
}]);

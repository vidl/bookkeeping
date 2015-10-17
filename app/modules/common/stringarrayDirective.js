angular.module('bookkeeping.stringarray.directive',[])
    .directive('stringarray', [function(){
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
            ctrl.$render = function() {
                element.val((ctrl.$modelValue || []).join('\n'));
            };

            ctrl.$parsers.unshift(function(viewValue) {
                if (viewValue.split)
                    return viewValue.split(/\n/);
                else
                    return [];
            });
        }
    };
}]);

angular.module('bookkeeping.error', ['mgcrea.ngStrap', 'bookkeeping.date'])
    .factory('errorTooltipHandler', ['$tooltip', '$filter', function($tooltip, $filter){
        var refTypes = {
            'entry': 'Buchung'
        };
        var bookkeepingDate = $filter('bookkeepingDate');

        var transformError = function(errorData) {
            var errorMessage = 'unbekannter Fehler';
            switch(errorData.type) {
                case 'references':
                    errorMessage = 'Es exisitieren noch ' + errorData.count +
                        ' referenzierende Datensätze vom Typ ' + refTypes[errorData.refType];
                    break;
                case 'notBalanced':
                    errorMessage = 'Buchung ist nicht ausgeglichen: ' + errorData.balance;
                    break;
                case 'beforeAccountFreezeDate':
                    errorMessage = 'Buchungsdatum ist vor dem Abschluss-Datum '
                        + bookkeepingDate(errorData.freezed)
                        + ' von Konto ' + errorData.account.name;
                    break;
            }
            return errorMessage;
        };

        return function(element) {

            return function(err) {
                $tooltip(angular.element(element), {
                    title: transformError(err.data),
                    show: true
                });
            };
        };
    }]);

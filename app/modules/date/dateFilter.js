angular.module('bookkeeping.date.filter',[])
    .filter('bookkeepingDate', function(){
        return function(date, format){
            return moment(date).format(format || 'L');
        };
    })
    .filter('bookkeepingTime', function(){
        return function(date, format){
            return moment(date).format(format || 'LT');
        };
    })
    .filter('bookkeepingFromNow', function(){
        return function(date){
            return moment(date).fromNow();
        };
    })
;

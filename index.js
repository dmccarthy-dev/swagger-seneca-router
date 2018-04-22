'use strict';

var jsonic = require('jsonic');

/**
 *
 * @param operation
 * @returns {*}
 */
var resolveOperationPattern = function( operation ){

    if ( operation['x-seneca-pattern'] ) {
        return operation['x-seneca-pattern'] ;
    }
    else if ( operation.operationId ) {
        var pattern = '';

        if ( operation['x-swagger-router-controller']) {
            pattern += 'controller:' + operation['x-swagger-router-controller'] + ',';
        }

        pattern += 'operation:' + operation.operationId;

        return pattern;
    }
    else {
        //TODO: decide if middeware should next at this point. config option?
        throw new Error( 'Seneca pattern not found.' );
    }
};


/**
 *
 * @param swagger
 * @returns {*}
 */
var buildPattern = function( swagger ){

    var patternStr = resolveOperationPattern( swagger.operation );

    var pattern = jsonic ( patternStr );

    for ( let i in swagger.params ) {
        if ( swagger.params.hasOwnProperty( i )){
            pattern[i] = swagger.params[i].value;
        }
    }

    return pattern;
};


/**
 *
 * @param res
 * @param err
 */
var sendErr = function( res, err ){

    if ( err.body ){
        sendResp( res, err );
    }
    else{
        sendResp( res, { code : 500, body: err } )
    }

};


/**
 *
 * @param res
 * @param result
 */
var sendResp = function( res, result ){

    if ( result.headers ){
        for ( let i in result.headers ){
            if ( result.headers.hasOwnProperty( i )){
                res.setHeader( i );
            }
        }
    }

    var code = result.code ? result.code : 200;

    res.writeHead( code, {'Content-Type': 'application/json'} );
    res.end( JSON.stringify( result.body ) );
};



module.exports = function ( senecaInstance ) {

    return function (req, res, next ) {

        if ( !req.swagger ){
            next();
        }

        var pattern = buildPattern( req.swagger );

        senecaInstance.act( pattern, function ( err, result ) {
            if (err) {
                sendErr( res, err );
            }
            else {
                sendResp( res, result );
            }
        });
    };

};


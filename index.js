'use strict';

const jsonic = require('jsonic');

/**
 *
 * Builds a Seneca pattern string based on swagger properties.
 *
 * @param operation
 * @returns {*}
 */
const resolveOperationPattern = function( operation ){

    if ( operation['x-seneca-pattern'] ) {
        return operation['x-seneca-pattern'] ;
    }

    let pattern = '';

    if ( operation['x-swagger-router-controller'] ) {
        pattern += 'controller:' + operation['x-swagger-router-controller'];
    }

    if ( operation['x-swagger-router-controller'] && operation.operationId ){
        pattern +=  ',';
    }

    if ( operation.operationId ){
        pattern += 'operation:' + operation.operationId;
    }

    return pattern;
};


/**
 * Builds a seneca pattern object based on the swagger
 * properties and query parameters.
 *
 * @param swagger
 * @returns {*}
 */
const buildPattern = function( swagger ){

    const patternStr = resolveOperationPattern( swagger.operation );

    const pattern = jsonic( patternStr );

    for ( const i in swagger.params ) {
        if ( swagger.params.hasOwnProperty( i )){
            pattern[i] = swagger.params[i].value;
        }
    }

    return pattern;
};


/**
 *
 * Converts the seneca error output to https response.
 *
 * @param res
 * @param err
 */
const sendErr = function( res, err ){

    if ( err.body ){
        sendResp( res, err );
    }
    else{
        sendResp( res, { code : 500, body: err } );
    }

};


/**
 * Converts the seneca output to https response.
 * It expects the seneca output object to contain
 * a code,body and headers property.
 *
 * @param res
 * @param result
 */
const sendResp = function( res, result ){

    if ( result.headers ){
        for ( const i of result.headers ){
            for ( const j in i ){
                res.setHeader( j, i[j] );
            }
        }
    }

    const code = result.code ? result.code : 200;

    res.writeHead( code, {'Content-Type': 'application/json'} );
    res.end( JSON.stringify( result.body ) );
};


/**
 * Validate that the options parameter contains valid options.
 *
 * @param options
 */
const validateOptions = function ( options ){

    if ( !options.senecaClient || !options.senecaClient.act ){
        throw new Error( 'senecaClient is required.' );
    }

};


/**
 * Check that the swagger operation has properties that we can use to create a
 * seneca pattern.
 *
 * @param operation
 * @returns {boolean}
 */
const hasPattern = ( operation ) => {

    return !!( operation['x-seneca-pattern'] || operation['x-swagger-router-controller'] || operation.operationId );

};


module.exports = function ( options ) {

    validateOptions( options );

    return function (req, res, next ) {

        if ( !req.swagger || !hasPattern( req.swagger.operation )){
            next();
        }

        const pattern = buildPattern( req.swagger );

        options.senecaClient.act( pattern, function ( err, result ) {
            if (err) {
                sendErr( res, err );
            }
            else {
                sendResp( res, result );
            }
        });
    };

};


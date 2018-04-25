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
        return operation['x-seneca-pattern'];
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
 *
 * @param val the config value for this error.
 * @param err
 * @param context
 * @returns {*}
 */
const handleSenecaError = ( val, err, context ) => {

    if ( !val || val === 'error' ){
        return context.next( err );
    }
    else if( val === 'next'  ){
        context.next();
    }
    else if( val === 'response'  ){
        sendResp( { code : 500, body : err }, context );
    }
    else if( 0 === val.indexOf( 'jsonic' ) ){
        const message = jsonic( val );
        sendResp(  message.jsonic, context );
    }
    else{
        return context.next( err );
    }
};


/**
 *
 * Converts the seneca error output to https response.
 *
 * @param err
 * @param context
 * @param context.req
 * @param context.res
 * @param context.next
 * @param context.options
 */
const handleErr = function( err, context){

    if ( err.seneca ){

        if ( !context.options.senecaErrorMode ) {
            return context.next( err );
        }

        if ( context.options.senecaErrorMode[err.code] ){
            return handleSenecaError( context.options.senecaErrorMode[err.code], err, context );
        }

        if ( context.options.senecaErrorMode.default ){
            return handleSenecaError( context.options.senecaErrorMode.default, err, context );
        }

        return context.next( err );
    }


    if ( err.body ){

        if ( !err.code ){
            err.code = 500;
        }

        sendResp( err, context );
    }
    else{
        sendResp( { code : 500, body: err }, context );
    }

};


/**
 * Converts the seneca output to https response.
 * It expects the seneca output object to contain
 * a code,body and headers property.
 *
 *  The result object can have the following structure:
 *  {
 *      headers : {
 *          'Content-Type' : 'application/json'
 *      }
 *      code: 200,
 *      body: {
 *          a : 2,
 *          b : true
 *      }
 *  }
 *
 *
 * @param result
 * @param context
 */
const sendResp = function( result, context ){

    const res = context.res;

    if ( result.headers ){
        for ( const name in result.headers ){
            if ( result.headers.hasOwnProperty( name ) ){
                res.setHeader( name, result.headers[name] );
            }
        }
    }

    const code = result.code ? result.code : 200;
    const body = result.body ? result.body : ( code === 201 || code === 204 ? undefined : result );

    if ( body && (!result.headers || !result.headers['Content-Type']) ){
        res.setHeader( 'Content-Type', 'application/json' );
    }

    res.writeHead( code );
    res.end( JSON.stringify( body ) );
};


/**
 * Validate that the options parameter contains valid options.
 *
 *
 *
 * @param options
 */
const validateOptions = function ( options ){

    if ( !options || !options.senecaClient || !options.senecaClient.act ){
        throw new Error( 'senecaClient is required.' );
    }

    if ( options.hasOwnProperty( 'matchXSenecaPatternsOnly' ) && typeof options.matchXSenecaPatternsOnly !== 'boolean' ){
        throw new Error( 'Invalid matchXSenecaPatternsOnly, the value must have a boolean value.' );
    }

    if ( options.patternNotFoundMode ) {

        if ( -1 === ['error', 'next' ].indexOf( options.patternNotFoundMode ) && !isValidJsonicConfig( options.patternNotFoundMode ) ) {
            throw new Error('Invalid value for patternNotFoundMode.');
        }
    }

    if ( options.defaultErrorCode &&
        ( typeof options.defaultErrorCode !== "number" ||
            options.defaultErrorCode < 0 ||
            options.defaultErrorCode > 600 ) ){
        throw new Error( 'Invalid defaultErrorCode, the value must be number between 0 and 600.' );
    }


    if ( options.senecaCallbackOverride && typeof options.senecaCallbackOverride !== "function"){
        throw new Error( 'Invalid senecaCallbackOverride, the value must be a function.' );
    }

    if ( options.senecaErrorMode ) {

        if ( typeof  options.senecaErrorMode !== 'object'){
            throw new Error( 'Invalid senecaErrorMode, the value must be an object.' );
        }

        for ( const i in options.senecaErrorMode ){
            const val = options.senecaErrorMode[i];

            if ( -1 === ['error', 'next', 'response' ].indexOf( val ) && !isValidJsonicConfig( val ) ) {
                throw new Error('Invalid value for senecaErrorMode entry: ' + i );
            }
        }

    }

};


/**
 *
 * Validates that jsonic config is valid.
 *
 * @param str
 * @returns {boolean}
 */
const isValidJsonicConfig = function ( str ) {

    try{
        const obj = jsonic( str );
        return !!obj.jsonic;
    }
    catch (e) {
        return false;
    }
};


/**
 * Check that the swagger operation has properties that we can use to create a
 * seneca pattern.
 *
 * @param operation
 * @param context
 * @param context.options
 * @returns {boolean}
 */
const hasPattern = ( operation, context ) => {

    if ( context.options.matchXSenecaPatternsOnly ) return !!operation['x-seneca-pattern'];

    return !!( operation['x-seneca-pattern'] || ( operation['x-swagger-router-controller'] && operation.operationId ) );

};


/**
 *
 *
 * @param context
 * @returns {*}
 */
const handlePatternNotFound = ( context ) => {

    const options = context.options;

    if ( !options.patternNotFoundMode || options.patternNotFoundMode === 'next' ){
        return context.next();
    }
    else if( options.patternNotFoundMode === 'error'  ){
        context.next( new Error('Swagger Pattern not found') );
    }
    else if( 0 === options.patternNotFoundMode.indexOf( 'jsonic' ) ){
        const message = jsonic(options.patternNotFoundMode);
        sendResp( message.jsonic, context );
    }
    else{
        return context.next();
    }
};


/**
 * @param options
 * @param options.senecaClient
 * @param options.patternNotFoundMode
 * @param options.matchXSenecaPatternsOnly
 * @param options.defaultErrorCode
 * @param options.senecaErrorMode
 * @param options.senecaCallbackOverride
 * @returns {Function}
 */
module.exports = function ( options ) {

    validateOptions( options );

    return function (req, res, next ) {

        const context = { req : req, res : res, next : next, options : options};

        if ( !req.swagger || !hasPattern( req.swagger.operation, context )){
            return handlePatternNotFound( context );
        }

        context.pattern = buildPattern( req.swagger );

        options.senecaClient.act( context.pattern, function ( err, result ) {

            if ( options.senecaCallbackOverride ) {
                return options.senecaCallbackOverride( err, result, context );
            }
            else if (err) {
                handleErr( err, context );
            }
            else {
                sendResp( result, context );
            }
        });
    };

};


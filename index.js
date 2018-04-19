'use strict';

const jsonic = require('jsonic');

/**
 *
 * @param operation
 * @returns {*}
 */
const getBasePattern = function( operation ){

    if ( operation['x-seneca-pattern'] ) {
        return jsonic( operation['x-seneca-pattern'] );
    }
    else if ( operation['x-swagger-router-controller'] && operation['operationId'] ) {
        return jsonic( 'controller:' + operation['x-swagger-router-controller']
                        + ',operation:' + operation['operationId'] );
    }
    else {
        throw new Error( 'Seneca pattern not found.' );
    }
    
};


exports = module.exports = function ( senecaInstance ) {

    return function (req, res, next ) {

        //TODO validate req.swagger exists.

        const pattern = getBasePattern( req.swagger.operation );

        for ( let i in req.swagger.params ) {
            if ( req.swagger.params.hasOwnProperty( i )){
                pattern[i] = req.swagger.params[i].value;
            }
        }

        //console.log( pattern );

        senecaInstance.act( pattern, function ( err, result ) {
            if (err) {
                res.writeHead( err.code, {'Content-Type': 'application/json'});
                res.end( err.body );
            }
            else {
                if ( result.headers ){
                    for ( let i in result.headers ){
                        if ( result.headers.hasOwnProperty( i )){
                            res.setHeader( i )
                        }
                    }
                }

                const code = result.code ? result.code : 200;

                res.writeHead( code, {'Content-Type': 'application/json'} );
                res.end( JSON.stringify( result.body ) );
            }
        });
    };

};


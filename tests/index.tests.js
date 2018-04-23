/**
 * Created by dmccarthy on 19/07/2016.
 */
const chai                  = require('chai');
const rewire                = require('rewire');
const swaggerSenecaRouter   = require('../index');
const swaggerSenecaRouterRW = rewire('../index');

chai.should();

const should = chai.should();


describe('Test swagger-seneca-router middleware', function() {

    describe('Test getBasePattern', function() {

        it('test getBasePattern with x-seneca-pattern', function () {

            const mockOperation = { 'x-seneca-pattern' : 'service:math,cmd:list' };

            swaggerSenecaRouterRW.__get__( 'resolveOperationPattern' )( mockOperation ).should.equal( 'service:math,cmd:list' );

        });


        it('test getBasePattern with x-swagger-router-controller and operationId', function () {

            const mockOperation = {
                'x-swagger-router-controller' : 'Organisation',
                'operationId'                 : 'getAllOrganisations',
            };

            swaggerSenecaRouterRW.__get__( 'resolveOperationPattern' )( mockOperation ).should.equal( 'controller:Organisation,operation:getAllOrganisations' );

        });

        it('test getBasePattern with x-swagger-router-controller', function () {

            const mockOperation = {
                'x-swagger-router-controller' : 'Organisation'
            };

            swaggerSenecaRouterRW.__get__( 'resolveOperationPattern' )( mockOperation ).should.equal( 'controller:Organisation' );

        });


        it('test getBasePattern with operationId', function () {

            const mockOperation = {
                'operationId'                 : 'getAllOrganisations',
            };

            swaggerSenecaRouterRW.__get__( 'resolveOperationPattern' )( mockOperation ).should.equal( 'operation:getAllOrganisations' );

        });

    });


    describe('Test hasPattern', function() {

        it('test hasPattern operationId', function () {

            const mockOperation = {
                'operationId' : 'getAllOrganisations',
            };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation ).should.be.true;

        });


        it('test hasPattern x-swagger-router-controller and operationId ', function () {

            const mockOperation = {
                'x-swagger-router-controller' : 'Organisation',
                'operationId'                 : 'getAllOrganisations',
            };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation ).should.be.true;

        });


        it('test hasPattern x-seneca-pattern ', function () {

            const mockOperation = { 'x-seneca-pattern' : 'service:math,cmd:list' };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation ).should.be.true;

        });


        it('test hasPattern without pattern ', function () {

            const mockOperation = { };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation ).should.be.false;

        });

    });


    describe('Test validateOptions', function() {

        it('test validateOptions', function () {

            const options = { senecaClient : { act : function () {}} };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions without senecaClient', function () {

            const options = { };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'senecaClient is required.' );

        });


        it('test validateOptions with senecaClient missing act function', function () {

            const options = { senecaClient : { } };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'senecaClient is required.' );

        });

    });




    describe('Test sendResp', function() {

        it('test sendResp with code, body, header', function () {

            const mockResult = { code : 200, body : { a : 42 }, headers : [ { 'X-Powered-By' : 'Something'} ]};

            const mockRes = {
                setHeader : function ( k, v ){
                    k.should.equal( 'X-Powered-By' );
                    v.should.equal( 'Something' );
                },
                writeHead : function ( code, header ){
                    code.should.equal( 200 );
                },
                end : function ( str ) {
                    str.should.equal( '{"a":42}' );
                }
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockRes, mockResult );

        });

    });

});
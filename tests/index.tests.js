/**
 * Created by dmccarthy on 19/07/2016.
 */
const chai                  = require('chai');
const sinon                 = require("sinon");
const sinonChai             = require("sinon-chai");
const rewire                = require('rewire');
const swaggerSenecaRouter   = require('../index');
const swaggerSenecaRouterRW = rewire('../index');
const mockResponseObj       = require('./mockResponse');
const mockSwaggerMetadata   = require('./mockSwaggerMetadata');

chai.should();
chai.use(sinonChai);

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

            const result = { code : 200,
                body : { a : 42 },
                headers : { 'X-Powered-By' : 'Something'} };


            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", 'X-Powered-By' : 'Something' } );

        });


        it('test sendResp with code and body', function () {

            const result = { code : 200,
                body : { a : 42 } };

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type" : "application/json" } );

        });


        it('test sendResp with code only', function () {

            const result = { code : 201 };


            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            should.equal( mockResponse.getData().body,    undefined );

            mockResponse.getData().code.should.equal( 201 );
            mockResponse.getData().headers.should.deep.equal( {} );

        });


        it('test sendResp with body only', function () {

            const result = { body : { a : 542 } };

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            mockResponse.getData().body.should.equal( '{"a":542}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('test sendResp with data only', function () {

            const result = { a: 42, b : true };

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            mockResponse.getData().body.should.equal( '{"a":42,"b":true}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('gets full coverage :)', function () {

            function HeaderObject() {}

            HeaderObject.prototype.foo   = 'bar';
            const header = new HeaderObject();

            header['X-Powered-By'] = 'Something';

            const result = { code : 200,
                body : { a : 42 },
                headers : header };


            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendResp' )( mockResponse, result );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", 'X-Powered-By' : 'Something' } );

        });

    });



    describe('Test sendErr', function() {

        it('test sendErr basic', function () {

            const error = { code : 503,
                body    : { message: 'Invalid command', code : 20003 },
                headers : { 'X-Powered-By' : 'Something'}};

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendErr' )( mockResponse, error );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 503 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", "X-Powered-By": "Something" } );

        });


        it('test sendErr error message only', function () {

            const error = { message: 'Invalid command', code : 20003 };

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendErr' )( mockResponse, error );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('test sendErr error body only', function () {

            const error = { body : { message: 'Invalid command', code : 20003 } };

            const mockResponse = mockResponseObj();

            swaggerSenecaRouterRW.__get__( 'sendErr' )( mockResponse, error );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });

    });


    describe('Test buildPattern', function() {


        it('test buildPattern basic', function () {
            const pattern = swaggerSenecaRouterRW.__get__( 'buildPattern' )( mockSwaggerMetadata );

            pattern.operation.should.equal( 'getOrganisation' );
            pattern.organisationId.should.equal( '4n5pxq24kpiob12og8' );
            pattern.apiVersion.should.equal( 'v1' );
        });


        it ( 'gets full coverage', function () {

            function ParamsObject() {}

            ParamsObject.prototype.foo   = 'bar';
            const params = new ParamsObject();

            params['bob'] = {
                path:
                    ['paths',
                        '/api/{apiVersion}/organisations/{bob}',
                        'get',
                        'parameters',
                        '0'],
                        schema:
                {
                    name: 'organisationId',
                    in: 'path',
                    description: 'The organisations Id',
                    required: true,
                    type: 'string',
                },
                originalValue: 'bazz',
                    value: 'bazz'
            };

            const mockSwaggerMetadataClone = Object.assign({}, mockSwaggerMetadata);

            mockSwaggerMetadataClone.params = params;

            const pattern = swaggerSenecaRouterRW.__get__( 'buildPattern' )( mockSwaggerMetadataClone );

            pattern.operation.should.equal( 'getOrganisation' );
            pattern.bob.should.equal( 'bazz' );

        });
    });


    describe('Test module', function() {

        it('test basic', function () {

            const options = { };

            (function () { swaggerSenecaRouter( {} )})
                .should.Throw( Error, 'senecaClient is required.' );
        });


        it('test without swagger', function () {


            const options = { senecaClient : { act : function () {}} };

            const middleware = swaggerSenecaRouter( options );

            const req = { };
            const res = mockResponseObj();

            const nextFunc = sinon.spy();

            middleware( req, req, nextFunc );

            nextFunc.should.have.been.calledOnce

        });


        it('test with mock swagger and positive result', function () {

            const options = {
                senecaClient : {
                    act : function ( pattern, cb )  {
                        cb(null, { code : 205,
                            body : {a:12,b:true},
                            headers : { 'Content-Type' : 'application/json'}});
                    }}
            };

            const actFunc = sinon.spy( options.senecaClient, 'act' );

            const middleware = swaggerSenecaRouter( options );

            const req = { swagger : mockSwaggerMetadata };
            const res = mockResponseObj();

            middleware( req, res, ()=>{} );

            actFunc.should.have.been.calledOnce;

            actFunc.should.have.been.calledWith( { operation: 'getOrganisation',
                organisationId: '4n5pxq24kpiob12og8',
                apiVersion: 'v1' } );

            res.getData().code.should.be.equal( 205 );
            res.getData().body.should.be.equal( '{"a":12,"b":true}' );
            res.getData().headers.should.be.deep.equal( { 'Content-Type' : 'application/json'} );

        })


        it('test with mock swagger and error', function () {

            const options = {
                senecaClient : {
                    act : function ( pattern, cb )  {
                        cb( {code : 34444, message : 'something went wrong'} );
                    }}
            };

            const actFunc = sinon.spy( options.senecaClient, 'act' );

            const middleware = swaggerSenecaRouter( options );

            const req = { swagger : mockSwaggerMetadata };
            const res = mockResponseObj();

            middleware( req, res, ()=>{} );

            actFunc.should.have.been.calledOnce;

            actFunc.should.have.been.calledWith( { operation: 'getOrganisation',
                organisationId: '4n5pxq24kpiob12og8',
                apiVersion: 'v1' } );

            res.getData().code.should.be.equal( 500 );
            res.getData().body.should.be.equal( '{"code":34444,"message":"something went wrong"}' );
            res.getData().headers.should.be.deep.equal( { 'Content-Type' : 'application/json'} );

        })
    });

});
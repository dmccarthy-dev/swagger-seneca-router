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

            //switching to needing a x-swagger-router-controller and operationId
            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, { options : {} } ).should.be.false;

        });


        it('test hasPattern x-swagger-router-controller and operationId ', function () {

            const mockOperation = {
                'x-swagger-router-controller' : 'Organisation',
                'operationId'                 : 'getAllOrganisations',
            };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, { options : {} }  ).should.be.true;

        });


        it('test hasPattern x-seneca-pattern ', function () {

            const mockOperation = { 'x-seneca-pattern' : 'service:math,cmd:list' };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, { options : {} }  ).should.be.true;

        });


        it('test hasPattern without pattern ', function () {

            const mockOperation = { };

            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, { options : {} }  ).should.be.false;

        });



        it('test hasPattern with x-seneca-pattern with matchXSenecaPatternsOnly true', function () {

            const mockOperation = { 'x-seneca-pattern' : 'service:math,cmd:list' };
            const context       = { options : { matchXSenecaPatternsOnly : true } }
            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, context  ).should.be.true;

        });


        it('test hasPattern without x-seneca-pattern with matchXSenecaPatternsOnly true', function () {

            const mockOperation = {  };
            const context       = { options : { matchXSenecaPatternsOnly : true } }
            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, context  ).should.be.false;

        });

        it('test hasPattern without x-seneca-pattern with matchXSenecaPatternsOnly true 2', function () {

            const mockOperation = {
                'x-swagger-router-controller' : 'Organisation',
                'operationId'                 : 'getAllOrganisations',
            };
            const context       = { options : { matchXSenecaPatternsOnly : true } }
            swaggerSenecaRouterRW.__get__( 'hasPattern' )( mockOperation, context  ).should.be.false;

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


        it('test validateOptions with valid matchXSenecaPatternsOnly', function () {

            const options = {
                senecaClient             : { act : function () {}},
                matchXSenecaPatternsOnly : true
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions with invalid matchXSenecaPatternsOnly', function () {

            const options = {
                senecaClient : { act : function () {}},
                matchXSenecaPatternsOnly : 'asdf'
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid matchXSenecaPatternsOnly, the value must have a boolean value.' );

        });


        it('test validateOptions with invalid patternNotFoundMode', function () {

            const options = {
                senecaClient : { act : function () {}},
                patternNotFoundMode : 'asdasdad'
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid value for patternNotFoundMode.' );

        });


        it('test validateOptions with valid patternNotFoundMode', function () {

            const options = {
                senecaClient : { act : function () {}},
                patternNotFoundMode : 'error'
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });

        it('test validateOptions with valid defaultErrorCode', function () {

            const options = {
                senecaClient : { act : function () {}},
                defaultErrorCode : 400
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions with invalid defaultErrorCode 1', function () {

            const options = {
                senecaClient : { act : function () {}},
                defaultErrorCode : -400
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid defaultErrorCode, the value must be number between 0 and 600.' );


        });




        it('test validateOptions with invalid defaultErrorCode 2', function () {

            const options = {
                senecaClient : { act : function () {}},
                defaultErrorCode : 800
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid defaultErrorCode, the value must be number between 0 and 600.' );


        });


        it('test validateOptions with invalid defaultErrorCode 3', function () {

            const options = {
                senecaClient : { act : function () {}},
                defaultErrorCode : 'bob'
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid defaultErrorCode, the value must be number between 0 and 600.' );

        });


        it('test validateOptions with valid senecaCallbackOverride', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaCallbackOverride : function () {}
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions with invalid senecaCallbackOverride', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaCallbackOverride : 'bob'
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid senecaCallbackOverride, the value must be a function.' );

        });


        it('test validateOptions with valid senecaErrorMode', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaErrorMode : {
                    default : 'error'
                }
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions with valid senecaErrorMode jsonic', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaErrorMode : {
                    default : 'jsonic:{body:{num:200}}'
                }
            };

            should.equal(swaggerSenecaRouterRW.__get__( 'validateOptions' )( options ), undefined );

        });


        it('test validateOptions with invalid senecaErrorMode', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaErrorMode : 'bob'
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid senecaErrorMode, the value must be an object.' );

        });


        it('test validateOptions with invalid senecaErrorMode error value', function () {

            const options = {
                senecaClient : { act : function () {}},
                senecaErrorMode : {
                    default : 'wrong'
                }
            };

            (function () { swaggerSenecaRouterRW.__get__( 'validateOptions' )( options )})
                .should.Throw( Error, 'Invalid value for senecaErrorMode entry: default' );

        });

    });


    describe('Test sendResp', function() {

        it('test sendResp with code, body, header', function () {

            const result = { code : 200,
                body : { a : 42 },
                headers : { 'X-Powered-By' : 'Something'} };


            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( result, context );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", 'X-Powered-By' : 'Something' } );

        });


        it('test sendResp with code and body', function () {

            const result = { code : 200,
                body : { a : 42 } };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( result, context );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type" : "application/json" } );

        });


        it('test sendResp with code only', function () {

            const result = { code : 201 };


            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( result, context );

            should.equal( mockResponse.getData().body,    undefined );

            mockResponse.getData().code.should.equal( 201 );
            mockResponse.getData().headers.should.deep.equal( {} );

        });


        it('test sendResp with body only', function () {

            const result = { body : { a : 542 } };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( result, context );

            mockResponse.getData().body.should.equal( '{"a":542}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('test sendResp with data only', function () {

            const result = { a: 42, b : true };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )(  result, context );

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

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'sendResp' )( result, context );

            mockResponse.getData().body.should.equal( '{"a":42}' );
            mockResponse.getData().code.should.equal( 200 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", 'X-Powered-By' : 'Something' } );

        });

    });



    describe('Test handleErr', function() {

        it('test handleErr basic', function () {

            const error = { code : 503,
                body    : { message: 'Invalid command', code : 20003 },
                headers : { 'X-Powered-By' : 'Something'}};

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 503 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json", "X-Powered-By": "Something" } );

        });


        it('test handleErr error message only', function () {

            const error = { message: 'Invalid command', code : 20003 };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'handleErr' )(  error, context );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('test handleErr error body only', function () {

            const error = { body : { message: 'Invalid command', code : 20003 } };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });


        it('test handleErr with Seneca error no config options;', function () {

            const error = {
                seneca : true,
                code   : 'act_not_found',
                msg    : 'something went wrong'
            };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                options : {},
                next : function () {
                    
                }
            };

            const nextFunc = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            nextFunc.should.be.calledOnce;
            nextFunc.should.be.calledWithExactly( error );

        });




        it('test handleErr with Seneca error with matching config options;', function () {

            const error = {
                seneca : true,
                code   : 'act_not_found',
                msg    : 'something went wrong'
            };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                options : {
                    senecaErrorMode : {
                        act_not_found : 'response'
                    }
                },
                next : function () {

                }
            };

            const nextFunc = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            nextFunc.should.not.be.calledOnce;

            mockResponse.getData().body.should.equal( '{"seneca":true,"code":"act_not_found","msg":"something went wrong"}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });





        it('test handleErr with Seneca error with a default config options;', function () {

            const error = {
                seneca : true,
                code   : 'act_not_found',
                msg    : 'something went wrong'
            };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                options : {
                    senecaErrorMode : {
                        default : 'jsonic:{code:500,body:{message:Internal Server Error}}'
                    }
                },
                next : function () {

                }
            };

            const nextFunc = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            nextFunc.should.not.be.calledOnce;

            mockResponse.getData().body.should.equal( '{"message":"Internal Server Error"}' );
            mockResponse.getData().code.should.equal( 500 );
            mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

        });




        it('test handleErr with Seneca error with mismatch config option', function () {

            const error = {
                seneca : true,
                code   : 'act_not_found',
                msg    : 'something went wrong'
            };

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                options : {
                    senecaErrorMode : {
                        'no-current-target' : 'jsonic:{code:500,body:{message:Internal Server Error}}'
                    }
                },
                next : function () {

                }
            };

            const nextFunc = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

            nextFunc.should.be.calledOnce;
            nextFunc.should.be.calledWithExactly(error);


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

            const options = {};

            (function () {
                swaggerSenecaRouter({})
            })
                .should.Throw(Error, 'senecaClient is required.');
        });


        it('test without swagger', function () {


            const options = {
                senecaClient: {
                    act: function () {
                    }
                }
            };

            const middleware = swaggerSenecaRouter(options);

            const req = {};
            const res = mockResponseObj();

            const nextFunc = sinon.spy();

            middleware(req, req, nextFunc);

            nextFunc.should.have.been.calledOnce

        });


        it('test with mock swagger and positive result', function () {

            const options = {
                senecaClient: {
                    act: function (pattern, cb) {
                        cb(null, {
                            code: 205,
                            body: {a: 12, b: true},
                            headers: {'Content-Type': 'application/json'}
                        });
                    }
                }
            };

            const actFunc = sinon.spy(options.senecaClient, 'act');

            const middleware = swaggerSenecaRouter(options);

            const req = {headers: {}, swagger: mockSwaggerMetadata};
            const res = mockResponseObj();

            middleware(req, res, () => {
            });

            actFunc.should.have.been.calledOnce;

            actFunc.should.have.been.calledWith({
                operation: 'getOrganisation',
                controller: "something",
                organisationId: '4n5pxq24kpiob12og8',
                apiVersion: 'v1'
            });

            res.getData().code.should.be.equal(205);
            res.getData().body.should.be.equal('{"a":12,"b":true}');
            res.getData().headers.should.be.deep.equal({'Content-Type': 'application/json'});

        });


        it('test with mock swagger and negative result', function () {

            const options = {
                senecaClient: {
                    act: function (pattern, cb) {
                        cb({
                            code: 500,
                            body: {err: 444 },
                            headers: {'Content-Type': 'application/json'}
                        });
                    }
                }
            };

            const actFunc = sinon.spy(options.senecaClient, 'act');

            const middleware = swaggerSenecaRouter(options);

            const req = {headers: {}, swagger: mockSwaggerMetadata};
            const res = mockResponseObj();

            middleware(req, res, () => {
            });

            actFunc.should.have.been.calledOnce;

            actFunc.should.have.been.calledWith({
                operation: 'getOrganisation',
                controller: "something",
                organisationId: '4n5pxq24kpiob12og8',
                apiVersion: 'v1'
            });

            res.getData().code.should.be.equal(500);
            res.getData().body.should.be.equal('{"err":444}');
            res.getData().headers.should.be.deep.equal({'Content-Type': 'application/json'});

        });


        it('test with mock swagger senecaCallbackOverride', function () {

            const options = {
                senecaClient: {
                    act: function (pattern, cb) {
                        cb(null, {
                            code: 500,
                            body: {err: 444 },
                            headers: {'Content-Type': 'application/json'}
                        });
                    }
                },
                senecaCallbackOverride : function () {
                    
                }
            };

            const senecaCallbackOverrideFunc = sinon.spy(options, 'senecaCallbackOverride');

            const middleware = swaggerSenecaRouter(options);

            const req = {headers: {}, swagger: mockSwaggerMetadata};
            const res = mockResponseObj();

            middleware(req, res, () => {
            });

            senecaCallbackOverrideFunc.should.have.been.calledOnce;

            senecaCallbackOverrideFunc.should.have.been.calledWith( null, { body: { err: 444 }, code: 500, headers: { 'Content-Type': "application/json" } }  );

        });
    });


    it('test handleErr error body only', function () {

        const error = { body : { message: 'Invalid command', code : 20003 } };

        const mockResponse = mockResponseObj();

        const context = {
            req : { headers : {}},
            res : mockResponse
        };

        swaggerSenecaRouterRW.__get__( 'handleErr' )( error, context );

        mockResponse.getData().body.should.equal( '{"message":"Invalid command","code":20003}' );
        mockResponse.getData().code.should.equal( 500 );
        mockResponse.getData().headers.should.deep.equal( { "Content-Type": "application/json" } );

    });





    describe('Test handleSenecaError', function() {

        it('test with response val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'response', { message : 'random'}, context );


            mockResponse.getData().code.should.be.equal(500);
            mockResponse.getData().body.should.be.equal('{"message":"random"}');
            mockResponse.getData().headers.should.be.deep.equal({'Content-Type': 'application/json'});

        });

        it('test with jsonic val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse
            };

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'jsonic:{code:403,body:{a:234234,b:true}}', { message : 'random'}, context );


            mockResponse.getData().code.should.be.equal(403);
            mockResponse.getData().body.should.be.equal('{"a":234234,"b":true}');
            mockResponse.getData().headers.should.be.deep.equal({'Content-Type': 'application/json'});

        });


        it('test with next val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                next : function () {

                }
            };

            const nextFunc = sinon.spy(context, 'next');

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'next', { message : 'random'}, context );


            nextFunc.should.have.been.calledOnce;
            nextFunc.should.have.been.calledWithExactly();

        });


        it('test with error val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                next : function () {}
            };

            const nextFunc = sinon.spy(context, 'next');

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'error', { message : 'random'}, context );


            nextFunc.should.have.been.calledOnce;
            nextFunc.should.have.been.calledWithExactly({ message : 'random'});

        });


        it('test without val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                next : function () {}
            };

            const nextFunc = sinon.spy(context, 'next');

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'error', { message : 'random2'}, context );


            nextFunc.should.have.been.calledOnce;
            nextFunc.should.have.been.calledWithExactly({ message : 'random2'});

        });


        it('test wit junk val ', function () {

            const mockResponse = mockResponseObj();

            const context = {
                req : { headers : {}},
                res : mockResponse,
                next : function () {}
            };

            const nextFunc = sinon.spy(context, 'next');

            swaggerSenecaRouterRW.__get__( 'handleSenecaError' )( 'junk', { message : 'random2'}, context );


            nextFunc.should.have.been.calledOnce;
            nextFunc.should.have.been.calledWithExactly({ message : 'random2'});

        });
    });


    describe( 'Test isValidJsonicConfig', function () {


        it('test with valid jsonic', function () {


            const res = swaggerSenecaRouterRW.__get__( 'isValidJsonicConfig' )( 'jsonic:code:205' );

            res.should.be.true;

        });


        it('test with valid jsonic but wrong lead property', function () {


            const res = swaggerSenecaRouterRW.__get__( 'isValidJsonicConfig' )( 'other:code:205' );

            res.should.be.false;

        });


        it('test with invalid jsonic', function () {


            const res = swaggerSenecaRouterRW.__get__( 'isValidJsonicConfig' )( 'hello world' );

            res.should.be.false;

        });
    })



    describe( 'Test handlePatternNotFound', function () {


        it('test without patternNotFoundMode', function () {

            const context = {
                next : function () { },
                options : {}
            };

            const nextFun = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handlePatternNotFound' )( context );

            nextFun.should.be.calledOnce;
            nextFun.should.be.calledWithExactly();

        });

        it('test with patternNotFoundMode set to next', function () {

            const context = {
                next : function () { },
                options : {}
            };

            const nextFun = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handlePatternNotFound' )( context );

            nextFun.should.be.calledOnce;
            nextFun.should.be.calledWithExactly();

        });


        it('test with patternNotFoundMode set to error', function () {

            const context = {
                next : function () { },
                res : function () { },
                options : { patternNotFoundMode : 'error' }
            };

            const nextFun = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handlePatternNotFound' )( context );

            nextFun.should.be.calledOnce;
            //nextFun.should.be.calledWithMatch(Error('Swagger Pattern not found' ));

        });

        it('test with patternNotFoundMode set to jsonic', function () {

            const context = {
                next : function () { },
                res  : mockResponseObj(),
                options : { patternNotFoundMode : 'jsonic:{code:400,body:{errCode:111,errMessage:Not Found}}' }
            };

            const nextFun       = sinon.spy( context, 'next' );
            const setHeaderFun  = sinon.spy( context.res, 'setHeader' );
            const writeHeadFun  = sinon.spy( context.res, 'writeHead' );
            const endFun        = sinon.spy( context.res, 'end' );

            swaggerSenecaRouterRW.__get__( 'handlePatternNotFound' )( context );

            nextFun.should.not.be.called;
            setHeaderFun.should.be.calledOnce;
            setHeaderFun.should.be.calledWithExactly( 'Content-Type',     'application/json' );
            writeHeadFun.should.be.calledWithExactly( 400 );
            endFun.should.be.calledWithExactly( '{"errCode":111,"errMessage":"Not Found"}' );

        });


        it('test with patternNotFoundMode set to invalid value', function () {

            const context = {
                next : function () { },
                options : {patternNotFoundMode : 'junk' }
            };

            const nextFun = sinon.spy( context, 'next' );

            swaggerSenecaRouterRW.__get__( 'handlePatternNotFound' )( context );

            nextFun.should.be.calledOnce;
            nextFun.should.be.calledWithExactly();

        });


    })

});
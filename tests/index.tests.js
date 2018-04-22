/**
 * Created by dmccarthy on 19/07/2016.
 */
const chai                  = require('chai');
const rewire                = require('rewire');
const swaggerSenecaRouter   = require('../index');
const swaggerSenecaRouterRW = rewire('../index');

chai.should();


describe('Test swagger-seneca-router middleware', function() {


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


    it('test getBasePattern with operationId', function () {

        const mockOperation = {
            'operationId'                 : 'getAllOrganisations',
        };

        swaggerSenecaRouterRW.__get__( 'resolveOperationPattern' )( mockOperation ).should.equal( 'operation:getAllOrganisations' );

    });


});
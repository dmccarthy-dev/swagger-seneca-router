# swagger-seneca-router
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-status-badge]][coveralls-status-url]
[![Known Vulnerabilities][snyk-badge]][snyk-url]
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/dmccarthy-dev/swagger-seneca-router/blob/master/LICENSE)

Swagger-seneca-router is a Node.js connect/express middleware for routing REST API calls to Seneca micro-services. This module depends on the Swagger JavaScript tools module. 

This guide assumes that you have some knowledge of Connect, Connect Middleware, Swagger, Swagger JavaScript Tools, Seneca, and Seneca Mesh. Check out the following links if you are not familiar with any of these components. 

- [Learn more about Connect and Connect Middleware](https://github.com/senchalabs/connect)
- [Learn more about Swagger](https://swagger.io/specification/)
- [Learn more about JavaScript Swagger Tools](https://github.com/apigee-127/swagger-tools)
- [Learn more about Seneca](http://senecajs.org/)
- [Learn more about Seneca Mesh](https://github.com/senecajs/seneca-mesh)

**Quick Links**

- [Skip to Features Section](#features) 
- [Skip to Background Section](#background) 
- [Skip to Installation Section](#installation) 
- [Skip to Sample Usage Section](#sample-usage) 
- [Skip to Matching API calls to Seneca Patterns Section](#matching-api-calls-to-seneca-pattern) 
- [Skip to Swagger to Seneca Pattern Examples Section](#swagger-to-seneca-pattern-examples) 
- [Skip to Seneca Result and Error objects Section](#seneca-result-and-error-object) 
- [Skip to Syntax Section](#syntax) 
- [Skip to Configuration Options Section](#configuration-options) 
- [Skip to Complete Example Section](#complete-example) 


#### Features 
- Translates incoming REST calls to Seneca patterns.
- Build patterns based on x-swagger-router-controller and operationId values.
- Alternatively, build patterns based on x-seneca-pattern values.
- Converts Seneca result to http response.


### Background

The Swagger JavaScript Tools is a Node.js and browser module that provides tooling around Swagger specifications. The project has a number of middleware modules that add structure and constrains to a Connect server. Their module includes:

- A middleware for adding pertinent Swagger information to your requests (Node only)
- A middleware for serving your Swagger documents and Swagger UI (Node only)
- A middleware for using Swagger resource documents for pre-route validation (Node only)

In summary their middlewares parse incoming request, validates the request against a Swagger definition, and creates structured data elements based on the active http request and the swagger specification file. Our module build upon these structured data elements to create predictable and safe Seneca act patterns. 

- [Click here to learn more about JavaScript Swagger Tools](https://github.com/apigee-127/swagger-tools)



#### Installation

```bash
npm install swagger-seneca-router
```

### Sample Usage

```JavaScript
'use strict';

const fs   = require('fs'),
    path   = require('path'),
    http   = require('http'),
    app    = require('connect')(),
    jsyaml = require('js-yaml'),
    swaggerTools = require('swagger-tools'),
    swaggerSenecaRouter = require('swagger-seneca-router');

//load and parse our swagger file.
const spec       = fs.readFileSync(path.join(__dirname, '/swagger-file.yaml'), 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);


// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

    //we create a Seneca Client and add it to a mesh network. 
    //You aren't tied to mesh, you can wire you Seneca Client/Services however you like.
    require('seneca')()
        .use('mesh')
        .ready( function() {
            
            //when our Seneca Client is ready we attach
            //the Swagger middlware.
            app.use(middleware.swaggerMetadata());
            app.use(middleware.swaggerValidator());
            //The Swagger UI in useful for development. Disable for production. 
            app.use(middleware.swaggerUi());

            //Init the swaggerSenecaRouter middleware, passing an instance 
            // of our Swagger Client as a config object.
            app.use( swaggerSenecaRouter( { senecaClient : this } ) );

            //catch all the request that don't match Swagger UI 
            // or Seneca Pattern.
            app.use( function (req, res, next) {
                res.writeHead(404, {});
                res.end( 'Not found');
            });

            // Start the server
            http.createServer(app).listen(8080, function () {
                console.log('Your server is listening on port 8080 (http://localhost:8080)');
                console.log('Swagger-ui is available on http://localhost:8080/docs');
            });
        });

});

```

**Ordering Middleware**

You must take care when attaching our middleware to the Connect app as the order in which they are attached is important. The Swagger metadata middleware must go first or else we won't have structured data to build our Seneca patterns. You should also allow the swagger validator filter the request to ensure that the parameters are valid. By default our swagger-seneca-router middleware will call the next function when it cannot detect a valid Seneca pattern or when a miro-service is not found that implements the calculated pattern. Therefore, we need to attach another middleware function to handle not found errors after our middleware.   

```JavaScript
//swaggerMetadata 
app.use(middleware.swaggerMetadata());  //this one has to go first. 
app.use(middleware.swaggerValidator()); //this one has to go second. 

app.use(middleware.swaggerUi());

app.use(swaggerSenecaRouter( { senecaClient : this } ) );

app.use( function (req, res, next) {
    res.writeHead(404, {});
    res.end( 'Not found');
});

```


### Matching API calls to Seneca Pattern 

The swagger-seneca-router middleware builds Seneca pattern objects based on the Swagger operation associated with the incoming http request. By default the pattern is a simple JavaScript object with the properties: controller and operation. The controller value is set to the (unofficial) Swagger property `x-swagger-router-controller` and the operation value is set to the (official) Swagger property `operationId`. The parameters that are associated with the incoming request are also attached to the pattern object. We can override the default pattern detection behaviour by including the unofficial swagger option `x-seneca-pattern` with a [jsonic value](https://github.com/rjrodger/jsonic); by including `x-seneca-pattern` the `x-swagger-router-controller` and `operationId` values are ignored.


### Swagger to Seneca Pattern Examples

When parsing following Swagger operation our middleware would use the `x-swagger-router-controller` and `operationId` values to create the pattern `{ controller : "petstore", operation : "addPet", "pet" : { name : "foo" } }`. On our Seneca micro-service we need to add a function that acts on the `controller:petstore,operation:addPet` pattern.  

```yaml
  post: 
    description: "Creates a new pet in the store.  Duplicates are allowed"
    operationId: "addPet"
    produces: 
      - "application/json"
    parameters: 
      - name: "pet"
        in: "body"
        description: "Pet to add to the store"
        required: true
        schema: 
          $ref: "#/definitions/NewPet"
    responses: 
      "201":
        description: "pet response"
        schema: 
          $ref: "#/definitions/Pet"
      default: 
        description: "unexpected error"
        schema: 
          $ref: "#/definitions/ErrorModel"
    x-swagger-router-controller: "petstore"
```

We can override the default pattern detection behaviour by including the `x-seneca-pattern` option; by including `x-seneca-pattern` the `x-swagger-router-controller` and operationId values are ignored. In the following example we set `x-seneca-pattern` to `service:storage,action:addPet`. The `x-seneca-pattern` option is useful if you have multiple Swagger operations that you want to direct to the same micro-service.

```yaml
  post: 
    description: "Creates a new pet in the store.  Duplicates are allowed"
    operationId: "addPet"
    produces: 
      - "application/json"
    parameters: 
      - name: "pet"
        in: "body"
        description: "Pet to add to the store"
        required: true
        schema: 
          $ref: "#/definitions/NewPet"
    responses: 
      "201":
        description: "pet response"
        schema: 
          $ref: "#/definitions/Pet"
      default: 
        description: "unexpected error"
        schema: 
          $ref: "#/definitions/ErrorModel"
    x-swagger-router-controller: "petstore"
    x-seneca-pattern: "service:storage,action:addPet"
```  

### Seneca Result and Error object
Extracting patterns from incoming requests is only half the story; the other half is converting the data emitted from our Seneca micro-service into a http response. The result and error objects can be structured two ways: 1) with the properties code, body, and headers or 2) just plain object. When the code, body, or header is not detected the object is stringified and sent as the http response. By default the http code is set to 200 for a result and 500 for an error.   

If the result object is as follows:

```JSON
{ "a" : 2, "b": true }
``` 

The http response will be as follows:

```http response
HTTP/1.1 200 OK\r\n 
Content-Length: 17\r\n 
Content-Type: application/json\r\n 
\r\n 
{"a":2,"b":true}
```

If the result object has the code, body, and headers data like this:

```JSON
{ 
  "code": 200, 
  "body" : { "a" : 2, "b" :false }, 
  "headers" : {"X-Powered-By" : "Something"} 
}
``` 

The http response will be as follows:

```http response
HTTP/1.1 200 OK\r\n 
Content-Length: 18\r\n 
Content-Type: application/json\r\n 
X-Powered-By: Something\r\n 
\r\n 
{"a":2,"b":false}
```

In some situations you might want to send the http status code on its own. If you want to send a 201 or a 204 code without a body you can return a result like this:


```JSON
{ 
  "code": 201
}
``` 

The http response will be as follows:

```http response
HTTP/1.1 201 OK\r\n 
Content-Length: 0\r\n 
X-Powered-By: Something\r\n 
\r\n 

```

### Syntax

```JavaScript
const swaggerSenecaRouter = require( 'swagger-seneca-router' );

app.use( swaggerSenecaRouter( options ) );
```

#### Configuration Options

- **senecaClient** - an instance of Seneca client. The swagger-seneca-router makes no attempt at service discovery, such concerns must be addressed outside of our module. 
- **matchXSenecaPatternsOnly** - disables pattern matching with `x-swagger-router-controller` and `operationId` values. This option might be useful if you are porting a monolith to a micro-services architecture. Operations can be ported one by one to microservices by adding `x-seneca-pattern` to their Swagger specification. 
- **defaultErrorCode** - overrides the default http code for errors is 500.
- **patternNotFoundMode** - configures the behaviour when a pattern is not found in the swagger operation/http request. Can be set to one of the following options:
    - *next* (default) Calls the Connect next function. This will move the http request onto the next middleware function.
    - *error* Throw an Error Swagger Pattern not found.
    - *jsonic:<jsonic message>* Send a jsonic response object. e.g. `jsonic:{code:400,body:{errCode:111,errMessage:Not Found}}`.
- **senecaErrorMode** - configures the behaviour when a Seneca error is emitted. This configuration option is an object of key value pairs where the keys are match Seneca [error names](https://github.com/senecajs/seneca/blob/master/lib/errors.js) and the value is the action to complete. The special default key allows you to configure the default behaviour for all errors. It's value will be used if a more specific match ins't found. The value can one of the following: 
    - *error* (default) Calls the next function with the Seneca error object passed as a parameter. You need to attach an error handler to the Connect app to deal with the errors. 
    - *next*  Calls the Connect next function without passing the error object. This will move the process on to the next middleware function.
    - *response* Output the Seneca Error message in the http response.
    - *jsonic:<jsonic message>* Send a jsonic response object. e.g. `jsonic:body:{errCode:3322,errMessage:Opps, our servers appear to be down!}}`.
    
        Sample senecaErrorMode object:
        ```json
        {
            "default"           : "next",
            "act_not_found"     : "error",
            "no-current-target" : "jsonic:body:{errCode:3322,errMessage:Oops, our servers appear to be down!}}"
        }
        ```  
 - **senecaCallbackOverride** - overrides the default function that is called when the Seneca act function emits an error or result. Use the senecaCallbackOverride option if you want swagger-seneca-router to manage the incoming requests, but you want more control over parsing the error/result and sending the http response. Your senecaCallbackOverride function will be passes the err and result values that are output from Seneca, as well as a context object containing references to the middleware request, response, next, and options objects.  
 
    The senecaCallbackOverride function has the following signature:

    ```JavaScript
    /**
    * 
    * @param err       Seneca error
    * @param result    Seneca result
    * @param context   Context objects     
    * @param context.req  incoming request object 
    * @param context.res  incoming response object 
    * @param context.next connect next function
    * @param context.options incoming request object
    * @param context.pattern the Seneca pattern 
    */
    const senecaCallbackOverride = function( err, result, context ) {
        
        
    }
    ```

Sample Configuration object:

```JavaScript

swaggerSenecaRouter( { 
    senecaClient              : client,
    patternNotFoundMode       : 'error',
    matchXSenecaPatternsOnly  : true,
    defaultErrorCode          : 400,
    senecaErrorMode : {
        'default'           : 'next',
        'act_not_found'     : 'error',
        'no-current-target' : 'error'
    },
    senecaCallbackOverride : function( err, result, context ) {
        console.log( 'Got an error or result' );
    }
    
} )
```


#### Complete Example

Take the petstore-simple.yaml swagger definition that has a number of API endpoints for CRUDing Pet objects.

```yaml

---
  swagger: "2.0"
  info: 
    version: "1.0.0"
    title: "Swagger Petstore"
    description: "A sample API that uses a petstore as an example to demonstrate features in the swagger-2.0 specification"
    termsOfService: "http://swagger.io/terms/"
    contact: 
      name: "Swagger API Team"
    license: 
      name: "MIT"
  basePath: "/api"
  schemes: 
    - "http"
  consumes: 
    - "application/json"
  produces: 
    - "application/json"
  paths: 
    /pets: 
      get: 
        description: "Returns all pets from the system that the user has access to"
        operationId: "findPets"
        produces: 
          - "application/json"
        parameters: 
          - name: "tags"
            in: "query"
            description: "tags to filter by"
            required: false
            type: "array"
            items: 
              type: "string"
            collectionFormat: "csv"
          - name: "limit"
            in: "query"
            description: "maximum number of results to return"
            required: false
            type: "integer"
            format: "int32"
        responses: 
          "200":
            description: "pet response"
            schema: 
              type: "array"
              items: 
                $ref: "#/definitions/Pet"
          default: 
            description: "unexpected error"
            schema: 
              $ref: "#/definitions/ErrorModel"
        x-swagger-router-controller: "petstore"
      post: 
        description: "Creates a new pet in the store.  Duplicates are allowed"
        operationId: "addPet"
        produces: 
          - "application/json"
        parameters: 
          - name: "pet"
            in: "body"
            description: "Pet to add to the store"
            required: true
            schema: 
              $ref: "#/definitions/NewPet"
        responses: 
          "200":
            description: "pet response"
            schema: 
              $ref: "#/definitions/Pet"
          default: 
            description: "unexpected error"
            schema: 
              $ref: "#/definitions/ErrorModel"
        x-swagger-router-controller: "petstore"
    /pets/{id}: 
      get: 
        description: "Returns a user based on a single ID, if the user does not have access to the pet"
        operationId: "findPetById"
        produces: 
          - "application/json"
        parameters: 
          - name: "id"
            in: "path"
            description: "ID of pet to fetch"
            required: true
            type: "integer"
            format: "int64"
        responses: 
          "200":
            description: "pet response"
            schema: 
              $ref: "#/definitions/Pet"
          default: 
            description: "unexpected error"
            schema: 
              $ref: "#/definitions/ErrorModel"
        x-swagger-router-controller: "petstore"
      delete: 
        description: "deletes a single pet based on the ID supplied"
        operationId: "deletePet"
        parameters: 
          - name: "id"
            in: "path"
            description: "ID of pet to delete"
            required: true
            type: "integer"
            format: "int64"
        responses: 
          "204":
            description: "pet deleted"
          default: 
            description: "unexpected error"
            schema: 
              $ref: "#/definitions/ErrorModel"
        x-swagger-router-controller: "petstore"
  definitions: 
    Pet: 
      type: "object"
      allOf: 
        - 
          $ref: "#/definitions/NewPet"
        - 
          required: 
            - "id"
          properties: 
            id: 
              type: "integer"
              format: "int64"
    NewPet: 
      type: "object"
      required: 
        - "name"
      properties: 
        name: 
          type: "string"
        tag: 
          type: "string"
    ErrorModel: 
      type: "object"
      required: 
        - "code"
        - "message"
      properties: 
        code: 
          type: "integer"
          format: "int32"
        message: 
          type: "string"

```


Build a simple Seneca service for each of the operations (petstore-service.js).

```JavaScript

'use strict';

const seneca = require('seneca')({tag: 'pet-service'})

    .add('controller:petstore,operation:findPetById', (msg, reply) => {

        reply( null, {
                "id"    : msg.id,
                "name"  : "foo",
                "tag"   : "xyz123",
            });
    })
    .add('controller:petstore,operation:findPets', (msg, reply) => {

        reply( null, {
            code : 200,
            body : [{
                "id"    : 34,
                "name"  : "foo",
                "tag"   : "xyz123",
            },{
                "id"    : 35,
                "name"  : "bax",
                "tag"   : "xyz321",
            }]
        } );
    })
    .add('controller:petstore,operation:addPet', (msg, reply) => {

        reply( null, {
            code : 201,
            body : {
                "id"    : 36,
                "name"  : msg.pet.name,
                "tag"   : msg.pet.tag,
            }
        } );
    })
    .add('controller:petstore,operation:deletePet', (msg, reply) => {

        reply( null, {
            code : 204
        } );
    })
    .use('mesh', {
        isbase : true,
        pin    : 'controller:petstore'
    });

```

Create an instance of the Connect app that initialise the swagger tools with our petstore-simple.yaml file, then creates an instance of Seneca, and finally attaches the swagger and swagger-seneca-router middleware. 

```JavaScript
'use strict';

const fs   = require('fs'),
    path   = require('path'),
    http   = require('http'),
    app    = require('connect')(),
    jsyaml = require('js-yaml'),
    swaggerTools = require('swagger-tools'),
    swaggerSenecaRouter = require('swagger-seneca-router');


const serverPort = 8080;

const spec = fs.readFileSync(path.join(__dirname, '/petstore-simple.yaml'), 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);


// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

    require('seneca')()
        .use('mesh')
        .ready( function() {

            app.use(middleware.swaggerMetadata());
            app.use(middleware.swaggerValidator());
            app.use(middleware.swaggerUi());

            app.use( swaggerSenecaRouter( { senecaClient : this } ) );

            app.use( function (req, res, next) {
                res.writeHead(404, {});
                res.end( 'Not found');
            });

            // Start the server
            http.createServer(app).listen(serverPort, function () {
                console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
                console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
            });
        });

});



```

Start the petstore service in one process:

```bash
node petstore-service.js
```

Start the connect server in another process:

```bash
node index.js
```

Load the swagger UI on http://localhost:8081/docs and hit the try it out buttons.



## License
Copyright (c) 2018 Dónal McCarthy;
Licensed under __[MIT][Licence]__.



[travis-badge]: https://travis-ci.org/dmccarthy-dev/swagger-seneca-router.svg
[travis-url]: https://travis-ci.org/dmccarthy-dev/swagger-seneca-router
[coveralls-status-badge]: https://coveralls.io/repos/github/dmccarthy-dev/swagger-seneca-router/badge.svg?branch=master
[coveralls-status-url]: https://coveralls.io/github/dmccarthy-dev/swagger-seneca-router?branch=master
[snyk-badge]: https://snyk.io/test/github/dmccarthy-dev/swagger-seneca-router/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/dmccarthy-dev/swagger-seneca-router?targetFile=package.json
[Licence]: ./LICENSE
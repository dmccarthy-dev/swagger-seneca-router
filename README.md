# swagger-seneca-router
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-status-badge]][coveralls-status-url]
[![Known Vulnerabilities][snyk-badge]][snyk-url]
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/dmccarthy-dev/swagger-seneca-router/blob/master/LICENSE)

Swagger-seneca-router is a Node.js connect/express middleware for routing REST API calls to Seneca micro-services. This module depends on the Swagger JavaScript tools module. 

- [Learn more about Seneca](http://senecajs.org/)
- [Learn more about JavaScript Swagger Tools](https://github.com/apigee-127/swagger-tools)


#### Features
- Translates incoming REST calls to Seneca patterns.
- Build patterns based on x-swagger-router-controller and operationId values.
- Alternatively, build patterns based on x-seneca-pattern values.
- Converts Seneca result to http response.


#### Example

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





[travis-badge]: https://travis-ci.org/dmccarthy-dev/swagger-seneca-router.svg
[travis-url]: https://travis-ci.org/dmccarthy-dev/swagger-seneca-router
[coveralls-status-badge]: https://coveralls.io/repos/github/dmccarthy-dev/swagger-seneca-router/badge.svg?branch=master
[coveralls-status-url]: https://coveralls.io/github/dmccarthy-dev/swagger-seneca-router?branch=master
[snyk-badge]: https://snyk.io/test/github/dmccarthy-dev/swagger-seneca-router/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/dmccarthy-dev/swagger-seneca-router?targetFile=package.json
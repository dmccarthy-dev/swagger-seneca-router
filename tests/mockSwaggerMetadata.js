module.exports = {
    operation: {
        tags: ['Organisation'],
        summary: 'Get a single Organisation.',
        description: 'Gets an `Organisation` entry.\n',
        operationId: 'getOrganisation',
    },
    params: {
        organisationId:
            {
                path:
                    ['paths',
                        '/api/{apiVersion}/organisations/{organisationId}',
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
                        'x-regex-constraints': '^[a-z0-9]{18}$'
                    },
                originalValue: '4n5pxq24kpiob12og8',
                value: '4n5pxq24kpiob12og8'
            },
        apiVersion:
            {
                path:
                    ['paths',
                        '/api/{apiVersion}/organisations/{organisationId}',
                        'get',
                        'parameters',
                        '1'],
                schema:
                    {
                        name: 'apiVersion',
                        in: 'path',
                        description: 'The API version',
                        required: true,
                        type: 'string',
                        'x-regex-constraints': '^v\\d{1}$'
                    },
                originalValue: 'v1',
                value: 'v1'
            }
    },
    operationPath: ['paths',
        '/api/{apiVersion}/organisations/{organisationId}',
        'get']
};
module.exports = () => {

    return {
        data : {
            headers : {}
        },
        setHeader : function ( k, v ){
            this.data.headers[k] = v;
        },
        writeHead : function ( code, header ){
            this.data.code = code;
        },
        end : function ( str ) {
            this.data.body = str;
        },
        getData : function () {
            return this.data;
        }
    }
};
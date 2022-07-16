var connect = require('connect');
var serveStatic = require('serve-static');
var cors = require('cors')

connect()
    .use(serveStatic(__dirname))
    .use(cors())
    .listen(8080, () => console.log('Server running on 8080...'));


const { authenticateRadius } = require('./dist/lib/radius');
authenticateRadius('64010123', 'mypassword123').then(console.log).catch(console.error);

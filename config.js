exports.DATABASE_URL =  process.env.DATABASE_URL ||
                        process.env.MONGODB_URI ||
                        'mongodb://localhost/recipe-server'||
                        'mongodb://jylei:pw123@ds151955.mlab.com:51955/reciped';
exports.TEST_DATABASE_URL =  process.env.TEST_DATABASE_URL ||
                            'mongodb://localhost/test-recipe-app';
exports.PORT = process.env.PORT || 8080;
exports.ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || 'AKIAIQRN4O6HMDJCVHZQ';
exports.SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY || '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';
// exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

exports.JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
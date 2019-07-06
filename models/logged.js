const mongoose = require('mongoose');
const UserSchema = require('./user');

module.exports = mongoose.model('logged-users', UserSchema.schema); //nombre coleccion y esquema a usar
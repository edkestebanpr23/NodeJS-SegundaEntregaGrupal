const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CourseSchema = require('./course').schema;

const UserSchema = new Schema({
    name:  { type : String , required : true },
    id:  { type : Number , unique : true, required : true, dropDups: true },
    mail: { type : String , required : true },
    phone: { type : Number , required : true },
    pass: { type : String , required : true },
    role: { type: String, default: 'Aspirante' },
    courses: [{ type: Schema.Types.ObjectId, ref: 'courses' }]
});

class User {
    constructor(name, id, mail, phone, pass, role, courses) {
        this.name = name;
        this.id = id;
        this.mail = mail;
        this.phone = phone;
        this.pass = pass;
        this.role = role;
        this.courses = courses;
    }
}

module.exports = mongoose.model('users', UserSchema); //nombre coleccion y esquema a usar
module.exports = User;
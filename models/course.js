const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = require('./user');

const CourseSchema = new Schema({
    id: { type : Number , unique : true, required : true, dropDups: true },
    name: { type : String , required : true },
    description: { type : String , required : true },
    price: { type : Number , required : true },
    modality: String,
    hours: Number,
    status: {
        type: String,
        default:'disponible'
    },
    students: [{ type: Schema.Types.ObjectId, ref: 'users' }]
});
/*
class Course {
    constructor(id, name, description, price, modality, hours, status, students) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.modality = modality;
        this.hours = hours;
        this.status = status;
        this.students = students;
    }
}
module.exports = Course;*/
module.exports = mongoose.model('courses', CourseSchema); //nombre coleccion y esquema a usar


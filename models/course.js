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

module.exports = Course;

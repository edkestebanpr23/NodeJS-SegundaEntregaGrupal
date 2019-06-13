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

module.exports = User;

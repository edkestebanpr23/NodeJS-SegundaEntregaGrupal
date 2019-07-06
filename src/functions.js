const fs = require("fs");
const mongoose = require('mongoose');
var User = require('../models/user');
var Logged = require('../models/logged');
var Course = require('../models/course');


const add_user = (user) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    if (!exists(user.name, users)) {
        users.push(user);
        fs.writeFile("./users.json", JSON.stringify(users), (e) => {
            if (e) throw(e);
            console.log("success creating users.json");
        });
    }
    else {
        throw new Error("user already exists");
    }
};

const modify_user = (user, args) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    if (usr = users.find(u => u.id == user.id)) {
        if ("name" in args) { usr["name"] = args["name"]; }
        if ("mail" in args) { usr["mail"] = args["mail"]; }
        if ("phone" in args) { usr["phone"] = args["phone"]; }
        if ("pass" in args) { usr["pass"] = args["pass"]; }
        /*usr["name"] = (usr["name"] != new_user["name"]) ? new_user["name"] : user["name"];
        usr["mail"] = (usr["mail"] != new_user["mail"]) ? new_user["mail"] : user["mail"];
        usr["phone"] = (usr["phone"] != new_user["phone"]) ? new_user["phone"] : user["phone"];
        usr["pass"] = (usr["pass"] != new_user["pass"]) ? new_user["pass"] : user["pass"];*/

        update_json("./users.json", users);
    }
};

const add_user_to_course = async (user_id, course_id) => {
	const student = await User.findOne({id: user_id});
	const course = await Course.findOne({id: course_id});
	course.students.push(student);
	course.save();
};

const add_course_to_user = async (course_id, user_id) => {
	const student = await User.findOne({id: user_id});
	const logged = await Logged.findOne({id: user_id});
	const course = await Course.findOne({id: course_id});	
	student.courses.push(course);
	student.save();
	logged.courses.push(course);
	logged.save();
};

const del_user_from_course = async (user_id, course_id) => {
    const student = await User.findOne({id: user_id});
	const course = await Course.findOne({id: course_id});
	course.students.pull(student);
	course.save();
};

const del_course_from_user = async (course_id, user_id) => {
    const student = await User.findOne({id: user_id});
	const logged = await Logged.findOne({id: user_id});
	const course = await Course.findOne({id: course_id});
	student.courses.pull(course);
	student.save();
	logged.courses.pull(course);
	logged.save();
};

let get_user_courses = async (user) => {
    let courses = [];
    for (var c = 0; c < user.courses.length; c++) {
		var course = await Course.findOne({_id: user.courses[c]});
        courses.push(course);
    }
	
    return courses;
};

let get_course_users = async (course) => {
    let students = [];
    for (var c = 0; c < course.students.length; c++) {
		var student = await User.findOne({_id: course.students[c]});
        students.push(student);
    }
	
    return students;
};

const get_all_course_users = async () => {
    //let courses = JSON.parse(fs.readFileSync("./courses.json"));
    let courses = await Course.find();
    //let users = JSON.parse(fs.readFileSync("./users.json"));
    let users = await User.find();
    var res = [];  // array containing students for each existing course
    for (var c = 0; c < courses.length; c++) {
        res.push(new Array(courses[c].students.length));
        for (var j = 0; j < courses[c].students.length; j++) {
            console.log(find_user(courses[c].students[j].id));
            res[c][j] = find_user(courses[c].students[j].id);
        }
    }
    return res;
};

const substract_arrays = (arr1, arr2) => {
    var res = [], aux = false;

	for (var c = 0; c < arr1.length; c++) {
        for (var j = 0; j < arr2.length; j++) {
	        if (JSON.stringify(arr1[c]) == JSON.stringify(arr2[j])) {
	            aux = true;
                break;
            }
        }
        if (!aux) res.push(arr1[c]);
        else aux = false;
    }
    return res;
};

const add_course = async (course) => {
    //let courses = JSON.parse(fs.readFileSync("./courses.json"));
    let courses = await Course.find();
    if (!exists(course.id, courses)) {
        //courses.push(course);
        //update_json("./courses.json", courses);
        await Course.create(course);
        return "Curso creado exitosamente";
    }
    else {
        return "Un curso con este ID ya existe";
    }
};

const change_course_state = async (course_id) => {
	const course = await Course.findOne({id: course_id});
	var new_status = course.status == "no disponible" ? "disponible" : "no disponible";
	await Course.updateOne({id: course_id}, {$set: {status: new_status}});
};

const update_json = (file, content) => {
    fs.writeFileSync(file, JSON.stringify(content), (e) => {
        if (e) throw(e);
        console.log("success creating "+file);
    });
};

const find_course = async (id) => {
    //let courses = JSON.parse(fs.readFileSync("./courses.json"));
    console.log('holi');
    let courses = await Course.find();
    console.log(courses);
    if (id == '*') return courses;
    if (course = courses.find(c => c.id == id)) {
        return course;
    }
    else {
        throw new Error("Course with id "+id+" does not exists");
    }
};

const find_user = async (id) => {
    //let users = JSON.parse(fs.readFileSync("./users.json"));
    let user = await User.findOne({id: id});
    return user;
    //else {
    //    throw new Error("User with id "+id+" does not exists");
    //}
};

const log_user = (id) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    let logged_users = [];
    if (exists(id, users)) {
        // user already registered
        if (!is_logged(id)) {
            logged_users.push(find_user(id));
            fs.writeFileSync("./logged.json", JSON.stringify(logged_users), (e) => {
                if (e) throw(e);
                console.log("success creating logged.json");
            });
        }

        return 1;
    }
    else {
        // user have to register
        return -1;
    }
};

const logout_user = (id) => {
    if (is_logged(id)) {
        let logged_users = JSON.parse(fs.readFileSync("./logged.json"));
        if (user = logged_users.find(u => u.id == id)) {
            logged_users.splice(logged_users.indexOf(user), 1);
            update_json("./logged.json", logged_users);
        }
    }
};

const is_logged = (id) => {
    //let users = JSON.parse(fs.readFileSync("./logged.json"));
    let users = JSON.parse(fs.readFileSync("./logged.json"));
    if (user = users.find(u => u.id == id)) {
        return true;
    }
    else {
        return false;
    }
};

const read_file = (file) => {
    return JSON.parse(fs.readFileSync(file));
};

const exists = (id, array) => {
    return array.find(u => u.id == id);
};

module.exports = {
    add_user, modify_user, add_course,
    find_course, find_user,
    add_user_to_course, add_course_to_user,
	del_user_from_course, del_course_from_user,
    change_course_state,
    get_user_courses, get_course_users,
    get_all_course_users,
    substract_arrays,
    is_logged, log_user, logout_user
};

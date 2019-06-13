const fs = require("fs");

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
}

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
}

const add_user_to_course = (user, course_id) => {
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    let users = JSON.parse(fs.readFileSync("./users.json"));
    if (course = courses.find(c => c.id == course_id)) {
        course["students"].push(user);
        aux_user = find_user(user.id);
        if (usr = users.find(u => u.id == aux_user.id)) {
            usr["courses"].push(course_id);
        }

        update_json("./courses.json", courses);
        update_json("./users.json", users);
    }
}

const del_user_from_course = (user, course_id) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    if (usr = users.find(u => u.id == user.id)) {
        usr["courses"].splice(usr["courses"].indexOf(course_id), 1);
        course = find_course(course_id);
        if (crs = courses.find(c => c.id == course.id)) {
            crs["students"].splice(crs["students"].indexOf(user.id), 1);
        }

        update_json("./courses.json", courses);
        update_json("./users.json", users);
    }
}

const get_user_courses = (user) => {
    let courses = []
    for (var c = 0; c < user.courses.length; c++) {
        courses.push(find_course(user.courses[c]));
    }
    return courses;
}

const get_all_course_users = () => {
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    let users = JSON.parse(fs.readFileSync("./users.json"));
    var res = [];  // array containing students for each existing course
    for (var c = 0; c < courses.length; c++) {
        res.push(new Array(courses[c].students.length));
        for (var j = 0; j < courses[c].students.length; j++) {
            console.log(find_user(courses[c].students[j].id));
            res[c][j] = find_user(courses[c].students[j].id);
        }
    }

    // console.log(res[0][3]);
    return res;
}

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
}

const add_course = (course) => {
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    if (!exists(course.id, courses)) {
        courses.push(course);
        update_json("./courses.json", courses);
    }
    else {
        throw new Error("course already exists");
    }
}

const change_course_state = (id) => {
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    if (course = courses.find(c => c.id == id)) {
        course["status"] = (course["status"] == "disponible") ?
                          course["status"] = "cerrado" : course["status"] = "disponible";
        console.log(course["status"]);
        console.log(courses);

        update_json("./courses.json", courses);
    }
}

const update_json = (file, content) => {
    fs.writeFileSync(file, JSON.stringify(content), (e) => {
        if (e) throw(e);
        console.log("success creating "+file);
    });
}

const find_course = (id) => {
    let courses = JSON.parse(fs.readFileSync("./courses.json"));
    // console.log(courses);
    if (id == '*') return courses;
    if (course = courses.find(c => c.id == id)) {
        return course;
    }
    else {
        throw new Error("course with id "+id+" does not exists");
    }
}

const find_user = (id) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    if (user = users.find(u => u.id == id)) {
        return user;
    }
    else {
        throw new Error("user with id "+id+" does not exists");
    }
}

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
}

const logout_user = (id) => {
    if (is_logged(id)) {
        let logged_users = JSON.parse(fs.readFileSync("./logged.json"));
        if (user = logged_users.find(u => u.id == id)) {
            logged_users.splice(logged_users.indexOf(user), 1);
            update_json("./logged.json", logged_users);
        }
    }
}

const is_logged = (id) => {
    let users = JSON.parse(fs.readFileSync("./logged.json"));
    if (user = users.find(u => u.id == id)) {
        return true;
    }
    else {
        return false;
    }
}

const read_file = (file) => {
    return JSON.parse(fs.readFileSync(file));
}

const exists = (id, array) => {
    return array.find(u => u.id == id);
}

module.exports = {
    add_user, modify_user, add_course,
    find_course, find_user,
    add_user_to_course, del_user_from_course,
    change_course_state,
    get_user_courses,
    get_all_course_users,
    substract_arrays,
    is_logged, log_user, logout_user
}

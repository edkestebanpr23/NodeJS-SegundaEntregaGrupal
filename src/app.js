const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
require("./helpers");
const body_parser = require("body-parser");
const fncs = require("./functions");
const morgan = require('morgan');
const mongoose = require('mongoose');

//connecting to the DB
mongoose.connect('mongodb://localhost/bd-aplicacion')
    .then(db => console.log('Conectado a la BD'))
    .catch(err => console.log(err));

var User = require("../models/user");
var Course = require("../models/course");
users = [];
courses = [];
courses.push(new Course(1, "curso1",
                        "descripcion",
                        "20 dolares",
                        "presencial",
                        "30 horas",
                        "disponible", []));
courses.push(new Course(2, "curso2",
                        "descripcion2",
                        "40 dolares",
                        "a distancia",
                        "100 horas",
                        "disponible", []));
global.current_user = null;

//settings
app.set('port', process.env.PORT || 3000); //tomar puerto del sistema o 3000
app.set('views', path.join(__dirname, 'views')); //localizacion de views
app.set("view engine", "hbs");

//middlewares - funcion ejecutada antes de las rutas
app.use(morgan('dev')); //permite ver respuestas del servidor al cliente
app.use(express.static(path.join(__dirname, "../public")));
hbs.registerPartials(path.join(__dirname, "../partials"));
app.use(body_parser.urlencoded({extended: false}));

app.get("/", (req, res) => {
    res.render("index", {
        estudiante: "Mario"
    });
});

app.post("/calculos", (req, res) => {
    console.log(req.query);

    res.render("calculos", {
        estudiante: req.body.nombre,
        nota1: parseInt(req.body.nota1),
        nota2: parseInt(req.body.nota2),
        nota3: parseInt(req.body.nota3)
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", (req, res) => {
    if (fncs.log_user(req.body.id)) {
        global.current_user = fncs.find_user(req.body.id);
        console.log(global.current_user.id);
        res.redirect("/profile?id="+req.body.id);
    }
    else {
        res.render("register");
    }
});

app.get("/logout", (req, res) => {
    fncs.logout_user(req.body.id);
    global.current_user = null;
    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", (req, res) => {
    console.log(req.body);
    try {
        new_user = new User(req.body.name,
                            req.body.id,
                            req.body.mail,
                            req.body.phone,
                            req.body.pass,
                            "aspirante",
                            []
        );
        fncs.add_user(new_user);
        users.push(new_user);

        res.render("index", {
            alert: "Usuario creado con éxito!"
        });
    }
    catch (err) {
        console.log("error while registering :\n"+err);
        res.render("register", {
            alert: "Error registrando nuevo usuario!"
        });
    }
});

app.get("/profile", (req, res) => {
    if (!fncs.is_logged(req.query.id) && global.current_user.role != "coordinador") {
        res.redirect("*");
    }
    else {
        res.render("profile", {
            user: fncs.find_user(req.query.id),
            courses: fncs.get_user_courses(fncs.find_user(req.query.id))
        });
    }
});

app.get("/profile_edit", (req, res) => {
    res.render("profile_edit");
});
app.post("/profile_edit", (req, res) => {
    var args = {};
    if (req.body.name != "") { global.current_user.name = args["name"] = req.body.name; }
    if (req.body.mail != "") { global.current_user.mail = args["mail"] = req.body.mail; }
    if (req.body.pass != "") { global.current_user.pass = args["pass"] = req.body.pass; }
    if (req.body.phone != "") { global.current_user.phone = args["phone"] = req.body.phone; }

    fncs.modify_user(global.current_user, args);
    res.redirect("/profile?id="+global.current_user.id);
});

app.get("/courses", (req, res) => {
    var args = {
        user: global.current_user,
        courses: fncs.substract_arrays(fncs.find_course('*'),
                                       global.current_user != null ?
                                       fncs.get_user_courses(global.current_user) : [])
    };
    if (global.current_user != null && global.current_user.role == "coordinador") {
        args["course_students"] = fncs.get_all_course_users();
    }
    res.render("courses", args);
});
app.post("/courses", (req, res) => {
    try {
        if (req.body.action == "add") {
            fncs.add_user_to_course(global.current_user, req.body.id);
            res.redirect("/profile?id="+global.current_user.id);
        }
        else if (req.body.action == "ch_state") {
            fncs.change_course_state(req.body.id);
            res.redirect("/courses");
        }
        else {
            if (req.body.action == "del") {  // user deleting himself from course
                fncs.del_user_from_course(global.current_user, req.body.id);
            }
            else {  // coord deleting user from course
                fncs.del_user_from_course(fncs.find_user(req.body.uid), req.body.id);
            }

            res.redirect("/profile?id="+global.current_user.id);
        }
    }
    catch (err) {
        console.log(err);
    }

    /*res.render("courses", {
        courses: fncs.find_course('*')
    });*/
});

app.post("/new_course", (req, res) => {
    course = new Course(req.body.id,
                        req.body.name,
                        req.body.desc,
                        req.body.price,
                        req.body.modality,
                        req.body.hours,
                        "disonible", [])
    fncs.add_course(course);
    res.redirect("/profile?id="+global.current_user.id);
});

app.get("*", (req, res) => {
    res.render("error", {
        estudiante: "error"
    });
});

//starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
})

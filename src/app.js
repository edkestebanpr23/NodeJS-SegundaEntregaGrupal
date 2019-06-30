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

var User = require('../models/user');
var Course = require('../models/course');
var Logged = require('../models/logged');
//var User = require("../models/user");
//var Course = require("../models/course");
users = [];
courses = [];

//Inicializacion de una BD virgen
const queryUsers = User.estimatedDocumentCount( async (err,count) => {
    if(count == 0){
        const nuevoCoordinador = new User({
            name: 'Coordinador1',
            id: 0,
            mail: 'coordinador@tdea.com',
            phone: 12345,
            pass: 'admin',
            role: 'coordinador',
            courses: []
        });
        await nuevoCoordinador.save();
        console.log('No se encontraron usuarios previos. Puede loguearse con el id: 0 y pass: admin');
    }
    else{
        console.log('Se han encontrado usuarios guardados en la base de datos');
    }
});

//Inicializacion de una BD virgen
const queryCourses = Course.estimatedDocumentCount( async (err,count) => {
    if(count == 0){
        const nuevoCurso = new Course({
            id: 0,
            name: 'Curso por defecto',
            description: 'Placeholder para probar la inserción',
            price: -1,
            modality: 'nocturna',
            hours: 0,
            status: 'no disponible',
            students: []
        });
        await nuevoCurso.save();
        console.log('No se encontraron cursos previos.');
    }
    else{
        console.log('Se han encontrado cursos guardados en la base de datos');
    }
});
global.current_user = null;

//settings
app.set('port', process.env.PORT || 3000); //tomar puerto del sistema o 3000
//app.set('views', path.join(__dirname, 'views')); //localizacion de views
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

app.post("/login", async (req, res) => {
    const id = req.body.id;
    const user = await User.findOne({ id: id });
    if (user !== null) {
        global.current_user = user;
        console.log(global.current_user.id);
        const logged_user = new Logged({
            name: user.name,
            id: user.id,
            mail: user.mail,
            phone: user.phone,
            pass: user.pass,
            role: user.role,
            courses: user.courses
        });
        await logged_user.save();
        res.redirect("/profile?id="+req.body.id);
    }
    else {
        res.render("register");
    }
});

app.get("/logout", async (req, res) => {
    await Logged.remove({ id: global.current_user.id });
    //fncs.logout_user(req.body.id);
    global.current_user = null;
    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const repetido = await User.findOne({ id: req.body.id });
        const new_user = new User(req.body);
        if(repetido === null){
            await new_user.save();
            res.render("register", {
                alert: "Usuario creado con éxito!"
            });
        }
        else{
            res.render("register", {
                alert: "Ya existe un usuario con este ID"
            });
            
        }     
        //fncs.add_user(new_user);
        //users.push(new_user);
    }
    catch (err) {
        console.log("Error al registrar:\n"+err);
        res.render("register", {
            alert: "Error registrando nuevo usuario!"
        });
    }
});

app.get("/profile", async (req, res) => {
    const user = await User.findOne({id: req.query.id});
    if (user === null && global.current_user.role != "coordinador") {
        res.redirect("*");
    }
    else {
        res.render("profile", {
            user: user,
            courses: user.courses  //fncs.get_user_courses(fncs.find_user(req.query.id))
        });
    }
});

app.get("/profile_edit", (req, res) => {
    res.render("profile_edit");
});

app.post("/profile_edit", async (req, res) => {
    var user = await User.findOne({id: global.current_user.id});
    if (req.body.name != "" && typeof req.body.name == 'string') { global.current_user.name = user.name = req.body.name; }
    if (req.body.mail != "" && typeof req.body.mail == 'string') { global.current_user.mail = user.mail = req.body.mail; }
    if (req.body.pass != "" && typeof req.body.pass == 'string') { global.current_user.pass = user.pass = req.body.pass; }
    if (req.body.phone != "" && typeof req.body.phone == 'number') { global.current_user.phone = user.phone = req.body.phone; }

    await user.save();
    //fncs.modify_user(global.current_user, args);
    //el usuario en logged users queda con info desactualizada, aunque como solo importa su id (inmutable) no hay problema
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

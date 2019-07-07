const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
require("./helpers");
const body_parser = require("body-parser");
const fncs = require("./functions");
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');

//connecting to the DB
mongoose.connect('mongodb://localhost/bd-aplicacion')
    .then(db => console.log('Conectado a la BD'))
    .catch(err => console.log(err));

var User = require('../models/user');
var Course = require('../models/course');
var Logged = require('../models/logged');
Logged.remove({}, function(err, removed) {});

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

        const nuevoDocente = new User({
            name: 'Docente1',
            id: 1,
            mail: 'docente@tdea.com',
            phone: 12345,
            pass: 'docente',
            role: 'docente',
            courses: []
        });
        await nuevoDocente.save();
		
        console.log('No se encontraron usuarios previos.\n'+
		'Se crearon nuevos usuarios:'+
		'	Coordinador -> id: 0 y pass: admin'+
		'	Docente -> id: 1 y pass: docente');
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
            name: 'Curso por defecto 1',
            description: 'descripción curso 1',
            price: -1,
            modality: 'nocturna',
            hours: 0,
            status: 'no disponible',
            students: []
        });
        await nuevoCurso.save();
		
		const nuevoCurso2 = new Course({
            id: 1,
            name: 'Curso por defecto 2',
            description: 'descripción curso 2',
            price: -1,
            modality: 'nocturna',
            hours: 0,
            status: 'disponible',
            students: []
        });
        await nuevoCurso2.save();
		
        console.log('No se encontraron cursos previos.');
    }
    else{
        console.log('Se han encontrado cursos guardados en la base de datos');
    }
});

global.current_user = null;

//settings
app.set('port', process.env.PORT || 3000); //tomar puerto del sistema o 3000
app.set("view engine", "hbs");
app.use(session({
	secret: "kayboard cat",
	resave: false,
	saveUninitialized: true
}));

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

app.get("/login", (req, res) => {
	Logged.remove({}, function(err, removed) {});
    res.render("login");
});

app.post("/login", async (req, res) => {
    const id = req.body.id;
    const user = await User.findOne({ id: id });
    if (user !== null) {
        if(user.pass === req.body.pass) {
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
			req.session.user = user.id;
			res.redirect("/profile?id="+req.body.id);
        }
        else{
            res.render("login", {
                alert: 'Nombre de usuario o contraseña equivocada!'
            });
        }
    }
    else {
        res.render("register");
    }
});

app.get("/logout", async (req, res) => {
    await Logged.remove({id: req.session.user});
	req.session.user = null;

    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const repetido = await User.findOne({ id: req.body.id });
        const new_user = new User(req.body);
        if(repetido === null) {
            await new_user.save();
            res.render("register", {
                alert: "Usuario creado con éxito!"
            });
        }
        else {
            res.render("register", {
                alert: "Ya existe un usuario con este ID"
            });
            
        }
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
	
	if (user === null && user.role != "coordinador") {
        res.redirect("*");
    }
    else {
        res.render("profile", {
            user: user,
            courses: await fncs.get_user_courses(user)  //fncs.get_user_courses(fncs.find_user(req.query.id))
        });
    }
});

app.get("/profile_edit", async (req, res) => {
	if (req.session.user != null) {
		res.render("profile_edit", {curr_user: await User.findOne({id: req.session.user}),
									user: await User.findOne({id: req.query.id})});
	}
	else {
		res.render("error");
	}
});

app.post("/profile_edit", async (req, res) => {
    var user = await User.findOne({id: req.query.id});console.log(req.query.id);
    var logged = await Logged.findOne({id: req.session.user});
	
    if (req.body.name != "" && typeof req.body.name == 'string') {
		user.name = req.body.name;
		if (req.query.id == logged.id) logged.name = req.body.name;
	}
    if (req.body.mail != "" && typeof req.body.mail == 'string') {
		user.mail = req.body.mail;
		if (req.query.id == logged.id) logged.mail = req.body.mail;
	}
    if (req.body.pass != "" && typeof req.body.pass == 'string') {
		user.pass = req.body.pass;
		if (req.query.id == logged.id) logged.pass = req.body.pass;
	}
    if (req.body.phone != "" && typeof req.body.phone == 'number') {
		user.phone = req.body.phone;
		if (req.query.id == logged.id) logged.phone = req.body.phone;
	}
	if ("role" in req.body) {console.log("!!_________________");
		user.role = req.body.role;
		if (req.query.id == logged.id) logged.role = req.body.role;
	}
 
    await user.save();
	await logged.save();
	
    res.redirect("/profile?id="+req.session.user);
});

app.get("/courses", async (req, res) => {
    var args = {
        user: await User.findOne({id: req.session.user}),
        courses: await Course.find({})
    };

	var logged = await Logged.findOne({});
    if (logged != null) {
		args["courses"] = fncs.substract_arrays(await Course.find({}),
												await fncs.get_user_courses(logged));
    }
	
    res.render("courses", args);
});

app.post("/courses", (req, res) => {
    try {
        if (req.body.action == "add") {
            fncs.add_user_to_course(req.session.user, req.body.id);
			fncs.add_course_to_user(req.body.id, req.session.user);
			update_logged_user(req.session.user);
			
            res.redirect("/profile?id="+req.session.user);
        }
        else if (req.body.action == "ch_state") {
            fncs.change_course_state(req.body.id);
            res.redirect("/courses");
        }
        else {
            if (req.body.action == "del") {  // user deleting himself from course
                fncs.del_user_from_course(req.session.user, req.body.id);
                fncs.del_course_from_user(req.body.id, req.session.user);
				update_logged_user(req.session.user);
            }

            res.redirect("/profile?id="+req.session.user);
        }
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/students", async (req, res) => {
	if (req.session.user != null) {
		res.render("students", {students: await User.find({}),
							    curr_user: req.session.user});
	}
	else {
		res.render("error");
	}
});

app.get("/course", async (req, res) => {
	if (req.session.user != null) {
		var course = await Course.findOne({id: req.query.id});
		var args = {
			course: course,
			students: await fncs.get_course_users(course),
			user: req.session.user != null ? await User.findOne({id: req.session.user}) : "."
		};
	
		res.render("course", args);
	}
	else {
		res.render("error");
	}
});

app.post("/course", async (req, res) => {
	fncs.del_user_from_course(req.body.id, req.body.course_id);
	fncs.del_course_from_user(req.body.course_id, req.body.id);
	res.redirect("/course?id="+req.body.course_id);
});		 

app.post("/new_course", (req, res) => {
    var course = new Course(req.body);
    fncs.add_course(course);
    res.redirect("/profile?id="+req.session.user);
});

app.get("*", (req, res) => {
    res.render("error", {
        estudiante: "error"
    });
});


const update_logged_user = async (user_id) => {
	global.current_user = await User.findOne({id: user_id});;
};

//starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});


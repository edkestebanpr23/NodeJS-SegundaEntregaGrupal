const fs = require("fs");
const hbs = require("hbs");

hbs.registerHelper("obtener_promedio", (n1, n2, n3) => {
    return (n1+n2+n3)/3;
});

hbs.registerHelper("listar", () => {
    estudiantes = require("../lista.json")
    let cont = "Lista de estudiantes \n";
    estudiantes.forEach(e => {
        cont += e.nombre+" "+e.matematicas+" "+e.ingles+" "+e.programacion+"\n";
    });

    return cont;
});

hbs.registerHelper("get_user", (id) => {
    let users = JSON.parse(fs.readFileSync("./users.json"));
    return users.find(u => u.id == id);
});

hbs.registerHelper("if_eq", function(a, b, opts) {
    return (a == b) ? opts.fn(this) : opts.inverse(this);
});
hbs.registerHelper("if_M", function(a, b, opts) {
    return (a > b) ? opts.fn(this) : opts.inverse(this);
});

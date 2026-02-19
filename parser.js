let tokens = [];
let i = 0;
let tokenActual = null;
let logReglas = "";
let logTraza = "";
let logTercetos = "";
let nTerceto = 1;

function scanner(cadena) {
    // Soporta =, +, -, *, /, (, ), ids y números
    const regex = /([a-zA-Z][a-zA-Z0-9]*)|(\d+)|([+\-*/=()])|(\$)/g;
    let match;
    tokens = [];
    while ((match = regex.exec(cadena)) !== null) {
        if (match[1]) tokens.push({ tipo: 'ID', val: match[1] });
        else if (match[2]) tokens.push({ tipo: 'NUM', val: match[2] });
        else tokens.push({ tipo: match[3], val: match[3] });
    }
    tokens.push({ tipo: '$', val: '$' });
}

function emparejar(esperado) {
    if (tokenActual.tipo === esperado) {
        i++;
        tokenActual = tokens[i];
    } else {
        throw new Error(`Se esperaba ${esperado}`);
    }
}

/* --- LÓGICA DE ASIGNACIÓN (SINTÁCTICO) --- */

// Agregamos manejo de asignación '=' como en tu PDF: x = expresión
function Inicio() {
    if (tokenActual.tipo === 'ID' && tokens[i+1] && tokens[i+1].tipo === '=') {
        let variable = tokenActual.val;
        emparejar('ID');
        emparejar('=');
        let resExp = E();
        
        let idx = `(${nTerceto++})`;
        logTraza += `Asignando ${idx} a la operación de asignación [=]\n`;
        logTercetos += `${idx} =, ${variable}, ${resExp}\n`;
    } else {
        E();
    }
}

function E() {
    logReglas += "Regla 1: E -> T E'\n";
    let izq = T();
    return E_Prima(izq);
}

function E_Prima(izq) {
    if (tokenActual.tipo === '+') {
        logReglas += "Regla 2: E' -> + T E'\n";
        emparejar('+');
        let der = T();
        let idx = `(${nTerceto++})`;
        logTraza += `Asignando ${idx} a la SUMA (+)\n`;
        logTercetos += `${idx} +, ${izq}, ${der}\n`;
        return E_Prima(idx);
    } else if (tokenActual.tipo === '-') {
        logReglas += "Regla 3: E' -> - T E'\n";
        emparejar('-');
        let der = T();
        let idx = `(${nTerceto++})`;
        logTraza += `Asignando ${idx} a la RESTA (-)\n`;
        logTercetos += `${idx} -, ${izq}, ${der}\n`;
        return E_Prima(idx);
    } else {
        logReglas += "Regla 4: E' -> epsilon\n";
        return izq;
    }
}

function T() {
    logReglas += "Regla 5: T -> F T'\n";
    let izq = F();
    return T_Prima(izq);
}

function T_Prima(izq) {
    if (tokenActual.tipo === '*') {
        logReglas += "Regla 6: T' -> * F T'\n";
        emparejar('*');
        let der = F();
        let idx = `(${nTerceto++})`;
        logTraza += `Asignando ${idx} al PRODUCTO (*)\n`;
        logTercetos += `${idx} *, ${izq}, ${der}\n`;
        return T_Prima(idx);
    } else if (tokenActual.tipo === '/') {
        logReglas += "Regla 7: T' -> / F T'\n";
        emparejar('/');
        let der = F();
        let idx = `(${nTerceto++})`;
        logTraza += `Asignando ${idx} a la DIVISIÓN (/)\n`;
        logTercetos += `${idx} /, ${izq}, ${der}\n`;
        return T_Prima(idx);
    } else {
        logReglas += "Regla 8: T' -> epsilon\n";
        return izq;
    }
}

function F() {
    if (tokenActual.tipo === '(') {
        logReglas += "Regla 9: F -> ( E )\n";
        emparejar('(');
        let res = E();
        emparejar(')');
        return res;
    } else if (tokenActual.tipo === 'ID') {
        logReglas += "Regla 10: F -> id\n";
        let v = tokenActual.val;
        emparejar('ID');
        return v;
    } else {
        logReglas += "Regla 11: F -> num\n";
        let v = tokenActual.val;
        emparejar('NUM');
        return v;
    }
}

function ejecutarAnalisis() {
    const input = document.getElementById("inputExp").value;
    i = 0; nTerceto = 1;
    logReglas = ""; logTraza = ""; logTercetos = "";
    
    try {
        scanner(input);
        tokenActual = tokens[i];
        Inicio();
        
        document.getElementById("reglasLog").innerText = logReglas;
        document.getElementById("trazaLog").innerText = logTraza;
        document.getElementById("codigoObjeto").innerText = logTercetos;
    } catch (e) {
        alert("Error en la cadena");
    }
}
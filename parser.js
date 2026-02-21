let tokens = [];
let idx = 0;
let tokenActual = null;
let trazaGlobal = "";
let temaDia = false;

function registrar(texto) { trazaGlobal += texto + "\n"; }

/* === TOGGLE TEMA DÍA/NOCHE === */
function toggleTema() {
    temaDia = !temaDia;
    const body = document.body;
    const btn = document.getElementById('toggleTema');
    const icono = btn.querySelector('.icono-tema');
    
    if (temaDia) {
        body.classList.add('tema-dia');
        icono.textContent = '☀️';
        localStorage.setItem('tema', 'dia');
    } else {
        body.classList.remove('tema-dia');
        icono.textContent = '🌙';
        localStorage.setItem('tema', 'noche');
    }
}

// Cargar tema guardado
window.addEventListener('DOMContentLoaded', () => {
    const temaSaved = localStorage.getItem('tema');
    const btn = document.getElementById('toggleTema');
    const icono = btn.querySelector('.icono-tema');
    
    if (temaSaved === 'dia') {
        temaDia = true;
        document.body.classList.add('tema-dia');
        icono.textContent = '☀️';
    } else {
        temaDia = false;
        document.body.classList.remove('tema-dia');
        icono.textContent = '🌙';
    }
});

function scanner(cadena) {
    const regex = /(\d+(\.\d+)?)|([a-zA-Z_]\w*)|([\+\-\*\/\^\(\)])|(\$)/g;
    let match;
    tokens = [];
    while ((match = regex.exec(cadena)) !== null) {
        if (match[1]) tokens.push({ tipo: 'num', val: parseFloat(match[1]) });
        else if (match[3]) tokens.push({ tipo: 'id', val: match[3] });
        else tokens.push({ tipo: match[4] || match[5], val: match[4] || match[5] });
    }
    tokens.push({ tipo: '$', val: '$' });
}

function emparejar(esperado) {
    if (tokenActual.tipo === esperado || tokenActual.val === esperado) {
        idx++;
        tokenActual = tokens[idx];
    } else throw new Error(`Se esperaba '${esperado}', se halló '${tokenActual.val}'`);
}

/* --- AST BUILDER --- */
function E() {
    registrar("[*] Expansión: E -> T E'");
    let nodoE = { label: "E", tipo: "nt", hijos: [] };
    let resT = T();
    nodoE.hijos.push(resT.nodo);
    let resEP = E_Prima(resT.valor);
    nodoE.hijos.push(resEP.nodo);
    return { valor: resEP.valor, nodo: nodoE };
}

function E_Prima(izq) {
    let nodoEP = { label: "E'", tipo: "nt", hijos: [] };
    if (tokenActual.val === '+' || tokenActual.val === '-') {
        let op = tokenActual.val;
        registrar(`[*] Expansión: E' -> ${op} T E'`);
        emparejar(op);
        
        nodoEP.hijos.push({ label: op, tipo: "t", hijos: [] });
        let resT = T();
        nodoEP.hijos.push(resT.nodo);
        
        let resultado = (op === '+') ? (izq + resT.valor) : (izq - resT.valor);
        registrar(`    => Semántica: ${izq} ${op} ${resT.valor} = ${resultado}`);
        
        let resSig = E_Prima(resultado);
        nodoEP.hijos.push(resSig.nodo);
        return { valor: resSig.valor, nodo: nodoEP };
    }
    nodoEP.hijos.push({ label: "ε", tipo: "eps", hijos: [] });
    return { valor: izq, nodo: nodoEP };
}

function T() {
    registrar("[*] Expansión: T -> P T'");
    let nodoT = { label: "T", tipo: "nt", hijos: [] };
    let resP = P();
    nodoT.hijos.push(resP.nodo);
    let resTP = T_Prima(resP.valor);
    nodoT.hijos.push(resTP.nodo);
    return { valor: resTP.valor, nodo: nodoT };
}

function T_Prima(izq) {
    let nodoTP = { label: "T'", tipo: "nt", hijos: [] };
    if (tokenActual.val === '*' || tokenActual.val === '/') {
        let op = tokenActual.val;
        registrar(`[*] Expansión: T' -> ${op} P T'`);
        emparejar(op);
        
        nodoTP.hijos.push({ label: op, tipo: "t", hijos: [] });
        let resP = P();
        nodoTP.hijos.push(resP.nodo);
        
        let resultado = (op === '*') ? (izq * resP.valor) : (izq / resP.valor);
        registrar(`    => Semántica: ${izq} ${op} ${resP.valor} = ${resultado}`);
        
        let resSig = T_Prima(resultado);
        nodoTP.hijos.push(resSig.nodo);
        return { valor: resSig.valor, nodo: nodoTP };
    }
    nodoTP.hijos.push({ label: "ε", tipo: "eps", hijos: [] });
    return { valor: izq, nodo: nodoTP };
}

function P() {
    registrar("[*] Expansión: P -> F P'");
    let nodoP = { label: "P", tipo: "nt", hijos: [] };
    let resF = F();
    nodoP.hijos.push(resF.nodo);
    let resPP = P_Prima(resF.valor);
    nodoP.hijos.push(resPP.nodo);
    return { valor: resPP.valor, nodo: nodoP };
}

function P_Prima(izq) {
    let nodoPP = { label: "P'", tipo: "nt", hijos: [] };
    if (tokenActual.val === '^') {
        registrar("[*] Expansión: P' -> ^ F P'");
        emparejar('^');
        
        nodoPP.hijos.push({ label: "^", tipo: "t", hijos: [] });
        let resF = F();
        nodoPP.hijos.push(resF.nodo);
        
        let resultado = Math.pow(izq, resF.valor);
        registrar(`    => Semántica: ${izq} ^ ${resF.valor} = ${resultado}`);
        
        let resSig = P_Prima(resultado);
        nodoPP.hijos.push(resSig.nodo);
        return { valor: resSig.valor, nodo: nodoPP };
    }
    nodoPP.hijos.push({ label: "ε", tipo: "eps", hijos: [] });
    return { valor: izq, nodo: nodoPP };
}

function F() {
    let nodoF = { label: "F", tipo: "nt", hijos: [] };
    if (tokenActual.val === '(') {
        registrar("[*] Expansión: F -> ( E )");
        emparejar('(');
        nodoF.hijos.push({ label: "(", tipo: "t", hijos: [] });
        
        let resE = E();
        nodoF.hijos.push(resE.nodo);
        
        emparejar(')');
        nodoF.hijos.push({ label: ")", tipo: "t", hijos: [] });
        return { valor: resE.valor, nodo: nodoF };
    } else if (tokenActual.tipo === 'num') {
        let v = tokenActual.val;
        registrar(`[+] Terminal detectado: ${v}`);
        emparejar('num');
        nodoF.hijos.push({ label: `${v}`, tipo: "t", hijos: [] });
        return { valor: v, nodo: nodoF };
    } else if (tokenActual.tipo === 'id') {
        let v = tokenActual.val;
        registrar(`[+] Terminal ID detectado: ${v}`);
        emparejar('id');
        nodoF.hijos.push({ label: `${v}`, tipo: "t", hijos: [] });
        return { valor: 0, nodo: nodoF };
    } else {
        throw new Error(`Token inesperado: ${tokenActual.val}`);
    }
}

function construirHTMLArbol(nodo) {
    let html = `<li><div class="node-box ${nodo.tipo}">${nodo.label}</div>`;
    if (nodo.hijos && nodo.hijos.length > 0) {
        html += `<ul>`;
        nodo.hijos.forEach(hijo => { html += construirHTMLArbol(hijo); });
        html += `</ul>`;
    }
    html += `</li>`;
    return html;
}

function ejecutarParser() {
    const input = document.getElementById("inputExpresion").value.trim();
    if (!input) return;

    idx = 0; trazaGlobal = `[SISTEMA] Iniciando análisis para: "${input}"\n\n`;
    document.getElementById("contenedorArbol").innerHTML = ""; 
    document.getElementById("btnVerArbol").disabled = true;

    try {
        scanner(input);
        tokenActual = tokens[idx];
        
        let resultadoFinal = E();

        if (tokenActual.tipo !== '$') throw new Error("La cadena contiene tokens sueltos al final.");

        document.getElementById("estadoValidacion").className = "badge exito";
        document.getElementById("estadoValidacion").innerText = "SINTAXIS CORRECTA";
        document.getElementById("valorFinal").innerText = resultadoFinal.valor;
        
        const htmlArbol = `<div class="tree"><ul>${construirHTMLArbol(resultadoFinal.nodo)}</ul></div>`;
        document.getElementById("contenedorArbol").innerHTML = htmlArbol;
        
        document.getElementById("btnVerArbol").disabled = false;
        registrar("\n[SISTEMA] ANÁLISIS FINALIZADO CON ÉXITO.");
    } catch (e) {
        document.getElementById("estadoValidacion").className = "badge error";
        document.getElementById("estadoValidacion").innerText = "ERROR SINTÁCTICO";
        document.getElementById("valorFinal").innerText = "N/A";
        registrar(`\n[!] ERROR LÉXICO/SINTÁCTICO: ${e.message}`);
    }
    
    document.getElementById("consolaTraza").innerText = trazaGlobal;
}

/* === LÓGICA DEL VIEWPORT (ZOOM Y PAN) === */
let zoomScale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

const viewport = document.getElementById('lienzoViewport');
const arbolDom = document.getElementById('contenedorArbol');

function actualizarTransform() {
    arbolDom.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
}

// 1. Zoom con Botones
function zoomIn() { zoomScale = Math.min(zoomScale + 0.2, 3); actualizarTransform(); }
function zoomOut() { zoomScale = Math.max(zoomScale - 0.2, 0.3); actualizarTransform(); }
function resetZoom() { zoomScale = 1; translateX = 0; translateY = 0; actualizarTransform(); }

// 2. Zoom con Rueda del Ratón
viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomScale += e.deltaY * -0.001;
    zoomScale = Math.min(Math.max(0.3, zoomScale), 3); // Límite de zoom entre 0.3x y 3x
    actualizarTransform();
});

// 3. Pan (Arrastrar lienzo)
viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});
viewport.addEventListener('mouseleave', () => { isDragging = false; });
viewport.addEventListener('mouseup', () => { isDragging = false; });
viewport.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    actualizarTransform();
});

// 4. Modal
function abrirModal() {
    document.getElementById("modalArbol").style.display = "flex";
    resetZoom(); // Centra el árbol al abrir
}
function cerrarModal() {
    document.getElementById("modalArbol").style.display = "none";
}
window.onclick = function(event) {
    if (event.target === document.getElementById("modalArbol")) cerrarModal();
}

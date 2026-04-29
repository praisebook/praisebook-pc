// --- PraiseBook Manager - Lógica JS (Sincronización Original Restaurada) ---

let peer = null; let conn = null;
let songsData = []; let currentSongId = null;

const el = {
    app: document.getElementById('app-manager'),
    status: document.getElementById('connection-status'),
    pinArea: document.getElementById('pin-input-area'),
    infoArea: document.getElementById('connection-info-area'),
    connectedId: document.getElementById('connected-id'),
    songList: document.getElementById('song-list'),
    searchInput: document.getElementById('song-search'),
    editor: {
        title: document.getElementById('editor-title'),
        artist: document.getElementById('editor-artist'),
        tono: document.getElementById('editor-tono'), // NUEVO
        bpm: document.getElementById('editor-bpm'),   // NUEVO
        vel: document.getElementById('editor-vel'),   // NUEVO
		duracion: document.getElementById('editor-duracion'), // NUEVO
        content: document.getElementById('editor-content')
    },
    preview: document.getElementById('preview-display')
};

// --- Control del Tema ---
function toggleTema() {
    const body = document.body;
    body.classList.toggle('tema-claro');
    const isClaro = body.classList.contains('tema-claro');
    const btn = document.getElementById('btn-tema');
    
    if (isClaro) {
        btn.innerHTML = '<span class="material-icons" style="font-size: 16px; margin-right: 5px;">dark_mode</span> Tema Oscuro';
    } else {
        btn.innerHTML = '<span class="material-icons" style="font-size: 16px; margin-right: 5px;">light_mode</span> Tema Claro';
    }
}

// 🚨 CONEXIÓN RESTAURADA IDÉNTICA A TU ARCHIVO ORIGINAL 🚨
function conectarApp() {
    const pin = document.getElementById('pin-code').value;
    if (pin.length !== 4) { alert("Ingresa el PIN de 4 dígitos."); return; }

    actualizarEstado('Conectando...', 'neutral');
    
    peer = new Peer({ 
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    peer.on('open', (id) => {
        const peerIdDeLaApp = `PraiseBook-${pin}`; 
        
        // QUITAMOS serialization: 'json' PARA EVITAR EL BUG (Justo como lo tenías)
        conn = peer.connect(peerIdDeLaApp);
        
        conn.on('open', () => {
            actualizarEstado('Conectado a la App', 'connected');
            el.pinArea.style.display = 'none';
            el.infoArea.style.display = 'flex';
            el.connectedId.innerText = pin;
            el.app.style.display = 'flex';

            // ENVIAMOS COMO STRING (Justo como lo tenías)
            setTimeout(() => { conn.send(JSON.stringify({ type: 'request_sync' })); }, 1000);
        });

        conn.on('data', (rawData) => {
            // TRADUCIMOS EL TEXTO A CÓDIGO SIEMPRE (Justo como lo tenías)
            let data = rawData;
            if (typeof rawData === 'string') {
                try { data = JSON.parse(rawData); } catch(e) { return; }
            }

            if (!data || !data.type) return;

            switch (data.type) {
                case 'sync_start':
                    songsData = []; 
                    el.songList.innerHTML = '<div style="padding:20px; text-align:center; color:#888; font-weight:bold;">Recibiendo canciones...</div>';
                    break;
                case 'update_full': 
                    songsData = data.data || [];
                    actualizarListaCanciones();
                    break;
                case 'save_success':
                    alert('¡Guardado en el celular con éxito!');
                    // ENVIAMOS COMO STRING
                    conn.send(JSON.stringify({ type: 'request_sync' }));
                    break;
            }
        });

        conn.on('close', () => { actualizarEstado('Conexión cerrada', 'neutral'); reajustarUI(); });
        conn.on('error', () => { actualizarEstado('Error', 'disconnected'); });
    });

    peer.on('error', (err) => {
        actualizarEstado('Error de conexión', 'disconnected');
        if (err.type === 'peer-not-found') alert("No se encontró el celular. Revisa el PIN.");
        reajustarUI();
    });
}

function actualizarEstado(mensaje, tipo) {
    el.status.innerText = mensaje;
    el.status.className = '';
    if (tipo === 'connected') el.status.classList.add('status-connected');
    else if (tipo === 'disconnected') el.status.classList.add('status-disconnected');
    else el.status.classList.add('status-neutral');
}

function reajustarUI() {
    el.pinArea.style.display = 'flex'; el.infoArea.style.display = 'none'; el.app.style.display = 'none';
    conn = null; peer = null; songsData = []; currentSongId = null;
    document.getElementById('pin-code').value = '';
}

function desconectarApp() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    reajustarUI();
}

function actualizarListaCanciones() {
    const filtro = document.getElementById('song-search').value.toLowerCase();
    el.songList.innerHTML = '';
    
    songsData.forEach((cancion, index) => {
        const tituloSeguro = cancion.title || 'Sin título';
        const autorSeguro = cancion.artist || '';
        const text = (tituloSeguro + ' ' + autorSeguro).toLowerCase();
        
        if (filtro && !text.includes(filtro)) return;

        const item = document.createElement('div');
        item.className = 'song-item';
        
        if (index === currentSongId) item.classList.add('active'); 
        
        let icono = cancion.isVisual ? ' 🖼️' : '';
        item.innerText = tituloSeguro + icono;
        
        item.onclick = () => seleccionarCancion(index);
        el.songList.appendChild(item);
    });
}

// 🚨 BÚSQUEDA EN TIEMPO REAL CONECTADA
document.getElementById('song-search').addEventListener('input', actualizarListaCanciones);

function seleccionarCancion(index) {
    const cancion = songsData[index];
    if (!cancion) return;
    currentSongId = index; 
    
    document.querySelectorAll('.song-item').forEach(e => e.classList.remove('active'));
    const items = document.querySelectorAll('.song-item');
    for (let item of items) {
        if (item.innerText.includes(cancion.title)) item.classList.add('active');
    }

    el.editor.title.value = cancion.title || "";
    el.editor.artist.value = cancion.artist || "";
    
    // NUEVOS CAJONES VINCULADOS
    el.editor.tono.value = cancion.tone || "";
    el.editor.bpm.value = cancion.bpm || "";
    el.editor.vel.value = cancion.velLetra || "";
	el.editor.duracion.value = cancion.duracion || ""; // NUEVO

    const btnGuardar = document.querySelector('.btn-primary');
    if (cancion.isVisual) {
        el.editor.content.value = `⚠️ ESTE ES UN ARCHIVO VISUAL (${cancion.tipoArchivo.toUpperCase()}).\nNo se puede editar desde la PC.`;
        el.editor.content.disabled = true;
        btnGuardar.style.opacity = "0.5";
        btnGuardar.style.pointerEvents = "none";
    } else {
        el.editor.content.value = cancion.lyrics || "";
        el.editor.content.disabled = false;
        btnGuardar.style.opacity = "1";
        btnGuardar.style.pointerEvents = "auto";
    }
    dibujarVisualizador();
}

function guardarCambios() {
    if (!conn || !conn.open) { 
        alert("No hay conexión activa con el celular."); 
        return; 
    }
    
    const titulo = el.editor.title.value.trim().toUpperCase();
    if (!titulo) { alert("La canción debe tener un título."); return; }

    const esNueva = typeof currentSongId === 'string' && currentSongId.startsWith('new_');
    const cancionOriginal = esNueva ? {} : (songsData[currentSongId] || {});

    // 🚨 EL OBJETO EXACTO DE TU CÓDIGO PERO EXTRALLENDO TONO/BPM/VEL DE LOS CAJONES
    const cancionActualizada = {
        indiceBaseDatos: esNueva ? null : currentSongId, 
        title: titulo,
        artist: el.editor.artist.value.trim().toUpperCase(),
        lyrics: el.editor.content.value,
        tone: el.editor.tono.value.trim() || "--",
        bpm: el.editor.bpm.value.trim(),
        velLetra: el.editor.vel.value.trim(),
		duracion: el.editor.duracion.value.trim(), // NUEVO
        folder: cancionOriginal.folder || "Sin Categoría",
        fecha: cancionOriginal.fecha || new Date().toISOString(),
        tipoArchivo: cancionOriginal.tipoArchivo || "texto"
    };

    // Enviamos como texto para evitar bugs
    conn.send(JSON.stringify({ 
        type: 'cancion_actualizar', 
        data: cancionActualizada 
    }));
}

function crearNuevaCancion() {
    el.editor.title.value = "NUEVA CANCIÓN";
    el.editor.artist.value = "Desconocido";
    el.editor.tono.value = "";
    el.editor.bpm.value = "";
    el.editor.vel.value = "";
	el.editor.duracion.value = ""; // NUEVO
    el.editor.content.value = "";
    el.editor.content.disabled = false;
    
    const btnGuardar = document.querySelector('.btn-primary');
    btnGuardar.style.opacity = "1";
    btnGuardar.style.pointerEvents = "auto";

    currentSongId = 'new_' + Date.now(); 
    dibujarVisualizador();
    el.editor.title.focus();
}

function cancelarEdicion() {
    if (confirm("¿Seguro que quieres cancelar? Perderás los cambios no guardados.")) {
        if (currentSongId && !currentSongId.toString().startsWith('new_')) seleccionarCancion(currentSongId);
        else {
            el.preview.innerHTML = '<div class="empty-preview">Selecciona una canción</div>';
            el.editor.title.value = "";
            el.editor.artist.value = "";
            el.editor.tono.value = "";
            el.editor.bpm.value = "";
            el.editor.vel.value = "";
            el.editor.content.value = "";
        }
    }
}

// ==========================================================================
// EL MOTOR CHORDPRO REAL (Extraído de tu App) PARA LA VISTA PREVIA
// ==========================================================================

function preProcesarMultiplicadores(texto) {
    let lineasCrudas = texto.split('\n');
    let lineasSeparadas = [];
    const patronIntro = /^(Intro\b(?:[\s\-:]|\([^)]*\))*)(.*)$/i;
    const patronMultiplicadorFinal = /\s*\(*x\s*\d+\)*$/i;

    for (let i = 0; i < lineasCrudas.length; i++) {
        let lineaCruda = lineasCrudas[i].trimEnd();
        let match = lineaCruda.match(patronIntro);
        if (match) {
            let encabezado = match[1];
            let resto = match[2].trim();
            if (resto === "") { lineasSeparadas.push(lineaCruda); } 
            else {
                let multiplicador = "";
                let matchMult = resto.match(patronMultiplicadorFinal);
                if (matchMult) { multiplicador = matchMult[0]; resto = resto.substring(0, resto.length - matchMult[0].length).trim(); }
                lineasSeparadas.push((encabezado.trim() + " " + multiplicador.trim()).trim());
                if (resto !== "") lineasSeparadas.push(resto);
            }
        } else { lineasSeparadas.push(lineaCruda); }
    }

    const patronEnc = /^(Solo de Guitarra|Instrumental Final|Pre-Coro|Pre - Coro|Pre Coro|PreCoro|Estructura|Instrumental|Estribillo|Interludio|Preludio|Estrofa|Puente|Outro|Final|Nota Final|Verso|Bridge|Intro|Coro|Coro Final|Solo|Bis)\b(?:[\s\-:\dIVXx]|\([^)]*\))*$/i;
    const patronMultiplicador = /\s*\(*x\s*(\d+)\)*/i; 
    let bloques = []; let bloqueActual = null;

    for (let i = 0; i < lineasSeparadas.length; i++) {
        let linea = lineasSeparadas[i]; let lineaLimpia = linea.trim();
        if (patronEnc.test(lineaLimpia)) {
            if (bloqueActual) bloques.push(bloqueActual);
            let multiplicador = 1;
            let matchMult = lineaLimpia.match(patronMultiplicador);
            if (matchMult) { multiplicador = parseInt(matchMult[1]); lineaLimpia = lineaLimpia.replace(patronMultiplicador, ''); }
            lineaLimpia = lineaLimpia.replace(/[\-=_.\+\/]{3,}/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
            bloqueActual = { encabezado: lineaLimpia, contenido: [], multiplicador: multiplicador };
        } else {
            if (bloqueActual) { bloqueActual.contenido.push(linea); } 
            else { bloqueActual = { encabezado: null, contenido: [linea], multiplicador: 1 }; }
        }
    }
    if (bloqueActual) bloques.push(bloqueActual);

    let textoFinal = [];
    for (let b of bloques) {
        if (b.encabezado !== null) { textoFinal.push(b.encabezado); }
        if (b.contenido.length > 0) {
            if (b.multiplicador > 1) {
                for (let m = 0; m < b.multiplicador; m++) {
                    textoFinal.push(...b.contenido);
                    if (m < b.multiplicador - 1) textoFinal.push(""); 
                }
            } else { textoFinal.push(...b.contenido); }
        }
    }
    return textoFinal.join('\n');
}

function convertirTextoAChordPro(texto) {
    if (!texto) return "";
    let lineas = texto.replace(/\t/g, '    ').split('\n');
    let resultado = [];
    const patronAcordes = /(?<![a-z0-9])([A-G][#b]?(?:m|maj|7|sus|add|dim|aug|[0-9])*(?:\/[A-G][#b]?)?|[-]{1,})(?![a-záéíóú0-9#])/g;
    const palabrasExcluidas = ["As", "Va", "He", "Me", "Solo", "Fue", "Del", "Al"];

    for (let i = 0; i < lineas.length; i++) {
        let lineaActual = lineas[i];
        let lineaLimpia = lineaActual.trimEnd();
        let lineaSinAcordes = lineaLimpia;
        let tieneAcordes = false;
        let mapaAcordes = {};
        
        let regex = new RegExp(patronAcordes.source, patronAcordes.flags);
        let match;
        
        while ((match = regex.exec(lineaLimpia)) !== null) {
            if (!palabrasExcluidas.includes(match[0].trim())) {
                tieneAcordes = true;
                mapaAcordes[match.index] = match[0].trim();
                lineaSinAcordes = lineaSinAcordes.substring(0, match.index) + ' '.repeat(match[0].length) + lineaSinAcordes.substring(match.index + match[0].length);
            }
        }

        let esLineaAcordes = tieneAcordes && lineaSinAcordes.replace(/\([^)]*\)/g, ' ').trim() === '';

        if (esLineaAcordes) {
            let lineaSiguiente = (i + 1 < lineas.length) ? lineas[i + 1].trimEnd() : null;
            if (lineaSiguiente !== null && lineaSiguiente.trim() !== '' && !lineaSiguiente.match(/^(Intro|Coro|Estrofa|Puente|Solo)/i)) {
                let nuevaLetra = "";
                let maxLen = Math.max(lineaLimpia.length, lineaSiguiente.length);
                for(let j = 0; j < maxLen; j++) {
                    if (mapaAcordes[j]) nuevaLetra += `[${mapaAcordes[j]}]`;
                    nuevaLetra += (lineaSiguiente[j] !== undefined ? lineaSiguiente[j] : " ");
                }
                resultado.push(nuevaLetra);
                i++; 
            } else {
                let nuevaLetra = "@@CHORDLINE@@";
                for(let j = 0; j < lineaLimpia.length; j++) {
                    if (mapaAcordes[j]) {
                        nuevaLetra += `<span class="chord">${mapaAcordes[j]}</span>`;
                        j += mapaAcordes[j].length - 1; 
                    } else { nuevaLetra += lineaLimpia[j]; }
                }
                resultado.push(nuevaLetra);
            }
        } else { resultado.push(lineaActual); }
    }
    return resultado.join('\n');
}

function dibujarVisualizador() {
    const content = el.editor.content.value;
    const title = el.editor.title.value || "Sin título";
    const artist = el.editor.artist.value || "Artista desconocido";

    const cancionActual = typeof currentSongId === 'number' ? songsData[currentSongId] : null;

    if (!content) {
        el.preview.innerHTML = '<div class="empty-preview">Selecciona una canción o comienza a escribir...</div>';
        return;
    }

    if (cancionActual && cancionActual.isVisual) {
        el.preview.innerHTML = `<div class="empty-preview" style="color: var(--primary);"><h3>${title}</h3><p>Esto es un archivo ${cancionActual.tipoArchivo.toUpperCase()}. Se ve directo en el celular.</p></div>`;
        return;
    }

    let html = `<h1>${title}</h1><h2>${artist}</h2>`;
    
    let textoExpandido = preProcesarMultiplicadores(content);
    let textoChordPro = convertirTextoAChordPro(textoExpandido);
    
    const lineas = textoChordPro.split('\n').map(l => l.trimEnd());
    for (let i = 0; i < lineas.length; i++) {
        let lineaProcesada = lineas[i];

        if (lineaProcesada.trim() === "") {
            html += `<div style="height: 1.2em;">&nbsp;</div>`; continue;
        }

        if (lineaProcesada.match(/^(Solo de Guitarra|Instrumental Final|Pre-Coro|Pre - Coro|Pre Coro|PreCoro|Estructura|Instrumental|Estribillo|Interludio|Preludio|Estrofa|Puente|Outro|Final|Nota Final|Verso|Bridge|Intro|Coro|Coro Final|Solo|Bis)\b(?:[\s\-:\dIVXx]|\([^)]*\))*$/i) && !lineaProcesada.includes('[')) { 
            html += `<div class="bloque-seccion-general"><span class="linea-encabezado-txt">${lineaProcesada}</span></div>`; continue;
        }

        if (lineaProcesada.startsWith('@@CHORDLINE@@')) {
            html += `<div class="linea-acorde">${lineaProcesada.replace('@@CHORDLINE@@', '')}</div>`; continue;
        }

        if (lineaProcesada.includes('[')) {
            let htmlLinea = `<div class="linea-sincronizada">`;
            let tokens = lineaProcesada.match(/\S+|\s+/g) || [lineaProcesada];
            for (let k = 0; k < tokens.length; k++) {
                let token = tokens[k];
                if (/^\s+$/.test(token)) {
                    htmlLinea += `<div class="chunk-box"><span class="chord chunk-chord-empty"></span><span class="chunk-lyric">${token}</span></div>`;
                } else {
                    htmlLinea += `<div class="word-wrapper" style="display:flex;">`;
                    let partes = token.split(/\[([^\]]+)\]/);
                    let textoInicial = partes[0];
                    if (textoInicial) htmlLinea += `<div class="chunk-box"><span class="chord chunk-chord-empty"></span><span class="chunk-lyric">${textoInicial}</span></div>`;
                    for (let j = 1; j < partes.length; j += 2) {
                        htmlLinea += `<div class="chunk-box"><span class="chord">${partes[j]}</span><span class="chunk-lyric">${partes[j+1] || "&#8203;"}</span></div>`;
                    }
                    htmlLinea += `</div>`;
                }
            }
            htmlLinea += `</div>`; html += htmlLinea;
        } else {
            html += `<div class="linea-letra-normal">${lineaProcesada}</div>`;
        }
    }
    el.preview.innerHTML = html;
}

// Conectamos eventos de actualización en tiempo real
el.editor.content.addEventListener('input', dibujarVisualizador);
el.editor.title.addEventListener('input', dibujarVisualizador);
el.editor.artist.addEventListener('input', dibujarVisualizador);
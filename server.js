const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar Base de Datos SQLite (Persistencia local en servidor)
const dbFile = path.join(__dirname, 'deportes_fid.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos SQLite (deportes_fid.db)');
        inicializarBaseDatos();
    }
});

// Crear Tablas y Datos Iniciales según requerimientos del proyecto
function inicializarBaseDatos() {
    db.serialize(() => {
        // Tabla de Atletas y Elegibilidad
        db.run(`CREATE TABLE IF NOT EXISTS atletas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            apellidos_nombres TEXT NOT NULL,
            disciplina TEXT NOT NULL,
            ciclo_fid TEXT NOT NULL,
            creditos_aprobados INTEGER NOT NULL,
            estado_eligibilidad TEXT NOT NULL
        )`);

        // Tabla de Monitoreo Biométrico y Cargas
        db.run(`CREATE TABLE IF NOT EXISTS biometria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semana TEXT NOT NULL,
            fc_reposo INTEGER NOT NULL,
            carga_rpe REAL NOT NULL,
            control_peso TEXT NOT NULL
        )`);

        // Insertar datos de prueba si la tabla está vacía
        db.get("SELECT COUNT(*) as count FROM atletas", (err, row) => {
            if (row.count === 0) {
                const stmtAtletas = db.prepare("INSERT INTO atletas (apellidos_nombres, disciplina, ciclo_fid, creditos_aprobados, estado_eligibilidad) VALUES (?, ?, ?, ?, ?)");
                stmtAtletas.run("Alarcón Quispe, Marco", "Karate-Do", "VI Ciclo", 18, "Habilitado");
                stmtAtletas.run("Medina Rojas, Lucía", "Vóleibol", "IV Ciclo", 20, "Habilitado");
                stmtAtletas.run("Torres Mendoza, Carlos", "Futsal", "VIII Ciclo", 16, "Habilitado");
                stmtAtletas.run("Huamán Poma, Sofia", "Atletismo", "V Ciclo", 22, "Habilitado");
                stmtAtletas.finalize();

                const stmtBiometria = db.prepare("INSERT INTO biometria (semana, fc_reposo, carga_rpe, control_peso) VALUES (?, ?, ?, ?)");
                stmtBiometria.run("Sem 1", 58, 450, "OK");
                stmtBiometria.run("Sem 2", 57, 520, "OK");
                stmtBiometria.run("Sem 3", 56, 610, "OK");
                stmtBiometria.run("Sem 4", 55, 580, "OK");
                stmtBiometria.run("Sem 5", 54, 690, "OK");
                stmtBiometria.finalize();
                console.log('Datos iniciales cargados en la base de datos.');
            }
        });
    });
}

// --- ENDPOINTS DE LA API REST ---

// 1. Obtener todos los atletas
app.get('/api/atletas', (req, res) => {
    db.all("SELECT * FROM atletas", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// 2. Registrar nuevo atleta (Habilita funcionalidad completa de inserción)
app.post('/api/atletas', (req, res) => {
    const { apellidos_nombres, disciplina, ciclo_fid, creditos_aprobados, estado_eligibilidad } = req.body;
    const query = `INSERT INTO atletas (apellidos_nombres, disciplina, ciclo_fid, creditos_aprobados, estado_eligibilidad) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [apellidos_nombres, disciplina, ciclo_fid, creditos_aprobados, estado_eligibilidad], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: this.lastID, message: "Atleta registrado correctamente." });
    });
});

// 3. Obtener métricas biométricas
app.get('/api/biometria', (req, res) => {
    db.all("SELECT * FROM biometria", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// Iniciar servidor web en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor web ejecutándose en http://localhost:${PORT}`);
});
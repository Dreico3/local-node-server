const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();

// ========================
// Configuración de rutas y carpetas
// ========================
const UPLOADS_FOLDER = "uploads/";
const UPLOADS_IMAGE = path.join(UPLOADS_FOLDER, "images");
const UPLOADS_VIDEO = path.join(UPLOADS_FOLDER, "videos");
const UPLOADS_MUSIC = path.join(UPLOADS_FOLDER, "music");

// ========================
// Middlewares
// ========================
app.use("/uploads", express.static(UPLOADS_FOLDER));
app.use(express.json());
app.use(cors({
  origin: ["http://192.168.0.10:4200", "http://localhost:4200"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

const upload = multer({ storage: multer.memoryStorage() });

// ========================
// HTML simple de prueba
// ========================
app.get("/", (req, res) => {
  res.send(`
    <h2>Subir archivo</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="files" multiple>
      <button type="submit">Subir</button>
    </form>
  `);
});

// ========================
// Endpoint para subir archivos
// ========================
app.post("/upload", upload.array("files"), (req, res) => {
  const folderPath = (req.body.path || "").replace(/\\/g, "/");
  const targetDir = path.join(__dirname, UPLOADS_FOLDER, folderPath);
  fs.mkdirSync(targetDir, { recursive: true });

  req.files.forEach((file) => {
    const filePath = path.join(targetDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
  });

  res.send({ mensaje: "Archivos subidos correctamente", files: req.files });
});

// ========================
// Listado de archivos por tipo
// ========================
const listFiles = (dir, prefix) => (req, res) => {
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Error al leer la carpeta." });
    const fileLinks = files.map((file) => ({
      name: file,
      url: `${prefix}/${encodeURIComponent(file)}`,
    }));
    res.json(fileLinks);
  });
};

app.get("/images", listFiles(UPLOADS_IMAGE, "/uploads/images"));
app.get("/music", listFiles(UPLOADS_MUSIC, "/uploads/music"));
app.get("/videos", listFiles(UPLOADS_VIDEO, "/uploads/videos"));

// ========================
// Obtener archivos en subcarpetas
// ========================
app.get("/others", (req, res) => {
  const folderPath = path.join(UPLOADS_FOLDER, req.query.url || "");
  fs.readdir(folderPath, (err, files) => {
    if (err) return res.status(500).json({ error: "Error al leer la carpeta." });

    const fileLinks = files.map((file) => ({
      name: file,
      url: `/uploads/${req.query.url}/${encodeURIComponent(file)}`,
    }));

    res.json(fileLinks);
  });
});

// ========================
// Crear carpetas
// ========================
app.post("/create", (req, res) => {
  const { name, ubication } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).send("Nombre inválido");
  }

  const dir = path.join(__dirname, UPLOADS_FOLDER, ubication || "", name);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return res.send({ mensaje: `Carpeta '${name}' creada` });
  } else {
    return res.status(409).send("La carpeta ya existe");
  }
});

// ========================
// Iniciar el servidor
// ========================
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Servidor en http://192.168.X.X:${PORT}`);
});


/* const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();

const UPLOADS_FOLDER = "uploads/";
const UPLOADS_IMAGE = path.join(UPLOADS_FOLDER, "images");
const UPLOADS_VIDEO = path.join(UPLOADS_FOLDER, "videos");
const UPLOADS_MUSIC = path.join(UPLOADS_FOLDER, "music");

app.use("/uploads/images", express.static(UPLOADS_IMAGE));
app.use("/uploads/music", express.static(UPLOADS_MUSIC));
app.use(express.json());

app.use(cors({
  origin: ["http://192.168.0.10:4200", "http://localhost:4200"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.send(`
    <h2>Subir archivo</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="files" multiple>
      <button type="submit">Subir</button>
    </form>
  `);
});

// ==========================
// 📁 Subir Archivos
// ==========================
app.post("/upload", upload.array("files"), (req, res) => {
  const folderPath = (req.body.path || "").replace(/\\/g, "/");
  const targetDir = path.join(__dirname, UPLOADS_FOLDER, folderPath);
  fs.mkdirSync(targetDir, { recursive: true });

  req.files.forEach((file) => {
    const filePath = path.join(targetDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
  });

  res.send({ mensaje: "Archivos subidos correctamente", files: req.files });
});

// ==========================
// 🎬 Servir videos con soporte de rangos
// ==========================
app.get("/videos/:filename", (req, res) => {
  const filePath = path.join(UPLOADS_VIDEO, req.params.filename);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).end("Archivo no encontrado");
    }

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const positions = range.replace(/bytes=/, "").split("-");
      const start = parseInt(positions[0], 10);
      const end = positions[1] ? parseInt(positions[1], 10) : stats.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    }
  });
});

// ==========================
// 📂 Listar archivos
// ==========================
const listFiles = (dir, prefix) => (req, res) => {
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Error al leer la carpeta." });
    const fileLinks = files.map((file) => ({
      name: file,
      url: `${prefix}/${encodeURIComponent(file)}`,
    }));
    res.json(fileLinks);
  });
};

app.get("/images", listFiles(UPLOADS_IMAGE, "/uploads/images"));
app.get("/music", listFiles(UPLOADS_MUSIC, "/uploads/music"));
app.get("/videos", listFiles(UPLOADS_VIDEO, "/videos")); // Usa ruta nueva de video

// ==========================
// 📁 Crear carpetas
// ==========================
app.post("/create", (req, res) => {
  const { name, ubication } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).send("Nombre inválido");
  }

  const dir = path.join(__dirname, UPLOADS_FOLDER, ubication || "", name);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return res.send({ mensaje: `Carpeta '${name}' creada` });
  } else {
    return res.status(409).send("La carpeta ya existe");
  }
});

app.get("/others", (req, res) => {
  const folderPath = path.join(UPLOADS_FOLDER, req.query.url || "");
  fs.readdir(folderPath, (err, files) => {
    if (err) return res.status(500).json({ error: "Error al leer la carpeta." });
    const fileLinks = files.map((file) => ({
      name: file,
      url: `/uploads/${req.query.url}/${encodeURIComponent(file)}`,
    }));
    res.json(fileLinks);
  });
});

// ==========================
// 🚀 Iniciar servidor
// ==========================
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://192.168.X.X:${PORT}`);
});
 */
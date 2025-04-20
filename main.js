const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const upload = multer({ dest: "uploads/" }); // Carpeta donde se guardarán los archivos
const UPLOADS_FOLDER = "uploads";
const UPLOADS_IMAGE = "uploads/images";
const UPLOADS_VIDEO = "uploads/videos";
const UPLOADS_MUSIC = "uploads/music";
const cors = require("cors");
const { url } = require("inspector");

app.use("/uploads", express.static("uploads"));
app.use(
  cors({
    origin: ["http://192.168.0.8:4200", "http://localhost:4200"],
  })
);
// Página HTML para subir archivos
function saveFiles(file) {
  const newPath = `./uploads/${file.originalname}`;
  fs.renameSync(file.path, newPath);
  return newPath;
}
app.get("/", (req, res) => {
  res.send(`
    <h2>Subir archivo</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file">
      <button type="submit">Subir</button>
    </form>
  `);
});
//here look all or I think so
app.get("/images", (req, res) => {
  /* fs.readdir(UPLOADS_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer la carpeta.");
    }
    console.log(files);
    let fileList = files
      .map((file) => `<li><a href="/uploads/${file}">${file}</a></li>`)
      .join("");

    res.send(`<h2>Archivos disponibles</h2><ul>${fileList}</ul>`); */

  fs.readdir(UPLOADS_IMAGE, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error al leer la carpeta." });
    }

    const fileLinks = files.map((file) => ({
      name: file,
      url: `/uploads/images/${encodeURIComponent(file)}`,
    }));
    console.log(fileLinks);
    res.json(fileLinks);
  });
});
app.get("/music", (req, res) => {
  fs.readdir(UPLOADS_MUSIC, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error al leer la carpeta." });
    }
    const fileLinks = files.map((file) => ({
      name: file,
      url: `/uploads/music/${encodeURIComponent(file)}`,
    }));
    console.log(fileLinks);
    res.json(fileLinks);
  });
});

// Ruta para subir archivos
app.post("/upload", upload.single("file"), (req, res) => {
  saveFiles(req.file);
  res.send(`Archivo subido: ${req.file.originalname}`);
});

// Inicia el servidor
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Servidor en http://192.168.X.X:${PORT}`);
});

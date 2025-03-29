const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const upload = multer({ dest: "uploads/" }); // Carpeta donde se guardarán los archivos
const UPLOADS_FOLDER = "uploads";

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
app.get("/files", (req, res) => {
  fs.readdir(UPLOADS_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).send("Error al leer la carpeta.");
    }
    console.log(files);
    let fileList = files
      .map((file) => `<li><a href="/uploads/${file}" download>${file}</a></li>`)
      .join("");

    res.send(`<h2>Archivos disponibles</h2><ul>${fileList}</ul>`);
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

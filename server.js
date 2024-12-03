const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public'))); // 'public' es donde están tus archivos HTML/JS

app.listen(3000, () => {
    console.log('Servidor en el puerto 3000');
});

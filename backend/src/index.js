require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Simple auth config
const AUTH_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

// Recibir alerta desde la PWA
app.post('/api/alertas', async (req, res) => {
  try {
    const { nombre, direccion, telefono, lat, lon } = req.body;
    
    if (!nombre || !direccion || !telefono) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const nuevaAlerta = await prisma.alert.create({
      data: {
        nombre,
        direccion,
        telefono,
        lat: lat ? parseFloat(lat) : null,
        lon: lon ? parseFloat(lon) : null
      }
    });

    // Emitir a los clientes conectados
    io.emit('nueva_alerta', nuevaAlerta);

    res.status(201).json(nuevaAlerta);
  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las alertas para el dashboard
app.get('/api/alertas', async (req, res) => {
  try {
    const alertas = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Limitar a las últimas 100 para no saturar
    });
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Actualizar estado de una alerta
app.put('/api/alertas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota, password } = req.body;

    if (password !== AUTH_PASSWORD) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const alerta = await prisma.alert.update({
      where: { id },
      data: { estado, nota }
    });

    // Notificar a todos que la alerta cambió de estado
    io.emit('alerta_actualizada', alerta);

    res.json(alerta);
  } catch (error) {
    console.error('Error actualizando alerta:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Autenticación simple para frontend
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === AUTH_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor BAIP corriendo en puerto ${PORT}`);
});

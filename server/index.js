// Auth: https://github.com/websockets/ws/blob/HEAD/examples/express-session-parse
// WS: https://www.npmjs.com/package/ws

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import WebSocketServer from 'ws';
const http = require("http");
import session from 'express-session';
const sqlite3 = require('sqlite3').verbose();
import { createHash } from 'crypto';

const PORT = process.env.PORT;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const responsePIDs = ['vehicleSpeed', 'engineRPM', 'coolantTemperature', 'throttlePosition', 'fuelPressure'];

let data = null;

const app = express();
const map = new Map();

const sessionParser = session({
    saveUninitialized: false,
    secret: process.env.SECRET,
    resave: false
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../client/web-build')));
app.use(sessionParser);

const server = http.createServer(app)

const wss = new WebSocketServer.Server({ noServer: true });

let db = new sqlite3.Database('./database/obd.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the OBD database.');
});
db.get("PRAGMA foreign_keys = ON");
db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL)');
db.run(`CREATE TABLE IF NOT EXISTS data(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    timestamp INTEGER NOT NULL, 
    vehicleSpeed INTEGER, 
    engineRPM INTEGER, 
    coolantTemperature INTEGER, 
    throttlePosition INTEGER,
    fuelPressure INTEGER,
    userID INTEGER NOT NULL, 
    FOREIGN KEY (userID) REFERENCES users(id)
    )`);
db.run(`CREATE TABLE IF NOT EXISTS gps(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    timestamp INTEGER NOT NULL, 
    latitude REAL NOT NULL, 
    longitude REAL NOT NULL,
    userID INTEGER NOT NULL, 
    FOREIGN KEY (userID) REFERENCES users(id)
    )`)
const sqlInsert = 'INSERT INTO data(timestamp, vehicleSpeed, engineRPM, coolantTemperature, throttlePosition, fuelPressure, userID) VALUES(?,?,?,?,?,?,?)';

app.post('/login', function (req, res) {
    db.get('SELECT * FROM users WHERE username = ?', [req.body?.username], (err, user) => {
        if (err) return console.error(err.message);

        console.log(user);
        if (!user) {
            console.log('Unauthorized user', req.body?.username);
            return res.send({ result: 'UNAUTHORIZED', message: 'Invalid username or password'});
        } 
        const password = createHash('md5').update(req.body.password).digest('hex');
        if (user.password !== password) {
            
            console.log('Invalid password');
            return res.send({ result: 'UNAUTHORIZED', message: 'Invalid password'});
        }
    
        console.log(`Updating session for user ${user.id}`);
        req.session.userId = user.id;
        res.send({ result: 'OK', message: 'Session updated' });
    });
});

app.delete('/logout', function (request, response) {
    const ws = map.get(request.session.userId);
  
    console.log('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();
  
    response.send({ result: 'OK', message: 'Session destroyed' });
    });
});

app.post('/register', function(req, res) {
    if (!req.body?.username || !req.body?.password) {
        res.send({ result: 'FAIL', message: 'Provide both username and password' });
        return;
    }

    const password = createHash('md5').update(req.body.password).digest('hex');

    db.run('INSERT INTO users(username, password) VALUES(?,?)', [req.body.username, password], function(err) {
        if (err) return console.error(err.message);
    });
    res.send({ result: 'SUCCESS', message: 'Created new user' });
});

app.get('/users/:userId', (req, res) => {
    const userID = req.params.userId;
    db.all('SELECT * FROM data WHERE userID = ?', [userID], (err, rows) => {
        if (err) return console.error(err.message);

        res.send(JSON.stringify(rows));
    });
});

app.get('/user/data/:pidName', (req, res) => {
    const userID = req.session.userId;
    if (userID === undefined) return res.send('Unauthorized!');

    const pidName = req.params.pidName;
    const indexPID = responsePIDs.findIndex((obj) => obj === pidName);
    if (indexPID === -1) return console.log('Wrong PID parameter');

    db.all(`SELECT timestamp, ${pidName} FROM data WHERE userID = ? AND ${pidName} IS NOT NULL`, [userID], (err, rows) => {
        if (err) return console.error(err.message);

        res.send(JSON.stringify(rows));
    });
});

app.post('/api/gps', (req, res) => {
    if (req.session.userId === undefined) return res.send('Unauthorized!');

    db.run('INSERT INTO gps(timestamp, latitude, longitude, userID) VALUES(?,?,?,?)', [req.body.timestamp, req.body.latitude, req.body.longitude, req.session.userId], function(err) {
        if (err) {
            // res.status(400).send('Failed to add GPS coordinate');
            return console.error(err.message);
        }
    });
    // res.status(201).send('GPS coordinate added');
    console.log('Received GPS coordinates');
});

app.get('/api/gps', (req, res) => {
    if (req.session.userId === undefined) return res.send('Unauthorized!');
    
    db.all(`SELECT latitude, longitude FROM gps WHERE userID = ?`, [req.session.userId], (err, rows) => {
        if (err) return console.error(err.message);
        res.send(JSON.stringify(rows));
    });
});

app.get('/db', function (req, res) {
    db.all('SELECT * FROM data', [], (err, rows) => {
        if (err) return console.log(err.message);

        res.send(rows);
    });
});

app.delete('/db', function (req, res) {
    if (req.body.password == PASSWORD) {
        db.run('DROP TABLE IF EXISTS data', (error) => {
            if (error) return console.log(error.message);

            res.send('Deleted database');
        })
    }
});

server.on('upgrade', function (request, socket, head) {
    console.log('Parsing session from request...');
  
    sessionParser(request, {}, () => {
      if (!request.session.userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
  
      console.log('Session is parsed!');
  
      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
      });
    });
});

wss.on('connection', function (ws, request) {
    const userId = request.session.userId;
    map.set(userId, ws);

    ws.isAlive = true;
    ws.on('pong', heartbeat);
  
    ws.on('message', function (message) {

        // Broadcast to other clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocketServer.OPEN) {
                client.send(message);
            }
        });

        const dataObj = JSON.parse(message);
        const dataVals = [dataObj?.timestamp, dataObj?.vehicleSpeed, dataObj?.engineRPM, dataObj?.coolantTemperature, dataObj?.throttlePosition, dataObj?.fuelPressure, userId];
        db.run(sqlInsert, dataVals, function(err) {
            if (err) {
                return console.error(err.message);
            }
        });
    });
  
    ws.on('close', function () {
        map.delete(userId);
    });
});

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        console.log('Terminating inactive client');
        return ws.terminate();
      }
  
      ws.isAlive = false;
      ws.ping();
    });
}, 30000);

wss.on('close', function close() {
    clearInterval(interval);
  });

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

function heartbeat() {
    this.isAlive = true;
}
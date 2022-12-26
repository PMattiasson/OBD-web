// Auth: https://github.com/websockets/ws/blob/HEAD/examples/express-session-parse

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import WebSocketServer from 'ws';
const http = require("http");
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
const sqlite3 = require('sqlite3').verbose();
import { createHash } from 'crypto';

const PORT = process.env.PORT;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

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
    time TEXT NOT NULL, 
    vehicle_speed INTEGER, 
    engine_rpm INTEGER, 
    coolant_temperature INTEGER, 
    user_id INTEGER NOT NULL, 
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
const sqlInsert = 'INSERT INTO data(time, vehicle_speed, engine_rpm, coolant_temperature, user_id) VALUES(?,?,?,?,?)';

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
        if (err) {
            return console.error(err.message);
        }
    });
    res.send({ result: 'SUCCESS', message: 'Created new user' });
});

app.get('/db/arr', function (req, res) {
    db.all('SELECT * FROM data', [], (err, rows) => {
        if (err) return console.log(err.message);
        
        let result = {};
        rows.forEach((row) => {
            Object.keys(row).forEach((key) => {
                result[key] = (result[key] || []).concat([row[key]]);
            })
        })

        res.send(result);
    });
});

app.get('/users/:userId', (req, res) => {
    const user_id = req.params.userId;
    db.all('SELECT * FROM data WHERE user_id = ?', [user_id], (err, rows) => {
        if (err) return console.error(err.message);

        res.send(rows);
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
        db.run('DELETE FROM data', (error) => {
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
        const dataVals = [dataObj?.timestamp, dataObj?.VehicleSpeed, dataObj?.EngineRPM, dataObj?.CoolantTemperature, userId];
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
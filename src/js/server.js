import { spawn } from 'child_process';
import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export default async function server() {
    const app = express();
    app.use(express.static(path.join(__dirname, '../web')));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.text());
    app.get('/', (_req, res) => {
        res.sendFile(path.join(__dirname, '../web/index.html'));
    });
    app.get('/story/retrieve', (_req, res) => {
        fs.readFile(path.join(__dirname, '../../db/story.txt'), 'utf-8', (err, data) => {
            if (!err)
                res.send(data);
            else
                res.sendStatus(500);
        });
    });
    app.post('/story/change', (req, res) => {
        const story = req.body;
        fs.writeFile(path.join(__dirname, '../../db/story.txt'), story, (err) => {
            if (!err)
                res.sendStatus(200);
            else
                res.sendStatus(500);
        });
    });
    const uploadDir = path.join(__dirname, '../../db/images');
    fs.mkdirSync(uploadDir, { recursive: true });
    const storage = multer.diskStorage({
        destination: function (_req, _file, cb) {
            cb(null, uploadDir);
        },
        filename: function (_req, file, cb) {
            cb(null, file.originalname);
        }
    });
    const upload = multer({ storage: storage });
    app.post('/image/add', upload.single('image'), (req, res) => {
        if (req.file) {
            fs.readdir(path.join(__dirname, '../../db/images'), (err, files) => {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                }
                else {
                    files.forEach(file => {
                        if (file !== req.file.filename) {
                            fs.unlink(path.join(__dirname, '../../db/images', file), err => {
                                if (err)
                                    console.log(err);
                            });
                        }
                    });
                    res.sendStatus(200);
                }
            });
        }
        else {
            res.sendStatus(400);
        }
    });
    app.get('/image/retrieve', (_req, res) => {
        fs.readdir(path.join(__dirname, '../../db/images'), (err, files) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            }
            else {
                if (files[0]) {
                    const imagePath = path.join(__dirname, '../../db/images', files[0]);
                    res.sendFile(imagePath);
                }
                else {
                    res.sendStatus(200);
                }
            }
        });
    });
    app.get('/image/remove', (_req, res) => {
        try {
            fs.emptyDirSync(path.join(__dirname, '../../db/images'));
            res.sendStatus(200);
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    });
    app.get('/start-production', (_req, res) => {
        try {
            const child = spawn('powershell.exe', ['-File', path.join(__dirname, '../../cli/startAndWait.ps1')]);
            child.on('close', () => {
                res.sendStatus(200);
            });
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    });
    app.post('/image/title/set', (req, res) => {
        const title = req.body;
        fs.writeFile(path.join(__dirname, '../../db/title.txt'), title, (err) => {
            if (!err)
                res.sendStatus(200);
            else
                res.sendStatus(500);
        });
    });
    app.get('/image/title/get', (_req, res) => {
        fs.readFile(path.join(__dirname, '../../db/title.txt'), 'utf-8', (err, data) => {
            if (!err)
                res.send(data);
            else
                res.sendStatus(500);
        });
    });
    app.listen(492, () => {
        console.log('Hold ctrl and click the link below to open the browser:');
        console.log('http://localhost:492');
    });
}

const express    = require('express');
const router     = express.Router();
const SFTPClient = require('ssh2').Client;
const FTPClient  = require('ftp');

router.use('/sftp', require('./sftp'));

/* GET home page. */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true
    });
});

/** Should be removed once v4 is in live */
router.post('/sftp_test', (req, res) => {
    const isSFTP    = req.body.is_sftp;
    const host      = req.body.host;
    const port      = req.body.port;
    const username  = req.body.username;
    const password  = req.body.password;

    console.log("isSFTP::::", isSFTP)
    
    if (isSFTP > 0) {
        const conn = new SFTPClient(); 
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                // if (err) {
                //     console.log('SFTP error:', err);
                //     res.send({ success: false, error: err.message });
                // } else {
                    res.send({ success: true });
                // }
            });
        }).connect({
            host: host,
            port: port,
            username: username,
            password: password
        });
    } else {
        const encryption = req.body.encryption;
        const conn = new FTPClient();
        
        conn.on('ready', () => {
            res.send({ success: true });
        });

        conn.on('error', () => {
            conn.end();
            res.send({success: false})
        });
        
        conn.connect({
            host: host,
            port: port,
            user: username,
            password: password,
            secure: encryption > 0
        });
    }
});

router.post('/sftp_upload', (req, res) => {
    const isSFTP    = req.body.is_sftp;
    const protocal  = req.body.protocal;
    const host      = req.body.host;
    const port      = req.body.port;
    const username  = req.body.username;
    const password  = req.body.password;
    const content   = req.body.content;
    const filename  = req.body.filename;
    
    if (isSFTP > 0) {
        const conn = new SFTPClient(); 
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    console.log('SFTP error:', err);
                    res.send({ success: false, error: err.message });
                } else {
                    const writeStream = sftp.createWriteStream(`/${filename}`);
                    writeStream.on('close', () => {
                        console.log( "File transferred" );
                        sftp.end();
                        res.send({ success: true, url: `${protocal}${host}/lightspeed/${filename}` });
                    });
                    writeStream.write(content);
                    writeStream.end();
                }
            });
        }).connect({
            host: host,
            port: port,
            username: username,
            password: password
        });
    } else {
        const encryption = req.body.encryption;
        const conn = new FTPClient();
        conn.on('ready', () => {
            conn.put(content, `/${filename}`, (err) => {
                if (err) {
                    console.log('FTP error:', err);
                    res.send({ success: false, error: err.message });
                } else {
                    console.log( "File transferred" );
                    res.send({ success: true, url: `${protocal}${host}/ls/${filename}` });
                }

                conn.end();
            });
        });

        conn.on('error', (err) => {
            conn.end();
            res.send({success: false, message: err})
        });

        conn.connect({
            host: host,
            port: port,
            user: username,
            password: password,
            secure: encryption > 0
        });
    }
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require('multer');
const fs = require('fs');
const { MongoClient, ServerApiVersion, GridFSBucket, ObjectId } = require("mongodb");
const { auth } = require("express-openid-connect");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectToDatabase() {
    try {
        if (!client.isConnected) {
            await client.connect();
            console.log("Successfully connected to MongoDB!");
        }
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        throw err;
    }
}


function deleteFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Failed to read directory: ${err.message}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Failed to get stats for file: ${err.message}`);
                    return;
                }

                if (stats.isFile()) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Failed to delete file: ${err.message}`);
                        } else {
                            console.log(`Deleted file: ${filePath}`);
                        }
                    });
                }
                else if (stats.isDirectory()) {
                    console.log(`Skipping directory: ${filePath}`);
                }
            });
        });
    });
}

app.use(express.static(path.join(__dirname, 'public')));

const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    secret: process.env.AUTH0_CLIENT_SECRET
};

  
app.use(auth(config));

app.get('/', (req, res) => {
    if (req.oidc.isAuthenticated()) {
        const userName = req.oidc.user.name;

        res.render('dashboard', { userName });
    } else {
        res.redirect('/login');
    }
});


app.get('/models', async (req, res) => {
    try {
        await connectToDatabase();

        const db = client.db('webapp');
        const modelsCollection = db.collection('models');

        const userId = req.oidc?.user?.sub;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const models = await modelsCollection.find({ userId }).toArray();
        console.log("User ID:", userId);
        console.log(models);

        res.render('models', { models });
    } catch (err) {
        console.error("Error fetching models:", err);
        res.status(500).json({ error: 'An error occurred while fetching models.' });
    }
});
  
app.post('/models', async (req, res) => {
    try {
        const { name, price } = req.body;
        console.log(req.body);
        db.models.files.find({ _id: ObjectId("678bc3d52e91c701ade937e0") });
        res.redirect('/models');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/model/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const db = client.db('webapp');
        const collection = db.collection('models');

        const modelId = req.params.id;
        const users = req.oidc.user;
        const models = await collection.findOne({ _id: new ObjectId(modelId) });
        console.log(models);
        console.log(users);

        if (!modelId) {
            return res.status(400).json({ error: 'Model ID is required.' });
        }

        res.render('detail', { models, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/list/:id', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('webapp');
        const collection = db.collection('models');

        const modelId = req.params.id;
        const models2 = await collection.findOne({ _id: new ObjectId(modelId) });
        console.log("Line 261:", models2);

        try {
            const result = await collection.updateOne(
                { _id: new ObjectId(modelId) },
                { $set: { list: !models2.list } }
            );

            const userId = req.oidc.user.sub;
            console.log(userId);

            const models = await collection.find({ userId }).toArray();
        
            if (result.matchedCount === 0) {
                res.status(404).send({ message: "No document found with the given userId." });
            } 

            res.render('models', { models });
        } catch (error) {
            console.error("Error updating document:", error);
            res.status(500).send({ message: "An error occurred while updating the document." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/profile', async (req, res) => {
    try {
        await connectToDatabase();

        const db = client.db('webapp');
        const modelsCollection = db.collection('models');

        const userId = req.oidc.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log("User ID:", userId);

        res.render('profile', { userId });
    } catch (err) {
        console.error("Error fetching models:", err);
        res.status(500).json({ error: 'An error occurred while fetching models.' });
    }
});

app.get('/cart/:id', async (req, res) => {
    try {
        await connectToDatabase();

        const db = client.db('webapp');
        const modelsCollection = db.collection('models');

        const value = req.params.id;
        console.log(value);

        const userId = req.oidc.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log("User ID:", userId);

        res.render('cart', { value });
    } catch (err) {
        console.error("Error fetching models:", err);
        res.status(500).json({ error: 'An error occurred while fetching models.' });
    }
});

app.get('/cart', async (req, res) => {
    try {
        await connectToDatabase();

        const db = client.db('webapp');
        const modelsCollection = db.collection('models');

        const userId = req.oidc.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log("User ID:", userId);
        const value = 0;

        res.render('cart', { value });
    } catch (err) {
        console.error("Error fetching models:", err);
        res.status(500).json({ error: 'An error occurred while fetching models.' });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.fields([{ name: 'modelFile', maxCount: 1 }]), async (req, res) => {
    try {
        const { modelName, modelDescription, modelType } = req.body;
        const file = req.files['modelFile'] ? req.files['modelFile'][0] : null;
        const path_to_file = file.filename;
    
        const filePath = path.join(__dirname, 'uploads', path_to_file);

        await connectToDatabase();

        const db = client.db('webapp');
        
        const bucket = new GridFSBucket(db, { bucketName: 'models' });

        const fileStream = fs.createReadStream(filePath);

        const uploadStream = bucket.openUploadStream(filePath);

        const { size } = fs.statSync(filePath);

        const formatSize = (size) => {
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let index = 0;
            let fileSize = size;

            while (fileSize >= 1024 && index < units.length - 1) {
                fileSize /= 1024;
                index++;
            }

            return `${fileSize.toFixed(2)} ${units[index]}`;
        };

        const formattedSize = formatSize(size);

        await new Promise((resolve, reject) => {
            fileStream.pipe(uploadStream);

            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        const userId = req.oidc.user.sub;

        const modelsCollection = db.collection('models');
        const result = await modelsCollection.insertOne({
            userId: userId,
            name: modelName,
            type: modelType,
            size: formattedSize,
            list: false,
            description: modelDescription,
            file: uploadStream.id,
            lastUpdated: new Date(),
        });

        const models = await modelsCollection.find({ userId }).toArray();

        deleteFilesInFolder('./uploads');

        res.render('models', { models });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

app.get('/download/:id', async (req, res) => {
    const fileId = req.params.id;

    try {
        console.log(`Received download request for file ID: ${fileId}`);

        if (!ObjectId.isValid(fileId)) {
            console.log('Invalid ObjectId:', fileId);
            return res.status(400).send('Invalid file ID.');
        }

        await connectToDatabase();
        const db = client.db('webapp');
        const collection = db.collection('models');

        console.log('Database connection successful.');

        const fileDocument = await collection.findOne({ _id: new ObjectId(fileId) });

        if (!fileDocument) {
            console.error('File not found:', fileId);
            return res.status(404).send('File not found.');
        }

        const bucket = new GridFSBucket(db, { bucketName: 'models' });
        const fileStream = bucket.openDownloadStream(new ObjectId(fileDocument.file));

        res.setHeader('Content-Disposition', 'attachment; filename="downloaded-file.h5"');
        res.setHeader('Content-Type', 'application/octet-stream');

        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('Error retrieving file:', err);
            return res.status(500).send('Error downloading the file.');
        });

        fileStream.on('finish', () => {
            console.log('File download stream finished.');
        });

    } catch (err) {
        console.error('Error occurred during the download process:', err);

        return res.status(500).send('Error retrieving the file.');
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

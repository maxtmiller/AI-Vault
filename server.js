require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require('multer');
const fs = require('fs');
const { MongoClient, ServerApiVersion, GridFSBucket, ObjectId } = require("mongodb");
const { auth } = require("express-openid-connect");

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

// const upload = multer({ dest: 'uploads/' });

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

async function createCollection() {
    try {
        // Connect to MongoDB server
        await client.connect();
        console.log("Connected to MongoDB!");

        // Specify the database
        const db = client.db('webapp'); // Replace with your actual database name

        // Check if the 'models' collection exists
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        // If 'models' collection doesn't exist, create it
        if (!collectionNames.includes('models')) {
            await db.createCollection('models');
            console.log("Collection 'models' created.");
        }

        // Proceed with file upload and insertion
        const filePath = path.join(__dirname, 'trained_model.h5');
        const bucket = new GridFSBucket(db, { bucketName: 'models' });

        // Create a readable stream from the file
        const fileStream = fs.createReadStream(filePath);

        // Open a GridFS upload stream
        const uploadStream = bucket.openUploadStream('trained_model.h5');

        const { size } = fs.statSync(filePath); // size is in bytes

        // Convert size to a more readable format (e.g., KB, MB)
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

        // Wait for the file to be uploaded
        await new Promise((resolve, reject) => {
            // Pipe the file to GridFS
            fileStream.pipe(uploadStream);

            // Handle upload completion and error
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        // After upload completes, insert metadata into the collection
        const modelsCollection = db.collection('models');
        const result = await modelsCollection.insertOne({
            userId: 'development',
            name: 'AI Model',
            type: 'NLP',
            size: formattedSize,
            list: false,
            description: '',
            file: uploadStream.id,
            lastUpdated: new Date(),
        });

        console.log("Model metadata inserted with file ID:", uploadStream.id);
    } catch (err) {
        console.error('Error in creating collection or uploading file:', err);
    }
}
createCollection();

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
                // Optionally handle subfolders
                else if (stats.isDirectory()) {
                    console.log(`Skipping directory: ${filePath}`);
                    // Uncomment below to recursively delete subfolders
                    // deleteFilesInFolder(filePath);
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
        // res.sendFile(path.join(__dirname, './public/login.html'));
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


app.get('/detail/:id', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('webapp');
        const collection = db.collection('models');
        // const bucket = new GridFSBucket(db, { bucketName: 'models' });

        const modelId = req.params.id;
        const fileDocument = await collection.findOne({ _id: new ObjectId(modelId) });
        
        render('detail')
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
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

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Save uploaded files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Add timestamp to file name
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.fields([{ name: 'modelFile', maxCount: 1 }]), async (req, res) => {
    try {
        const { modelName, modelDescription, modelType } = req.body;
        const file = req.files['modelFile'] ? req.files['modelFile'][0] : null;
        const path_to_file = file.filename;
        
        // console.log(req.body);
        // console.log(req.oidc.user);
        // console.log(path_to_file);
        // console.log(modelName, modelDescription, modelType);
        // res.status(200).send('Model uploaded successfully!');

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
        // Log the incoming request and the fileId
        console.log(`Received download request for file ID: ${fileId}`);

        // Validate the fileId
        if (!ObjectId.isValid(fileId)) {
            console.log('Invalid ObjectId:', fileId);
            return res.status(400).send('Invalid file ID.');
        }

        // Connect to the database
        await connectToDatabase();
        const db = client.db('webapp'); // Get the database
        const collection = db.collection('models');

        console.log('Database connection successful.');

        // Retrieve the file document by ID
        const fileDocument = await collection.findOne({ _id: new ObjectId(fileId) });

        if (!fileDocument) {
            console.error('File not found:', fileId);
            return res.status(404).send('File not found.');
        }

        // Retrieve the file from GridFS
        const bucket = new GridFSBucket(db, { bucketName: 'models' });
        const fileStream = bucket.openDownloadStream(new ObjectId(fileDocument.file));

        // Set the headers for the response to prompt the file download
        res.setHeader('Content-Disposition', 'attachment; filename="downloaded-file.h5"');
        res.setHeader('Content-Type', 'application/octet-stream');

        // Pipe the file stream to the response
        fileStream.pipe(res);

        // Handle errors from the file stream
        fileStream.on('error', (err) => {
            console.error('Error retrieving file:', err);
            return res.status(500).send('Error downloading the file.');
        });

        // Handle successful completion of the stream
        fileStream.on('finish', () => {
            console.log('File download stream finished.');
        });

    } catch (err) {
        // Log the detailed error
        console.error('Error occurred during the download process:', err);

        // Send a generic error response
        return res.status(500).send('Error retrieving the file.');
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

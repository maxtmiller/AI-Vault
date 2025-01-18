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

const upload = multer({ dest: 'uploads/' });

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
            userId: 'development',  // Replace with actual user ID
            name: 'AI Model',
            type: 'NLP',
            description: '',
            file: uploadStream.id, // Store the file ID in the database
            lastUpdated: new Date(),
        });

        console.log("Model metadata inserted with file ID:", uploadStream.id);
    } catch (err) {
        console.error('Error in creating collection or uploading file:', err);
    }
}
createCollection();

app.use(express.static(path.join(__dirname, 'public')));


const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    secret: process.env.AUTH0_CLIENT_SECRET
};
  
  // auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    if (req.oidc.isAuthenticated()) {
        // User is authenticated, serve the dashboard
        const userName = req.oidc.user.name;
        res.render('dashboard', { userName });
    } else {
        // User is not authenticated, serve the login page
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
        const models = await collection.findOne({ _id: new ObjectId(modelId) });
        console.log(models);

        if (!modelId) {
            return res.status(400).json({ error: 'Model ID is required.' });
        }

        res.render('detail', { models });
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



app.post('/upload-model', upload.single('modelFile'), async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'uploads', req.file.filename); // File path of the uploaded .h5 file

        await client.connect();
        const db = client.db('webapp');
        const bucket = new GridFSBucket(db, { bucketName: 'models' });

        // Read the file and upload it to GridFS
        const fileStream = fs.createReadStream(filePath);
        const uploadStream = bucket.openUploadStream(req.file.originalname);
        fileStream.pipe(uploadStream);

        uploadStream.on('finish', async () => {
            // After the file is uploaded, save the model metadata to the collection
            await db.collection('models').insertOne({
                userId: req.oidc.user.sub,
                name: 'AI Model',
                type: 'NLP',
                description: '',
                file: uploadStream.id,
                lastUpdated: new Date(),
            });

            res.status(200).send('Model uploaded successfully!');
        });

        uploadStream.on('error', (err) => {
            res.status(500).send('Error uploading file: ' + err.message);
        });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

app.get('/download/:id', async (req, res) => {
    const fileId = req.params.id; // Get the file ObjectId from the URL

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

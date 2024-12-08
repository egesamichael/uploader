const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const File = require('./models/File');
const PrintRequest = require('./models/PrintRequest');

const app = express();
const PORT = 3010;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/PrintOrders', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route for multiple files
app.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const {
      documentType,
      printType,
      copies,
      documentFormat,
      paperSize,
      description,
      descriptionType,
      textDescription
    } = req.body;

    // Save uploaded files info to DB
    const filesData = req.files.map(file => ({
      name: file.originalname,
      path: file.path,
      size: file.size
    }));

    const savedFiles = await File.insertMany(filesData);
    const fileIds = savedFiles.map(f => f._id);

    // Create a new PrintRequest with all the fields plus the file references
    const newRequest = new PrintRequest({
      documentType: documentType || '',
      printType: printType || '',
      copies: copies ? Number(copies) : 1,
      documentFormat: documentFormat || '',
      paperSize: paperSize || '',
      description: description || '',
      descriptionType: descriptionType || 'Text',
      textDescription: textDescription || '',
      files: fileIds
    });

    const savedRequest = await newRequest.save();

    res.status(200).json({
      message: 'Files and data uploaded successfully',
      request: savedRequest
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to upload files', error: err });
  }
});

app.get('/requests', async (req, res) => {
  try {
    const requests = await PrintRequest.find().populate('files');
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests', error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

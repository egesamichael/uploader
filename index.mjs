import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import File from './models/File.mjs';
import PrintRequest from './models/PrintRequest.mjs';
import paymentRoutes from './routes/payment.mjs';
import equipmentRoutes from './routes/equipments.mjs';



const app = express();
const PORT = 3010;

// Add this near the top of your file, after the imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(paymentRoutes);

app.use('/equipments', equipmentRoutes);

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/PrintOrders', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// Import ObjectId utility from mongoose
const { ObjectId } = mongoose.Types;

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route for multiple files upload and creating a new PrintRequest
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
      files: fileIds,
      // Initialize status and quotationAmount if needed
      status: 'Pending', // e.g. default
      quotationAmount: null,
      paymentStatus: 'Pending'
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

// Fetch all requests
app.get('/requests', async (req, res) => {
  try {
    const requests = await PrintRequest.find().populate('files');
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests', error: err });
  }
});


// Routes
app.get("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Convert to ObjectId using 'new' keyword and validate
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const order = await PrintRequest.findById(new ObjectId(id)); // Use 'new' to instantiate ObjectId
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
});



// Accept order route
app.patch('/requests/:id', async (req, res) => {
  try {
    const { status } = req.body; // You can send { "status": "Accepted" } in the request body
    const updatedRequest = await PrintRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Order status updated successfully', request: updatedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order status', error: err });
  }
});

//update payment status
app.patch('/requests/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body; // Expecting { "paymentStatus": "Paid" } in the request body

    if (!paymentStatus) {
      return res.status(400).json({ message: 'Payment status is required' });
    }

    const updatedRequest = await PrintRequest.findByIdAndUpdate(
      req.params.id,
      { paymentStatus }, // Use the provided paymentStatus value
      { new: true } // Ensure the updated document is returned
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Payment status updated successfully', request: updatedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update payment status', error: err });
  }
});


// Add/Update quotation route
app.patch('/requests/:id/quotation', async (req, res) => {
  try {
    const { quotationAmount } = req.body;
    const updatedRequest = await PrintRequest.findByIdAndUpdate(
      req.params.id,
      { quotationAmount },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Quotation added successfully', request: updatedRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add quotation', error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;

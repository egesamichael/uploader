import express from 'express';
import Equipment from '../models/Equipments.mjs';

const router = express.Router();

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const { name, category, price } = req.body;

    const newEquipment = new Equipment({ name, category, price });
    const savedEquipment = await newEquipment.save();

    res.status(201).json({ message: 'Equipment created successfully', equipment: savedEquipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create equipment', error: err.message });
  }
});

// Get all equipment
router.get('/', async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.status(200).json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch equipment', error: err.message });
  }
});

// Get a single equipment by ID
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    res.status(200).json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch equipment', error: err.message });
  }
});

// Update equipment
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updatedEquipment = await Equipment.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!updatedEquipment) return res.status(404).json({ message: 'Equipment not found' });

    res.status(200).json({ message: 'Equipment updated successfully', equipment: updatedEquipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update equipment', error: err.message });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const deletedEquipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!deletedEquipment) return res.status(404).json({ message: 'Equipment not found' });

    res.status(200).json({ message: 'Equipment deleted successfully', equipment: deletedEquipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete equipment', error: err.message });
  }
});

export default router;

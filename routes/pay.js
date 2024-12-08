import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Router } from 'express';

dotenv.config();

const router = Router();

const API_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
const API_USER_ID = process.env.API_USER_ID;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
const API_KEY = process.env.API_KEY;

// Function to get an auth token
const getAuthToken = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/collection/token/`, null, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${API_USER_ID}:${API_KEY}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEY,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Payment request function
router.post('/api/payments/request', async (req, res) => {
  const { amount, phoneNumber } = req.body;

  const referenceId = uuidv4();

  try {
    const authToken = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount,
        currency: 'EUR', // Adjust currency as needed
        externalId: '1234560096',
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': PRIMARY_KEY,
        },
      }
    );

    res.json({ referenceId, ...response.data });
  } catch (error) {
    console.error('Error requesting payment:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Transaction status function
router.get('/api/payments/status/:referenceId', async (req, res) => {
  const { referenceId } = req.params;

  try {
    const authToken = await getAuthToken();
    const response = await axios.get(
      `${API_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Ocp-Apim-Subscription-Key': PRIMARY_KEY,
          'X-Target-Environment': 'sandbox',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error getting transaction status:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch transaction status' });
  }
});

export default router;

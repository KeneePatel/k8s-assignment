// container2-service/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Storage directory - will be replaced with PV path later
const STORAGE_DIR = process.env.STORAGE_DIR || '/tmp';

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

// Calculate total endpoint
app.post('/calculate-total', async (req, res) => {
    const { file, product } = req.body;
    
    if (!file || !product) {
        return res.status(400).json({
            error: "Invalid input parameters"
        });
    }

    try {
        const fileContent = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
        const lines = fileContent.split('\n');
        
        // Skip header row and process data
        let total = 0;
        for (let i = 1; i < lines.length; i++) {
            const [currentProduct, amount] = lines[i].split(',').map(item => item.trim());
            if (currentProduct === product) {
                total += parseInt(amount, 10);
            }
        }

        return res.json({
            sum: total
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                error: "File not found"
            });
        }
        return res.status(500).json({
            error: "Error processing file"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Container 2 service listening on port ${PORT}`);
});


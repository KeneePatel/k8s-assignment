// container1-service/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const errorHandler = require("./errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const STORAGE_DIR = process.env.STORAGE_DIR || "/tmp";
const CONTAINER2_URL = process.env.CONTAINER2_URL || "http://localhost:3001";

// Middleware
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
  }),
);
app.use(bodyParser.json());

// Helper function to validate CSV format
const validateCSV = (data) => {
  const lines = data.split("\n");
  if (lines.length < 2) return false;

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  return header.includes("product") && header.includes("amount");
};

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("Ok");
});

// Store file endpoint
app.post("/store-file", async (req, res, next) => {
  try {
    const { file, data } = req.body;

    // Check for required fields first
    if (!file || !data) {
      return res.status(400).json({
        file: null,
        error: "Invalid JSON input.",
      });
    }

    // Then validate CSV format
    if (!validateCSV(data)) {
      return res.status(400).json({
        file,
        error: "Invalid CSV format.",
      });
    }

    await fs.writeFile(path.join(STORAGE_DIR, file), data);
    res.json({
      file: file,
      message: "Success.",
    });
  } catch (error) {
    next(error);
  }
});

// Calculate endpoint
app.post("/calculate", async (req, res, next) => {
  try {
    const { file, product } = req.body;

    // Check for required fields first
    if (!file || !product) {
      return res.status(400).json({
        file: null,
        error: "Invalid JSON input.",
      });
    }

    // Check file existence
    try {
      await fs.access(path.join(STORAGE_DIR, file));
    } catch (error) {
      return res.status(404).json({
        file: file,
        error: "File not found.",
      });
    }

    // Validate CSV format
    const fileContent = await fs.readFile(
      path.join(STORAGE_DIR, file),
      "utf-8",
    );
    if (!validateCSV(fileContent)) {
      return res.status(400).json({
        file: file,
        error: "Input file not in CSV format.",
      });
    }

    const response = await axios.post(`${CONTAINER2_URL}/calculate-total`, {
      file,
      product,
    });

    res.json({
      file: file,
      sum: response.data.sum,
    });
  } catch (error) {
    if (error.isAxiosError) {
      return res.status(error.response?.status || 500).json({
        file: req.body.file,
        error:
          error.response?.data?.error ||
          "Error communicating with calculation service",
      });
    }
    next(error);
  }
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Container 1 service listening on port ${PORT}`);
  console.log(`Storage directory: ${STORAGE_DIR}`);
  console.log(`Container 2 URL: ${CONTAINER2_URL}`);
});

// errorHandler.js (create this file in both service directories)
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'SyntaxError') {
        return res.status(400).json({
            error: "Invalid JSON format"
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Handle axios errors
    if (err.isAxiosError) {
        return res.status(err.response?.status || 500).json({
            error: err.response?.data?.error || "Service communication error"
        });
    }

    res.status(500).json({
        error: "Internal server error"
    });
};

module.exports = errorHandler;


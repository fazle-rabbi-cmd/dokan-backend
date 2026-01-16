const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err.message);
});
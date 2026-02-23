// const app = require('./app');
// const connectDB = require('./src/config/db');

// const PORT = process.env.PORT || 5000;

// // Connect to MongoDB then start server
// connectDB().then(() => {
//     app.listen(PORT, () => {
//         console.log(`✅ Server running on port ${PORT}`);
//     });
// }).catch(err => {
//     console.error("❌ Database connection failed:", err.message);
// });

const app = require('./app');
const connectDB = require('./src/config/db');
const cron = require('node-cron');

// মডেল এবং ইমেইল সার্ভিস ইমপোর্ট (পাথগুলো চেক করে নিও)
const Sales = require('./src/modules/sales/sales.model');
const Expense = require('./src/modules/expense/expense.model');
const User = require('./src/modules/auth/user.model');
const sendEmail = require('./src/utils/emailService');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });

    // --- 📊 অটোমেটেড মান্থলি রিপোর্ট (Cron Job) ---
    // প্রতি মাসের ১ তারিখ রাত ১২:০১ মিনিটে রান হবে
    cron.schedule('1 0 1 * *', async () => {
        console.log('Running Monthly Business Report Automation... 📊');
        
        try {
            // ১. অ্যাডমিন ইউজারকে খুঁজে বের করা
            const admin = await User.findOne({ role: 'Admin' });
            if (!admin) return console.log('Admin not found for automated report.');

            // ২. গত মাসের সময়সীমা বের করা
            const now = new Date();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            // ৩. ডাটা এগ্রিগেশন (সেলস এবং খরচ)
            const [monthlySales, monthlyExpenses] = await Promise.all([
                Sales.aggregate([
                    { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]),
                Expense.aggregate([
                    { $match: { expenseDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ])
            ]);

            const sales = monthlySales[0]?.total || 0;
            const expenses = monthlyExpenses[0]?.total || 0;
            const netProfit = sales - expenses;

            // ৪. ইমেইল পাঠানো
            await sendEmail({
                email: admin.email,
                subject: `📊 Monthly Summary: ${startOfLastMonth.toLocaleString('default', { month: 'long' })}`,
                message: `<h1>Dokan ERP Monthly Report</h1><p>Total Sales: ${sales} TK</p><p>Total Expenses: ${expenses} TK</p><h3>Net Profit: ${netProfit} TK</h3>`,
                isHtml: true
            });

            console.log('✅ Automated Monthly Report Sent!');
        } catch (error) {
            console.error('❌ Automation Error:', error.message);
        }
    });

}).catch(err => {
    console.error("❌ Database connection failed:", err.message);
});
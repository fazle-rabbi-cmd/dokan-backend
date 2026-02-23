const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'খরচের একটি নাম দিন (যেমন: দোকান ভাড়া)'], 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: [true, 'খরচের পরিমাণ লিখুন'] 
  },
  category: { 
    type: String, 
    enum: ['Rent', 'Utility', 'Salary', 'Marketing', 'Maintenance', 'Others'], 
    default: 'Others' 
  },
  expenseDate: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String, 
    trim: true 
  },
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
const express = require('express');
const router = express.Router();
const { paySalary, getSalaryHistory, getAttendance } = require('./employee.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.post('/pay-salary', paySalary); // Proti mashe salary dewar record
router.get('/salary-history/:employeeId', getSalaryHistory);
router.post('/attendance', getAttendance); // Daily check-in/out

module.exports = router;
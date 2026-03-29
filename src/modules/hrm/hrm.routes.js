const express = require('express');
const router = express.Router();
const { 
    addEmployee, 
    getAllEmployees, 
    getEmployeeById, 
    updateEmployee, 
    deleteEmployee,
    updateStatus // Active/Inactive korar jonno
} = require('./employee.controller');
const { protect, authorize } = require('../../middleware/auth');

// Shudhu Admin employee manage korte parbe
router.use(protect);
router.use(authorize('Admin'));

router.post('/add', addEmployee);
router.get('/all', getAllEmployees);
router.get('/:id', getEmployeeById);
router.patch('/:id', updateEmployee);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteEmployee);

module.exports = router;
const Joi = require('joi');

const inventorySchema = Joi.object({
  name: Joi.string().trim().min(3).required(),
  quantity: Joi.number().integer().min(0).required(),
  minStockLevel: Joi.number().integer().min(0),
  category: Joi.string().required(),
  warehouseLocation: Joi.string().required(),
  sku: Joi.string().uppercase(), 
 
  supplier: Joi.string().required().messages({
    'string.empty': 'Supplier ID is required'
  }),
  image: Joi.any() 
});

exports.validateInventory = (req, res, next) => {
  const { error } = inventorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};
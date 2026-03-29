const Category = require('./category.model');

exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({ 
      name, 
      description, 
      addedBy: req.user.id 
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('addedBy', 'name');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    // Category delete korar age check kora dorkar oi category-te kono product ache kina
    const CategoryId = req.params.id;
    const itemExists = await require('./inventory.model').findOne({ category: CategoryId });
    
    if (itemExists) {
      return res.status(400).json({ 
        success: false, 
        message: "এই ক্যাটাগরিতে প্রোডাক্ট আছে, তাই এটি ডিলিট করা সম্ভব নয়।" 
      });
    }

    await Category.findByIdAndDelete(CategoryId);
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
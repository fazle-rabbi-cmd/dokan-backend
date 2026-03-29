const bcrypt = require('bcryptjs');
const User = require('./user.model');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../utils/emailService');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });

    user.password = undefined;
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ success: true, token, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ success: false, message: 'Email or Password is Wrong' });
        }
    
    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been disabled' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.password = undefined;

    res.status(200).json({ success: true, token, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { name, email }, 
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is wrong!" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "Logout is successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. User check
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "এই ইমেইলে কোনো ইউজার পাওয়া যায়নি" });
    }

    // 2. Get Reset Token (Model-e method thakte hobe)
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 3. Create Reset URL (Frontend URL: e.g. http://localhost:3000/reset-password/...)
    // Tumi chaitile frontend URL env file-e rakhte paro
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    // Professional HTML Message
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #333; text-align: center;">পাসওয়ার্ড রিসেট রিকোয়েস্ট</h2>
        <p>আপনি আপনার <strong>Dokan ERP</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য রিকোয়েস্ট করেছেন।</p>
        <p>নিচের বাটনে ক্লিক করে আপনার পাসওয়ার্ড পরিবর্তন করুন। এই লিঙ্কটি মাত্র ১০ মিনিটের জন্য কার্যকর থাকবে।</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2ecc71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">পাসওয়ার্ড রিসেট করুন</a>
        </div>
        <p style="color: #777; font-size: 12px;">আপনি যদি এই রিকোয়েস্ট না করে থাকেন, তবে এই ইমেইলটি ইগনোর করুন।</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 Password Reset Token (Dokan ERP)',
        message: message,
        isHtml: true
      });

      res.status(200).json({ success: true, message: "পাসওয়ার্ড রিসেট লিঙ্ক ইমেইলে পাঠানো হয়েছে" });
    } catch (err) {
      // Token muche fela jodi mail fail kore
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email Error:", err);
      return res.status(500).json({ success: false, message: "ইমেইল পাঠানো সম্ভব হয়নি। আপনার ইমেইল কনফিগারেশন চেক করুন।" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Hash the token from URL
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "ইনভ্যালিড বা এক্সপায়ার্ড টোকেন" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "পাসওয়ার্ড রিসেট সফল হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminResetPassword = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "ইউজার পাওয়া যায়নি" });

  user.password = req.body.newPassword;
  await user.save();
  
  res.status(200).json({ success: true, message: "অ্যাডমিন কর্তৃক পাসওয়ার্ড সফলভাবে রিসেট হয়েছে" });
};
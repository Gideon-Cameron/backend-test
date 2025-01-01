// Example: Token generation in your login route
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token without expiration
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

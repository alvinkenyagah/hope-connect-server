module.exports = function(allowed = []) {
  // allowed: array e.g. ['admin'] or ['counselor','admin']
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  }
}

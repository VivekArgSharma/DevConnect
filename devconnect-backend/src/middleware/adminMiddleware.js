export function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!req.user || req.user.email !== adminEmail) {
    return res.status(403).json({ error: "Admin access only" });
  }

  next();
}

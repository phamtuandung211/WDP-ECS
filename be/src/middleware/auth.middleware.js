import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize =
  (...roles) =>
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!roles || roles.length === 0) {
        return next();
      }

      const role = req.user.role;
      if (!role || !roles.includes(role)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      next();
    };

export const authorizeAny = (roles = []) => authorize(...roles);

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};

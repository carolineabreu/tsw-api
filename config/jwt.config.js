import jwt from "jsonwebtoken";

export function generateToken(user) {
  const { id, name, email, role } = user;

  const signature = process.env.TOKEN_SIGN_SECRET;
  const expiration = "12h";

  return jwt.sign({ id, name, email, role }, signature, {
    expiresIn: expiration,
  });
}

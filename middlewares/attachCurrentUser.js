import { prisma } from '../config/prismaClient.js';

export default async function attachCurrentUser(req, res, next) {
  try {
    const userData = req.auth;

    const user = await prisma.user.findUnique({
      where: {
        id: userData.id
      }
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    req.currentUser = user;

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
}

import bcrypt from "bcrypt";
import express from 'express';
import { generateToken } from '../config/jwt.config.js';
import { prisma } from '../config/prismaClient.js';
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import isAuth from '../middlewares/isAuth.js';


const userRouter = express.Router();

userRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (
      !password ||
      !password.match(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/gm
      )
    ) {
      return res.status(400).json({
        msg: "Invalid email or password. Check that both meet the requirements.",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword
      }
    });

    delete createdUser.password;
    return res.status(201).json(createdUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(404).json({ msg: "Email or password invalid." });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = generateToken(user);

      delete user.password;

      return res.status(200).json({
        user,
        token: token,
      });
    } else {
      return res.status(401).json({ msg: "Email or password invalids!" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.get("/all", isAuth, attachCurrentUser, isAdmin, async (req, res) => {
  try {
    // melhorar essa parte do select, pra não selecionar a password
    const users = await prisma.user.findMany({
      select: {
        name: true,
        id: true,
        email: true,
        password: false,
        role: true,
        createdAt: true,
        updatedAt: true,
        countries: {
          select: {
            id: true,
            name: true
          }
        },
        writtenReviews: {
          select: {
            id: true,
            title: true
          }
        },
        comments: {
          select: {
            id: true,
            body: true
          }
        },
        likedReviews: {
          select: {
            id: true,
            title: true
          }
        },
        savedCountries: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.get("/profile", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;

    const user = await prisma.user.findUnique({
      where: {
        id: loggedInUser.id
      },
      include: {
        writtenReviews: {
          select: {
            id: true,
            title: true,
            image: true
          }
        },
        countries: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        comments: true,
        likedReviews: true,
        savedCountries: true
      }
    });

    delete user.password;
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.get("/savedCountries", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;

    const likedCountries = await prisma.country.findMany({
      where: {
        savedBy: {
          id: loggedInUser.id
        }
      }
    });

    return res.status(200).json(likedCountries);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

userRouter.patch(
  "/edit-profile",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const loggedInUser = req.currentUser;
      const data = req.body;

      const updateUser = await prisma.user.update({
        where: {
          id: loggedInUser.id
        },
        data: {
          name: data.name
        }
      });

      delete updateUser.password;

      return res.status(200).json(updateUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

userRouter.delete("/delete", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;

    const deleteReviews = await prisma.review.deleteMany({
      where: {
        authorId: loggedInUser.id
      }
    });

    const deleteUser = await prisma.user.delete({
      where: {
        id: loggedInUser.id
      }
    });

    const transaction = await prisma.$transaction([deleteReviews, deleteUser]);
    return res.status(200).json(transaction);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// testar essa rota quando tiver algum país
userRouter.delete(
  "/admin/delete",
  isAuth,
  attachCurrentUser,
  isAdmin,
  async (req, res) => {
    try {
      const loggedInUser = req.currentUser;

      if (loggedInUser.country.length !== 0) {
        return res.json({ message: `You have ${loggedInUser.country.length} countries in your account, transfer to another ADMIN before deleting the account!` });
      }

      const deleteUser = await prisma.user.delete({
        where: {
          id: loggedInUser.id
        }
      });


      return res.status(200).json(deleteUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });


export { userRouter };

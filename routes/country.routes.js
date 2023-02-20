import { PrismaClient } from '@prisma/client';
import express from 'express';
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import isAuth from '../middlewares/isAuth.js';

const countryRouter = express.Router();
const prisma = new PrismaClient();

countryRouter.post(
  "/new-country",
  isAuth,
  attachCurrentUser,
  isAdmin,
  async (req, res) => {
    try {
      const loggedInUser = req.currentUser;

      const country = await prisma.country.create({
        data: {
          userId: loggedInUser.id,
          ...req.body
        }
      });

      return res.status(201).json(country);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

countryRouter.get("/all", async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            author: {
              select: {
                name: true
              }
            },
            title: true,
            body: true,
            rate: true,
            createdAt: true
          }
        }
      }
    });

    return res.status(200).json(countries);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

countryRouter.get("/:id", async (req, res) => {
  try {
    const country = await prisma.country.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            author: {
              select: {
                name: true
              }
            },
            title: true,
            body: true,
            rate: true,
            createdAt: true
          }
        }
      }
    });

    return res.status(200).json(country);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

countryRouter.patch(
  "/edit/:id",
  isAuth,
  attachCurrentUser,
  isAdmin,
  async (req, res) => {
    try {
      const country = await prisma.country.findUnique({
        where: {
          id: req.params.id
        }
      });

      //colocar um status mais adequado e uma mensagem melhor. Será que precisa?
      // if (String(country.userId) !== req.currentUser.id) {
      //   return res.status(500).json({ msg: "You can't edit this!" });
      // }

      let date = new Date();

      const updatedCountry = await prisma.country.update({
        where: {
          id: country.id
        },
        data: {
          ...req.body,
          updatedBy: {
            push: `User ${req.currentUser.id} at ${date.toUTCString()}`
          }
        }
      });

      return res.status(200).json(updatedCountry);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

countryRouter.delete(
  "/delete/:id",
  isAuth,
  attachCurrentUser,
  isAdmin,
  async (req, res) => {
    try {
      const deleteCountry = await prisma.country.delete({
        where: {
          id: req.params.id
        }
      });

      return res.status(200).json(deleteCountry);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

export { countryRouter };

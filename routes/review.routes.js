import { PrismaClient } from '@prisma/client';
import express from 'express';
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAuth from '../middlewares/isAuth.js';

const reviewRouter = express.Router();
const prisma = new PrismaClient();

reviewRouter.post("/new", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;

    const review = await prisma.review.create({
      data: {
        ...req.body,
        authorId: loggedInUser.id
      }
    });

    return res.status(201).json(review);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

reviewRouter.get("/all", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        country: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          select: {
            id: true,
            body: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        author: {
          select: {
            id: true,
            name: true
          }
        },
      }
    });

    return res.status(200).json(reviews);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

reviewRouter.get("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        country: {
          select: {
            id: true,
            name: true
          }
        },
        comments: true
      }
    });

    return res.status(200).json(review);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

//arrumar a mensagem
reviewRouter.get("/byCountry/:id", async (req, res) => {
  try {
    // const { countryId } = req.params;
    const reviewsByCountry = await prisma.review.findMany({
      where: {
        country: {
          is: {
            id: req.params.id
          }
        }
      }
    });

    if (!reviewsByCountry.length) {
      return res.json({ message: "This country don't have any review yet" });
    }

    return res.status(200).json(reviewsByCountry);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

reviewRouter.patch("/edit/:id", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const updateReview = await prisma.review.update({
      where: {
        id: req.params.id
      },
      data: {
        ...req.body
      }
    });

    return res.status(200).json(updateReview);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

//só o author que criou pode deletar, ver isso
reviewRouter.delete(
  "/delete/:id",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const deleteComment = await prisma.comment.deleteMany({
        where: {
          reviewId: req.params.id
        }
      });

      const deleteReview = await prisma.review.delete({
        where: {
          id: req.params.id
        }
      });

      const transaction = await prisma.$transaction([deleteComment, deleteReview]);
      return res.status(200).json(transaction);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

export { reviewRouter };

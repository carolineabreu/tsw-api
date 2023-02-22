import express from 'express';
import { prisma } from '../config/prismaClient.js';
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAuth from '../middlewares/isAuth.js';

const commentRouter = express.Router();

commentRouter.post(
  "/:reviewId/new",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { reviewId } = req.params;
      const loggedInUser = req.currentUser;

      const comment = await prisma.comment.create({
        data: {
          ...req.body,
          authorId: loggedInUser.id,
          reviewId: reviewId
        }
      });

      return res.status(201).json(comment);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

commentRouter.get("/all", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        review: true,
      }
    });

    return res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

commentRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: {
        id: id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        review: true
      }
    });

    return res.status(200).json(comment);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

commentRouter.get("/byReview/:id", async (req, res) => {
  try {
    const commentsByReview = await prisma.comment.findMany({
      where: {
        review: {
          is: {
            id: req.params.id
          }
        }
      }
    });

    if (!commentsByReview.length) {
      return res.json({ message: "This review don't have any comments yet" });
    }

    return res.status(200).json(commentsByReview);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

commentRouter.delete(
  "/delete/:id",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const deleteComment = await prisma.comment.delete({
        where: {
          id: req.params.id
        }
      });

      return res.status(200).json(deleteComment);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });


export { commentRouter };

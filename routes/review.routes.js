import express from 'express';
import { prisma } from '../config/prismaClient.js';
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import isAuth from '../middlewares/isAuth.js';

const reviewRouter = express.Router();

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
                username: true
              }
            }
          }
        },
        author: {
          select: {
            id: true,
            username: true
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

reviewRouter.get("/pagination", async (req, res) => {
  try {
    const count = await prisma.review.count();
    const pages = Math.ceil(count / 6);
    const allDocsPromises = [];
    for (let i = 0; i < pages; i++) {
      const page = prisma.review.findMany({
        skip: i * 6,
        take: 6,
        orderBy: {
          createdAt: "desc"
        },
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
                  username: true
                }
              }
            }
          },
          author: {
            select: {
              id: true,
              username: true
            }
          },
        }
      });
      allDocsPromises.push(page);
    }
    const allDocs = await Promise.all(allDocsPromises);
    return res.status(200).json(allDocs);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

reviewRouter.get(
  "/all-reviews",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const loggedInUser = req.currentUser;

      const userReviews = await prisma.review.findMany({
        where: {
          author: {
            id: loggedInUser.id
          }
        },
        include: {
          author: {
            select: {
              username: true
            }
          }
        }
      });

      return res.status(200).json(userReviews);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
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
            username: true
          }
        },
        country: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        comments: true,
        likedBy: {
          select: {
            user: {
              select: {
                username: true
              }
            },
            userId: true
          }
        }
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

reviewRouter.patch("/:id/like", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.currentUser;

    const likes = await prisma.userReview.findMany();
    let findUser = likes.filter((id) => (id.userId === loggedInUser.id));

    let find = findUser.filter((user) => user.reviewId === id);
    console.log(find);
    if (find.length) {
      let dislike = await prisma.userReview.delete({
        where: {
          id: find[0].id
        }
      });

      return res.status(200).json(dislike);
    } else {
      const favorite = await prisma.userReview.create({
        data: {
          reviewId: id,
          userId: loggedInUser.id
        }
      });
      return res.status(200).json(favorite);
    }



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
      const deleted = await prisma.review.delete({
        where: {
          id: req.params.id
        }
      });

      await prisma.userReview.deleteMany({
        where: {
          reviewId: req.params.id
        }
      });


      return res.status(200).json(deleted);

    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  });

export { reviewRouter };

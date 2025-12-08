import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as commentsController from "../controllers/comments";

const router = Router();

router.post(
  `/list-comments`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.getAllComments
);

router.get(
  `/get/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.getCommentById
);

router.get(
  `/get/story/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.getStoryById
);

router.get(
  `/get/review/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.getReviewById
);

router.delete("/delete/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.deleteComment
);

router.post(
  `/report/status`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.updateReportStatus
);

router.post(
  `/list/reports/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("commentsLists"),
  commentsController.getCommentsReports
);

//Public
router.post(
  `/add-comment`,
  commentsController.addComment,
);

router.post(
  `/get-comments`,
  commentsController.getComments
);

router.post(
  `/upvote-comments`,
  commentsController.upvoteComment
);

router.post(
  `/mark-helpful-comments`,
  commentsController.markHelpfulComment
);

router.post(
  `/report-comments`,
  commentsController.submitCommentReport
);


export default router;

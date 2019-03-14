import models from '../database/models';
import response from '../utils/response';
import { favouriteArticleNotification, HelperUtils } from '../utils';
import host from '../utils/markups';

const {
  ArticleComment,
  Bookmark,
  User,
  Notification,
  UserNotification,
  CommentEditHistory
} = models;

/**
 * @class ArticleComment
 * @description Controller to handle comment request
 * @exports ArticleComment
 */
class Comment {
  /**
   * @method getComments
   * @description - Gets all comments for a single article
   * @param {object} req - The request object
   * @param {object} res - The response object
   * @returns {object} - The comment object
   */
  static async getComments(req, res) {
    const articleId = req.article.id;
    const comments = await ArticleComment.findAll({
      where: {
        articleId
      }
    });
    return response(res).success({
      message: 'Comments successfully retrieved',
      comments
    });
  }

  /**
   * @method postComment
   * @description - Posts comment to the database
   * @param {object} req - The request object
   * @param {object} res - The response object
   * @returns {object} - The comment object
   */
  static async postComment(req, res) {
    const userId = req.user.id;
    const { username } = req.user;
    const { comment } = req.body;
    const { slug } = req.params;
    const { article } = req;

    try {
      const articleId = article.id;
      const userComment = await ArticleComment.create({ articleId, comment, userId });

      response(res).created({
        message: 'Comment created successfully',
        userComment
      });

      const bookmarks = await Bookmark.findAll({
        where: { articleId }
      }).map(user => user.userId);

      bookmarks.forEach(async (usersId) => {
        const userData = await User.findOne({
          attributes: ['id', 'email', 'username', 'emailNotification', 'inAppNotification'],
          where: { id: usersId }
        });
        if (userData.emailNotification) {
          await HelperUtils.sendMail(userData.email,
            'Authors Haven <notification@authorshaven.com>',
            'Bookmarked Article Notification',
            'Comment Notification',
            favouriteArticleNotification(userData.username, slug));
        }
        if (userData.inAppNotification) {
          await HelperUtils.pusher(`channel-${userData.id}`, 'notification', {
            message: `${username} commented on a post you bookmarked`,
            title: article.title,
            type: 'comment',
            url: `${host}api/articles/${slug}`
          });
          const notification = await Notification.create({
            message: `${username} commented on the post "${article.title}"`,
            metaId: userData.id,
            type: 'comment',
            title: article.title,
            url: `${host}api/articles/${slug}`,
          });

          await UserNotification.create({
            userId: userData.id,
            notificationId: notification.dataValues.id,
          });
        }
      });
    } catch (error) {
      return response(res).serverError({ errors: { server: ['database error'] } });
    }
  }

  /**
   * @method updateComment
   * @description - Updates comment
   * @param {object} req - The request object
   * @param {object} res - The response object
   * @returns {object} - The updated comment object
   */
  static async updateComment(req, res) {
    const { commentRow } = req;
    const { comment } = req.body;
    const { id } = commentRow; // commentId

    try {
      const previousComment = await ArticleComment.findOne({
        where: { id }
      });

      if (previousComment) {
        await CommentEditHistory.create({
          commentId: id,
          previousComment: previousComment.comment
        });
      }

      const articleUpdate = await ArticleComment.update({ comment }, {
        where: {
          id
        },
        returning: true
      });
      const userComment = articleUpdate[1][0];
      return response(res).success({
        message: 'Comment updated successfully',
        userComment
      });
    } catch (error) {
      return response(res).serverError({ errors: { server: ['database error'] } });
    }
  }

  /**
   * @method deleteComment
   * @description - Deletes comment
   * @param {object} req - The request object
   * @param {object} res - The response object
   * @returns {object} - response message
   */
  static async deleteComment(req, res) {
    const { commentRow } = req;

    try {
      const { id } = commentRow;
      await ArticleComment.destroy({
        where: {
          id
        }
      });
      return response(res).success({ message: 'Comment has been deleted successfully.' });
    } catch (error) {
      return response(res).serverError({
        errors: { server: ['database error'] }
      });
    }
  }
}

export default Comment;

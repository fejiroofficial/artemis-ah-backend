/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
import slugify from 'slug';
import { validationResult } from 'express-validator/check';
import response, { validationErrors } from '../utils/response';
import db from '../database/models';

const { Article } = db;

class ArticleController {
  constructor() {
    this.numberPerPage = 20;
  }

  /**
   * Creates a new
   *
   * @param {object} req The request object
   * @param {object} res The response object
   */
  create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response(res).badRequest({
        errors: validationErrors(errors),
      });
    } else {
      const { title, description, body } = req.body;
      let slug = slugify(title, {
        lower: true,
      });

      // Insert into database
      Article.create({
        userId: 2,
        title,
        description,
        body,
      }).then((article) => {
        slug = slug.concat(`-${article.id}`);
        article.slug = slug;

        // Append id to slug and update.
        return Article.update({
          slug,
        }, {
          where: {
            id: article.id,
          }
        }).then(dbRes => article);
      }).then((article) => {
        article.userId = undefined;

        response(res).created({
          article,
        });
      });
    }
  }

  /**
   *
   * @param {object} req The request object from the route
   * @param {object} res The response object from the route
   */
  getAll(req, res) {
    let limit = 20; // Default limit.
    let offset = 0; // Default offset.

    const { query } = req;
    // If limit is specified.
    if (query.limit) {
      limit = query.limit;
    }
    // If page is specified.
    if (query.page) {
      offset = (query.page - 1) * limit;
    }

    const sequelizeOptions = {
      where: {},
      offset, // Default is page 1
      limit,
    };

    Article
       .findAll(sequelizeOptions)
       .then((articles) => {
         response(res).success({
           articles,
         });
       });
  }
}

export default ArticleController;

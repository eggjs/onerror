'use strict';

const http = require('http');
const onerror = require('koa-onerror');
const ErrorView = require('./lib/error_view');
const { isProd, detectStatus, accepts } = require('./lib/utils');

module.exports = app => {
  // logging error
  const config = app.config.onerror;
  app.on('error', (err, ctx) => {
    ctx = ctx || app.createAnonymousContext();
    if (config.appErrorFilter && !config.appErrorFilter(err, ctx)) return;

    const status = detectStatus(err);
    // 5xx
    if (status >= 500) {
      try {
        ctx.logger.error(err);
      } catch (ex) {
        app.logger.error(err);
        app.logger.error(ex);
      }
      return;
    }

    // 4xx
    try {
      ctx.logger.warn(err);
    } catch (ex) {
      app.logger.warn(err);
      app.logger.error(ex);
    }
  });

  onerror(app, {
    // support customize accepts function
    accepts() {
      const fn = config.accepts || accepts;
      return fn(this);
    },

    html(err) {
      const status = detectStatus(err);
      const errorPageUrl = config.errorPageUrl;
      // keep the real response status
      this.realStatus = status;
      // don't respond any error message in production env
      if (isProd(app)) {
        if (errorPageUrl) {
          const statusQuery =
            (errorPageUrl.indexOf('?') > 0 ? '&' : '?') +
            `real_status=${status}`;
          return this.redirect(errorPageUrl + statusQuery);
        }
        this.status = 500;
        this.body = `<h2>Internal Server Error, real status: ${status}</h2>`;
        return;
      }

      const errorView = new ErrorView(this, err);
      this.body = errorView.toHTML();
    },

    json(err) {
      const status = detectStatus(err);
      let errorJson = {};

      this.status = status;

      if (isProd(app)) {
        // 5xx server side error
        if (status >= 500) {
          errorJson = {
            code: errorJson.code,
            // don't respond any error message in production env
            message: http.STATUS_CODES[status],
          };
        } else {
          // 4xx client side error
          // addition `errors`
          errorJson = {
            code: errorJson.code,
            message: errorJson.message,
          };
        }
      } else {
        const errorView = new ErrorView(this, err);
        errorJson = errorView.toJSON();

        if (status >= 500) {
          // provide detail error stack in local env
          errorJson.stack = err.stack;
        } else {
          errorJson.errors = err.errors;
        }
      }

      this.body = errorJson;
    },
  });
};

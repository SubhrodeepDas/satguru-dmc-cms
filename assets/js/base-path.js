'use strict';
/* Sets window.SATGURU_BASE_PATH ('' locally, '/dmc' in production) and satguruUrl(). */
(function (window) {
  if (typeof window.SITE_BASE_PATH !== 'undefined') {
    window.SATGURU_BASE_PATH = window.SITE_BASE_PATH;
    return;
  }

  var base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : '/dmc';
  window.SITE_BASE_PATH = base;
  window.SATGURU_BASE_PATH = base;

  window.satguruUrl = function (url) {
    if (!url || /^https?:\/\//i.test(url) || url.indexOf('//') === 0) return url;
    return base + (url.charAt(0) === '/' ? url : '/' + url);
  };

  window.prefixRootHtml = function (html) {
    if (!base || !html) return html;
    return html
      .split('__SITE_BASE__').join(base)
      .replace(/(\s(?:src|href)=["'])\/(?!\/)/g, '$1' + base + '/');
  };
})(window);

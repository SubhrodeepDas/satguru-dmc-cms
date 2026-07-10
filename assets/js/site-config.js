'use strict';
/* Site base path: '' on localhost, '/dmc' on production (satgurutravel.ru). */
(function (window) {
  function isLocalDev() {
    var host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  function getSiteBasePath() {
    return isLocalDev() ? '' : '/dmc';
  }

  var base = getSiteBasePath();
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

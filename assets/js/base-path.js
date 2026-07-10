'use strict';
/* Sets window.SATGURU_BASE_PATH ('' locally, '/dmc' in production) and satguruUrl(). */
(function (window) {
  function detectBasePath() {
    var path = window.location.pathname;
    return path === '/dmc' || path.indexOf('/dmc/') === 0 ? '/dmc' : '';
  }

  if (typeof window.SATGURU_BASE_PATH === 'undefined') {
    window.SATGURU_BASE_PATH = detectBasePath();
  }

  window.satguruUrl = function (url) {
    if (!url || /^https?:\/\//i.test(url) || url.indexOf('//') === 0) return url;
    var base = window.SATGURU_BASE_PATH || '';
    return base + (url.charAt(0) === '/' ? url : '/' + url);
  };

  window.prefixRootHtml = function (html) {
    var base = window.SATGURU_BASE_PATH;
    if (!base || !html) return html;
    return html.replace(/(\s(?:src|href)=["'])\/(?!\/)/g, '$1' + base + '/');
  };
})(window);

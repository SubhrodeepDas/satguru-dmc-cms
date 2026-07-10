'use strict';
/* Sets window.SATGURU_BASE_PATH ('' locally, '/dmc' in production) and satguruUrl(). */
(function (window) {
  function detectBasePathFromScript() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src;
      if (!src || src.indexOf('assets/js/includes.js') === -1) continue;
      try {
        var marker = '/assets/js/includes.js';
        var pathname = new URL(src).pathname;
        var idx = pathname.indexOf(marker);
        if (idx > 0) return pathname.slice(0, idx);
        return '';
      } catch (e) {
        return '';
      }
    }
    return null;
  }

  function detectBasePath() {
    var fromScript = detectBasePathFromScript();
    if (fromScript !== null) return fromScript;

    var path = window.location.pathname;
    if (path === '/dmc' || path.indexOf('/dmc/') === 0) return '/dmc';

    // Production domain — this site is always served under /dmc
    if (/(?:^|\.)satgurutravel\.ru$/i.test(window.location.hostname)) return '/dmc';

    return '';
  }

  window.SATGURU_BASE_PATH = detectBasePath();

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

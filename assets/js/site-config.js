'use strict';
/* Shared deploy config — localhost, server IP, or satgurutravel.ru/dmc */
(function (window) {
  var SERVER_IP = '194.67.119.189';
  var CMS_PORT = 10006;

  function isLocalDev() {
    var host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  function isServerIp() {
    return window.location.hostname === SERVER_IP;
  }

  function isDmcDomain() {
    var host = window.location.hostname;
    return /(?:^|\.)satgurutravel\.ru$/i.test(host);
  }

  function getSiteBasePath() {
    if (isLocalDev() || isServerIp()) return '';
    if (isDmcDomain()) return '/dmc';
    return '';
  }

  function getCmsUrl() {
    if (isLocalDev()) return 'http://localhost:' + CMS_PORT;
    if (isServerIp()) return 'http://' + SERVER_IP + ':' + CMS_PORT;
    if (isDmcDomain()) return 'https://satgurutravel.ru/dmc';
    return window.location.protocol + '//' + window.location.hostname + ':' + CMS_PORT;
  }

  var base = getSiteBasePath();
  window.SERVER_IP = SERVER_IP;
  window.CMS_PORT = CMS_PORT;
  window.SITE_BASE_PATH = base;
  window.SATGURU_BASE_PATH = base;
  window.getCmsUrl = getCmsUrl;

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

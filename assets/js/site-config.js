'use strict';
/* Shared deploy config — localhost, server IP, or satgurutravel.ru/dmc */
(function (window) {
  var SERVER_IP = '194.67.119.189';
  var CMS_PORT = 10006;
  var FRONTEND_PORT = 10005;

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

  function usesExplicitPorts() {
    return isLocalDev() || isServerIp();
  }

  function getSiteBasePath() {
    if (usesExplicitPorts()) return '';
    if (isDmcDomain()) return '/dmc';
    return '';
  }

  function getFrontendUrl() {
    if (isLocalDev()) return 'http://localhost:' + FRONTEND_PORT;
    if (isServerIp()) return 'http://' + SERVER_IP + ':' + FRONTEND_PORT;
    if (isDmcDomain()) return 'https://satgurutravel.ru/dmc';
    return window.location.origin;
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
  window.FRONTEND_PORT = FRONTEND_PORT;
  window.SITE_BASE_PATH = base;
  window.SATGURU_BASE_PATH = base;
  window.getFrontendUrl = getFrontendUrl;
  window.getCmsUrl = getCmsUrl;

  window.satguruUrl = function (url) {
    if (!url || /^https?:\/\//i.test(url) || url.indexOf('//') === 0) return url;
    var path = url.charAt(0) === '/' ? url : '/' + url;
    if (usesExplicitPorts() || isDmcDomain()) {
      return getFrontendUrl() + path;
    }
    return base + path;
  };

  window.prefixRootHtml = function (html) {
    if (!html) return html;
    return html
      .split('__SITE_BASE__').join(base)
      .replace(/(\s(?:src|href)=["'])\/(?!\/)([^"']*)/g, function (_, prefix, path) {
        return prefix + window.satguruUrl('/' + path);
      });
  };

  // Fix favicon links in <head> when the site runs on IP:port or localhost:port.
  function fixHeadAssetLinks() {
    if (!usesExplicitPorts()) return;
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href && href.charAt(0) === '/' && !href.startsWith('//')) {
        el.href = window.satguruUrl(href);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixHeadAssetLinks);
  } else {
    fixHeadAssetLinks();
  }
})(window);

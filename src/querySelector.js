// Copyright 2013 The Polymer Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var HTMLCollection = scope.wrappers.HTMLCollection;
  var NodeList = scope.wrappers.NodeList;

  var documentQuerySelector = document.querySelector;
  var elementQuerySelector = document.documentElement.querySelector;

  var documentQuerySelectorAll = document.querySelectorAll;
  var elementQuerySelectorAll = document.documentElement.querySelectorAll;

  var documentGetElementsByTagName = document.getElementsByTagName;
  var elementGetElementsByTagName = document.documentElement.getElementsByTagName;

  var documentGetElementsByTagNameNS = document.getElementsByTagNameNS;
  var elementGetElementsByTagNameNS = document.documentElement.getElementsByTagNameNS;

  var OriginalElement = window.Element;
  var OriginalDocument = window.HTMLDocument;

  function filterNodeList(list) {
    if (list == null)
      return list;
    var wrapperList = new NodeList();
    var wrappedItem = null;
    var index = 0;
    for (var i = 0, length = list.length; i < length; i++) {
      wrappedItem = wrap(list[i]);
      if (!wrappedItem.treeScope_ || wrappedItem.treeScope_.parent === null) {
        wrapperList[index++] = wrappedItem;
      }
    }
    wrapperList.length = index;
    return wrapperList;
  }

  function findOne(node, selector) {
    var m, el = node.firstElementChild;
    while (el) {
      if (el.matches(selector))
        return el;
      m = findOne(el, selector);
      if (m)
        return m;
      el = el.nextElementSibling;
    }
    return null;
  }

  function matchesSelector(el, selector) {
    return el.matches(selector);
  }

  var XHTML_NS = 'http://www.w3.org/1999/xhtml';

  function matchesTagName(el, localName, localNameLowerCase) {
    var ln = el.localName;
    return ln === localName ||
        ln === localNameLowerCase && el.namespaceURI === XHTML_NS;
  }

  function matchesEveryThing() {
    return true;
  }

  function matchesLocalName(el, localName) {
    return el.localName === localName;
  }

  function matchesNameSpace(el, ns) {
    return el.namespaceURI === ns;
  }

  function matchesLocalNameNS(el, ns, localName) {
    return el.namespaceURI === ns && el.localName === localName;
  }

  function findElements(node, result, p, arg0, arg1) {
    var el = node.firstElementChild;
    while (el) {
      if (p(el, arg0, arg1))
        result[result.length++] = el;
      findElements(el, result, p, arg0, arg1);
      el = el.nextElementSibling;
    }
    return result;
  }

  // find and findAll will only match Simple Selectors,
  // Structural Pseudo Classes are not guarenteed to be correct
  // http://www.w3.org/TR/css3-selectors/#simple-selectors

  var SelectorsInterface = {
    querySelector: function(selector) {
      var target = this.impl || this;
      if (target instanceof OriginalElement) {
        return wrap(elementQuerySelector.call(target, selector));
      } else if (target instanceof OriginalDocument) {
        return wrap(documentQuerySelector.call(target, selector));
      }

      return findOne(this, selector);
    },
    querySelectorAll: function(selector) {
      var target = this.impl || this;
      if (target instanceof OriginalElement) {
        return filterNodeList(elementQuerySelectorAll.call(target, selector));
      } else if (target instanceof OriginalDocument) {
        return filterNodeList(documentQuerySelectorAll.call(target, selector));
      }

      return findElements(this, new NodeList(), matchesSelector, selector);
    }
  };

  var GetElementsByInterface = {
    getElementsByTagName: function(localName) {
      var target = this.impl || this;
      if (target instanceof OriginalElement) {
        return filterNodeList(elementGetElementsByTagName.call(target, localName));
      } else if (target instanceof OriginalDocument) {
        return filterNodeList(documentGetElementsByTagName.call(target, localName));
      }

      var result = new HTMLCollection();
      if (localName === '*')
        return findElements(this, result, matchesEveryThing);

      return findElements(this, result,
          matchesTagName,
          localName,
          localName.toLowerCase());
    },

    getElementsByClassName: function(className) {
      // TODO(arv): Check className?
      return this.querySelectorAll('.' + className);
    },

    getElementsByTagNameNS: function(ns, localName) {
      var target = this.impl || this;
      if (target instanceof OriginalElement) {
        return filterNodeList(elementGetElementsByTagNameNS.call(target, ns, localName));
      } else if (target instanceof OriginalDocument) {
        return filterNodeList(documentGetElementsByTagNameNS.call(target, ns, localName));
      }

      var result = new HTMLCollection();

      if (ns === '') {
        ns = null;
      } else if (ns === '*') {
        if (localName === '*')
          return findElements(this, result, matchesEveryThing);
        return findElements(this, result, matchesLocalName, localName);
      }

      if (localName === '*')
        return findElements(this, result, matchesNameSpace, ns);

      return findElements(this, result, matchesLocalNameNS, ns, localName);
    }
  };

  scope.GetElementsByInterface = GetElementsByInterface;
  scope.SelectorsInterface = SelectorsInterface;

})(window.ShadowDOMPolyfill);

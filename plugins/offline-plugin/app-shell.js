"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _react = _interopRequireDefault(require("react"));

var _jsxFileName = "C:\\Users\\kanmii\\projects\\gatsby-plugin-offline\\src\\app-shell.js";

var AppShell =
/*#__PURE__*/
function (_React$Component) {
  (0, _inheritsLoose2.default)(AppShell, _React$Component);

  function AppShell() {
    return _React$Component.apply(this, arguments) || this;
  }

  var _proto = AppShell.prototype;

  _proto.render = function render() {
    return _react.default.createElement(_react.default.Fragment, {
      __source: {
        fileName: _jsxFileName,
        lineNumber: 5
      },
      __self: this
    });
  };

  return AppShell;
}(_react.default.Component);

var _default = AppShell;
exports.default = _default;
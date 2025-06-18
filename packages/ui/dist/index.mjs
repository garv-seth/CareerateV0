var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// src/components/GlassCard.tsx
import React from "react";
import { motion } from "framer-motion";
var glassVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};
var GlassCard = ({ children, className = "", variant = "default" }) => {
  const glassStyles = {
    default: "bg-glass-dark/80 backdrop-blur-xl border border-glass-border",
    elevated: "bg-glass-dark/80 backdrop-blur-2xl border border-glass-border shadow-2xl shadow-primary-main/10",
    interactive: "bg-glass-white backdrop-blur-lg border border-glass-border hover:bg-glass-blue hover:shadow-lg hover:shadow-primary-main/25 transition-all duration-300"
  };
  return /* @__PURE__ */ React.createElement(
    motion.div,
    {
      variants: glassVariants,
      initial: "initial",
      animate: "animate",
      exit: "exit",
      className: `rounded-2xl ${glassStyles[variant]} ${className}`
    },
    children
  );
};

// src/components/GlassButton.tsx
import React2 from "react";
import { motion as motion2 } from "framer-motion";
var GlassButton = (_a) => {
  var _b = _a, { children, variant = "primary", fullWidth = false, className = "" } = _b, props = __objRest(_b, ["children", "variant", "fullWidth", "className"]);
  return /* @__PURE__ */ React2.createElement(
    motion2.button,
    __spreadValues({
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 },
      className: `
                relative overflow-hidden rounded-lg font-medium transition-all duration-300
                group
                ${fullWidth ? "w-full" : ""}
                ${variant === "primary" ? "bg-gradient-primary text-white shadow-lg shadow-primary-main/25" : ""}
                ${variant === "glass" ? "bg-glass-white backdrop-blur-md border border-glass-border text-white" : ""}
                px-6 py-3 text-base
                ${className}
            `
    }, props),
    /* @__PURE__ */ React2.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent \r\n                          -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" }),
    /* @__PURE__ */ React2.createElement("span", { className: "relative z-10" }, children)
  );
};
export {
  GlassButton,
  GlassCard
};

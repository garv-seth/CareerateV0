'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import React from 'react';
import { motion } from 'framer-motion';
export const GlassButton = (_a) => {
    var { children, variant = 'primary', fullWidth = false, className = '' } = _a, props = __rest(_a, ["children", "variant", "fullWidth", "className"]);
    return (React.createElement(motion.button, Object.assign({ whileHover: { scale: 1.02, y: -2 }, whileTap: { scale: 0.98 }, className: `
                relative overflow-hidden rounded-lg font-medium transition-all duration-300
                group
                ${fullWidth ? 'w-full' : ''}
                ${variant === 'primary' ? 'bg-gradient-primary text-white shadow-lg shadow-primary-main/25' : ''}
                ${variant === 'glass' ? 'bg-glass-white backdrop-blur-md border border-glass-border text-white' : ''}
                px-6 py-3 text-base
                ${className}
            ` }, props),
        React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent \r\n                          -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" }),
        React.createElement("span", { className: "relative z-10" }, children)));
};
//# sourceMappingURL=GlassButton.js.map
/**
 * @license lucide v0.470.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.lucide = {}));
})(this, (function (exports) { 'use strict';

  const createElement = (tag, attrs, children = []) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach((name) => {
      element.setAttribute(name, String(attrs[name]));
    });
    if (children.length) {
      children.forEach((child) => {
        const childElement = createElement(...child);
        element.appendChild(childElement);
      });
    }
    return element;
  };
  var createElement$1 = ([tag, attrs, children]) => createElement(tag, attrs, children);

  const getAttrs = (element) => Array.from(element.attributes).reduce((attrs, attr) => {
    attrs[attr.name] = attr.value;
    return attrs;
  }, {});
  const getClassNames = (attrs) => {
    if (typeof attrs === "string")
      return attrs;
    if (!attrs || !attrs.class)
      return "";
    if (attrs.class && typeof attrs.class === "string") {
      return attrs.class.split(" ");
    }
    if (attrs.class && Array.isArray(attrs.class)) {
      return attrs.class;
    }
    return "";
  };
  const combineClassNames = (arrayOfClassnames) => {
    const classNameArray = arrayOfClassnames.flatMap(getClassNames);
    return classNameArray.map((classItem) => classItem.trim()).filter(Boolean).filter((value, index, self) => self.indexOf(value) === index).join(" ");
  };
  const toPascalCase = (string) => string.replace(/(\w)(\w*)(_|-|\s*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
  const replaceElement = (element, { nameAttr, icons, attrs }) => {
    const iconName = element.getAttribute(nameAttr);
    if (iconName == null)
      return;
    const ComponentName = toPascalCase(iconName);
    const iconNode = icons[ComponentName];
    if (!iconNode) {
      return console.warn(
        `${element.outerHTML} icon name was not found in the provided icons object.`
      );
    }
    const elementAttrs = getAttrs(element);
    const [tag, iconAttributes, children] = iconNode;
    const iconAttrs = {
      ...iconAttributes,
      "data-lucide": iconName,
      ...attrs,
      ...elementAttrs
    };
    const classNames = combineClassNames(["lucide", `lucide-${iconName}`, elementAttrs, attrs]);
    if (classNames) {
      Object.assign(iconAttrs, {
        class: classNames
      });
    }
    const svgElement = createElement$1([tag, iconAttrs, children]);
    return element.parentNode?.replaceChild(svgElement, element);
  };

  const defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  };

  const AArrowDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3.5 13h6" }],
      ["path", { d: "m2 16 4.5-9 4.5 9" }],
      ["path", { d: "M18 7v9" }],
      ["path", { d: "m14 12 4 4 4-4" }]
    ]
  ];

  const AArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3.5 13h6" }],
      ["path", { d: "m2 16 4.5-9 4.5 9" }],
      ["path", { d: "M18 16V7" }],
      ["path", { d: "m14 11 4-4 4 4" }]
    ]
  ];

  const ALargeSmall = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 14h-5" }],
      ["path", { d: "M16 16v-3.5a2.5 2.5 0 0 1 5 0V16" }],
      ["path", { d: "M4.5 13h6" }],
      ["path", { d: "m3 16 4.5-9 4.5 9" }]
    ]
  ];

  const Accessibility = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "16", cy: "4", r: "1" }],
      ["path", { d: "m18 19 1-7-6 1" }],
      ["path", { d: "m5 8 3-3 5.5 3-2.36 3.5" }],
      ["path", { d: "M4.24 14.5a5 5 0 0 0 6.88 6" }],
      ["path", { d: "M13.76 17.5a5 5 0 0 0-6.88-6" }]
    ]
  ];

  const Activity = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        }
      ]
    ]
  ];

  const AirVent = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M6 8h12" }],
      ["path", { d: "M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12" }],
      ["path", { d: "M6.6 15.6A2 2 0 1 0 10 17v-5" }]
    ]
  ];

  const Airplay = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" }],
      ["path", { d: "m12 15 5 6H7Z" }]
    ]
  ];

  const AlarmClockCheck = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "13", r: "8" }],
      ["path", { d: "M5 3 2 6" }],
      ["path", { d: "m22 6-3-3" }],
      ["path", { d: "M6.38 18.7 4 21" }],
      ["path", { d: "M17.64 18.67 20 21" }],
      ["path", { d: "m9 13 2 2 4-4" }]
    ]
  ];

  const AlarmClockMinus = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "13", r: "8" }],
      ["path", { d: "M5 3 2 6" }],
      ["path", { d: "m22 6-3-3" }],
      ["path", { d: "M6.38 18.7 4 21" }],
      ["path", { d: "M17.64 18.67 20 21" }],
      ["path", { d: "M9 13h6" }]
    ]
  ];

  const AlarmClockOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6.87 6.87a8 8 0 1 0 11.26 11.26" }],
      ["path", { d: "M19.9 14.25a8 8 0 0 0-9.15-9.15" }],
      ["path", { d: "m22 6-3-3" }],
      ["path", { d: "M6.26 18.67 4 21" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M4 4 2 6" }]
    ]
  ];

  const AlarmClockPlus = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "13", r: "8" }],
      ["path", { d: "M5 3 2 6" }],
      ["path", { d: "m22 6-3-3" }],
      ["path", { d: "M6.38 18.7 4 21" }],
      ["path", { d: "M17.64 18.67 20 21" }],
      ["path", { d: "M12 10v6" }],
      ["path", { d: "M9 13h6" }]
    ]
  ];

  const AlarmClock = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "13", r: "8" }],
      ["path", { d: "M12 9v4l2 2" }],
      ["path", { d: "M5 3 2 6" }],
      ["path", { d: "m22 6-3-3" }],
      ["path", { d: "M6.38 18.7 4 21" }],
      ["path", { d: "M17.64 18.67 20 21" }]
    ]
  ];

  const AlarmSmoke = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 21c0-2.5 2-2.5 2-5" }],
      ["path", { d: "M16 21c0-2.5 2-2.5 2-5" }],
      ["path", { d: "m19 8-.8 3a1.25 1.25 0 0 1-1.2 1H7a1.25 1.25 0 0 1-1.2-1L5 8" }],
      ["path", { d: "M21 3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z" }],
      ["path", { d: "M6 21c0-2.5 2-2.5 2-5" }]
    ]
  ];

  const Album = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["polyline", { points: "11 3 11 11 14 8 17 11 17 3" }]
    ]
  ];

  const AlignCenterHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 12h20" }],
      ["path", { d: "M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" }],
      ["path", { d: "M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" }],
      ["path", { d: "M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" }]
    ]
  ];

  const AlignCenterVertical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v20" }],
      ["path", { d: "M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4" }],
      ["path", { d: "M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4" }],
      ["path", { d: "M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1" }],
      ["path", { d: "M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" }]
    ]
  ];

  const AlignCenter = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 12H7" }],
      ["path", { d: "M19 18H5" }],
      ["path", { d: "M21 6H3" }]
    ]
  ];

  const AlignEndHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "16", x: "4", y: "2", rx: "2" }],
      ["rect", { width: "6", height: "9", x: "14", y: "9", rx: "2" }],
      ["path", { d: "M22 22H2" }]
    ]
  ];

  const AlignEndVertical = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "6", x: "2", y: "4", rx: "2" }],
      ["rect", { width: "9", height: "6", x: "9", y: "14", rx: "2" }],
      ["path", { d: "M22 22V2" }]
    ]
  ];

  const AlignHorizontalDistributeCenter = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
      ["path", { d: "M17 22v-5" }],
      ["path", { d: "M17 7V2" }],
      ["path", { d: "M7 22v-3" }],
      ["path", { d: "M7 5V2" }]
    ]
  ];

  const AlignHorizontalDistributeEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
      ["path", { d: "M10 2v20" }],
      ["path", { d: "M20 2v20" }]
    ]
  ];

  const AlignHorizontalDistributeStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "4", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "14", y: "7", rx: "2" }],
      ["path", { d: "M4 2v20" }],
      ["path", { d: "M14 2v20" }]
    ]
  ];

  const AlignHorizontalJustifyCenter = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "2", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "16", y: "7", rx: "2" }],
      ["path", { d: "M12 2v20" }]
    ]
  ];

  const AlignHorizontalJustifyEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "2", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "12", y: "7", rx: "2" }],
      ["path", { d: "M22 2v20" }]
    ]
  ];

  const AlignHorizontalJustifyStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "6", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "16", y: "7", rx: "2" }],
      ["path", { d: "M2 2v20" }]
    ]
  ];

  const AlignHorizontalSpaceAround = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "10", x: "9", y: "7", rx: "2" }],
      ["path", { d: "M4 22V2" }],
      ["path", { d: "M20 22V2" }]
    ]
  ];

  const AlignHorizontalSpaceBetween = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "14", x: "3", y: "5", rx: "2" }],
      ["rect", { width: "6", height: "10", x: "15", y: "7", rx: "2" }],
      ["path", { d: "M3 2v20" }],
      ["path", { d: "M21 2v20" }]
    ]
  ];

  const AlignJustify = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 12h18" }],
      ["path", { d: "M3 18h18" }],
      ["path", { d: "M3 6h18" }]
    ]
  ];

  const AlignLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 12H3" }],
      ["path", { d: "M17 18H3" }],
      ["path", { d: "M21 6H3" }]
    ]
  ];

  const AlignRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 12H9" }],
      ["path", { d: "M21 18H7" }],
      ["path", { d: "M21 6H3" }]
    ]
  ];

  const AlignStartHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "6", height: "16", x: "4", y: "6", rx: "2" }],
      ["rect", { width: "6", height: "9", x: "14", y: "6", rx: "2" }],
      ["path", { d: "M22 2H2" }]
    ]
  ];

  const AlignStartVertical = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "9", height: "6", x: "6", y: "14", rx: "2" }],
      ["rect", { width: "16", height: "6", x: "6", y: "4", rx: "2" }],
      ["path", { d: "M2 2v20" }]
    ]
  ];

  const AlignVerticalDistributeCenter = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M22 17h-3" }],
      ["path", { d: "M22 7h-5" }],
      ["path", { d: "M5 17H2" }],
      ["path", { d: "M7 7H2" }],
      ["rect", { x: "5", y: "14", width: "14", height: "6", rx: "2" }],
      ["rect", { x: "7", y: "4", width: "10", height: "6", rx: "2" }]
    ]
  ];

  const AlignVerticalDistributeEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "14", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "4", rx: "2" }],
      ["path", { d: "M2 20h20" }],
      ["path", { d: "M2 10h20" }]
    ]
  ];

  const AlignVerticalDistributeStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "14", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "4", rx: "2" }],
      ["path", { d: "M2 14h20" }],
      ["path", { d: "M2 4h20" }]
    ]
  ];

  const AlignVerticalJustifyCenter = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "16", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "2", rx: "2" }],
      ["path", { d: "M2 12h20" }]
    ]
  ];

  const AlignVerticalJustifyEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "12", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "2", rx: "2" }],
      ["path", { d: "M2 22h20" }]
    ]
  ];

  const AlignVerticalJustifyStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "16", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "6", rx: "2" }],
      ["path", { d: "M2 2h20" }]
    ]
  ];

  const AlignVerticalSpaceAround = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "10", height: "6", x: "7", y: "9", rx: "2" }],
      ["path", { d: "M22 20H2" }],
      ["path", { d: "M22 4H2" }]
    ]
  ];

  const AlignVerticalSpaceBetween = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "6", x: "5", y: "15", rx: "2" }],
      ["rect", { width: "10", height: "6", x: "7", y: "3", rx: "2" }],
      ["path", { d: "M2 21h20" }],
      ["path", { d: "M2 3h20" }]
    ]
  ];

  const Ambulance = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 10H6" }],
      ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }],
      [
        "path",
        {
          d: "M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"
        }
      ],
      ["path", { d: "M8 8v4" }],
      ["path", { d: "M9 18h6" }],
      ["circle", { cx: "17", cy: "18", r: "2" }],
      ["circle", { cx: "7", cy: "18", r: "2" }]
    ]
  ];

  const Ampersand = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M17.5 12c0 4.4-3.6 8-8 8A4.5 4.5 0 0 1 5 15.5c0-6 8-4 8-8.5a3 3 0 1 0-6 0c0 3 2.5 8.5 12 13"
        }
      ],
      ["path", { d: "M16 12h3" }]
    ]
  ];

  const Ampersands = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M10 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" }
      ],
      [
        "path",
        { d: "M22 17c-5-3-7-7-7-9a2 2 0 0 1 4 0c0 2.5-5 2.5-5 6 0 1.7 1.3 3 3 3 2.8 0 5-2.2 5-5" }
      ]
    ]
  ];

  const Amphora = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8" }],
      ["path", { d: "M10 5H8a2 2 0 0 0 0 4h.68" }],
      ["path", { d: "M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8" }],
      ["path", { d: "M14 5h2a2 2 0 0 1 0 4h-.68" }],
      ["path", { d: "M18 22H6" }],
      ["path", { d: "M9 2h6" }]
    ]
  ];

  const Anchor = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 22V8" }],
      ["path", { d: "M5 12H2a10 10 0 0 0 20 0h-3" }],
      ["circle", { cx: "12", cy: "5", r: "3" }]
    ]
  ];

  const Angry = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M16 16s-1.5-2-4-2-4 2-4 2" }],
      ["path", { d: "M7.5 8 10 9" }],
      ["path", { d: "m14 9 2.5-1" }],
      ["path", { d: "M9 10h.01" }],
      ["path", { d: "M15 10h.01" }]
    ]
  ];

  const Annoyed = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M8 15h8" }],
      ["path", { d: "M8 9h2" }],
      ["path", { d: "M14 9h2" }]
    ]
  ];

  const Antenna = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 12 7 2" }],
      ["path", { d: "m7 12 5-10" }],
      ["path", { d: "m12 12 5-10" }],
      ["path", { d: "m17 12 5-10" }],
      ["path", { d: "M4.5 7h15" }],
      ["path", { d: "M12 16v6" }]
    ]
  ];

  const Anvil = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" }],
      ["path", { d: "M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" }],
      ["path", { d: "M9 12v5" }],
      ["path", { d: "M15 12v5" }],
      ["path", { d: "M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" }]
    ]
  ];

  const Aperture = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m14.31 8 5.74 9.94" }],
      ["path", { d: "M9.69 8h11.48" }],
      ["path", { d: "m7.38 12 5.74-9.94" }],
      ["path", { d: "M9.69 16 3.95 6.06" }],
      ["path", { d: "M14.31 16H2.83" }],
      ["path", { d: "m16.62 12-5.74 9.94" }]
    ]
  ];

  const AppWindowMac = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
      ["path", { d: "M6 8h.01" }],
      ["path", { d: "M10 8h.01" }],
      ["path", { d: "M14 8h.01" }]
    ]
  ];

  const AppWindow = [
    "svg",
    defaultAttributes,
    [
      ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }],
      ["path", { d: "M10 4v4" }],
      ["path", { d: "M2 8h20" }],
      ["path", { d: "M6 4v4" }]
    ]
  ];

  const Apple = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"
        }
      ],
      ["path", { d: "M10 2c1 .5 2 2 2 5" }]
    ]
  ];

  const ArchiveRestore = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
      ["path", { d: "M4 8v11a2 2 0 0 0 2 2h2" }],
      ["path", { d: "M20 8v11a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "m9 15 3-3 3 3" }],
      ["path", { d: "M12 12v9" }]
    ]
  ];

  const ArchiveX = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
      ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
      ["path", { d: "m9.5 17 5-5" }],
      ["path", { d: "m9.5 12 5 5" }]
    ]
  ];

  const Archive = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }],
      ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
      ["path", { d: "M10 12h4" }]
    ]
  ];

  const Armchair = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" }],
      [
        "path",
        {
          d: "M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"
        }
      ],
      ["path", { d: "M5 18v2" }],
      ["path", { d: "M19 18v2" }]
    ]
  ];

  const ArrowBigDownDash = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 5H9" }],
      ["path", { d: "M15 9v3h4l-7 7-7-7h4V9z" }]
    ]
  ];

  const ArrowBigDown = [
    "svg",
    defaultAttributes,
    [["path", { d: "M15 6v6h4l-7 7-7-7h4V6h6z" }]]
  ];

  const ArrowBigLeftDash = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M19 15V9" }],
      ["path", { d: "M15 15h-3v4l-7-7 7-7v4h3v6z" }]
    ]
  ];

  const ArrowBigLeft = [
    "svg",
    defaultAttributes,
    [["path", { d: "M18 15h-6v4l-7-7 7-7v4h6v6z" }]]
  ];

  const ArrowBigRightDash = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 9v6" }],
      ["path", { d: "M9 9h3V5l7 7-7 7v-4H9V9z" }]
    ]
  ];

  const ArrowBigRight = [
    "svg",
    defaultAttributes,
    [["path", { d: "M6 9h6V5l7 7-7 7v-4H6V9z" }]]
  ];

  const ArrowBigUpDash = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 19h6" }],
      ["path", { d: "M9 15v-3H5l7-7 7 7h-4v3H9z" }]
    ]
  ];

  const ArrowBigUp = [
    "svg",
    defaultAttributes,
    [["path", { d: "M9 18v-6H5l7-7 7 7h-4v6H9z" }]]
  ];

  const ArrowDown01 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["rect", { x: "15", y: "4", width: "4", height: "6", ry: "2" }],
      ["path", { d: "M17 20v-6h-2" }],
      ["path", { d: "M15 20h4" }]
    ]
  ];

  const ArrowDown10 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["path", { d: "M17 10V4h-2" }],
      ["path", { d: "M15 10h4" }],
      ["rect", { x: "15", y: "14", width: "4", height: "6", ry: "2" }]
    ]
  ];

  const ArrowDownAZ = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["path", { d: "M20 8h-5" }],
      ["path", { d: "M15 10V6.5a2.5 2.5 0 0 1 5 0V10" }],
      ["path", { d: "M15 14h5l-5 6h5" }]
    ]
  ];

  const ArrowDownFromLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M19 3H5" }],
      ["path", { d: "M12 21V7" }],
      ["path", { d: "m6 15 6 6 6-6" }]
    ]
  ];

  const ArrowDownLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 7 7 17" }],
      ["path", { d: "M17 17H7V7" }]
    ]
  ];

  const ArrowDownNarrowWide = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["path", { d: "M11 4h4" }],
      ["path", { d: "M11 8h7" }],
      ["path", { d: "M11 12h10" }]
    ]
  ];

  const ArrowDownRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 7 10 10" }],
      ["path", { d: "M17 7v10H7" }]
    ]
  ];

  const ArrowDownToDot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v14" }],
      ["path", { d: "m19 9-7 7-7-7" }],
      ["circle", { cx: "12", cy: "21", r: "1" }]
    ]
  ];

  const ArrowDownToLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 17V3" }],
      ["path", { d: "m6 11 6 6 6-6" }],
      ["path", { d: "M19 21H5" }]
    ]
  ];

  const ArrowDownUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["path", { d: "m21 8-4-4-4 4" }],
      ["path", { d: "M17 4v16" }]
    ]
  ];

  const ArrowDownWideNarrow = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 20V4" }],
      ["path", { d: "M11 4h10" }],
      ["path", { d: "M11 8h7" }],
      ["path", { d: "M11 12h4" }]
    ]
  ];

  const ArrowDownZA = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 16 4 4 4-4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M15 4h5l-5 6h5" }],
      ["path", { d: "M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" }],
      ["path", { d: "M20 18h-5" }]
    ]
  ];

  const ArrowDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 5v14" }],
      ["path", { d: "m19 12-7 7-7-7" }]
    ]
  ];

  const ArrowLeftFromLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m9 6-6 6 6 6" }],
      ["path", { d: "M3 12h14" }],
      ["path", { d: "M21 19V5" }]
    ]
  ];

  const ArrowLeftRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 3 4 7l4 4" }],
      ["path", { d: "M4 7h16" }],
      ["path", { d: "m16 21 4-4-4-4" }],
      ["path", { d: "M20 17H4" }]
    ]
  ];

  const ArrowLeftToLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 19V5" }],
      ["path", { d: "m13 6-6 6 6 6" }],
      ["path", { d: "M7 12h14" }]
    ]
  ];

  const ArrowLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m12 19-7-7 7-7" }],
      ["path", { d: "M19 12H5" }]
    ]
  ];

  const ArrowRightFromLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 5v14" }],
      ["path", { d: "M21 12H7" }],
      ["path", { d: "m15 18 6-6-6-6" }]
    ]
  ];

  const ArrowRightLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m16 3 4 4-4 4" }],
      ["path", { d: "M20 7H4" }],
      ["path", { d: "m8 21-4-4 4-4" }],
      ["path", { d: "M4 17h16" }]
    ]
  ];

  const ArrowRightToLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 12H3" }],
      ["path", { d: "m11 18 6-6-6-6" }],
      ["path", { d: "M21 5v14" }]
    ]
  ];

  const ArrowRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 12h14" }],
      ["path", { d: "m12 5 7 7-7 7" }]
    ]
  ];

  const ArrowUp01 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["rect", { x: "15", y: "4", width: "4", height: "6", ry: "2" }],
      ["path", { d: "M17 20v-6h-2" }],
      ["path", { d: "M15 20h4" }]
    ]
  ];

  const ArrowUp10 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M17 10V4h-2" }],
      ["path", { d: "M15 10h4" }],
      ["rect", { x: "15", y: "14", width: "4", height: "6", ry: "2" }]
    ]
  ];

  const ArrowUpAZ = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M20 8h-5" }],
      ["path", { d: "M15 10V6.5a2.5 2.5 0 0 1 5 0V10" }],
      ["path", { d: "M15 14h5l-5 6h5" }]
    ]
  ];

  const ArrowUpDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m21 16-4 4-4-4" }],
      ["path", { d: "M17 20V4" }],
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }]
    ]
  ];

  const ArrowUpFromDot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m5 9 7-7 7 7" }],
      ["path", { d: "M12 16V2" }],
      ["circle", { cx: "12", cy: "21", r: "1" }]
    ]
  ];

  const ArrowUpFromLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m18 9-6-6-6 6" }],
      ["path", { d: "M12 3v14" }],
      ["path", { d: "M5 21h14" }]
    ]
  ];

  const ArrowUpLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 17V7h10" }],
      ["path", { d: "M17 17 7 7" }]
    ]
  ];

  const ArrowUpNarrowWide = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M11 12h4" }],
      ["path", { d: "M11 16h7" }],
      ["path", { d: "M11 20h10" }]
    ]
  ];

  const ArrowUpRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 7h10v10" }],
      ["path", { d: "M7 17 17 7" }]
    ]
  ];

  const ArrowUpToLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 3h14" }],
      ["path", { d: "m18 13-6-6-6 6" }],
      ["path", { d: "M12 7v14" }]
    ]
  ];

  const ArrowUpWideNarrow = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M11 12h10" }],
      ["path", { d: "M11 16h7" }],
      ["path", { d: "M11 20h4" }]
    ]
  ];

  const ArrowUpZA = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 8 4-4 4 4" }],
      ["path", { d: "M7 4v16" }],
      ["path", { d: "M15 4h5l-5 6h5" }],
      ["path", { d: "M15 20v-3.5a2.5 2.5 0 0 1 5 0V20" }],
      ["path", { d: "M20 18h-5" }]
    ]
  ];

  const ArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m5 12 7-7 7 7" }],
      ["path", { d: "M12 19V5" }]
    ]
  ];

  const ArrowsUpFromLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m4 6 3-3 3 3" }],
      ["path", { d: "M7 17V3" }],
      ["path", { d: "m14 6 3-3 3 3" }],
      ["path", { d: "M17 17V3" }],
      ["path", { d: "M4 21h16" }]
    ]
  ];

  const Asterisk = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 6v12" }],
      ["path", { d: "M17.196 9 6.804 15" }],
      ["path", { d: "m6.804 9 10.392 6" }]
    ]
  ];

  const AtSign = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }]
    ]
  ];

  const Atom = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "1" }],
      [
        "path",
        {
          d: "M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"
        }
      ],
      [
        "path",
        {
          d: "M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"
        }
      ]
    ]
  ];

  const AudioLines = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 10v3" }],
      ["path", { d: "M6 6v11" }],
      ["path", { d: "M10 3v18" }],
      ["path", { d: "M14 8v7" }],
      ["path", { d: "M18 5v13" }],
      ["path", { d: "M22 10v3" }]
    ]
  ];

  const AudioWaveform = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"
        }
      ]
    ]
  ];

  const Award = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
        }
      ],
      ["circle", { cx: "12", cy: "8", r: "6" }]
    ]
  ];

  const Axe = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9" }],
      ["path", { d: "M15 13 9 7l4-4 6 6h3a8 8 0 0 1-7 7z" }]
    ]
  ];

  const Axis3d = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 4v16h16" }],
      ["path", { d: "m4 20 7-7" }]
    ]
  ];

  const Baby = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 12h.01" }],
      ["path", { d: "M15 12h.01" }],
      ["path", { d: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" }],
      [
        "path",
        {
          d: "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"
        }
      ]
    ]
  ];

  const Backpack = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" }],
      ["path", { d: "M8 10h8" }],
      ["path", { d: "M8 18h8" }],
      ["path", { d: "M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" }],
      ["path", { d: "M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" }]
    ]
  ];

  const BadgeAlert = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
      ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]
    ]
  ];

  const BadgeCent = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M12 7v10" }],
      ["path", { d: "M15.4 10a4 4 0 1 0 0 4" }]
    ]
  ];

  const BadgeCheck = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "m9 12 2 2 4-4" }]
    ]
  ];

  const BadgeDollarSign = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
      ["path", { d: "M12 18V6" }]
    ]
  ];

  const BadgeEuro = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M7 12h5" }],
      ["path", { d: "M15 9.4a4 4 0 1 0 0 5.2" }]
    ]
  ];

  const BadgeHelp = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
      ["line", { x1: "12", x2: "12.01", y1: "17", y2: "17" }]
    ]
  ];

  const BadgeIndianRupee = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M8 8h8" }],
      ["path", { d: "M8 12h8" }],
      ["path", { d: "m13 17-5-1h1a4 4 0 0 0 0-8" }]
    ]
  ];

  const BadgeInfo = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["line", { x1: "12", x2: "12", y1: "16", y2: "12" }],
      ["line", { x1: "12", x2: "12.01", y1: "8", y2: "8" }]
    ]
  ];

  const BadgeJapaneseYen = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "m9 8 3 3v7" }],
      ["path", { d: "m12 11 3-3" }],
      ["path", { d: "M9 12h6" }],
      ["path", { d: "M9 16h6" }]
    ]
  ];

  const BadgeMinus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }]
    ]
  ];

  const BadgePercent = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "m15 9-6 6" }],
      ["path", { d: "M9 9h.01" }],
      ["path", { d: "M15 15h.01" }]
    ]
  ];

  const BadgePlus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["line", { x1: "12", x2: "12", y1: "8", y2: "16" }],
      ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }]
    ]
  ];

  const BadgePoundSterling = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M8 12h4" }],
      ["path", { d: "M10 16V9.5a2.5 2.5 0 0 1 5 0" }],
      ["path", { d: "M8 16h7" }]
    ]
  ];

  const BadgeRussianRuble = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M9 16h5" }],
      ["path", { d: "M9 12h5a2 2 0 1 0 0-4h-3v9" }]
    ]
  ];

  const BadgeSwissFranc = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["path", { d: "M11 17V8h4" }],
      ["path", { d: "M11 12h3" }],
      ["path", { d: "M9 16h4" }]
    ]
  ];

  const BadgeX = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ],
      ["line", { x1: "15", x2: "9", y1: "9", y2: "15" }],
      ["line", { x1: "9", x2: "15", y1: "9", y2: "15" }]
    ]
  ];

  const Badge = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        }
      ]
    ]
  ];

  const BaggageClaim = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2" }],
      ["path", { d: "M17 14V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v10" }],
      ["rect", { width: "13", height: "8", x: "8", y: "6", rx: "1" }],
      ["circle", { cx: "18", cy: "20", r: "2" }],
      ["circle", { cx: "9", cy: "20", r: "2" }]
    ]
  ];

  const Ban = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m4.9 4.9 14.2 14.2" }]
    ]
  ];

  const Banana = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" }],
      [
        "path",
        {
          d: "M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z"
        }
      ]
    ]
  ];

  const Bandage = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 10.01h.01" }],
      ["path", { d: "M10 14.01h.01" }],
      ["path", { d: "M14 10.01h.01" }],
      ["path", { d: "M14 14.01h.01" }],
      ["path", { d: "M18 6v11.5" }],
      ["path", { d: "M6 6v12" }],
      ["rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" }]
    ]
  ];

  const Banknote = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }],
      ["circle", { cx: "12", cy: "12", r: "2" }],
      ["path", { d: "M6 12h.01M18 12h.01" }]
    ]
  ];

  const Barcode = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 5v14" }],
      ["path", { d: "M8 5v14" }],
      ["path", { d: "M12 5v14" }],
      ["path", { d: "M17 5v14" }],
      ["path", { d: "M21 5v14" }]
    ]
  ];

  const Baseline = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 20h16" }],
      ["path", { d: "m6 16 6-12 6 12" }],
      ["path", { d: "M8 12h8" }]
    ]
  ];

  const Bath = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 4 8 6" }],
      ["path", { d: "M17 19v2" }],
      ["path", { d: "M2 12h20" }],
      ["path", { d: "M7 19v2" }],
      ["path", { d: "M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" }]
    ]
  ];

  const BatteryCharging = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1" }],
      ["path", { d: "m11 7-3 5h4l-3 5" }],
      ["line", { x1: "22", x2: "22", y1: "11", y2: "13" }]
    ]
  ];

  const BatteryFull = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "10", x: "2", y: "7", rx: "2", ry: "2" }],
      ["line", { x1: "22", x2: "22", y1: "11", y2: "13" }],
      ["line", { x1: "6", x2: "6", y1: "11", y2: "13" }],
      ["line", { x1: "10", x2: "10", y1: "11", y2: "13" }],
      ["line", { x1: "14", x2: "14", y1: "11", y2: "13" }]
    ]
  ];

  const BatteryLow = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "10", x: "2", y: "7", rx: "2", ry: "2" }],
      ["line", { x1: "22", x2: "22", y1: "11", y2: "13" }],
      ["line", { x1: "6", x2: "6", y1: "11", y2: "13" }]
    ]
  ];

  const BatteryMedium = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "10", x: "2", y: "7", rx: "2", ry: "2" }],
      ["line", { x1: "22", x2: "22", y1: "11", y2: "13" }],
      ["line", { x1: "6", x2: "6", y1: "11", y2: "13" }],
      ["line", { x1: "10", x2: "10", y1: "11", y2: "13" }]
    ]
  ];

  const BatteryWarning = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 17h.01" }],
      ["path", { d: "M10 7v6" }],
      ["path", { d: "M14 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M22 11v2" }],
      ["path", { d: "M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }]
    ]
  ];

  const Battery = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "10", x: "2", y: "7", rx: "2", ry: "2" }],
      ["line", { x1: "22", x2: "22", y1: "11", y2: "13" }]
    ]
  ];

  const Beaker = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4.5 3h15" }],
      ["path", { d: "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" }],
      ["path", { d: "M6 14h12" }]
    ]
  ];

  const BeanOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22a13.96 13.96 0 0 0 9.9-4.1" }],
      ["path", { d: "M10.75 5.093A6 6 0 0 1 22 8c0 2.411-.61 4.68-1.683 6.66" }],
      ["path", { d: "M5.341 10.62a4 4 0 0 0 6.487 1.208M10.62 5.341a4.015 4.015 0 0 1 2.039 2.04" }],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const Bean = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z"
        }
      ],
      ["path", { d: "M5.341 10.62a4 4 0 1 0 5.279-5.28" }]
    ]
  ];

  const BedDouble = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" }],
      ["path", { d: "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }],
      ["path", { d: "M12 4v6" }],
      ["path", { d: "M2 18h20" }]
    ]
  ];

  const BedSingle = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" }],
      ["path", { d: "M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" }],
      ["path", { d: "M3 18h18" }]
    ]
  ];

  const Bed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 4v16" }],
      ["path", { d: "M2 8h18a2 2 0 0 1 2 2v10" }],
      ["path", { d: "M2 17h20" }],
      ["path", { d: "M6 8v9" }]
    ]
  ];

  const Beef = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12.5", cy: "8.5", r: "2.5" }],
      [
        "path",
        {
          d: "M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z"
        }
      ],
      [
        "path",
        {
          d: "m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"
        }
      ]
    ]
  ];

  const BeerOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13 13v5" }],
      ["path", { d: "M17 11.47V8" }],
      ["path", { d: "M17 11h1a3 3 0 0 1 2.745 4.211" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" }],
      ["path", { d: "M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268" }],
      [
        "path",
        {
          d: "M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12"
        }
      ],
      ["path", { d: "M9 14.6V18" }]
    ]
  ];

  const Beer = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 11h1a3 3 0 0 1 0 6h-1" }],
      ["path", { d: "M9 12v6" }],
      ["path", { d: "M13 12v6" }],
      [
        "path",
        {
          d: "M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"
        }
      ],
      ["path", { d: "M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" }]
    ]
  ];

  const BellDot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      [
        "path",
        {
          d: "M13.916 2.314A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.74 7.327A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673 9 9 0 0 1-.585-.665"
        }
      ],
      ["circle", { cx: "18", cy: "8", r: "3" }]
    ]
  ];

  const BellElectric = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18.8 4A6.3 8.7 0 0 1 20 9" }],
      ["path", { d: "M9 9h.01" }],
      ["circle", { cx: "9", cy: "9", r: "7" }],
      ["rect", { width: "10", height: "6", x: "4", y: "16", rx: "2" }],
      ["path", { d: "M14 19c3 0 4.6-1.6 4.6-1.6" }],
      ["circle", { cx: "20", cy: "16", r: "2" }]
    ]
  ];

  const BellMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      ["path", { d: "M15 8h6" }],
      [
        "path",
        {
          d: "M16.243 3.757A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673A9.4 9.4 0 0 1 18.667 12"
        }
      ]
    ]
  ];

  const BellOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      ["path", { d: "M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" }]
    ]
  ];

  const BellPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      ["path", { d: "M15 8h6" }],
      ["path", { d: "M18 5v6" }],
      [
        "path",
        {
          d: "M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332"
        }
      ]
    ]
  ];

  const BellRing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      ["path", { d: "M22 8c0-2.3-.8-4.3-2-6" }],
      [
        "path",
        {
          d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
        }
      ],
      ["path", { d: "M4 2C2.8 3.7 2 5.7 2 8" }]
    ]
  ];

  const Bell = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }],
      [
        "path",
        {
          d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
        }
      ]
    ]
  ];

  const BetweenHorizontalEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "13", height: "7", x: "3", y: "3", rx: "1" }],
      ["path", { d: "m22 15-3-3 3-3" }],
      ["rect", { width: "13", height: "7", x: "3", y: "14", rx: "1" }]
    ]
  ];

  const BetweenHorizontalStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "13", height: "7", x: "8", y: "3", rx: "1" }],
      ["path", { d: "m2 9 3 3-3 3" }],
      ["rect", { width: "13", height: "7", x: "8", y: "14", rx: "1" }]
    ]
  ];

  const BetweenVerticalEnd = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "13", x: "3", y: "3", rx: "1" }],
      ["path", { d: "m9 22 3-3 3 3" }],
      ["rect", { width: "7", height: "13", x: "14", y: "3", rx: "1" }]
    ]
  ];

  const BetweenVerticalStart = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "13", x: "3", y: "8", rx: "1" }],
      ["path", { d: "m15 2-3 3-3-3" }],
      ["rect", { width: "7", height: "13", x: "14", y: "8", rx: "1" }]
    ]
  ];

  const BicepsFlexed = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"
        }
      ],
      ["path", { d: "M15 14a5 5 0 0 0-7.584 2" }],
      ["path", { d: "M9.964 6.825C8.019 7.977 9.5 13 8 15" }]
    ]
  ];

  const Bike = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18.5", cy: "17.5", r: "3.5" }],
      ["circle", { cx: "5.5", cy: "17.5", r: "3.5" }],
      ["circle", { cx: "15", cy: "5", r: "1" }],
      ["path", { d: "M12 17.5V14l-3-3 4-3 2 3h2" }]
    ]
  ];

  const Binary = [
    "svg",
    defaultAttributes,
    [
      ["rect", { x: "14", y: "14", width: "4", height: "6", rx: "2" }],
      ["rect", { x: "6", y: "4", width: "4", height: "6", rx: "2" }],
      ["path", { d: "M6 20h4" }],
      ["path", { d: "M14 10h4" }],
      ["path", { d: "M6 14h2v6" }],
      ["path", { d: "M14 4h2v6" }]
    ]
  ];

  const Binoculars = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 10h4" }],
      ["path", { d: "M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" }],
      [
        "path",
        {
          d: "M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"
        }
      ],
      ["path", { d: "M 22 16 L 2 16" }],
      [
        "path",
        {
          d: "M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"
        }
      ],
      ["path", { d: "M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" }]
    ]
  ];

  const Biohazard = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "11.9", r: "2" }],
      ["path", { d: "M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6" }],
      ["path", { d: "m8.9 10.1 1.4.8" }],
      ["path", { d: "M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5" }],
      ["path", { d: "m15.1 10.1-1.4.8" }],
      ["path", { d: "M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2" }],
      ["path", { d: "M12 13.9v1.6" }],
      ["path", { d: "M13.5 5.4c-1-.2-2-.2-3 0" }],
      ["path", { d: "M17 16.4c.7-.7 1.2-1.6 1.5-2.5" }],
      ["path", { d: "M5.5 13.9c.3.9.8 1.8 1.5 2.5" }]
    ]
  ];

  const Bird = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 7h.01" }],
      ["path", { d: "M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" }],
      ["path", { d: "m20 7 2 .5-2 .5" }],
      ["path", { d: "M10 18v3" }],
      ["path", { d: "M14 17.75V21" }],
      ["path", { d: "M7 18a6 6 0 0 0 3.84-10.61" }]
    ]
  ];

  const Bitcoin = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"
        }
      ]
    ]
  ];

  const Blend = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "9", cy: "9", r: "7" }],
      ["circle", { cx: "15", cy: "15", r: "7" }]
    ]
  ];

  const Blinds = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3h18" }],
      ["path", { d: "M20 7H8" }],
      ["path", { d: "M20 11H8" }],
      ["path", { d: "M10 19h10" }],
      ["path", { d: "M8 15h12" }],
      ["path", { d: "M4 3v14" }],
      ["circle", { cx: "4", cy: "19", r: "2" }]
    ]
  ];

  const Blocks = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
      [
        "path",
        {
          d: "M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"
        }
      ]
    ]
  ];

  const BluetoothConnected = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }],
      ["line", { x1: "18", x2: "21", y1: "12", y2: "12" }],
      ["line", { x1: "3", x2: "6", y1: "12", y2: "12" }]
    ]
  ];

  const BluetoothOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m17 17-5 5V12l-5 5" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M14.5 9.5 17 7l-5-5v4.5" }]
    ]
  ];

  const BluetoothSearching = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }],
      ["path", { d: "M20.83 14.83a4 4 0 0 0 0-5.66" }],
      ["path", { d: "M18 12h.01" }]
    ]
  ];

  const Bluetooth = [
    "svg",
    defaultAttributes,
    [["path", { d: "m7 7 10 10-5 5V2l5 5L7 17" }]]
  ];

  const Bold = [
    "svg",
    defaultAttributes,
    [["path", { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" }]]
  ];

  const Bolt = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        }
      ],
      ["circle", { cx: "12", cy: "12", r: "4" }]
    ]
  ];

  const Bomb = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "11", cy: "13", r: "9" }],
      [
        "path",
        { d: "M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" }
      ],
      ["path", { d: "m22 2-1.5 1.5" }]
    ]
  ];

  const Bone = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"
        }
      ]
    ]
  ];

  const BookA = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "m8 13 4-7 4 7" }],
      ["path", { d: "M9.1 11h5.7" }]
    ]
  ];

  const BookAudio = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 6v7" }],
      ["path", { d: "M16 8v3" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "M8 8v3" }]
    ]
  ];

  const BookCheck = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "m9 9.5 2 2 4-4" }]
    ]
  ];

  const BookCopy = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 16V4a2 2 0 0 1 2-2h11" }],
      [
        "path",
        {
          d: "M22 18H11a2 2 0 1 0 0 4h10.5a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5H11a2 2 0 0 0-2 2v12"
        }
      ],
      ["path", { d: "M5 14H4a2 2 0 1 0 0 4h1" }]
    ]
  ];

  const BookDashed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 17h1.5" }],
      ["path", { d: "M12 22h1.5" }],
      ["path", { d: "M12 2h1.5" }],
      ["path", { d: "M17.5 22H19a1 1 0 0 0 1-1" }],
      ["path", { d: "M17.5 2H19a1 1 0 0 1 1 1v1.5" }],
      ["path", { d: "M20 14v3h-2.5" }],
      ["path", { d: "M20 8.5V10" }],
      ["path", { d: "M4 10V8.5" }],
      ["path", { d: "M4 19.5V14" }],
      ["path", { d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H8" }],
      ["path", { d: "M8 22H6.5a1 1 0 0 1 0-5H8" }]
    ]
  ];

  const BookDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13V7" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "m9 10 3 3 3-3" }]
    ]
  ];

  const BookHeadphones = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "M8 12v-2a4 4 0 0 1 8 0v2" }],
      ["circle", { cx: "15", cy: "12", r: "1" }],
      ["circle", { cx: "9", cy: "12", r: "1" }]
    ]
  ];

  const BookHeart = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M16 8.2A2.22 2.22 0 0 0 13.8 6c-.8 0-1.4.3-1.8.9-.4-.6-1-.9-1.8-.9A2.22 2.22 0 0 0 8 8.2c0 .6.3 1.2.7 1.6A226.652 226.652 0 0 0 12 13a404 404 0 0 0 3.3-3.1 2.413 2.413 0 0 0 .7-1.7"
        }
      ],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ]
    ]
  ];

  const BookImage = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["circle", { cx: "10", cy: "8", r: "2" }]
    ]
  ];

  const BookKey = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m19 3 1 1" }],
      ["path", { d: "m20 2-4.5 4.5" }],
      ["path", { d: "M20 8v13a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
      ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H14" }],
      ["circle", { cx: "14", cy: "8", r: "2" }]
    ]
  ];

  const BookLock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 6V4a2 2 0 1 0-4 0v2" }],
      ["path", { d: "M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
      ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10" }],
      ["rect", { x: "12", y: "6", width: "8", height: "5", rx: "1" }]
    ]
  ];

  const BookMarked = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2v8l3-3 3 3V2" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ]
    ]
  ];

  const BookMinus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "M9 10h6" }]
    ]
  ];

  const BookOpenCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 21V7" }],
      ["path", { d: "m16 12 2 2 4-4" }],
      [
        "path",
        {
          d: "M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"
        }
      ]
    ]
  ];

  const BookOpenText = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 7v14" }],
      ["path", { d: "M16 12h2" }],
      ["path", { d: "M16 8h2" }],
      [
        "path",
        {
          d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
        }
      ],
      ["path", { d: "M6 12h2" }],
      ["path", { d: "M6 8h2" }]
    ]
  ];

  const BookOpen = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 7v14" }],
      [
        "path",
        {
          d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
        }
      ]
    ]
  ];

  const BookPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 7v6" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "M9 10h6" }]
    ]
  ];

  const BookText = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "M8 11h8" }],
      ["path", { d: "M8 7h6" }]
    ]
  ];

  const BookType = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 13h4" }],
      ["path", { d: "M12 6v7" }],
      ["path", { d: "M16 8V6H8v2" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ]
    ]
  ];

  const BookUp2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13V7" }],
      ["path", { d: "M18 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" }],
      ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2" }],
      ["path", { d: "m9 10 3-3 3 3" }],
      ["path", { d: "m9 5 3-3 3 3" }]
    ]
  ];

  const BookUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13V7" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "m9 10 3-3 3 3" }]
    ]
  ];

  const BookUser = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 13a3 3 0 1 0-6 0" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["circle", { cx: "12", cy: "8", r: "2" }]
    ]
  ];

  const BookX = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14.5 7-5 5" }],
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ],
      ["path", { d: "m9.5 7 5 5" }]
    ]
  ];

  const Book = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
        }
      ]
    ]
  ];

  const BookmarkCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }],
      ["path", { d: "m9 10 2 2 4-4" }]
    ]
  ];

  const BookmarkMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }],
      ["line", { x1: "15", x2: "9", y1: "10", y2: "10" }]
    ]
  ];

  const BookmarkPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }],
      ["line", { x1: "12", x2: "12", y1: "7", y2: "13" }],
      ["line", { x1: "15", x2: "9", y1: "10", y2: "10" }]
    ]
  ];

  const BookmarkX = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }],
      ["path", { d: "m14.5 7.5-5 5" }],
      ["path", { d: "m9.5 7.5 5 5" }]
    ]
  ];

  const Bookmark = [
    "svg",
    defaultAttributes,
    [["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }]]
  ];

  const BoomBox = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" }],
      ["path", { d: "M8 8v1" }],
      ["path", { d: "M12 8v1" }],
      ["path", { d: "M16 8v1" }],
      ["rect", { width: "20", height: "12", x: "2", y: "9", rx: "2" }],
      ["circle", { cx: "8", cy: "15", r: "2" }],
      ["circle", { cx: "16", cy: "15", r: "2" }]
    ]
  ];

  const BotMessageSquare = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 6V2H8" }],
      ["path", { d: "m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" }],
      ["path", { d: "M2 12h2" }],
      ["path", { d: "M9 11v2" }],
      ["path", { d: "M15 11v2" }],
      ["path", { d: "M20 12h2" }]
    ]
  ];

  const BotOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13.67 8H18a2 2 0 0 1 2 2v4.33" }],
      ["path", { d: "M2 14h2" }],
      ["path", { d: "M20 14h2" }],
      ["path", { d: "M22 22 2 2" }],
      ["path", { d: "M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" }],
      ["path", { d: "M9 13v2" }],
      ["path", { d: "M9.67 4H12v2.33" }]
    ]
  ];

  const Bot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 8V4H8" }],
      ["rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }],
      ["path", { d: "M2 14h2" }],
      ["path", { d: "M20 14h2" }],
      ["path", { d: "M15 13v2" }],
      ["path", { d: "M9 13v2" }]
    ]
  ];

  const Box = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        }
      ],
      ["path", { d: "m3.3 7 8.7 5 8.7-5" }],
      ["path", { d: "M12 22V12" }]
    ]
  ];

  const Boxes = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"
        }
      ],
      ["path", { d: "m7 16.5-4.74-2.85" }],
      ["path", { d: "m7 16.5 5-3" }],
      ["path", { d: "M7 16.5v5.17" }],
      [
        "path",
        {
          d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"
        }
      ],
      ["path", { d: "m17 16.5-5-3" }],
      ["path", { d: "m17 16.5 4.74-2.85" }],
      ["path", { d: "M17 16.5v5.17" }],
      [
        "path",
        {
          d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"
        }
      ],
      ["path", { d: "M12 8 7.26 5.15" }],
      ["path", { d: "m12 8 4.74-2.85" }],
      ["path", { d: "M12 13.5V8" }]
    ]
  ];

  const Braces = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" }],
      ["path", { d: "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" }]
    ]
  ];

  const Brackets = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 3h3v18h-3" }],
      ["path", { d: "M8 21H5V3h3" }]
    ]
  ];

  const BrainCircuit = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" }
      ],
      ["path", { d: "M9 13a4.5 4.5 0 0 0 3-4" }],
      ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5" }],
      ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396" }],
      ["path", { d: "M6 18a4 4 0 0 1-1.967-.516" }],
      ["path", { d: "M12 13h4" }],
      ["path", { d: "M12 18h6a2 2 0 0 1 2 2v1" }],
      ["path", { d: "M12 8h8" }],
      ["path", { d: "M16 8V5a2 2 0 0 1 2-2" }],
      ["circle", { cx: "16", cy: "13", r: ".5" }],
      ["circle", { cx: "18", cy: "3", r: ".5" }],
      ["circle", { cx: "20", cy: "21", r: ".5" }],
      ["circle", { cx: "20", cy: "8", r: ".5" }]
    ]
  ];

  const BrainCog = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3.2 3.2 0 0 0 .164-.546c.028-.13.306-.13.335 0a3.2 3.2 0 0 0 .163.546 4 4 0 0 0 7.636-2.106 4 4 0 0 0 .556-6.588 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5"
        }
      ],
      ["path", { d: "M17.599 6.5a3 3 0 0 0 .399-1.375" }],
      ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5" }],
      ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396" }],
      ["path", { d: "M19.938 10.5a4 4 0 0 1 .585.396" }],
      ["path", { d: "M6 18a4 4 0 0 1-1.967-.516" }],
      ["path", { d: "M19.967 17.484A4 4 0 0 1 18 18" }],
      ["circle", { cx: "12", cy: "12", r: "3" }],
      ["path", { d: "m15.7 10.4-.9.4" }],
      ["path", { d: "m9.2 13.2-.9.4" }],
      ["path", { d: "m13.6 15.7-.4-.9" }],
      ["path", { d: "m10.8 9.2-.4-.9" }],
      ["path", { d: "m15.7 13.5-.9-.4" }],
      ["path", { d: "m9.2 10.9-.9-.4" }],
      ["path", { d: "m10.5 15.7.4-.9" }],
      ["path", { d: "m13.1 9.2.4-.9" }]
    ]
  ];

  const Brain = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" }
      ],
      [
        "path",
        { d: "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" }
      ],
      ["path", { d: "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" }],
      ["path", { d: "M17.599 6.5a3 3 0 0 0 .399-1.375" }],
      ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5" }],
      ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396" }],
      ["path", { d: "M19.938 10.5a4 4 0 0 1 .585.396" }],
      ["path", { d: "M6 18a4 4 0 0 1-1.967-.516" }],
      ["path", { d: "M19.967 17.484A4 4 0 0 1 18 18" }]
    ]
  ];

  const BrickWall = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M12 9v6" }],
      ["path", { d: "M16 15v6" }],
      ["path", { d: "M16 3v6" }],
      ["path", { d: "M3 15h18" }],
      ["path", { d: "M3 9h18" }],
      ["path", { d: "M8 15v6" }],
      ["path", { d: "M8 3v6" }]
    ]
  ];

  const BriefcaseBusiness = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M22 13a18.15 18.15 0 0 1-20 0" }],
      ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
    ]
  ];

  const BriefcaseConveyorBelt = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 20v2" }],
      ["path", { d: "M14 20v2" }],
      ["path", { d: "M18 20v2" }],
      ["path", { d: "M21 20H3" }],
      ["path", { d: "M6 20v2" }],
      ["path", { d: "M8 16V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12" }],
      ["rect", { x: "4", y: "6", width: "16", height: "10", rx: "2" }]
    ]
  ];

  const BriefcaseMedical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 11v4" }],
      ["path", { d: "M14 13h-4" }],
      ["path", { d: "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M18 6v14" }],
      ["path", { d: "M6 6v14" }],
      ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
    ]
  ];

  const Briefcase = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }],
      ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2" }]
    ]
  ];

  const BringToFront = [
    "svg",
    defaultAttributes,
    [
      ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "2" }],
      ["path", { d: "M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" }],
      ["path", { d: "M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" }]
    ]
  ];

  const Brush = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" }],
      [
        "path",
        {
          d: "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"
        }
      ]
    ]
  ];

  const BugOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 7.13V6a3 3 0 0 0-5.14-2.1L8 2" }],
      ["path", { d: "M14.12 3.88 16 2" }],
      ["path", { d: "M22 13h-4v-2a4 4 0 0 0-4-4h-1.3" }],
      ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M7.7 7.7A4 4 0 0 0 6 11v3a6 6 0 0 0 11.13 3.13" }],
      ["path", { d: "M12 20v-8" }],
      ["path", { d: "M6 13H2" }],
      ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4" }]
    ]
  ];

  const BugPlay = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12.765 21.522a.5.5 0 0 1-.765-.424v-8.196a.5.5 0 0 1 .765-.424l5.878 3.674a1 1 0 0 1 0 1.696z"
        }
      ],
      ["path", { d: "M14.12 3.88 16 2" }],
      ["path", { d: "M18 11a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v3a6.1 6.1 0 0 0 2 4.5" }],
      ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" }],
      ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4" }],
      ["path", { d: "M6 13H2" }],
      ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5" }],
      ["path", { d: "m8 2 1.88 1.88" }],
      ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" }]
    ]
  ];

  const Bug = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m8 2 1.88 1.88" }],
      ["path", { d: "M14.12 3.88 16 2" }],
      ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" }],
      ["path", { d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" }],
      ["path", { d: "M12 20v-9" }],
      ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5" }],
      ["path", { d: "M6 13H2" }],
      ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4" }],
      ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" }],
      ["path", { d: "M22 13h-4" }],
      ["path", { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4" }]
    ]
  ];

  const Building2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }],
      ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }],
      ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M10 6h4" }],
      ["path", { d: "M10 10h4" }],
      ["path", { d: "M10 14h4" }],
      ["path", { d: "M10 18h4" }]
    ]
  ];

  const Building = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2" }],
      ["path", { d: "M9 22v-4h6v4" }],
      ["path", { d: "M8 6h.01" }],
      ["path", { d: "M16 6h.01" }],
      ["path", { d: "M12 6h.01" }],
      ["path", { d: "M12 10h.01" }],
      ["path", { d: "M12 14h.01" }],
      ["path", { d: "M16 10h.01" }],
      ["path", { d: "M16 14h.01" }],
      ["path", { d: "M8 10h.01" }],
      ["path", { d: "M8 14h.01" }]
    ]
  ];

  const BusFront = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 6 2 7" }],
      ["path", { d: "M10 6h4" }],
      ["path", { d: "m22 7-2-1" }],
      ["rect", { width: "16", height: "16", x: "4", y: "3", rx: "2" }],
      ["path", { d: "M4 11h16" }],
      ["path", { d: "M8 15h.01" }],
      ["path", { d: "M16 15h.01" }],
      ["path", { d: "M6 19v2" }],
      ["path", { d: "M18 21v-2" }]
    ]
  ];

  const Bus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 6v6" }],
      ["path", { d: "M15 6v6" }],
      ["path", { d: "M2 12h19.6" }],
      [
        "path",
        {
          d: "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"
        }
      ],
      ["circle", { cx: "7", cy: "18", r: "2" }],
      ["path", { d: "M9 18h5" }],
      ["circle", { cx: "16", cy: "18", r: "2" }]
    ]
  ];

  const CableCar = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 3h.01" }],
      ["path", { d: "M14 2h.01" }],
      ["path", { d: "m2 9 20-5" }],
      ["path", { d: "M12 12V6.5" }],
      ["rect", { width: "16", height: "10", x: "4", y: "12", rx: "3" }],
      ["path", { d: "M9 12v5" }],
      ["path", { d: "M15 12v5" }],
      ["path", { d: "M4 17h16" }]
    ]
  ];

  const Cable = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1" }],
      ["path", { d: "M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9" }],
      ["path", { d: "M21 21v-2h-4" }],
      ["path", { d: "M3 5h4V3" }],
      ["path", { d: "M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3" }]
    ]
  ];

  const CakeSlice = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "9", cy: "7", r: "2" }],
      ["path", { d: "M7.2 7.9 3 11v9c0 .6.4 1 1 1h16c.6 0 1-.4 1-1v-9c0-2-3-6-7-8l-3.6 2.6" }],
      ["path", { d: "M16 13H3" }],
      ["path", { d: "M16 17H3" }]
    ]
  ];

  const Cake = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" }],
      ["path", { d: "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" }],
      ["path", { d: "M2 21h20" }],
      ["path", { d: "M7 8v3" }],
      ["path", { d: "M12 8v3" }],
      ["path", { d: "M17 8v3" }],
      ["path", { d: "M7 4h.01" }],
      ["path", { d: "M12 4h.01" }],
      ["path", { d: "M17 4h.01" }]
    ]
  ];

  const Calculator = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }],
      ["line", { x1: "8", x2: "16", y1: "6", y2: "6" }],
      ["line", { x1: "16", x2: "16", y1: "14", y2: "18" }],
      ["path", { d: "M16 10h.01" }],
      ["path", { d: "M12 10h.01" }],
      ["path", { d: "M8 10h.01" }],
      ["path", { d: "M12 14h.01" }],
      ["path", { d: "M8 14h.01" }],
      ["path", { d: "M12 18h.01" }],
      ["path", { d: "M8 18h.01" }]
    ]
  ];

  const Calendar1 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 14h1v4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }],
      ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }]
    ]
  ];

  const CalendarArrowDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14 18 4 4 4-4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M18 14v8" }],
      ["path", { d: "M21 11.354V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.343" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }]
    ]
  ];

  const CalendarArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14 18 4-4 4 4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M18 22v-8" }],
      ["path", { d: "M21 11.343V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }]
    ]
  ];

  const CalendarCheck2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "m16 20 2 2 4-4" }]
    ]
  ];

  const CalendarCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "m9 16 2 2 4-4" }]
    ]
  ];

  const CalendarClock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M3 10h5" }],
      ["path", { d: "M17.5 17.5 16 16.3V14" }],
      ["circle", { cx: "16", cy: "16", r: "6" }]
    ]
  ];

  const CalendarCog = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m15.2 16.9-.9-.4" }],
      ["path", { d: "m15.2 19.1-.9.4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "m16.9 15.2-.4-.9" }],
      ["path", { d: "m16.9 20.8-.4.9" }],
      ["path", { d: "m19.5 14.3-.4.9" }],
      ["path", { d: "m19.5 21.7-.4-.9" }],
      ["path", { d: "M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" }],
      ["path", { d: "m21.7 16.5-.9.4" }],
      ["path", { d: "m21.7 19.5-.9-.4" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }],
      ["circle", { cx: "18", cy: "18", r: "3" }]
    ]
  ];

  const CalendarDays = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 14h.01" }],
      ["path", { d: "M12 14h.01" }],
      ["path", { d: "M16 14h.01" }],
      ["path", { d: "M8 18h.01" }],
      ["path", { d: "M12 18h.01" }],
      ["path", { d: "M16 18h.01" }]
    ]
  ];

  const CalendarFold = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 17V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11Z" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M15 22v-4a2 2 0 0 1 2-2h4" }]
    ]
  ];

  const CalendarHeart = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" }],
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      [
        "path",
        {
          d: "M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"
        }
      ]
    ]
  ];

  const CalendarMinus2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M10 16h4" }]
    ]
  ];

  const CalendarMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 19h6" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }]
    ]
  ];

  const CalendarOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18" }],
      ["path", { d: "M21 15.5V6a2 2 0 0 0-2-2H9.5" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M3 10h7" }],
      ["path", { d: "M21 10h-5.5" }],
      ["path", { d: "m2 2 20 20" }]
    ]
  ];

  const CalendarPlus2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M10 16h4" }],
      ["path", { d: "M12 14v4" }]
    ]
  ];

  const CalendarPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M16 19h6" }],
      ["path", { d: "M19 16v6" }]
    ]
  ];

  const CalendarRange = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M17 14h-6" }],
      ["path", { d: "M13 18H7" }],
      ["path", { d: "M7 14h.01" }],
      ["path", { d: "M17 18h.01" }]
    ]
  ];

  const CalendarSearch = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 11.75V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.25" }],
      ["path", { d: "m22 22-1.875-1.875" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "M8 2v4" }],
      ["circle", { cx: "18", cy: "18", r: "3" }]
    ]
  ];

  const CalendarSync = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 10v4h4" }],
      ["path", { d: "m11 14 1.535-1.605a5 5 0 0 1 8 1.5" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "m21 18-1.535 1.605a5 5 0 0 1-8-1.5" }],
      ["path", { d: "M21 22v-4h-4" }],
      ["path", { d: "M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" }],
      ["path", { d: "M3 10h4" }],
      ["path", { d: "M8 2v4" }]
    ]
  ];

  const CalendarX2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["path", { d: "M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "m17 22 5-5" }],
      ["path", { d: "m17 17 5 5" }]
    ]
  ];

  const CalendarX = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }],
      ["path", { d: "m14 14-4 4" }],
      ["path", { d: "m10 14 4 4" }]
    ]
  ];

  const Calendar = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2v4" }],
      ["path", { d: "M16 2v4" }],
      ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }],
      ["path", { d: "M3 10h18" }]
    ]
  ];

  const CameraOff = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }],
      ["path", { d: "M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" }],
      ["path", { d: "M14.121 15.121A3 3 0 1 1 9.88 10.88" }]
    ]
  ];

  const Camera = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
        }
      ],
      ["circle", { cx: "12", cy: "13", r: "3" }]
    ]
  ];

  const CandyCane = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2Z" }
      ],
      ["path", { d: "M17.75 7 15 2.1" }],
      ["path", { d: "M10.9 4.8 13 9" }],
      ["path", { d: "m7.9 9.7 2 4.4" }],
      ["path", { d: "M4.9 14.7 7 18.9" }]
    ]
  ];

  const CandyOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m8.5 8.5-1 1a4.95 4.95 0 0 0 7 7l1-1" }],
      ["path", { d: "M11.843 6.187A4.947 4.947 0 0 1 16.5 7.5a4.947 4.947 0 0 1 1.313 4.657" }],
      ["path", { d: "M14 16.5V14" }],
      ["path", { d: "M14 6.5v1.843" }],
      ["path", { d: "M10 10v7.5" }],
      [
        "path",
        { d: "m16 7 1-5 1.367.683A3 3 0 0 0 19.708 3H21v1.292a3 3 0 0 0 .317 1.341L22 7l-5 1" }
      ],
      [
        "path",
        { d: "m8 17-1 5-1.367-.683A3 3 0 0 0 4.292 21H3v-1.292a3 3 0 0 0-.317-1.341L2 17l5-1" }
      ],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const Candy = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m9.5 7.5-2 2a4.95 4.95 0 1 0 7 7l2-2a4.95 4.95 0 1 0-7-7Z" }],
      ["path", { d: "M14 6.5v10" }],
      ["path", { d: "M10 7.5v10" }],
      ["path", { d: "m16 7 1-5 1.37.68A3 3 0 0 0 19.7 3H21v1.3c0 .46.1.92.32 1.33L22 7l-5 1" }],
      ["path", { d: "m8 17-1 5-1.37-.68A3 3 0 0 0 4.3 21H3v-1.3a3 3 0 0 0-.32-1.33L2 17l5-1" }]
    ]
  ];

  const Cannabis = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 22v-4" }],
      [
        "path",
        {
          d: "M7 12c-1.5 0-4.5 1.5-5 3 3.5 1.5 6 1 6 1-1.5 1.5-2 3.5-2 5 2.5 0 4.5-1.5 6-3 1.5 1.5 3.5 3 6 3 0-1.5-.5-3.5-2-5 0 0 2.5.5 6-1-.5-1.5-3.5-3-5-3 1.5-1 4-4 4-6-2.5 0-5.5 1.5-7 3 0-2.5-.5-5-2-7-1.5 2-2 4.5-2 7-1.5-1.5-4.5-3-7-3 0 2 2.5 5 4 6"
        }
      ]
    ]
  ];

  const CaptionsOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.5 5H19a2 2 0 0 1 2 2v8.5" }],
      ["path", { d: "M17 11h-.5" }],
      ["path", { d: "M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M7 11h4" }],
      ["path", { d: "M7 15h2.5" }]
    ]
  ];

  const Captions = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "14", x: "3", y: "5", rx: "2", ry: "2" }],
      ["path", { d: "M7 15h4M15 15h2M7 11h2M13 11h4" }]
    ]
  ];

  const CarFront = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" }],
      ["path", { d: "M7 14h.01" }],
      ["path", { d: "M17 14h.01" }],
      ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2" }],
      ["path", { d: "M5 18v2" }],
      ["path", { d: "M19 18v2" }]
    ]
  ];

  const CarTaxiFront = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2h4" }],
      ["path", { d: "m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" }],
      ["path", { d: "M7 14h.01" }],
      ["path", { d: "M17 14h.01" }],
      ["rect", { width: "18", height: "8", x: "3", y: "10", rx: "2" }],
      ["path", { d: "M5 18v2" }],
      ["path", { d: "M19 18v2" }]
    ]
  ];

  const Car = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
        }
      ],
      ["circle", { cx: "7", cy: "17", r: "2" }],
      ["path", { d: "M9 17h6" }],
      ["circle", { cx: "17", cy: "17", r: "2" }]
    ]
  ];

  const Caravan = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 19V9a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2h2" }],
      ["path", { d: "M2 9h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2" }],
      ["path", { d: "M22 17v1a1 1 0 0 1-1 1H10v-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9" }],
      ["circle", { cx: "8", cy: "19", r: "2" }]
    ]
  ];

  const Carrot = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46"
        }
      ],
      ["path", { d: "M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z" }],
      ["path", { d: "M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z" }]
    ]
  ];

  const CaseLower = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "7", cy: "12", r: "3" }],
      ["path", { d: "M10 9v6" }],
      ["circle", { cx: "17", cy: "12", r: "3" }],
      ["path", { d: "M14 7v8" }]
    ]
  ];

  const CaseSensitive = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 15 4-8 4 8" }],
      ["path", { d: "M4 13h6" }],
      ["circle", { cx: "18", cy: "12", r: "3" }],
      ["path", { d: "M21 9v6" }]
    ]
  ];

  const CaseUpper = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 15 4-8 4 8" }],
      ["path", { d: "M4 13h6" }],
      ["path", { d: "M15 11h4.5a2 2 0 0 1 0 4H15V7h4a2 2 0 0 1 0 4" }]
    ]
  ];

  const CassetteTape = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
      ["circle", { cx: "8", cy: "10", r: "2" }],
      ["path", { d: "M8 12h8" }],
      ["circle", { cx: "16", cy: "10", r: "2" }],
      ["path", { d: "m6 20 .7-2.9A1.4 1.4 0 0 1 8.1 16h7.8a1.4 1.4 0 0 1 1.4 1l.7 3" }]
    ]
  ];

  const Cast = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" }],
      ["path", { d: "M2 12a9 9 0 0 1 8 8" }],
      ["path", { d: "M2 16a5 5 0 0 1 4 4" }],
      ["line", { x1: "2", x2: "2.01", y1: "20", y2: "20" }]
    ]
  ];

  const Castle = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z" }],
      ["path", { d: "M18 11V4H6v7" }],
      ["path", { d: "M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4" }],
      ["path", { d: "M22 11V9" }],
      ["path", { d: "M2 11V9" }],
      ["path", { d: "M6 4V2" }],
      ["path", { d: "M18 4V2" }],
      ["path", { d: "M10 4V2" }],
      ["path", { d: "M14 4V2" }]
    ]
  ];

  const Cat = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"
        }
      ],
      ["path", { d: "M8 14v.5" }],
      ["path", { d: "M16 14v.5" }],
      ["path", { d: "M11.25 16.25h1.5L12 17l-.75-.75Z" }]
    ]
  ];

  const Cctv = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" }
      ],
      [
        "path",
        {
          d: "M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"
        }
      ],
      ["path", { d: "M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" }],
      ["path", { d: "M2 21v-4" }],
      ["path", { d: "M7 9h.01" }]
    ]
  ];

  const ChartArea = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      [
        "path",
        {
          d: "M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"
        }
      ]
    ]
  ];

  const ChartBarBig = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["rect", { x: "7", y: "13", width: "9", height: "4", rx: "1" }],
      ["rect", { x: "7", y: "5", width: "12", height: "4", rx: "1" }]
    ]
  ];

  const ChartBarDecreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M7 11h8" }],
      ["path", { d: "M7 16h3" }],
      ["path", { d: "M7 6h12" }]
    ]
  ];

  const ChartBarIncreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M7 11h8" }],
      ["path", { d: "M7 16h12" }],
      ["path", { d: "M7 6h3" }]
    ]
  ];

  const ChartBarStacked = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 13v4" }],
      ["path", { d: "M15 5v4" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["rect", { x: "7", y: "13", width: "9", height: "4", rx: "1" }],
      ["rect", { x: "7", y: "5", width: "12", height: "4", rx: "1" }]
    ]
  ];

  const ChartBar = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M7 16h8" }],
      ["path", { d: "M7 11h12" }],
      ["path", { d: "M7 6h3" }]
    ]
  ];

  const ChartCandlestick = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 5v4" }],
      ["rect", { width: "4", height: "6", x: "7", y: "9", rx: "1" }],
      ["path", { d: "M9 15v2" }],
      ["path", { d: "M17 3v2" }],
      ["rect", { width: "4", height: "8", x: "15", y: "5", rx: "1" }],
      ["path", { d: "M17 13v3" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }]
    ]
  ];

  const ChartColumnBig = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["rect", { x: "15", y: "5", width: "4", height: "12", rx: "1" }],
      ["rect", { x: "7", y: "8", width: "4", height: "9", rx: "1" }]
    ]
  ];

  const ChartColumnDecreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13 17V9" }],
      ["path", { d: "M18 17v-3" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M8 17V5" }]
    ]
  ];

  const ChartColumnIncreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13 17V9" }],
      ["path", { d: "M18 17V5" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M8 17v-3" }]
    ]
  ];

  const ChartColumnStacked = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 13H7" }],
      ["path", { d: "M19 9h-4" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["rect", { x: "15", y: "5", width: "4", height: "12", rx: "1" }],
      ["rect", { x: "7", y: "8", width: "4", height: "9", rx: "1" }]
    ]
  ];

  const ChartColumn = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M18 17V9" }],
      ["path", { d: "M13 17V5" }],
      ["path", { d: "M8 17v-3" }]
    ]
  ];

  const ChartGantt = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 6h8" }],
      ["path", { d: "M12 16h6" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M8 11h7" }]
    ]
  ];

  const ChartLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "m19 9-5 5-4-4-3 3" }]
    ]
  ];

  const ChartNetwork = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m13.11 7.664 1.78 2.672" }],
      ["path", { d: "m14.162 12.788-3.324 1.424" }],
      ["path", { d: "m20 4-6.06 1.515" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["circle", { cx: "12", cy: "6", r: "2" }],
      ["circle", { cx: "16", cy: "12", r: "2" }],
      ["circle", { cx: "9", cy: "15", r: "2" }]
    ]
  ];

  const ChartNoAxesColumnDecreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 20V10" }],
      ["path", { d: "M18 20v-4" }],
      ["path", { d: "M6 20V4" }]
    ]
  ];

  const ChartNoAxesColumnIncreasing = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "12", x2: "12", y1: "20", y2: "10" }],
      ["line", { x1: "18", x2: "18", y1: "20", y2: "4" }],
      ["line", { x1: "6", x2: "6", y1: "20", y2: "16" }]
    ]
  ];

  const ChartNoAxesColumn = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "18", x2: "18", y1: "20", y2: "10" }],
      ["line", { x1: "12", x2: "12", y1: "20", y2: "4" }],
      ["line", { x1: "6", x2: "6", y1: "20", y2: "14" }]
    ]
  ];

  const ChartNoAxesCombined = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 16v5" }],
      ["path", { d: "M16 14v7" }],
      ["path", { d: "M20 10v11" }],
      ["path", { d: "m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" }],
      ["path", { d: "M4 18v3" }],
      ["path", { d: "M8 14v7" }]
    ]
  ];

  const ChartNoAxesGantt = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 6h10" }],
      ["path", { d: "M6 12h9" }],
      ["path", { d: "M11 18h7" }]
    ]
  ];

  const ChartPie = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
        }
      ],
      ["path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83" }]
    ]
  ];

  const ChartScatter = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "18.5", cy: "5.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "11.5", cy: "11.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "7.5", cy: "16.5", r: ".5", fill: "currentColor" }],
      ["circle", { cx: "17.5", cy: "14.5", r: ".5", fill: "currentColor" }],
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }]
    ]
  ];

  const ChartSpline = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }],
      ["path", { d: "M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7" }]
    ]
  ];

  const CheckCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 6 7 17l-5-5" }],
      ["path", { d: "m22 10-7.5 7.5L13 16" }]
    ]
  ];

  const Check = ["svg", defaultAttributes, [["path", { d: "M20 6 9 17l-5-5" }]]];

  const ChefHat = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"
        }
      ],
      ["path", { d: "M6 17h12" }]
    ]
  ];

  const Cherry = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }],
      ["path", { d: "M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" }],
      ["path", { d: "M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" }],
      ["path", { d: "M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z" }]
    ]
  ];

  const ChevronDown = ["svg", defaultAttributes, [["path", { d: "m6 9 6 6 6-6" }]]];

  const ChevronFirst = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m17 18-6-6 6-6" }],
      ["path", { d: "M7 6v12" }]
    ]
  ];

  const ChevronLast = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 18 6-6-6-6" }],
      ["path", { d: "M17 6v12" }]
    ]
  ];

  const ChevronLeft = ["svg", defaultAttributes, [["path", { d: "m15 18-6-6 6-6" }]]];

  const ChevronRight = ["svg", defaultAttributes, [["path", { d: "m9 18 6-6-6-6" }]]];

  const ChevronUp = ["svg", defaultAttributes, [["path", { d: "m18 15-6-6-6 6" }]]];

  const ChevronsDownUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 20 5-5 5 5" }],
      ["path", { d: "m7 4 5 5 5-5" }]
    ]
  ];

  const ChevronsDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 6 5 5 5-5" }],
      ["path", { d: "m7 13 5 5 5-5" }]
    ]
  ];

  const ChevronsLeftRightEllipsis = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m18 8 4 4-4 4" }],
      ["path", { d: "m6 8-4 4 4 4" }],
      ["path", { d: "M8 12h.01" }],
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M16 12h.01" }]
    ]
  ];

  const ChevronsLeftRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m9 7-5 5 5 5" }],
      ["path", { d: "m15 7 5 5-5 5" }]
    ]
  ];

  const ChevronsLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m11 17-5-5 5-5" }],
      ["path", { d: "m18 17-5-5 5-5" }]
    ]
  ];

  const ChevronsRightLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m20 17-5-5 5-5" }],
      ["path", { d: "m4 17 5-5-5-5" }]
    ]
  ];

  const ChevronsRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m6 17 5-5-5-5" }],
      ["path", { d: "m13 17 5-5-5-5" }]
    ]
  ];

  const ChevronsUpDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 15 5 5 5-5" }],
      ["path", { d: "m7 9 5-5 5 5" }]
    ]
  ];

  const ChevronsUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m17 11-5-5-5 5" }],
      ["path", { d: "m17 18-5-5-5 5" }]
    ]
  ];

  const Chrome = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["line", { x1: "21.17", x2: "12", y1: "8", y2: "8" }],
      ["line", { x1: "3.95", x2: "8.54", y1: "6.06", y2: "14" }],
      ["line", { x1: "10.88", x2: "15.46", y1: "21.94", y2: "14" }]
    ]
  ];

  const Church = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 9h4" }],
      ["path", { d: "M12 7v5" }],
      ["path", { d: "M14 22v-4a2 2 0 0 0-4 0v4" }],
      [
        "path",
        {
          d: "M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"
        }
      ],
      [
        "path",
        {
          d: "m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"
        }
      ]
    ]
  ];

  const CigaretteOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13" }],
      ["path", { d: "M18 8c0-2.5-2-2.5-2-5" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866" }],
      ["path", { d: "M22 8c0-2.5-2-2.5-2-5" }],
      ["path", { d: "M7 12v4" }]
    ]
  ];

  const Cigarette = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" }],
      ["path", { d: "M18 8c0-2.5-2-2.5-2-5" }],
      ["path", { d: "M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }],
      ["path", { d: "M22 8c0-2.5-2-2.5-2-5" }],
      ["path", { d: "M7 12v4" }]
    ]
  ];

  const CircleAlert = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
      ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }]
    ]
  ];

  const CircleArrowDown = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 8v8" }],
      ["path", { d: "m8 12 4 4 4-4" }]
    ]
  ];

  const CircleArrowLeft = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M16 12H8" }],
      ["path", { d: "m12 8-4 4 4 4" }]
    ]
  ];

  const CircleArrowOutDownLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 12a10 10 0 1 1 10 10" }],
      ["path", { d: "m2 22 10-10" }],
      ["path", { d: "M8 22H2v-6" }]
    ]
  ];

  const CircleArrowOutDownRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 22a10 10 0 1 1 10-10" }],
      ["path", { d: "M22 22 12 12" }],
      ["path", { d: "M22 16v6h-6" }]
    ]
  ];

  const CircleArrowOutUpLeft = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 8V2h6" }],
      ["path", { d: "m2 2 10 10" }],
      ["path", { d: "M12 2A10 10 0 1 1 2 12" }]
    ]
  ];

  const CircleArrowOutUpRight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M22 12A10 10 0 1 1 12 2" }],
      ["path", { d: "M22 2 12 12" }],
      ["path", { d: "M16 2h6v6" }]
    ]
  ];

  const CircleArrowRight = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M8 12h8" }],
      ["path", { d: "m12 16 4-4-4-4" }]
    ]
  ];

  const CircleArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m16 12-4-4-4 4" }],
      ["path", { d: "M12 16V8" }]
    ]
  ];

  const CircleCheckBig = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }],
      ["path", { d: "m9 11 3 3L22 4" }]
    ]
  ];

  const CircleCheck = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m9 12 2 2 4-4" }]
    ]
  ];

  const CircleChevronDown = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m16 10-4 4-4-4" }]
    ]
  ];

  const CircleChevronLeft = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m14 16-4-4 4-4" }]
    ]
  ];

  const CircleChevronRight = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m10 8 4 4-4 4" }]
    ]
  ];

  const CircleChevronUp = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m8 14 4-4 4 4" }]
    ]
  ];

  const CircleDashed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.1 2.182a10 10 0 0 1 3.8 0" }],
      ["path", { d: "M13.9 21.818a10 10 0 0 1-3.8 0" }],
      ["path", { d: "M17.609 3.721a10 10 0 0 1 2.69 2.7" }],
      ["path", { d: "M2.182 13.9a10 10 0 0 1 0-3.8" }],
      ["path", { d: "M20.279 17.609a10 10 0 0 1-2.7 2.69" }],
      ["path", { d: "M21.818 10.1a10 10 0 0 1 0 3.8" }],
      ["path", { d: "M3.721 6.391a10 10 0 0 1 2.7-2.69" }],
      ["path", { d: "M6.391 20.279a10 10 0 0 1-2.69-2.7" }]
    ]
  ];

  const CircleDivide = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "8", x2: "16", y1: "12", y2: "12" }],
      ["line", { x1: "12", x2: "12", y1: "16", y2: "16" }],
      ["line", { x1: "12", x2: "12", y1: "8", y2: "8" }],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const CircleDollarSign = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
      ["path", { d: "M12 18V6" }]
    ]
  ];

  const CircleDotDashed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.1 2.18a9.93 9.93 0 0 1 3.8 0" }],
      ["path", { d: "M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" }],
      ["path", { d: "M21.82 10.1a9.93 9.93 0 0 1 0 3.8" }],
      ["path", { d: "M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" }],
      ["path", { d: "M13.9 21.82a9.94 9.94 0 0 1-3.8 0" }],
      ["path", { d: "M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" }],
      ["path", { d: "M2.18 13.9a9.93 9.93 0 0 1 0-3.8" }],
      ["path", { d: "M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" }],
      ["circle", { cx: "12", cy: "12", r: "1" }]
    ]
  ];

  const CircleDot = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["circle", { cx: "12", cy: "12", r: "1" }]
    ]
  ];

  const CircleEllipsis = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M17 12h.01" }],
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M7 12h.01" }]
    ]
  ];

  const CircleEqual = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 10h10" }],
      ["path", { d: "M7 14h10" }],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const CircleFadingArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
      ["path", { d: "m16 12-4-4-4 4" }],
      ["path", { d: "M12 16V8" }],
      ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
      ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
      ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
      ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
    ]
  ];

  const CircleFadingPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2a10 10 0 0 1 7.38 16.75" }],
      ["path", { d: "M12 8v8" }],
      ["path", { d: "M16 12H8" }],
      ["path", { d: "M2.5 8.875a10 10 0 0 0-.5 3" }],
      ["path", { d: "M2.83 16a10 10 0 0 0 2.43 3.4" }],
      ["path", { d: "M4.636 5.235a10 10 0 0 1 .891-.857" }],
      ["path", { d: "M8.644 21.42a10 10 0 0 0 7.631-.38" }]
    ]
  ];

  const CircleGauge = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15.6 2.7a10 10 0 1 0 5.7 5.7" }],
      ["circle", { cx: "12", cy: "12", r: "2" }],
      ["path", { d: "M13.4 10.6 19 5" }]
    ]
  ];

  const CircleHelp = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
      ["path", { d: "M12 17h.01" }]
    ]
  ];

  const CircleMinus = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M8 12h8" }]
    ]
  ];

  const CircleOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M8.35 2.69A10 10 0 0 1 21.3 15.65" }],
      ["path", { d: "M19.08 19.08A10 10 0 1 1 4.92 4.92" }]
    ]
  ];

  const CircleParkingOff = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m5 5 14 14" }],
      ["path", { d: "M13 13a3 3 0 1 0 0-6H9v2" }],
      ["path", { d: "M9 17v-2.34" }]
    ]
  ];

  const CircleParking = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M9 17V7h4a3 3 0 0 1 0 6H9" }]
    ]
  ];

  const CirclePause = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["line", { x1: "10", x2: "10", y1: "15", y2: "9" }],
      ["line", { x1: "14", x2: "14", y1: "15", y2: "9" }]
    ]
  ];

  const CirclePercent = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m15 9-6 6" }],
      ["path", { d: "M9 9h.01" }],
      ["path", { d: "M15 15h.01" }]
    ]
  ];

  const CirclePlay = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polygon", { points: "10 8 16 12 10 16 10 8" }]
    ]
  ];

  const CirclePlus = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M8 12h8" }],
      ["path", { d: "M12 8v8" }]
    ]
  ];

  const CirclePower = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 7v4" }],
      ["path", { d: "M7.998 9.003a5 5 0 1 0 8-.005" }],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const CircleSlash2 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M22 2 2 22" }]
    ]
  ];

  const CircleSlash = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["line", { x1: "9", x2: "15", y1: "15", y2: "9" }]
    ]
  ];

  const CircleStop = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["rect", { x: "9", y: "9", width: "6", height: "6", rx: "1" }]
    ]
  ];

  const CircleUserRound = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 20a6 6 0 0 0-12 0" }],
      ["circle", { cx: "12", cy: "10", r: "4" }],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const CircleUser = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["circle", { cx: "12", cy: "10", r: "3" }],
      ["path", { d: "M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" }]
    ]
  ];

  const CircleX = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m15 9-6 6" }],
      ["path", { d: "m9 9 6 6" }]
    ]
  ];

  const Circle = ["svg", defaultAttributes, [["circle", { cx: "12", cy: "12", r: "10" }]]];

  const CircuitBoard = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M11 9h4a2 2 0 0 0 2-2V3" }],
      ["circle", { cx: "9", cy: "9", r: "2" }],
      ["path", { d: "M7 21v-4a2 2 0 0 1 2-2h4" }],
      ["circle", { cx: "15", cy: "15", r: "2" }]
    ]
  ];

  const Citrus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z" }
      ],
      ["path", { d: "M19.65 15.66A8 8 0 0 1 8.35 4.34" }],
      ["path", { d: "m14 10-5.5 5.5" }],
      ["path", { d: "M14 17.85V10H6.15" }]
    ]
  ];

  const Clapperboard = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" }],
      ["path", { d: "m6.2 5.3 3.1 3.9" }],
      ["path", { d: "m12.4 3.4 3.1 4" }],
      ["path", { d: "M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" }]
    ]
  ];

  const ClipboardCheck = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "m9 14 2 2 4-4" }]
    ]
  ];

  const ClipboardCopy = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v4" }],
      ["path", { d: "M21 14H11" }],
      ["path", { d: "m15 10-4 4 4 4" }]
    ]
  ];

  const ClipboardList = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M12 11h4" }],
      ["path", { d: "M12 16h4" }],
      ["path", { d: "M8 11h.01" }],
      ["path", { d: "M8 16h.01" }]
    ]
  ];

  const ClipboardMinus = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M9 14h6" }]
    ]
  ];

  const ClipboardPaste = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z" }],
      [
        "path",
        {
          d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"
        }
      ],
      ["path", { d: "m17 10 4 4-4 4" }]
    ]
  ];

  const ClipboardPenLine = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1" }],
      ["path", { d: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 1.73 1" }],
      ["path", { d: "M8 18h1" }],
      [
        "path",
        {
          d: "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        }
      ]
    ]
  ];

  const ClipboardPen = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5" }],
      ["path", { d: "M4 13.5V6a2 2 0 0 1 2-2h2" }],
      [
        "path",
        {
          d: "M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        }
      ]
    ]
  ];

  const ClipboardPlus = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M9 14h6" }],
      ["path", { d: "M12 17v-6" }]
    ]
  ];

  const ClipboardType = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M9 12v-1h6v1" }],
      ["path", { d: "M11 17h2" }],
      ["path", { d: "M12 11v6" }]
    ]
  ];

  const ClipboardX = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }],
      ["path", { d: "m15 11-6 6" }],
      ["path", { d: "m9 11 6 6" }]
    ]
  ];

  const Clipboard = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1" }],
      ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }]
    ]
  ];

  const Clock1 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 14.5 8" }]
    ]
  ];

  const Clock10 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 8 10" }]
    ]
  ];

  const Clock11 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 9.5 8" }]
    ]
  ];

  const Clock12 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12" }]
    ]
  ];

  const Clock2 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 16 10" }]
    ]
  ];

  const Clock3 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 16.5 12" }]
    ]
  ];

  const Clock4 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 16 14" }]
    ]
  ];

  const Clock5 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 14.5 16" }]
    ]
  ];

  const Clock6 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 12 16.5" }]
    ]
  ];

  const Clock7 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 9.5 16" }]
    ]
  ];

  const Clock8 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 8 14" }]
    ]
  ];

  const Clock9 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 7.5 12" }]
    ]
  ];

  const ClockAlert = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 6v6l4 2" }],
      ["path", { d: "M16 21.16a10 10 0 1 1 5-13.516" }],
      ["path", { d: "M20 11.5v6" }],
      ["path", { d: "M20 21.5h.01" }]
    ]
  ];

  const ClockArrowDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12.338 21.994A10 10 0 1 1 21.925 13.227" }],
      ["path", { d: "M12 6v6l2 1" }],
      ["path", { d: "m14 18 4 4 4-4" }],
      ["path", { d: "M18 14v8" }]
    ]
  ];

  const ClockArrowUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13.228 21.925A10 10 0 1 1 21.994 12.338" }],
      ["path", { d: "M12 6v6l1.562.781" }],
      ["path", { d: "m14 18 4-4 4 4" }],
      ["path", { d: "M18 22v-8" }]
    ]
  ];

  const Clock = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["polyline", { points: "12 6 12 12 16 14" }]
    ]
  ];

  const CloudAlert = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 12v4" }],
      ["path", { d: "M12 20h.01" }],
      ["path", { d: "M17 18h.5a1 1 0 0 0 0-9h-1.79A7 7 0 1 0 7 17.708" }]
    ]
  ];

  const CloudCog = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "17", r: "3" }],
      ["path", { d: "M4.2 15.1A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" }],
      ["path", { d: "m15.7 18.4-.9-.3" }],
      ["path", { d: "m9.2 15.9-.9-.3" }],
      ["path", { d: "m10.6 20.7.3-.9" }],
      ["path", { d: "m13.1 14.2.3-.9" }],
      ["path", { d: "m13.6 20.7-.4-1" }],
      ["path", { d: "m10.8 14.3-.4-1" }],
      ["path", { d: "m8.3 18.6 1-.4" }],
      ["path", { d: "m14.7 15.8 1-.4" }]
    ]
  ];

  const CloudDownload = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13v8l-4-4" }],
      ["path", { d: "m12 21 4-4" }],
      ["path", { d: "M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284" }]
    ]
  ];

  const CloudDrizzle = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "M8 19v1" }],
      ["path", { d: "M8 14v1" }],
      ["path", { d: "M16 19v1" }],
      ["path", { d: "M16 14v1" }],
      ["path", { d: "M12 21v1" }],
      ["path", { d: "M12 16v1" }]
    ]
  ];

  const CloudFog = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "M16 17H7" }],
      ["path", { d: "M17 21H9" }]
    ]
  ];

  const CloudHail = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "M16 14v2" }],
      ["path", { d: "M8 14v2" }],
      ["path", { d: "M16 20h.01" }],
      ["path", { d: "M8 20h.01" }],
      ["path", { d: "M12 16v2" }],
      ["path", { d: "M12 22h.01" }]
    ]
  ];

  const CloudLightning = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" }],
      ["path", { d: "m13 12-3 5h4l-3 5" }]
    ]
  ];

  const CloudMoonRain = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.188 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.197" }],
      ["path", { d: "M11 20v2" }],
      ["path", { d: "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }],
      ["path", { d: "M7 19v2" }]
    ]
  ];

  const CloudMoon = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.188 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.197" }],
      ["path", { d: "M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z" }]
    ]
  ];

  const CloudOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" }],
      ["path", { d: "M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" }]
    ]
  ];

  const CloudRainWind = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "m9.2 22 3-7" }],
      ["path", { d: "m9 13-3 7" }],
      ["path", { d: "m17 13-3 7" }]
    ]
  ];

  const CloudRain = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "M16 14v6" }],
      ["path", { d: "M8 14v6" }],
      ["path", { d: "M12 16v6" }]
    ]
  ];

  const CloudSnow = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "M8 15h.01" }],
      ["path", { d: "M8 19h.01" }],
      ["path", { d: "M12 17h.01" }],
      ["path", { d: "M12 21h.01" }],
      ["path", { d: "M16 15h.01" }],
      ["path", { d: "M16 19h.01" }]
    ]
  ];

  const CloudSunRain = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v2" }],
      ["path", { d: "m4.93 4.93 1.41 1.41" }],
      ["path", { d: "M20 12h2" }],
      ["path", { d: "m19.07 4.93-1.41 1.41" }],
      ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128" }],
      ["path", { d: "M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24" }],
      ["path", { d: "M11 20v2" }],
      ["path", { d: "M7 19v2" }]
    ]
  ];

  const CloudSun = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v2" }],
      ["path", { d: "m4.93 4.93 1.41 1.41" }],
      ["path", { d: "M20 12h2" }],
      ["path", { d: "m19.07 4.93-1.41 1.41" }],
      ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128" }],
      ["path", { d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" }]
    ]
  ];

  const CloudUpload = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13v8" }],
      ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }],
      ["path", { d: "m8 17 4-4 4 4" }]
    ]
  ];

  const Cloud = [
    "svg",
    defaultAttributes,
    [["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }]]
  ];

  const Cloudy = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }],
      ["path", { d: "M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5" }]
    ]
  ];

  const Clover = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16.17 7.83 2 22" }],
      [
        "path",
        {
          d: "M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12"
        }
      ],
      ["path", { d: "m7.83 7.83 8.34 8.34" }]
    ]
  ];

  const Club = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M17.28 9.05a5.5 5.5 0 1 0-10.56 0A5.5 5.5 0 1 0 12 17.66a5.5 5.5 0 1 0 5.28-8.6Z" }
      ],
      ["path", { d: "M12 17.66L12 22" }]
    ]
  ];

  const CodeXml = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m18 16 4-4-4-4" }],
      ["path", { d: "m6 8-4 4 4 4" }],
      ["path", { d: "m14.5 4-5 16" }]
    ]
  ];

  const Code = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "16 18 22 12 16 6" }],
      ["polyline", { points: "8 6 2 12 8 18" }]
    ]
  ];

  const Codepen = [
    "svg",
    defaultAttributes,
    [
      ["polygon", { points: "12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" }],
      ["line", { x1: "12", x2: "12", y1: "22", y2: "15.5" }],
      ["polyline", { points: "22 8.5 12 15.5 2 8.5" }],
      ["polyline", { points: "2 15.5 12 8.5 22 15.5" }],
      ["line", { x1: "12", x2: "12", y1: "2", y2: "8.5" }]
    ]
  ];

  const Codesandbox = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        }
      ],
      ["polyline", { points: "7.5 4.21 12 6.81 16.5 4.21" }],
      ["polyline", { points: "7.5 19.79 7.5 14.6 3 12" }],
      ["polyline", { points: "21 12 16.5 14.6 16.5 19.79" }],
      ["polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }],
      ["line", { x1: "12", x2: "12", y1: "22.08", y2: "12" }]
    ]
  ];

  const Coffee = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2v2" }],
      ["path", { d: "M14 2v2" }],
      [
        "path",
        {
          d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
        }
      ],
      ["path", { d: "M6 2v2" }]
    ]
  ];

  const Cog = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" }],
      ["path", { d: "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" }],
      ["path", { d: "M12 2v2" }],
      ["path", { d: "M12 22v-2" }],
      ["path", { d: "m17 20.66-1-1.73" }],
      ["path", { d: "M11 10.27 7 3.34" }],
      ["path", { d: "m20.66 17-1.73-1" }],
      ["path", { d: "m3.34 7 1.73 1" }],
      ["path", { d: "M14 12h8" }],
      ["path", { d: "M2 12h2" }],
      ["path", { d: "m20.66 7-1.73 1" }],
      ["path", { d: "m3.34 17 1.73-1" }],
      ["path", { d: "m17 3.34-1 1.73" }],
      ["path", { d: "m11 13.73-4 6.93" }]
    ]
  ];

  const Coins = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "8", cy: "8", r: "6" }],
      ["path", { d: "M18.09 10.37A6 6 0 1 1 10.34 18" }],
      ["path", { d: "M7 6h1v4" }],
      ["path", { d: "m16.71 13.88.7.71-2.82 2.82" }]
    ]
  ];

  const Columns2 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M12 3v18" }]
    ]
  ];

  const Columns3 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M9 3v18" }],
      ["path", { d: "M15 3v18" }]
    ]
  ];

  const Columns4 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M7.5 3v18" }],
      ["path", { d: "M12 3v18" }],
      ["path", { d: "M16.5 3v18" }]
    ]
  ];

  const Combine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 18H5a3 3 0 0 1-3-3v-1" }],
      ["path", { d: "M14 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" }],
      ["path", { d: "M20 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" }],
      ["path", { d: "m7 21 3-3-3-3" }],
      ["rect", { x: "14", y: "14", width: "8", height: "8", rx: "2" }],
      ["rect", { x: "2", y: "2", width: "8", height: "8", rx: "2" }]
    ]
  ];

  const Command = [
    "svg",
    defaultAttributes,
    [["path", { d: "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" }]]
  ];

  const Compass = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
        }
      ],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const Component = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"
        }
      ],
      [
        "path",
        {
          d: "M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"
        }
      ],
      [
        "path",
        {
          d: "M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"
        }
      ],
      [
        "path",
        {
          d: "M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"
        }
      ]
    ]
  ];

  const Computer = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "8", x: "5", y: "2", rx: "2" }],
      ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
      ["path", { d: "M6 18h2" }],
      ["path", { d: "M12 18h6" }]
    ]
  ];

  const ConciergeBell = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" }],
      ["path", { d: "M20 16a8 8 0 1 0-16 0" }],
      ["path", { d: "M12 4v4" }],
      ["path", { d: "M10 4h4" }]
    ]
  ];

  const Cone = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" }],
      ["ellipse", { cx: "12", cy: "19", rx: "9", ry: "3" }]
    ]
  ];

  const Construction = [
    "svg",
    defaultAttributes,
    [
      ["rect", { x: "2", y: "6", width: "20", height: "8", rx: "1" }],
      ["path", { d: "M17 14v7" }],
      ["path", { d: "M7 14v7" }],
      ["path", { d: "M17 3v3" }],
      ["path", { d: "M7 3v3" }],
      ["path", { d: "M10 14 2.3 6.3" }],
      ["path", { d: "m14 6 7.7 7.7" }],
      ["path", { d: "m8 6 8 8" }]
    ]
  ];

  const ContactRound = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 2v2" }],
      ["path", { d: "M17.915 22a6 6 0 0 0-12 0" }],
      ["path", { d: "M8 2v2" }],
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }]
    ]
  ];

  const Contact = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 2v2" }],
      ["path", { d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" }],
      ["path", { d: "M8 2v2" }],
      ["circle", { cx: "12", cy: "11", r: "3" }],
      ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }]
    ]
  ];

  const Container = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"
        }
      ],
      ["path", { d: "M10 21.9V14L2.1 9.1" }],
      ["path", { d: "m10 14 11.9-6.9" }],
      ["path", { d: "M14 19.8v-8.1" }],
      ["path", { d: "M18 17.5V9.4" }]
    ]
  ];

  const Contrast = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 18a6 6 0 0 0 0-12v12z" }]
    ]
  ];

  const Cookie = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" }],
      ["path", { d: "M8.5 8.5v.01" }],
      ["path", { d: "M16 15.5v.01" }],
      ["path", { d: "M12 12v.01" }],
      ["path", { d: "M11 17v.01" }],
      ["path", { d: "M7 14v.01" }]
    ]
  ];

  const CookingPot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 12h20" }],
      ["path", { d: "M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" }],
      ["path", { d: "m4 8 16-4" }],
      ["path", { d: "m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8" }]
    ]
  ];

  const CopyCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m12 15 2 2 4-4" }],
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const CopyMinus = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "12", x2: "18", y1: "15", y2: "15" }],
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const CopyPlus = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "15", x2: "15", y1: "12", y2: "18" }],
      ["line", { x1: "12", x2: "18", y1: "15", y2: "15" }],
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const CopySlash = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "12", x2: "18", y1: "18", y2: "12" }],
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const CopyX = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "12", x2: "18", y1: "12", y2: "18" }],
      ["line", { x1: "12", x2: "18", y1: "18", y2: "12" }],
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const Copy = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
      ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
    ]
  ];

  const Copyleft = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M9.17 14.83a4 4 0 1 0 0-5.66" }]
    ]
  ];

  const Copyright = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M14.83 14.83a4 4 0 1 1 0-5.66" }]
    ]
  ];

  const CornerDownLeft = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "9 10 4 15 9 20" }],
      ["path", { d: "M20 4v7a4 4 0 0 1-4 4H4" }]
    ]
  ];

  const CornerDownRight = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "15 10 20 15 15 20" }],
      ["path", { d: "M4 4v7a4 4 0 0 0 4 4h12" }]
    ]
  ];

  const CornerLeftDown = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "14 15 9 20 4 15" }],
      ["path", { d: "M20 4h-7a4 4 0 0 0-4 4v12" }]
    ]
  ];

  const CornerLeftUp = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "14 9 9 4 4 9" }],
      ["path", { d: "M20 20h-7a4 4 0 0 1-4-4V4" }]
    ]
  ];

  const CornerRightDown = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "10 15 15 20 20 15" }],
      ["path", { d: "M4 4h7a4 4 0 0 1 4 4v12" }]
    ]
  ];

  const CornerRightUp = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "10 9 15 4 20 9" }],
      ["path", { d: "M4 20h7a4 4 0 0 0 4-4V4" }]
    ]
  ];

  const CornerUpLeft = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "9 14 4 9 9 4" }],
      ["path", { d: "M20 20v-7a4 4 0 0 0-4-4H4" }]
    ]
  ];

  const CornerUpRight = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "15 14 20 9 15 4" }],
      ["path", { d: "M4 20v-7a4 4 0 0 1 4-4h12" }]
    ]
  ];

  const Cpu = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "16", height: "16", x: "4", y: "4", rx: "2" }],
      ["rect", { width: "6", height: "6", x: "9", y: "9", rx: "1" }],
      ["path", { d: "M15 2v2" }],
      ["path", { d: "M15 20v2" }],
      ["path", { d: "M2 15h2" }],
      ["path", { d: "M2 9h2" }],
      ["path", { d: "M20 15h2" }],
      ["path", { d: "M20 9h2" }],
      ["path", { d: "M9 2v2" }],
      ["path", { d: "M9 20v2" }]
    ]
  ];

  const CreativeCommons = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M10 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" }],
      ["path", { d: "M17 9.3a2.8 2.8 0 0 0-3.5 1 3.1 3.1 0 0 0 0 3.4 2.7 2.7 0 0 0 3.5 1" }]
    ]
  ];

  const CreditCard = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }],
      ["line", { x1: "2", x2: "22", y1: "10", y2: "10" }]
    ]
  ];

  const Croissant = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m4.6 13.11 5.79-3.21c1.89-1.05 4.79 1.78 3.71 3.71l-3.22 5.81C8.8 23.16.79 15.23 4.6 13.11Z"
        }
      ],
      [
        "path",
        { d: "m10.5 9.5-1-2.29C9.2 6.48 8.8 6 8 6H4.5C2.79 6 2 6.5 2 8.5a7.71 7.71 0 0 0 2 4.83" }
      ],
      ["path", { d: "M8 6c0-1.55.24-4-2-4-2 0-2.5 2.17-2.5 4" }],
      [
        "path",
        {
          d: "m14.5 13.5 2.29 1c.73.3 1.21.7 1.21 1.5v3.5c0 1.71-.5 2.5-2.5 2.5a7.71 7.71 0 0 1-4.83-2"
        }
      ],
      ["path", { d: "M18 16c1.55 0 4-.24 4 2 0 2-2.17 2.5-4 2.5" }]
    ]
  ];

  const Crop = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 2v14a2 2 0 0 0 2 2h14" }],
      ["path", { d: "M18 22V8a2 2 0 0 0-2-2H2" }]
    ]
  ];

  const Cross = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z"
        }
      ]
    ]
  ];

  const Crosshair = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["line", { x1: "22", x2: "18", y1: "12", y2: "12" }],
      ["line", { x1: "6", x2: "2", y1: "12", y2: "12" }],
      ["line", { x1: "12", x2: "12", y1: "6", y2: "2" }],
      ["line", { x1: "12", x2: "12", y1: "22", y2: "18" }]
    ]
  ];

  const Crown = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
        }
      ],
      ["path", { d: "M5 21h14" }]
    ]
  ];

  const Cuboid = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.95 8.41a2 2 0 0 0-.95 1.7v5.82a2 2 0 0 0 .88 1.66l6.05 4.07a2 2 0 0 0 2.17.05l9.95-6.12a2 2 0 0 0 .95-1.7V8.06a2 2 0 0 0-.88-1.66Z"
        }
      ],
      ["path", { d: "M10 22v-8L2.25 9.15" }],
      ["path", { d: "m10 14 11.77-6.87" }]
    ]
  ];

  const CupSoda = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" }],
      ["path", { d: "M5 8h14" }],
      ["path", { d: "M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" }],
      ["path", { d: "m12 8 1-6h2" }]
    ]
  ];

  const Currency = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "8" }],
      ["line", { x1: "3", x2: "6", y1: "3", y2: "6" }],
      ["line", { x1: "21", x2: "18", y1: "3", y2: "6" }],
      ["line", { x1: "3", x2: "6", y1: "21", y2: "18" }],
      ["line", { x1: "21", x2: "18", y1: "21", y2: "18" }]
    ]
  ];

  const Cylinder = [
    "svg",
    defaultAttributes,
    [
      ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
      ["path", { d: "M3 5v14a9 3 0 0 0 18 0V5" }]
    ]
  ];

  const Dam = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 11.31c1.17.56 1.54 1.69 3.5 1.69 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }],
      ["path", { d: "M11.75 18c.35.5 1.45 1 2.75 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" }],
      ["path", { d: "M2 10h4" }],
      ["path", { d: "M2 14h4" }],
      ["path", { d: "M2 18h4" }],
      ["path", { d: "M2 6h4" }],
      ["path", { d: "M7 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1L10 4a1 1 0 0 0-1-1z" }]
    ]
  ];

  const DatabaseBackup = [
    "svg",
    defaultAttributes,
    [
      ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
      ["path", { d: "M3 12a9 3 0 0 0 5 2.69" }],
      ["path", { d: "M21 9.3V5" }],
      ["path", { d: "M3 5v14a9 3 0 0 0 6.47 2.88" }],
      ["path", { d: "M12 12v4h4" }],
      ["path", { d: "M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" }]
    ]
  ];

  const DatabaseZap = [
    "svg",
    defaultAttributes,
    [
      ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
      ["path", { d: "M3 5V19A9 3 0 0 0 15 21.84" }],
      ["path", { d: "M21 5V8" }],
      ["path", { d: "M21 12L18 17H22L19 22" }],
      ["path", { d: "M3 12A9 3 0 0 0 14.59 14.87" }]
    ]
  ];

  const Database = [
    "svg",
    defaultAttributes,
    [
      ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }],
      ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
      ["path", { d: "M3 12A9 3 0 0 0 21 12" }]
    ]
  ];

  const Delete = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
        }
      ],
      ["path", { d: "m12 9 6 6" }],
      ["path", { d: "m18 9-6 6" }]
    ]
  ];

  const Dessert = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "4", r: "2" }],
      [
        "path",
        {
          d: "M10.2 3.2C5.5 4 2 8.1 2 13a2 2 0 0 0 4 0v-1a2 2 0 0 1 4 0v4a2 2 0 0 0 4 0v-4a2 2 0 0 1 4 0v1a2 2 0 0 0 4 0c0-4.9-3.5-9-8.2-9.8"
        }
      ],
      ["path", { d: "M3.2 14.8a9 9 0 0 0 17.6 0" }]
    ]
  ];

  const Diameter = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "19", cy: "19", r: "2" }],
      ["circle", { cx: "5", cy: "5", r: "2" }],
      ["path", { d: "M6.48 3.66a10 10 0 0 1 13.86 13.86" }],
      ["path", { d: "m6.41 6.41 11.18 11.18" }],
      ["path", { d: "M3.66 6.48a10 10 0 0 0 13.86 13.86" }]
    ]
  ];

  const DiamondMinus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"
        }
      ],
      ["path", { d: "M8 12h8" }]
    ]
  ];

  const DiamondPercent = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z"
        }
      ],
      ["path", { d: "M9.2 9.2h.01" }],
      ["path", { d: "m14.5 9.5-5 5" }],
      ["path", { d: "M14.7 14.8h.01" }]
    ]
  ];

  const DiamondPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 8v8" }],
      [
        "path",
        {
          d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"
        }
      ],
      ["path", { d: "M8 12h8" }]
    ]
  ];

  const Diamond = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"
        }
      ]
    ]
  ];

  const Dice1 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M12 12h.01" }]
    ]
  ];

  const Dice2 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M15 9h.01" }],
      ["path", { d: "M9 15h.01" }]
    ]
  ];

  const Dice3 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M16 8h.01" }],
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M8 16h.01" }]
    ]
  ];

  const Dice4 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M16 8h.01" }],
      ["path", { d: "M8 8h.01" }],
      ["path", { d: "M8 16h.01" }],
      ["path", { d: "M16 16h.01" }]
    ]
  ];

  const Dice5 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M16 8h.01" }],
      ["path", { d: "M8 8h.01" }],
      ["path", { d: "M8 16h.01" }],
      ["path", { d: "M16 16h.01" }],
      ["path", { d: "M12 12h.01" }]
    ]
  ];

  const Dice6 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["path", { d: "M16 8h.01" }],
      ["path", { d: "M16 12h.01" }],
      ["path", { d: "M16 16h.01" }],
      ["path", { d: "M8 8h.01" }],
      ["path", { d: "M8 12h.01" }],
      ["path", { d: "M8 16h.01" }]
    ]
  ];

  const Dices = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "12", height: "12", x: "2", y: "10", rx: "2", ry: "2" }],
      ["path", { d: "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" }],
      ["path", { d: "M6 18h.01" }],
      ["path", { d: "M10 14h.01" }],
      ["path", { d: "M15 6h.01" }],
      ["path", { d: "M18 9h.01" }]
    ]
  ];

  const Diff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 3v14" }],
      ["path", { d: "M5 10h14" }],
      ["path", { d: "M5 21h14" }]
    ]
  ];

  const Disc2 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["path", { d: "M12 12h.01" }]
    ]
  ];

  const Disc3 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M6 12c0-1.7.7-3.2 1.8-4.2" }],
      ["circle", { cx: "12", cy: "12", r: "2" }],
      ["path", { d: "M18 12c0 1.7-.7 3.2-1.8 4.2" }]
    ]
  ];

  const DiscAlbum = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["circle", { cx: "12", cy: "12", r: "5" }],
      ["path", { d: "M12 12h.01" }]
    ]
  ];

  const Disc = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["circle", { cx: "12", cy: "12", r: "2" }]
    ]
  ];

  const Divide = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "6", r: "1" }],
      ["line", { x1: "5", x2: "19", y1: "12", y2: "12" }],
      ["circle", { cx: "12", cy: "18", r: "1" }]
    ]
  ];

  const DnaOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2c-1.35 1.5-2.092 3-2.5 4.5L14 8" }],
      ["path", { d: "m17 6-2.891-2.891" }],
      ["path", { d: "M2 15c3.333-3 6.667-3 10-3" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "m20 9 .891.891" }],
      ["path", { d: "M22 9c-1.5 1.35-3 2.092-4.5 2.5l-1-1" }],
      ["path", { d: "M3.109 14.109 4 15" }],
      ["path", { d: "m6.5 12.5 1 1" }],
      ["path", { d: "m7 18 2.891 2.891" }],
      ["path", { d: "M9 22c1.35-1.5 2.092-3 2.5-4.5L10 16" }]
    ]
  ];

  const Dna = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m10 16 1.5 1.5" }],
      ["path", { d: "m14 8-1.5-1.5" }],
      ["path", { d: "M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" }],
      ["path", { d: "m16.5 10.5 1 1" }],
      ["path", { d: "m17 6-2.891-2.891" }],
      ["path", { d: "M2 15c6.667-6 13.333 0 20-6" }],
      ["path", { d: "m20 9 .891.891" }],
      ["path", { d: "M3.109 14.109 4 15" }],
      ["path", { d: "m6.5 12.5 1 1" }],
      ["path", { d: "m7 18 2.891 2.891" }],
      ["path", { d: "M9 22c1.798-1.998 2.518-3.995 2.807-5.993" }]
    ]
  ];

  const Dock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 8h20" }],
      ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
      ["path", { d: "M6 16h12" }]
    ]
  ];

  const Dog = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11.25 16.25h1.5L12 17z" }],
      ["path", { d: "M16 14v.5" }],
      [
        "path",
        {
          d: "M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"
        }
      ],
      ["path", { d: "M8 14v.5" }],
      [
        "path",
        {
          d: "M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"
        }
      ]
    ]
  ];

  const DollarSign = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "12", x2: "12", y1: "2", y2: "22" }],
      ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }]
    ]
  ];

  const Donut = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20.5 10a2.5 2.5 0 0 1-2.4-3H18a2.95 2.95 0 0 1-2.6-4.4 10 10 0 1 0 6.3 7.1c-.3.2-.8.3-1.2.3"
        }
      ],
      ["circle", { cx: "12", cy: "12", r: "3" }]
    ]
  ];

  const DoorClosed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" }],
      ["path", { d: "M2 20h20" }],
      ["path", { d: "M14 12v.01" }]
    ]
  ];

  const DoorOpen = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13 4h3a2 2 0 0 1 2 2v14" }],
      ["path", { d: "M2 20h3" }],
      ["path", { d: "M13 20h9" }],
      ["path", { d: "M10 12v.01" }],
      [
        "path",
        {
          d: "M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"
        }
      ]
    ]
  ];

  const Dot = ["svg", defaultAttributes, [["circle", { cx: "12.1", cy: "12.1", r: "1" }]]];

  const Download = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["polyline", { points: "7 10 12 15 17 10" }],
      ["line", { x1: "12", x2: "12", y1: "15", y2: "3" }]
    ]
  ];

  const DraftingCompass = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m12.99 6.74 1.93 3.44" }],
      ["path", { d: "M19.136 12a10 10 0 0 1-14.271 0" }],
      ["path", { d: "m21 21-2.16-3.84" }],
      ["path", { d: "m3 21 8.02-14.26" }],
      ["circle", { cx: "12", cy: "5", r: "2" }]
    ]
  ];

  const Drama = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 11h.01" }],
      ["path", { d: "M14 6h.01" }],
      ["path", { d: "M18 6h.01" }],
      ["path", { d: "M6.5 13.1h.01" }],
      ["path", { d: "M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3" }],
      ["path", { d: "M17.4 9.9c-.8.8-2 .8-2.8 0" }],
      [
        "path",
        {
          d: "M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7"
        }
      ],
      ["path", { d: "M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4" }]
    ]
  ];

  const Dribbble = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" }],
      ["path", { d: "M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" }],
      ["path", { d: "M8.56 2.75c4.37 6 6 9.42 8 17.72" }]
    ]
  ];

  const Drill = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3 1 1 0 0 1 1-1z" }],
      [
        "path",
        {
          d: "M13 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1l-.81 3.242a1 1 0 0 1-.97.758H8"
        }
      ],
      ["path", { d: "M14 4h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3" }],
      ["path", { d: "M18 6h4" }],
      ["path", { d: "m5 10-2 8" }],
      ["path", { d: "m7 18 2-8" }]
    ]
  ];

  const DropletOff = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M18.715 13.186C18.29 11.858 17.384 10.607 16 9.5c-2-1.6-3.5-4-4-6.5a10.7 10.7 0 0 1-.884 2.586"
        }
      ],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M8.795 8.797A11 11 0 0 1 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 13.222 3.208" }]
    ]
  ];

  const Droplet = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
        }
      ]
    ]
  ];

  const Droplets = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"
        }
      ],
      [
        "path",
        {
          d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"
        }
      ]
    ]
  ];

  const Drum = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m2 2 8 8" }],
      ["path", { d: "m22 2-8 8" }],
      ["ellipse", { cx: "12", cy: "9", rx: "10", ry: "5" }],
      ["path", { d: "M7 13.4v7.9" }],
      ["path", { d: "M12 14v8" }],
      ["path", { d: "M17 13.4v7.9" }],
      ["path", { d: "M2 9v8a10 5 0 0 0 20 0V9" }]
    ]
  ];

  const Drumstick = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" }],
      ["path", { d: "m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" }]
    ]
  ];

  const Dumbbell = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14.4 14.4 9.6 9.6" }],
      [
        "path",
        {
          d: "M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"
        }
      ],
      ["path", { d: "m21.5 21.5-1.4-1.4" }],
      ["path", { d: "M3.9 3.9 2.5 2.5" }],
      [
        "path",
        {
          d: "M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"
        }
      ]
    ]
  ];

  const EarOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 18.5a3.5 3.5 0 1 0 7 0c0-1.57.92-2.52 2.04-3.46" }],
      ["path", { d: "M6 8.5c0-.75.13-1.47.36-2.14" }],
      ["path", { d: "M8.8 3.15A6.5 6.5 0 0 1 19 8.5c0 1.63-.44 2.81-1.09 3.76" }],
      ["path", { d: "M12.5 6A2.5 2.5 0 0 1 15 8.5M10 13a2 2 0 0 0 1.82-1.18" }],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const Ear = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" }],
      ["path", { d: "M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" }]
    ]
  ];

  const EarthLock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 3.34V5a3 3 0 0 0 3 3" }],
      ["path", { d: "M11 21.95V18a2 2 0 0 0-2-2 2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" }],
      ["path", { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54" }],
      ["path", { d: "M12 2a10 10 0 1 0 9.54 13" }],
      ["path", { d: "M20 6V4a2 2 0 1 0-4 0v2" }],
      ["rect", { width: "8", height: "5", x: "14", y: "6", rx: "1" }]
    ]
  ];

  const Earth = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21.54 15H17a2 2 0 0 0-2 2v4.54" }],
      [
        "path",
        { d: "M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" }
      ],
      ["path", { d: "M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" }],
      ["circle", { cx: "12", cy: "12", r: "10" }]
    ]
  ];

  const Eclipse = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 2a7 7 0 1 0 10 10" }]
    ]
  ];

  const EggFried = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "11.5", cy: "12.5", r: "3.5" }],
      [
        "path",
        {
          d: "M3 8c0-3.5 2.5-6 6.5-6 5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8Z"
        }
      ]
    ]
  ];

  const EggOff = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M6.399 6.399C5.362 8.157 4.65 10.189 4.5 12c-.37 4.43 1.27 9.95 7.5 10 3.256-.026 5.259-1.547 6.375-3.625"
        }
      ],
      [
        "path",
        {
          d: "M19.532 13.875A14.07 14.07 0 0 0 19.5 12c-.36-4.34-3.95-9.96-7.5-10-1.04.012-2.082.502-3.046 1.297"
        }
      ],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const Egg = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z"
        }
      ]
    ]
  ];

  const EllipsisVertical = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "1" }],
      ["circle", { cx: "12", cy: "5", r: "1" }],
      ["circle", { cx: "12", cy: "19", r: "1" }]
    ]
  ];

  const Ellipsis = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "1" }],
      ["circle", { cx: "19", cy: "12", r: "1" }],
      ["circle", { cx: "5", cy: "12", r: "1" }]
    ]
  ];

  const EqualApproximately = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 15a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }],
      ["path", { d: "M5 9a6.5 6.5 0 0 1 7 0 6.5 6.5 0 0 0 7 0" }]
    ]
  ];

  const EqualNot = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "5", x2: "19", y1: "9", y2: "9" }],
      ["line", { x1: "5", x2: "19", y1: "15", y2: "15" }],
      ["line", { x1: "19", x2: "5", y1: "5", y2: "19" }]
    ]
  ];

  const Equal = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "5", x2: "19", y1: "9", y2: "9" }],
      ["line", { x1: "5", x2: "19", y1: "15", y2: "15" }]
    ]
  ];

  const Eraser = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" }
      ],
      ["path", { d: "M22 21H7" }],
      ["path", { d: "m5 11 9 9" }]
    ]
  ];

  const EthernetPort = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "m15 20 3-3h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2l3 3z" }
      ],
      ["path", { d: "M6 8v1" }],
      ["path", { d: "M10 8v1" }],
      ["path", { d: "M14 8v1" }],
      ["path", { d: "M18 8v1" }]
    ]
  ];

  const Euro = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 10h12" }],
      ["path", { d: "M4 14h9" }],
      [
        "path",
        { d: "M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" }
      ]
    ]
  ];

  const Expand = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m21 21-6-6m6 6v-4.8m0 4.8h-4.8" }],
      ["path", { d: "M3 16.2V21m0 0h4.8M3 21l6-6" }],
      ["path", { d: "M21 7.8V3m0 0h-4.8M21 3l-6 6" }],
      ["path", { d: "M3 7.8V3m0 0h4.8M3 3l6 6" }]
    ]
  ];

  const ExternalLink = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 3h6v6" }],
      ["path", { d: "M10 14 21 3" }],
      ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
    ]
  ];

  const EyeClosed = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m15 18-.722-3.25" }],
      ["path", { d: "M2 8a10.645 10.645 0 0 0 20 0" }],
      ["path", { d: "m20 15-1.726-2.05" }],
      ["path", { d: "m4 15 1.726-2.05" }],
      ["path", { d: "m9 18 .722-3.25" }]
    ]
  ];

  const EyeOff = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
        }
      ],
      ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
      [
        "path",
        {
          d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
        }
      ],
      ["path", { d: "m2 2 20 20" }]
    ]
  ];

  const Eye = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        }
      ],
      ["circle", { cx: "12", cy: "12", r: "3" }]
    ]
  ];

  const Facebook = [
    "svg",
    defaultAttributes,
    [["path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }]]
  ];

  const Factory = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" }
      ],
      ["path", { d: "M17 18h1" }],
      ["path", { d: "M12 18h1" }],
      ["path", { d: "M7 18h1" }]
    ]
  ];

  const Fan = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"
        }
      ],
      ["path", { d: "M12 12v.01" }]
    ]
  ];

  const FastForward = [
    "svg",
    defaultAttributes,
    [
      ["polygon", { points: "13 19 22 12 13 5 13 19" }],
      ["polygon", { points: "2 19 11 12 2 5 2 19" }]
    ]
  ];

  const Feather = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"
        }
      ],
      ["path", { d: "M16 8 2 22" }],
      ["path", { d: "M17.5 15H9" }]
    ]
  ];

  const Fence = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }],
      ["path", { d: "M6 8h4" }],
      ["path", { d: "M6 18h4" }],
      ["path", { d: "m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }],
      ["path", { d: "M14 8h4" }],
      ["path", { d: "M14 18h4" }],
      ["path", { d: "m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z" }]
    ]
  ];

  const FerrisWheel = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "2" }],
      ["path", { d: "M12 2v4" }],
      ["path", { d: "m6.8 15-3.5 2" }],
      ["path", { d: "m20.7 7-3.5 2" }],
      ["path", { d: "M6.8 9 3.3 7" }],
      ["path", { d: "m20.7 17-3.5-2" }],
      ["path", { d: "m9 22 3-8 3 8" }],
      ["path", { d: "M8 22h8" }],
      ["path", { d: "M18 18.7a9 9 0 1 0-12 0" }]
    ]
  ];

  const Figma = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" }],
      ["path", { d: "M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" }],
      ["path", { d: "M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" }],
      ["path", { d: "M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" }],
      ["path", { d: "M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" }]
    ]
  ];

  const FileArchive = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 12v-1" }],
      ["path", { d: "M10 18v-2" }],
      ["path", { d: "M10 7V6" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01" }],
      ["circle", { cx: "10", cy: "20", r: "2" }]
    ]
  ];

  const FileAudio2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["circle", { cx: "3", cy: "17", r: "1" }],
      ["path", { d: "M2 17v-3a4 4 0 0 1 8 0v3" }],
      ["circle", { cx: "9", cy: "17", r: "1" }]
    ]
  ];

  const FileAudio = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      [
        "path",
        {
          d: "M2 19a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 1 1-4 0v-1a2 2 0 1 1 4 0"
        }
      ]
    ]
  ];

  const FileAxis3d = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m8 18 4-4" }],
      ["path", { d: "M8 10v8h8" }]
    ]
  ];

  const FileBadge2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["circle", { cx: "12", cy: "10", r: "3" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m14 12.5 1 5.5-3-1-3 1 1-5.5" }]
    ]
  ];

  const FileBadge = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" }],
      ["path", { d: "M7 16.5 8 22l-3-1-3 1 1-5.5" }]
    ]
  ];

  const FileBox = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      [
        "path",
        {
          d: "M3 13.1a2 2 0 0 0-1 1.76v3.24a2 2 0 0 0 .97 1.78L6 21.7a2 2 0 0 0 2.03.01L11 19.9a2 2 0 0 0 1-1.76V14.9a2 2 0 0 0-.97-1.78L8 11.3a2 2 0 0 0-2.03-.01Z"
        }
      ],
      ["path", { d: "M7 17v5" }],
      ["path", { d: "M11.7 14.2 7 17l-4.7-2.8" }]
    ]
  ];

  const FileChartColumnIncreasing = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M8 18v-2" }],
      ["path", { d: "M12 18v-4" }],
      ["path", { d: "M16 18v-6" }]
    ]
  ];

  const FileChartColumn = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M8 18v-1" }],
      ["path", { d: "M12 18v-6" }],
      ["path", { d: "M16 18v-3" }]
    ]
  ];

  const FileChartLine = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m16 13-3.5 3.5-2-2L8 17" }]
    ]
  ];

  const FileChartPie = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3.5" }],
      ["path", { d: "M4.017 11.512a6 6 0 1 0 8.466 8.475" }],
      [
        "path",
        {
          d: "M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"
        }
      ]
    ]
  ];

  const FileCheck2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m3 15 2 2 4-4" }]
    ]
  ];

  const FileCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m9 15 2 2 4-4" }]
    ]
  ];

  const FileClock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["circle", { cx: "8", cy: "16", r: "6" }],
      ["path", { d: "M9.5 17.5 8 16.25V14" }]
    ]
  ];

  const FileCode2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m5 12-3 3 3 3" }],
      ["path", { d: "m9 18 3-3-3-3" }]
    ]
  ];

  const FileCode = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 12.5 8 15l2 2.5" }],
      ["path", { d: "m14 12.5 2 2.5-2 2.5" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" }]
    ]
  ];

  const FileCog = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m3.2 12.9-.9-.4" }],
      ["path", { d: "m3.2 15.1-.9.4" }],
      ["path", { d: "M4.677 21.5a2 2 0 0 0 1.313.5H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2.5" }],
      ["path", { d: "m4.9 11.2-.4-.9" }],
      ["path", { d: "m4.9 16.8-.4.9" }],
      ["path", { d: "m7.5 10.3-.4.9" }],
      ["path", { d: "m7.5 17.7-.4-.9" }],
      ["path", { d: "m9.7 12.5-.9.4" }],
      ["path", { d: "m9.7 15.5-.9-.4" }],
      ["circle", { cx: "6", cy: "14", r: "3" }]
    ]
  ];

  const FileDiff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M9 10h6" }],
      ["path", { d: "M12 13V7" }],
      ["path", { d: "M9 17h6" }]
    ]
  ];

  const FileDigit = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["rect", { width: "4", height: "6", x: "2", y: "12", rx: "2" }],
      ["path", { d: "M10 12h2v6" }],
      ["path", { d: "M10 18h4" }]
    ]
  ];

  const FileDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M12 18v-6" }],
      ["path", { d: "m9 15 3 3 3-3" }]
    ]
  ];

  const FileHeart = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      [
        "path",
        {
          d: "M10.29 10.7a2.43 2.43 0 0 0-2.66-.52c-.29.12-.56.3-.78.53l-.35.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L6.5 18l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z"
        }
      ]
    ]
  ];

  const FileImage = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["circle", { cx: "10", cy: "12", r: "2" }],
      ["path", { d: "m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" }]
    ]
  ];

  const FileInput = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M2 15h10" }],
      ["path", { d: "m9 18 3-3-3-3" }]
    ]
  ];

  const FileJson2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M4 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" }],
      ["path", { d: "M8 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" }]
    ]
  ];

  const FileJson = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" }],
      ["path", { d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" }]
    ]
  ];

  const FileKey2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v6" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["circle", { cx: "4", cy: "16", r: "2" }],
      ["path", { d: "m10 10-4.5 4.5" }],
      ["path", { d: "m9 11 1 1" }]
    ]
  ];

  const FileKey = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["circle", { cx: "10", cy: "16", r: "2" }],
      ["path", { d: "m16 10-4.5 4.5" }],
      ["path", { d: "m15 11 1 1" }]
    ]
  ];

  const FileLock2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["rect", { width: "8", height: "5", x: "2", y: "13", rx: "1" }],
      ["path", { d: "M8 13v-2a2 2 0 1 0-4 0v2" }]
    ]
  ];

  const FileLock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["rect", { width: "8", height: "6", x: "8", y: "12", rx: "1" }],
      ["path", { d: "M10 12v-2a2 2 0 1 1 4 0v2" }]
    ]
  ];

  const FileMinus2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M3 15h6" }]
    ]
  ];

  const FileMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M9 15h6" }]
    ]
  ];

  const FileMusic = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v8.4" }],
      ["path", { d: "M8 18v-7.7L16 9v7" }],
      ["circle", { cx: "14", cy: "16", r: "2" }],
      ["circle", { cx: "6", cy: "18", r: "2" }]
    ]
  ];

  const FileOutput = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M4 7V4a2 2 0 0 1 2-2 2 2 0 0 0-2 2" }],
      ["path", { d: "M4.063 20.999a2 2 0 0 0 2 1L18 22a2 2 0 0 0 2-2V7l-5-5H6" }],
      ["path", { d: "m5 11-3 3" }],
      ["path", { d: "m5 17-3-3h10" }]
    ]
  ];

  const FilePenLine = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"
        }
      ],
      [
        "path",
        {
          d: "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        }
      ],
      ["path", { d: "M8 18h1" }]
    ]
  ];

  const FilePen = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      [
        "path",
        {
          d: "M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        }
      ]
    ]
  ];

  const FilePlus2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M3 15h6" }],
      ["path", { d: "M6 12v6" }]
    ]
  ];

  const FilePlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M9 15h6" }],
      ["path", { d: "M12 18v-6" }]
    ]
  ];

  const FileQuestion = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 17h.01" }],
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" }],
      ["path", { d: "M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" }]
    ]
  ];

  const FileScan = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M20 10V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M16 14a2 2 0 0 0-2 2" }],
      ["path", { d: "M20 14a2 2 0 0 1 2 2" }],
      ["path", { d: "M20 22a2 2 0 0 0 2-2" }],
      ["path", { d: "M16 22a2 2 0 0 1-2-2" }]
    ]
  ];

  const FileSearch2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["circle", { cx: "11.5", cy: "14.5", r: "2.5" }],
      ["path", { d: "M13.3 16.3 15 18" }]
    ]
  ];

  const FileSearch = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" }],
      ["path", { d: "m9 18-1.5-1.5" }],
      ["circle", { cx: "5", cy: "14", r: "3" }]
    ]
  ];

  const FileSliders = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M8 12h8" }],
      ["path", { d: "M10 11v2" }],
      ["path", { d: "M8 17h8" }],
      ["path", { d: "M14 16v2" }]
    ]
  ];

  const FileSpreadsheet = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M8 13h2" }],
      ["path", { d: "M14 13h2" }],
      ["path", { d: "M8 17h2" }],
      ["path", { d: "M14 17h2" }]
    ]
  ];

  const FileStack = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 7h-3a2 2 0 0 1-2-2V2" }],
      [
        "path",
        { d: "M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17Z" }
      ],
      ["path", { d: "M7 8v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H15" }],
      ["path", { d: "M3 12v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H11" }]
    ]
  ];

  const FileSymlink = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m10 18 3-3-3-3" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      [
        "path",
        { d: "M4 11V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7" }
      ]
    ]
  ];

  const FileTerminal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m8 16 2-2-2-2" }],
      ["path", { d: "M12 18h4" }]
    ]
  ];

  const FileText = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M10 9H8" }],
      ["path", { d: "M16 13H8" }],
      ["path", { d: "M16 17H8" }]
    ]
  ];

  const FileType2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M2 13v-1h6v1" }],
      ["path", { d: "M5 12v6" }],
      ["path", { d: "M4 18h2" }]
    ]
  ];

  const FileType = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M9 13v-1h6v1" }],
      ["path", { d: "M12 12v6" }],
      ["path", { d: "M11 18h2" }]
    ]
  ];

  const FileUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M12 12v6" }],
      ["path", { d: "m15 15-3-3-3 3" }]
    ]
  ];

  const FileUser = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M15 18a3 3 0 1 0-6 0" }],
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" }],
      ["circle", { cx: "12", cy: "13", r: "2" }]
    ]
  ];

  const FileVideo2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["rect", { width: "8", height: "6", x: "2", y: "12", rx: "1" }],
      ["path", { d: "m10 15.5 4 2.5v-6l-4 2.5" }]
    ]
  ];

  const FileVideo = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m10 11 5 3-5 3v-6Z" }]
    ]
  ];

  const FileVolume2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M8 15h.01" }],
      ["path", { d: "M11.5 13.5a2.5 2.5 0 0 1 0 3" }],
      ["path", { d: "M15 12a5 5 0 0 1 0 6" }]
    ]
  ];

  const FileVolume = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 11a5 5 0 0 1 0 6" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "M4 6.765V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-.93-.23" }],
      [
        "path",
        {
          d: "M7 10.51a.5.5 0 0 0-.826-.38l-1.893 1.628A1 1 0 0 1 3.63 12H2.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h1.129a1 1 0 0 1 .652.242l1.893 1.63a.5.5 0 0 0 .826-.38z"
        }
      ]
    ]
  ];

  const FileWarning = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M12 9v4" }],
      ["path", { d: "M12 17h.01" }]
    ]
  ];

  const FileX2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m8 12.5-5 5" }],
      ["path", { d: "m3 12.5 5 5" }]
    ]
  ];

  const FileX = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
      ["path", { d: "m14.5 12.5-5 5" }],
      ["path", { d: "m9.5 12.5 5 5" }]
    ]
  ];

  const File = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
      ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }]
    ]
  ];

  const Files = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }],
      ["path", { d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" }],
      ["path", { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" }]
    ]
  ];

  const Film = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M7 3v18" }],
      ["path", { d: "M3 7.5h4" }],
      ["path", { d: "M3 12h18" }],
      ["path", { d: "M3 16.5h4" }],
      ["path", { d: "M17 3v18" }],
      ["path", { d: "M17 7.5h4" }],
      ["path", { d: "M17 16.5h4" }]
    ]
  ];

  const FilterX = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13.013 3H2l8 9.46V19l4 2v-8.54l.9-1.055" }],
      ["path", { d: "m22 3-5 5" }],
      ["path", { d: "m17 3 5 5" }]
    ]
  ];

  const Filter = [
    "svg",
    defaultAttributes,
    [["polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }]]
  ];

  const Fingerprint = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" }],
      ["path", { d: "M14 13.12c0 2.38 0 6.38-1 8.88" }],
      ["path", { d: "M17.29 21.02c.12-.6.43-2.3.5-3.02" }],
      ["path", { d: "M2 12a10 10 0 0 1 18-6" }],
      ["path", { d: "M2 16h.01" }],
      ["path", { d: "M21.8 16c.2-2 .131-5.354 0-6" }],
      ["path", { d: "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" }],
      ["path", { d: "M8.65 22c.21-.66.45-1.32.57-2" }],
      ["path", { d: "M9 6.8a6 6 0 0 1 9 5.2v2" }]
    ]
  ];

  const FireExtinguisher = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 6.5V3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3.5" }],
      ["path", { d: "M9 18h8" }],
      ["path", { d: "M18 3h-3" }],
      ["path", { d: "M11 3a6 6 0 0 0-6 6v11" }],
      ["path", { d: "M5 13h4" }],
      ["path", { d: "M17 10a4 4 0 0 0-8 0v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2Z" }]
    ]
  ];

  const FishOff = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M18 12.47v.03m0-.5v.47m-.475 5.056A6.744 6.744 0 0 1 15 18c-3.56 0-7.56-2.53-8.5-6 .348-1.28 1.114-2.433 2.121-3.38m3.444-2.088A8.802 8.802 0 0 1 15 6c3.56 0 6.06 2.54 7 6-.309 1.14-.786 2.177-1.413 3.058"
        }
      ],
      [
        "path",
        {
          d: "M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33m7.48-4.372A9.77 9.77 0 0 1 16 6.07m0 11.86a9.77 9.77 0 0 1-1.728-3.618"
        }
      ],
      [
        "path",
        {
          d: "m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98M8.53 3h5.27a2 2 0 0 1 1.98 1.67l.23 1.4M2 2l20 20"
        }
      ]
    ]
  ];

  const FishSymbol = [
    "svg",
    defaultAttributes,
    [["path", { d: "M2 16s9-15 20-4C11 23 2 8 2 8" }]]
  ];

  const Fish = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"
        }
      ],
      ["path", { d: "M18 12v.5" }],
      ["path", { d: "M16 17.93a9.77 9.77 0 0 1 0-11.86" }],
      [
        "path",
        {
          d: "M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"
        }
      ],
      ["path", { d: "M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" }],
      ["path", { d: "m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" }]
    ]
  ];

  const FlagOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2c3 0 5 2 8 2s4-1 4-1v11" }],
      ["path", { d: "M4 22V4" }],
      ["path", { d: "M4 15s1-1 4-1 5 2 8 2" }],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const FlagTriangleLeft = [
    "svg",
    defaultAttributes,
    [["path", { d: "M17 22V2L7 7l10 5" }]]
  ];

  const FlagTriangleRight = [
    "svg",
    defaultAttributes,
    [["path", { d: "M7 22V2l10 5-10 5" }]]
  ];

  const Flag = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }],
      ["line", { x1: "4", x2: "4", y1: "22", y2: "15" }]
    ]
  ];

  const FlameKindling = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z"
        }
      ],
      ["path", { d: "m5 22 14-4" }],
      ["path", { d: "m5 18 14 4" }]
    ]
  ];

  const Flame = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        }
      ]
    ]
  ];

  const FlashlightOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 16v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4" }],
      ["path", { d: "M7 2h11v4c0 2-2 2-2 4v1" }],
      ["line", { x1: "11", x2: "18", y1: "6", y2: "6" }],
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }]
    ]
  ];

  const Flashlight = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z" }],
      ["line", { x1: "6", x2: "18", y1: "6", y2: "6" }],
      ["line", { x1: "12", x2: "12", y1: "12", y2: "12" }]
    ]
  ];

  const FlaskConicalOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2v2.343" }],
      ["path", { d: "M14 2v6.343" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-1.755-2.96l5.227-9.563" }],
      ["path", { d: "M6.453 15H15" }],
      ["path", { d: "M8.5 2h7" }]
    ]
  ];

  const FlaskConical = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"
        }
      ],
      ["path", { d: "M6.453 15h11.094" }],
      ["path", { d: "M8.5 2h7" }]
    ]
  ];

  const FlaskRound = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 2v6.292a7 7 0 1 0 4 0V2" }],
      ["path", { d: "M5 15h14" }],
      ["path", { d: "M8.5 2h7" }]
    ]
  ];

  const FlipHorizontal2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m3 7 5 5-5 5V7" }],
      ["path", { d: "m21 7-5 5 5 5V7" }],
      ["path", { d: "M12 20v2" }],
      ["path", { d: "M12 14v2" }],
      ["path", { d: "M12 8v2" }],
      ["path", { d: "M12 2v2" }]
    ]
  ];

  const FlipHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" }],
      ["path", { d: "M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" }],
      ["path", { d: "M12 20v2" }],
      ["path", { d: "M12 14v2" }],
      ["path", { d: "M12 8v2" }],
      ["path", { d: "M12 2v2" }]
    ]
  ];

  const FlipVertical2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m17 3-5 5-5-5h10" }],
      ["path", { d: "m17 21-5-5-5 5h10" }],
      ["path", { d: "M4 12H2" }],
      ["path", { d: "M10 12H8" }],
      ["path", { d: "M16 12h-2" }],
      ["path", { d: "M22 12h-2" }]
    ]
  ];

  const FlipVertical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" }],
      ["path", { d: "M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" }],
      ["path", { d: "M4 12H2" }],
      ["path", { d: "M10 12H8" }],
      ["path", { d: "M16 12h-2" }],
      ["path", { d: "M22 12h-2" }]
    ]
  ];

  const Flower2 = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"
        }
      ],
      ["circle", { cx: "12", cy: "8", r: "2" }],
      ["path", { d: "M12 10v12" }],
      ["path", { d: "M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" }],
      ["path", { d: "M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" }]
    ]
  ];

  const Flower = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "3" }],
      [
        "path",
        {
          d: "M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
        }
      ],
      ["path", { d: "M12 7.5V9" }],
      ["path", { d: "M7.5 12H9" }],
      ["path", { d: "M16.5 12H15" }],
      ["path", { d: "M12 16.5V15" }],
      ["path", { d: "m8 8 1.88 1.88" }],
      ["path", { d: "M14.12 9.88 16 8" }],
      ["path", { d: "m8 16 1.88-1.88" }],
      ["path", { d: "M14.12 14.12 16 16" }]
    ]
  ];

  const Focus = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "3" }],
      ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
      ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }]
    ]
  ];

  const FoldHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 12h6" }],
      ["path", { d: "M22 12h-6" }],
      ["path", { d: "M12 2v2" }],
      ["path", { d: "M12 8v2" }],
      ["path", { d: "M12 14v2" }],
      ["path", { d: "M12 20v2" }],
      ["path", { d: "m19 9-3 3 3 3" }],
      ["path", { d: "m5 15 3-3-3-3" }]
    ]
  ];

  const FoldVertical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 22v-6" }],
      ["path", { d: "M12 8V2" }],
      ["path", { d: "M4 12H2" }],
      ["path", { d: "M10 12H8" }],
      ["path", { d: "M16 12h-2" }],
      ["path", { d: "M22 12h-2" }],
      ["path", { d: "m15 19-3-3-3 3" }],
      ["path", { d: "m15 5-3 3-3-3" }]
    ]
  ];

  const FolderArchive = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "15", cy: "19", r: "2" }],
      [
        "path",
        {
          d: "M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"
        }
      ],
      ["path", { d: "M15 11v-1" }],
      ["path", { d: "M15 17v-2" }]
    ]
  ];

  const FolderCheck = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "m9 13 2 2 4-4" }]
    ]
  ];

  const FolderClock = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "16", cy: "16", r: "6" }],
      [
        "path",
        {
          d: "M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2"
        }
      ],
      ["path", { d: "M16 14v2l1 1" }]
    ]
  ];

  const FolderClosed = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M2 10h20" }]
    ]
  ];

  const FolderCode = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 10.5 8 13l2 2.5" }],
      ["path", { d: "m14 10.5 2 2.5-2 2.5" }],
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"
        }
      ]
    ]
  ];

  const FolderCog = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18", cy: "18", r: "3" }],
      [
        "path",
        {
          d: "M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v3.3"
        }
      ],
      ["path", { d: "m21.7 19.4-.9-.3" }],
      ["path", { d: "m15.2 16.9-.9-.3" }],
      ["path", { d: "m16.6 21.7.3-.9" }],
      ["path", { d: "m19.1 15.2.3-.9" }],
      ["path", { d: "m19.6 21.7-.4-1" }],
      ["path", { d: "m16.8 15.3-.4-1" }],
      ["path", { d: "m14.3 19.6 1-.4" }],
      ["path", { d: "m20.7 16.8 1-.4" }]
    ]
  ];

  const FolderDot = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
        }
      ],
      ["circle", { cx: "12", cy: "13", r: "1" }]
    ]
  ];

  const FolderDown = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M12 10v6" }],
      ["path", { d: "m15 13-3 3-3-3" }]
    ]
  ];

  const FolderGit2 = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5"
        }
      ],
      ["circle", { cx: "13", cy: "12", r: "2" }],
      ["path", { d: "M18 19c-2.8 0-5-2.2-5-5v8" }],
      ["circle", { cx: "20", cy: "19", r: "2" }]
    ]
  ];

  const FolderGit = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "13", r: "2" }],
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M14 13h3" }],
      ["path", { d: "M7 13h3" }]
    ]
  ];

  const FolderHeart = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.5"
        }
      ],
      [
        "path",
        {
          d: "M13.9 17.45c-1.2-1.2-1.14-2.8-.2-3.73a2.43 2.43 0 0 1 3.44 0l.36.34.34-.34a2.43 2.43 0 0 1 3.45-.01c.95.95 1 2.53-.2 3.74L17.5 21Z"
        }
      ]
    ]
  ];

  const FolderInput = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"
        }
      ],
      ["path", { d: "M2 13h10" }],
      ["path", { d: "m9 16 3-3-3-3" }]
    ]
  ];

  const FolderKanban = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
        }
      ],
      ["path", { d: "M8 10v4" }],
      ["path", { d: "M12 10v2" }],
      ["path", { d: "M16 10v6" }]
    ]
  ];

  const FolderKey = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "16", cy: "20", r: "2" }],
      [
        "path",
        {
          d: "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2"
        }
      ],
      ["path", { d: "m22 14-4.5 4.5" }],
      ["path", { d: "m21 15 1 1" }]
    ]
  ];

  const FolderLock = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "5", x: "14", y: "17", rx: "1" }],
      [
        "path",
        {
          d: "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5"
        }
      ],
      ["path", { d: "M20 17v-2a2 2 0 1 0-4 0v2" }]
    ]
  ];

  const FolderMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 13h6" }],
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ]
    ]
  ];

  const FolderOpenDot = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
        }
      ],
      ["circle", { cx: "14", cy: "15", r: "1" }]
    ]
  ];

  const FolderOpen = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
        }
      ]
    ]
  ];

  const FolderOutput = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5"
        }
      ],
      ["path", { d: "M2 13h10" }],
      ["path", { d: "m5 10-3 3 3 3" }]
    ]
  ];

  const FolderPen = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"
        }
      ],
      [
        "path",
        {
          d: "M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        }
      ]
    ]
  ];

  const FolderPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 10v6" }],
      ["path", { d: "M9 13h6" }],
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ]
    ]
  ];

  const FolderRoot = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
        }
      ],
      ["circle", { cx: "12", cy: "13", r: "2" }],
      ["path", { d: "M12 15v5" }]
    ]
  ];

  const FolderSearch2 = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "11.5", cy: "12.5", r: "2.5" }],
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M13.3 14.3 15 16" }]
    ]
  ];

  const FolderSearch = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"
        }
      ],
      ["path", { d: "m21 21-1.9-1.9" }],
      ["circle", { cx: "17", cy: "17", r: "3" }]
    ]
  ];

  const FolderSymlink = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"
        }
      ],
      ["path", { d: "m8 16 3-3-3-3" }]
    ]
  ];

  const FolderSync = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5"
        }
      ],
      ["path", { d: "M12 10v4h4" }],
      ["path", { d: "m12 14 1.535-1.605a5 5 0 0 1 8 1.5" }],
      ["path", { d: "M22 22v-4h-4" }],
      ["path", { d: "m22 18-1.535 1.605a5 5 0 0 1-8-1.5" }]
    ]
  ];

  const FolderTree = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
        }
      ],
      [
        "path",
        {
          d: "M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"
        }
      ],
      ["path", { d: "M3 5a2 2 0 0 0 2 2h3" }],
      ["path", { d: "M3 3v13a2 2 0 0 0 2 2h3" }]
    ]
  ];

  const FolderUp = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M12 10v6" }],
      ["path", { d: "m9 13 3-3 3 3" }]
    ]
  ];

  const FolderX = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "m9.5 10.5 5 5" }],
      ["path", { d: "m14.5 10.5-5 5" }]
    ]
  ];

  const Folder = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        }
      ]
    ]
  ];

  const Folders = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"
        }
      ],
      ["path", { d: "M2 8v11a2 2 0 0 0 2 2h14" }]
    ]
  ];

  const Footprints = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"
        }
      ],
      [
        "path",
        {
          d: "M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"
        }
      ],
      ["path", { d: "M16 17h4" }],
      ["path", { d: "M4 13h4" }]
    ]
  ];

  const Forklift = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 12H5a2 2 0 0 0-2 2v5" }],
      ["circle", { cx: "13", cy: "19", r: "2" }],
      ["circle", { cx: "5", cy: "19", r: "2" }],
      ["path", { d: "M8 19h3m5-17v17h6M6 12V7c0-1.1.9-2 2-2h3l5 5" }]
    ]
  ];

  const Forward = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "15 17 20 12 15 7" }],
      ["path", { d: "M4 18v-2a4 4 0 0 1 4-4h12" }]
    ]
  ];

  const Frame = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "22", x2: "2", y1: "6", y2: "6" }],
      ["line", { x1: "22", x2: "2", y1: "18", y2: "18" }],
      ["line", { x1: "6", x2: "6", y1: "2", y2: "22" }],
      ["line", { x1: "18", x2: "18", y1: "2", y2: "22" }]
    ]
  ];

  const Framer = [
    "svg",
    defaultAttributes,
    [["path", { d: "M5 16V9h14V2H5l14 14h-7m-7 0 7 7v-7m-7 0h7" }]]
  ];

  const Frown = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M16 16s-1.5-2-4-2-4 2-4 2" }],
      ["line", { x1: "9", x2: "9.01", y1: "9", y2: "9" }],
      ["line", { x1: "15", x2: "15.01", y1: "9", y2: "9" }]
    ]
  ];

  const Fuel = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "3", x2: "15", y1: "22", y2: "22" }],
      ["line", { x1: "4", x2: "14", y1: "9", y2: "9" }],
      ["path", { d: "M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" }],
      [
        "path",
        { d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" }
      ]
    ]
  ];

  const Fullscreen = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
      ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
      ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }],
      ["rect", { width: "10", height: "8", x: "7", y: "8", rx: "1" }]
    ]
  ];

  const GalleryHorizontalEnd = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 7v10" }],
      ["path", { d: "M6 5v14" }],
      ["rect", { width: "12", height: "18", x: "10", y: "3", rx: "2" }]
    ]
  ];

  const GalleryHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 3v18" }],
      ["rect", { width: "12", height: "18", x: "6", y: "3", rx: "2" }],
      ["path", { d: "M22 3v18" }]
    ]
  ];

  const GalleryThumbnails = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M4 21h1" }],
      ["path", { d: "M9 21h1" }],
      ["path", { d: "M14 21h1" }],
      ["path", { d: "M19 21h1" }]
    ]
  ];

  const GalleryVerticalEnd = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 2h10" }],
      ["path", { d: "M5 6h14" }],
      ["rect", { width: "18", height: "12", x: "3", y: "10", rx: "2" }]
    ]
  ];

  const GalleryVertical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 2h18" }],
      ["rect", { width: "18", height: "12", x: "3", y: "6", rx: "2" }],
      ["path", { d: "M3 22h18" }]
    ]
  ];

  const Gamepad2 = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "6", x2: "10", y1: "11", y2: "11" }],
      ["line", { x1: "8", x2: "8", y1: "9", y2: "13" }],
      ["line", { x1: "15", x2: "15.01", y1: "12", y2: "12" }],
      ["line", { x1: "18", x2: "18.01", y1: "10", y2: "10" }],
      [
        "path",
        {
          d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"
        }
      ]
    ]
  ];

  const Gamepad = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "6", x2: "10", y1: "12", y2: "12" }],
      ["line", { x1: "8", x2: "8", y1: "10", y2: "14" }],
      ["line", { x1: "15", x2: "15.01", y1: "13", y2: "13" }],
      ["line", { x1: "18", x2: "18.01", y1: "11", y2: "11" }],
      ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" }]
    ]
  ];

  const Gauge = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m12 14 4-4" }],
      ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0" }]
    ]
  ];

  const Gavel = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" }],
      ["path", { d: "m16 16 6-6" }],
      ["path", { d: "m8 8 6-6" }],
      ["path", { d: "m9 7 8 8" }],
      ["path", { d: "m21 11-8-8" }]
    ]
  ];

  const Gem = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 3h12l4 6-10 13L2 9Z" }],
      ["path", { d: "M11 3 8 9l4 13 4-13-3-6" }],
      ["path", { d: "M2 9h20" }]
    ]
  ];

  const Ghost = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 10h.01" }],
      ["path", { d: "M15 10h.01" }],
      ["path", { d: "M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" }]
    ]
  ];

  const Gift = [
    "svg",
    defaultAttributes,
    [
      ["rect", { x: "3", y: "8", width: "18", height: "4", rx: "1" }],
      ["path", { d: "M12 8v13" }],
      ["path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }],
      [
        "path",
        { d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" }
      ]
    ]
  ];

  const GitBranchPlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 3v12" }],
      ["path", { d: "M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" }],
      ["path", { d: "M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" }],
      ["path", { d: "M15 6a9 9 0 0 0-9 9" }],
      ["path", { d: "M18 15v6" }],
      ["path", { d: "M21 18h-6" }]
    ]
  ];

  const GitBranch = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "6", x2: "6", y1: "3", y2: "15" }],
      ["circle", { cx: "18", cy: "6", r: "3" }],
      ["circle", { cx: "6", cy: "18", r: "3" }],
      ["path", { d: "M18 9a9 9 0 0 1-9 9" }]
    ]
  ];

  const GitCommitHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "3" }],
      ["line", { x1: "3", x2: "9", y1: "12", y2: "12" }],
      ["line", { x1: "15", x2: "21", y1: "12", y2: "12" }]
    ]
  ];

  const GitCommitVertical = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 3v6" }],
      ["circle", { cx: "12", cy: "12", r: "3" }],
      ["path", { d: "M12 15v6" }]
    ]
  ];

  const GitCompareArrows = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "5", cy: "6", r: "3" }],
      ["path", { d: "M12 6h5a2 2 0 0 1 2 2v7" }],
      ["path", { d: "m15 9-3-3 3-3" }],
      ["circle", { cx: "19", cy: "18", r: "3" }],
      ["path", { d: "M12 18H7a2 2 0 0 1-2-2V9" }],
      ["path", { d: "m9 15 3 3-3 3" }]
    ]
  ];

  const GitCompare = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18", cy: "18", r: "3" }],
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }],
      ["path", { d: "M11 18H8a2 2 0 0 1-2-2V9" }]
    ]
  ];

  const GitFork = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "18", r: "3" }],
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["circle", { cx: "18", cy: "6", r: "3" }],
      ["path", { d: "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" }],
      ["path", { d: "M12 12v3" }]
    ]
  ];

  const GitGraph = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "5", cy: "6", r: "3" }],
      ["path", { d: "M5 9v6" }],
      ["circle", { cx: "5", cy: "18", r: "3" }],
      ["path", { d: "M12 3v18" }],
      ["circle", { cx: "19", cy: "6", r: "3" }],
      ["path", { d: "M16 15.7A9 9 0 0 0 19 9" }]
    ]
  ];

  const GitMerge = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18", cy: "18", r: "3" }],
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M6 21V9a9 9 0 0 0 9 9" }]
    ]
  ];

  const GitPullRequestArrow = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "5", cy: "6", r: "3" }],
      ["path", { d: "M5 9v12" }],
      ["circle", { cx: "19", cy: "18", r: "3" }],
      ["path", { d: "m15 9-3-3 3-3" }],
      ["path", { d: "M12 6h5a2 2 0 0 1 2 2v7" }]
    ]
  ];

  const GitPullRequestClosed = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M6 9v12" }],
      ["path", { d: "m21 3-6 6" }],
      ["path", { d: "m21 9-6-6" }],
      ["path", { d: "M18 11.5V15" }],
      ["circle", { cx: "18", cy: "18", r: "3" }]
    ]
  ];

  const GitPullRequestCreateArrow = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "5", cy: "6", r: "3" }],
      ["path", { d: "M5 9v12" }],
      ["path", { d: "m15 9-3-3 3-3" }],
      ["path", { d: "M12 6h5a2 2 0 0 1 2 2v3" }],
      ["path", { d: "M19 15v6" }],
      ["path", { d: "M22 18h-6" }]
    ]
  ];

  const GitPullRequestCreate = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M6 9v12" }],
      ["path", { d: "M13 6h3a2 2 0 0 1 2 2v3" }],
      ["path", { d: "M18 15v6" }],
      ["path", { d: "M21 18h-6" }]
    ]
  ];

  const GitPullRequestDraft = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18", cy: "18", r: "3" }],
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M18 6V5" }],
      ["path", { d: "M18 11v-1" }],
      ["line", { x1: "6", x2: "6", y1: "9", y2: "21" }]
    ]
  ];

  const GitPullRequest = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "18", cy: "18", r: "3" }],
      ["circle", { cx: "6", cy: "6", r: "3" }],
      ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }],
      ["line", { x1: "6", x2: "6", y1: "9", y2: "21" }]
    ]
  ];

  const Github = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
        }
      ],
      ["path", { d: "M9 18c-4.51 2-5-2-7-2" }]
    ]
  ];

  const Gitlab = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z"
        }
      ]
    ]
  ];

  const GlassWater = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"
        }
      ],
      ["path", { d: "M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" }]
    ]
  ];

  const Glasses = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "6", cy: "15", r: "4" }],
      ["circle", { cx: "18", cy: "15", r: "4" }],
      ["path", { d: "M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" }],
      ["path", { d: "M2.5 13 5 7c.7-1.3 1.4-2 3-2" }],
      ["path", { d: "M21.5 13 19 7c-.7-1.3-1.5-2-3-2" }]
    ]
  ];

  const GlobeLock = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15.686 15A14.5 14.5 0 0 1 12 22a14.5 14.5 0 0 1 0-20 10 10 0 1 0 9.542 13" }],
      ["path", { d: "M2 12h8.5" }],
      ["path", { d: "M20 6V4a2 2 0 1 0-4 0v2" }],
      ["rect", { width: "8", height: "5", x: "14", y: "6", rx: "1" }]
    ]
  ];

  const Globe = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
      ["path", { d: "M2 12h20" }]
    ]
  ];

  const Goal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 13V2l8 4-8 4" }],
      ["path", { d: "M20.561 10.222a9 9 0 1 1-12.55-5.29" }],
      ["path", { d: "M8.002 9.997a5 5 0 1 0 8.9 2.02" }]
    ]
  ];

  const Grab = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }],
      ["path", { d: "M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" }],
      ["path", { d: "M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
      ["path", { d: "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" }]
    ]
  ];

  const GraduationCap = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
        }
      ],
      ["path", { d: "M22 10v6" }],
      ["path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }]
    ]
  ];

  const Grape = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M22 5V2l-5.89 5.89" }],
      ["circle", { cx: "16.6", cy: "15.89", r: "3" }],
      ["circle", { cx: "8.11", cy: "7.4", r: "3" }],
      ["circle", { cx: "12.35", cy: "11.65", r: "3" }],
      ["circle", { cx: "13.91", cy: "5.85", r: "3" }],
      ["circle", { cx: "18.15", cy: "10.09", r: "3" }],
      ["circle", { cx: "6.56", cy: "13.2", r: "3" }],
      ["circle", { cx: "10.8", cy: "17.44", r: "3" }],
      ["circle", { cx: "5", cy: "19", r: "3" }]
    ]
  ];

  const Grid2x2Check = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
        }
      ],
      ["path", { d: "m16 19 2 2 4-4" }]
    ]
  ];

  const Grid2x2Plus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
        }
      ],
      ["path", { d: "M16 19h6" }],
      ["path", { d: "M19 22v-6" }]
    ]
  ];

  const Grid2x2X = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"
        }
      ],
      ["path", { d: "m16 16 5 5" }],
      ["path", { d: "m16 21 5-5" }]
    ]
  ];

  const Grid2x2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 3v18" }],
      ["path", { d: "M3 12h18" }],
      ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }]
    ]
  ];

  const Grid3x3 = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M3 9h18" }],
      ["path", { d: "M3 15h18" }],
      ["path", { d: "M9 3v18" }],
      ["path", { d: "M15 3v18" }]
    ]
  ];

  const GripHorizontal = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "9", r: "1" }],
      ["circle", { cx: "19", cy: "9", r: "1" }],
      ["circle", { cx: "5", cy: "9", r: "1" }],
      ["circle", { cx: "12", cy: "15", r: "1" }],
      ["circle", { cx: "19", cy: "15", r: "1" }],
      ["circle", { cx: "5", cy: "15", r: "1" }]
    ]
  ];

  const GripVertical = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "9", cy: "12", r: "1" }],
      ["circle", { cx: "9", cy: "5", r: "1" }],
      ["circle", { cx: "9", cy: "19", r: "1" }],
      ["circle", { cx: "15", cy: "12", r: "1" }],
      ["circle", { cx: "15", cy: "5", r: "1" }],
      ["circle", { cx: "15", cy: "19", r: "1" }]
    ]
  ];

  const Grip = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "5", r: "1" }],
      ["circle", { cx: "19", cy: "5", r: "1" }],
      ["circle", { cx: "5", cy: "5", r: "1" }],
      ["circle", { cx: "12", cy: "12", r: "1" }],
      ["circle", { cx: "19", cy: "12", r: "1" }],
      ["circle", { cx: "5", cy: "12", r: "1" }],
      ["circle", { cx: "12", cy: "19", r: "1" }],
      ["circle", { cx: "19", cy: "19", r: "1" }],
      ["circle", { cx: "5", cy: "19", r: "1" }]
    ]
  ];

  const Group = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 7V5c0-1.1.9-2 2-2h2" }],
      ["path", { d: "M17 3h2c1.1 0 2 .9 2 2v2" }],
      ["path", { d: "M21 17v2c0 1.1-.9 2-2 2h-2" }],
      ["path", { d: "M7 21H5c-1.1 0-2-.9-2-2v-2" }],
      ["rect", { width: "7", height: "5", x: "7", y: "7", rx: "1" }],
      ["rect", { width: "7", height: "5", x: "10", y: "12", rx: "1" }]
    ]
  ];

  const Guitar = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m11.9 12.1 4.514-4.514" }],
      [
        "path",
        {
          d: "M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4z"
        }
      ],
      ["path", { d: "m6 16 2 2" }],
      [
        "path",
        {
          d: "M8.2 9.9C8.7 8.8 9.8 8 11 8c2.8 0 5 2.2 5 5 0 1.2-.8 2.3-1.9 2.8l-.9.4A2 2 0 0 0 12 18a4 4 0 0 1-4 4c-3.3 0-6-2.7-6-6a4 4 0 0 1 4-4 2 2 0 0 0 1.8-1.2z"
        }
      ],
      ["circle", { cx: "11.5", cy: "12.5", r: ".5", fill: "currentColor" }]
    ]
  ];

  const Ham = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M13.144 21.144A7.274 10.445 45 1 0 2.856 10.856" }],
      [
        "path",
        { d: "M13.144 21.144A7.274 4.365 45 0 0 2.856 10.856a7.274 4.365 45 0 0 10.288 10.288" }
      ],
      [
        "path",
        {
          d: "M16.565 10.435 18.6 8.4a2.501 2.501 0 1 0 1.65-4.65 2.5 2.5 0 1 0-4.66 1.66l-2.024 2.025"
        }
      ],
      ["path", { d: "m8.5 16.5-1-1" }]
    ]
  ];

  const Hammer = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" }],
      ["path", { d: "m18 15 4-4" }],
      [
        "path",
        {
          d: "m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"
        }
      ]
    ]
  ];

  const HandCoins = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" }],
      [
        "path",
        {
          d: "m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
        }
      ],
      ["path", { d: "m2 16 6 6" }],
      ["circle", { cx: "16", cy: "9", r: "2.9" }],
      ["circle", { cx: "6", cy: "5", r: "3" }]
    ]
  ];

  const HandHeart = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" }],
      [
        "path",
        {
          d: "m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
        }
      ],
      ["path", { d: "m2 15 6 6" }],
      [
        "path",
        {
          d: "M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"
        }
      ]
    ]
  ];

  const HandHelping = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14" }],
      [
        "path",
        {
          d: "m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"
        }
      ],
      ["path", { d: "m2 13 6 6" }]
    ]
  ];

  const HandMetal = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" }],
      ["path", { d: "M14 11V9a2 2 0 1 0-4 0v2" }],
      ["path", { d: "M10 10.5V5a2 2 0 1 0-4 0v9" }],
      [
        "path",
        {
          d: "m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5"
        }
      ]
    ]
  ];

  const HandPlatter = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 3V2" }],
      [
        "path",
        {
          d: "m15.4 17.4 3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5"
        }
      ],
      ["path", { d: "M2 14h12a2 2 0 0 1 0 4h-2" }],
      ["path", { d: "M4 10h16" }],
      ["path", { d: "M5 10a7 7 0 0 1 14 0" }],
      ["path", { d: "M5 14v6a1 1 0 0 1-1 1H2" }]
    ]
  ];

  const Hand = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
      ["path", { d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }],
      ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" }],
      [
        "path",
        {
          d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
        }
      ]
    ]
  ];

  const Handshake = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m11 17 2 2a1 1 0 1 0 3-3" }],
      [
        "path",
        {
          d: "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"
        }
      ],
      ["path", { d: "m21 3 1 11h-2" }],
      ["path", { d: "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }],
      ["path", { d: "M3 4h8" }]
    ]
  ];

  const HardDriveDownload = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v8" }],
      ["path", { d: "m16 6-4 4-4-4" }],
      ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
      ["path", { d: "M6 18h.01" }],
      ["path", { d: "M10 18h.01" }]
    ]
  ];

  const HardDriveUpload = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m16 6-4-4-4 4" }],
      ["path", { d: "M12 2v8" }],
      ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2" }],
      ["path", { d: "M6 18h.01" }],
      ["path", { d: "M10 18h.01" }]
    ]
  ];

  const HardDrive = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "22", x2: "2", y1: "12", y2: "12" }],
      [
        "path",
        {
          d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
        }
      ],
      ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16" }],
      ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16" }]
    ]
  ];

  const HardHat = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" }],
      ["path", { d: "M14 6a6 6 0 0 1 6 6v3" }],
      ["path", { d: "M4 15v-3a6 6 0 0 1 6-6" }],
      ["rect", { x: "2", y: "15", width: "20", height: "4", rx: "1" }]
    ]
  ];

  const Hash = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "4", x2: "20", y1: "9", y2: "9" }],
      ["line", { x1: "4", x2: "20", y1: "15", y2: "15" }],
      ["line", { x1: "10", x2: "8", y1: "3", y2: "21" }],
      ["line", { x1: "16", x2: "14", y1: "3", y2: "21" }]
    ]
  ];

  const Haze = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m5.2 6.2 1.4 1.4" }],
      ["path", { d: "M2 13h2" }],
      ["path", { d: "M20 13h2" }],
      ["path", { d: "m17.4 7.6 1.4-1.4" }],
      ["path", { d: "M22 17H2" }],
      ["path", { d: "M22 21H2" }],
      ["path", { d: "M16 13a4 4 0 0 0-8 0" }],
      ["path", { d: "M12 5V2.5" }]
    ]
  ];

  const HdmiPort = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M22 9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1l2 2h12l2-2h1a1 1 0 0 0 1-1Z" }
      ],
      ["path", { d: "M7.5 12h9" }]
    ]
  ];

  const Heading1 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }],
      ["path", { d: "M12 18V6" }],
      ["path", { d: "m17 12 3-2v8" }]
    ]
  ];

  const Heading2 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }],
      ["path", { d: "M12 18V6" }],
      ["path", { d: "M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" }]
    ]
  ];

  const Heading3 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }],
      ["path", { d: "M12 18V6" }],
      ["path", { d: "M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" }],
      ["path", { d: "M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" }]
    ]
  ];

  const Heading4 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 18V6" }],
      ["path", { d: "M17 10v3a1 1 0 0 0 1 1h3" }],
      ["path", { d: "M21 10v8" }],
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }]
    ]
  ];

  const Heading5 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }],
      ["path", { d: "M12 18V6" }],
      ["path", { d: "M17 13v-3h4" }],
      ["path", { d: "M17 17.7c.4.2.8.3 1.3.3 1.5 0 2.7-1.1 2.7-2.5S19.8 13 18.3 13H17" }]
    ]
  ];

  const Heading6 = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 12h8" }],
      ["path", { d: "M4 18V6" }],
      ["path", { d: "M12 18V6" }],
      ["circle", { cx: "19", cy: "16", r: "2" }],
      ["path", { d: "M20 10c-2 2-3 3.5-3 6" }]
    ]
  ];

  const Heading = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 12h12" }],
      ["path", { d: "M6 20V4" }],
      ["path", { d: "M18 20V4" }]
    ]
  ];

  const HeadphoneOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 14h-1.343" }],
      ["path", { d: "M9.128 3.47A9 9 0 0 1 21 12v3.343" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M20.414 20.414A2 2 0 0 1 19 21h-1a2 2 0 0 1-2-2v-3" }],
      [
        "path",
        { d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 2.636-6.364" }
      ]
    ]
  ];

  const Headphones = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
        }
      ]
    ]
  ];

  const Headset = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"
        }
      ],
      ["path", { d: "M21 16v2a4 4 0 0 1-4 4h-5" }]
    ]
  ];

  const HeartCrack = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        }
      ],
      ["path", { d: "m12 13-1-1 2-2-3-3 2-2" }]
    ]
  ];

  const HeartHandshake = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        }
      ],
      [
        "path",
        {
          d: "M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"
        }
      ],
      ["path", { d: "m18 15-2-2" }],
      ["path", { d: "m15 18-2-2" }]
    ]
  ];

  const HeartOff = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "2", y1: "2", x2: "22", y2: "22" }],
      ["path", { d: "M16.5 16.5 12 21l-7-7c-1.5-1.45-3-3.2-3-5.5a5.5 5.5 0 0 1 2.14-4.35" }],
      [
        "path",
        {
          d: "M8.76 3.1c1.15.22 2.13.78 3.24 1.9 1.5-1.5 2.74-2 4.5-2A5.5 5.5 0 0 1 22 8.5c0 2.12-1.3 3.78-2.67 5.17"
        }
      ]
    ]
  ];

  const HeartPulse = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        }
      ],
      ["path", { d: "M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" }]
    ]
  ];

  const Heart = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        }
      ]
    ]
  ];

  const Heater = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 8c2-3-2-3 0-6" }],
      ["path", { d: "M15.5 8c2-3-2-3 0-6" }],
      ["path", { d: "M6 10h.01" }],
      ["path", { d: "M6 14h.01" }],
      ["path", { d: "M10 16v-4" }],
      ["path", { d: "M14 16v-4" }],
      ["path", { d: "M18 16v-4" }],
      ["path", { d: "M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" }],
      ["path", { d: "M5 20v2" }],
      ["path", { d: "M19 20v2" }]
    ]
  ];

  const Hexagon = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        }
      ]
    ]
  ];

  const Highlighter = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m9 11-6 6v3h9l3-3" }],
      ["path", { d: "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" }]
    ]
  ];

  const History = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
      ["path", { d: "M3 3v5h5" }],
      ["path", { d: "M12 7v5l4 2" }]
    ]
  ];

  const HopOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10.82 16.12c1.69.6 3.91.79 5.18.85.28.01.53-.09.7-.27" }],
      [
        "path",
        { d: "M11.14 20.57c.52.24 2.44 1.12 4.08 1.37.46.06.86-.25.9-.71.12-1.52-.3-3.43-.5-4.28" }
      ],
      ["path", { d: "M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .7-.26" }],
      [
        "path",
        { d: "M17.99 5.52a20.83 20.83 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-1.17.1-2.5.02-3.9-.25" }
      ],
      ["path", { d: "M20.57 11.14c.24.52 1.12 2.44 1.37 4.08.04.3-.08.59-.31.75" }],
      [
        "path",
        {
          d: "M4.93 4.93a10 10 0 0 0-.67 13.4c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.85.85 0 0 0 .48-.24"
        }
      ],
      [
        "path",
        { d: "M5.52 17.99c1.05.95 2.91 2.42 4.5 3.15a.8.8 0 0 0 1.13-.68c.2-2.34-.33-5.3-1.57-8.28" }
      ],
      ["path", { d: "M8.35 2.68a10 10 0 0 1 9.98 1.58c.43.35.4.96-.12 1.17-1.5.6-4.3.98-6.07 1.05" }],
      ["path", { d: "m2 2 20 20" }]
    ]
  ];

  const Hop = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M10.82 16.12c1.69.6 3.91.79 5.18.85.55.03 1-.42.97-.97-.06-1.27-.26-3.5-.85-5.18" }
      ],
      [
        "path",
        {
          d: "M11.5 6.5c1.64 0 5-.38 6.71-1.07.52-.2.55-.82.12-1.17A10 10 0 0 0 4.26 18.33c.35.43.96.4 1.17-.12.69-1.71 1.07-5.07 1.07-6.71 1.34.45 3.1.9 4.88.62a.88.88 0 0 0 .73-.74c.3-2.14-.15-3.5-.61-4.88"
        }
      ],
      [
        "path",
        { d: "M15.62 16.95c.2.85.62 2.76.5 4.28a.77.77 0 0 1-.9.7 16.64 16.64 0 0 1-4.08-1.36" }
      ],
      [
        "path",
        { d: "M16.13 21.05c1.65.63 3.68.84 4.87.91a.9.9 0 0 0 .96-.96 17.68 17.68 0 0 0-.9-4.87" }
      ],
      [
        "path",
        { d: "M16.94 15.62c.86.2 2.77.62 4.29.5a.77.77 0 0 0 .7-.9 16.64 16.64 0 0 0-1.36-4.08" }
      ],
      [
        "path",
        { d: "M17.99 5.52a20.82 20.82 0 0 1 3.15 4.5.8.8 0 0 1-.68 1.13c-2.33.2-5.3-.32-8.27-1.57" }
      ],
      ["path", { d: "M4.93 4.93 3 3a.7.7 0 0 1 0-1" }],
      [
        "path",
        {
          d: "M9.58 12.18c1.24 2.98 1.77 5.95 1.57 8.28a.8.8 0 0 1-1.13.68 20.82 20.82 0 0 1-4.5-3.15"
        }
      ]
    ]
  ];

  const Hospital = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 6v4" }],
      ["path", { d: "M14 14h-4" }],
      ["path", { d: "M14 18h-4" }],
      ["path", { d: "M14 8h-4" }],
      ["path", { d: "M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" }],
      ["path", { d: "M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" }]
    ]
  ];

  const Hotel = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 22v-6.57" }],
      ["path", { d: "M12 11h.01" }],
      ["path", { d: "M12 7h.01" }],
      ["path", { d: "M14 15.43V22" }],
      ["path", { d: "M15 16a5 5 0 0 0-6 0" }],
      ["path", { d: "M16 11h.01" }],
      ["path", { d: "M16 7h.01" }],
      ["path", { d: "M8 11h.01" }],
      ["path", { d: "M8 7h.01" }],
      ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }]
    ]
  ];

  const Hourglass = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M5 22h14" }],
      ["path", { d: "M5 2h14" }],
      ["path", { d: "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" }],
      ["path", { d: "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" }]
    ]
  ];

  const HousePlug = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 12V8.964" }],
      ["path", { d: "M14 12V8.964" }],
      ["path", { d: "M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z" }],
      [
        "path",
        {
          d: "M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2"
        }
      ]
    ]
  ];

  const HousePlus = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M13.22 2.416a2 2 0 0 0-2.511.057l-7 5.999A2 2 0 0 0 3 10v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.354"
        }
      ],
      ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
      ["path", { d: "M15 6h6" }],
      ["path", { d: "M18 3v6" }]
    ]
  ];

  const HouseWifi = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9.5 13.866a4 4 0 0 1 5 .01" }],
      ["path", { d: "M12 17h.01" }],
      [
        "path",
        {
          d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        }
      ],
      ["path", { d: "M7 10.754a8 8 0 0 1 10 0" }]
    ]
  ];

  const House = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
      [
        "path",
        {
          d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        }
      ]
    ]
  ];

  const IceCreamBowl = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M12 17c5 0 8-2.69 8-6H4c0 3.31 3 6 8 6m-4 4h8m-4-3v3M5.14 11a3.5 3.5 0 1 1 6.71 0" }
      ],
      ["path", { d: "M12.14 11a3.5 3.5 0 1 1 6.71 0" }],
      ["path", { d: "M15.5 6.5a3.5 3.5 0 1 0-7 0" }]
    ]
  ];

  const IceCreamCone = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" }],
      ["path", { d: "M17 7A5 5 0 0 0 7 7" }],
      ["path", { d: "M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" }]
    ]
  ];

  const IdCard = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 10h2" }],
      ["path", { d: "M16 14h2" }],
      ["path", { d: "M6.17 15a3 3 0 0 1 5.66 0" }],
      ["circle", { cx: "9", cy: "11", r: "2" }],
      ["rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }]
    ]
  ];

  const ImageDown = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"
        }
      ],
      ["path", { d: "m14 19 3 3v-5.5" }],
      ["path", { d: "m17 22 3-3" }],
      ["circle", { cx: "9", cy: "9", r: "2" }]
    ]
  ];

  const ImageMinus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" }],
      ["line", { x1: "16", x2: "22", y1: "5", y2: "5" }],
      ["circle", { cx: "9", cy: "9", r: "2" }],
      ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
    ]
  ];

  const ImageOff = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }],
      ["path", { d: "M10.41 10.41a2 2 0 1 1-2.83-2.83" }],
      ["line", { x1: "13.5", x2: "6", y1: "13.5", y2: "21" }],
      ["line", { x1: "18", x2: "21", y1: "12", y2: "15" }],
      ["path", { d: "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" }],
      ["path", { d: "M21 15V5a2 2 0 0 0-2-2H9" }]
    ]
  ];

  const ImagePlay = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m11 16-5 5" }],
      ["path", { d: "M11 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6.5" }],
      [
        "path",
        {
          d: "M15.765 22a.5.5 0 0 1-.765-.424V13.38a.5.5 0 0 1 .765-.424l5.878 3.674a1 1 0 0 1 0 1.696z"
        }
      ],
      ["circle", { cx: "9", cy: "9", r: "2" }]
    ]
  ];

  const ImagePlus = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 5h6" }],
      ["path", { d: "M19 2v6" }],
      ["path", { d: "M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" }],
      ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }],
      ["circle", { cx: "9", cy: "9", r: "2" }]
    ]
  ];

  const ImageUp = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"
        }
      ],
      ["path", { d: "m14 19.5 3-3 3 3" }],
      ["path", { d: "M17 22v-5.5" }],
      ["circle", { cx: "9", cy: "9", r: "2" }]
    ]
  ];

  const ImageUpscale = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M16 3h5v5" }],
      ["path", { d: "M17 21h2a2 2 0 0 0 2-2" }],
      ["path", { d: "M21 12v3" }],
      ["path", { d: "m21 3-5 5" }],
      ["path", { d: "M3 7V5a2 2 0 0 1 2-2" }],
      ["path", { d: "m5 21 4.144-4.144a1.21 1.21 0 0 1 1.712 0L13 19" }],
      ["path", { d: "M9 3h3" }],
      ["rect", { x: "3", y: "11", width: "10", height: "10", rx: "1" }]
    ]
  ];

  const Image = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["circle", { cx: "9", cy: "9", r: "2" }],
      ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]
    ]
  ];

  const Images = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M18 22H4a2 2 0 0 1-2-2V6" }],
      ["path", { d: "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" }],
      ["circle", { cx: "12", cy: "8", r: "2" }],
      ["rect", { width: "16", height: "16", x: "6", y: "2", rx: "2" }]
    ]
  ];

  const Import = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 3v12" }],
      ["path", { d: "m8 11 4 4 4-4" }],
      ["path", { d: "M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" }]
    ]
  ];

  const Inbox = [
    "svg",
    defaultAttributes,
    [
      ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }],
      [
        "path",
        {
          d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
        }
      ]
    ]
  ];

  const IndentDecrease = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 12H11" }],
      ["path", { d: "M21 18H11" }],
      ["path", { d: "M21 6H11" }],
      ["path", { d: "m7 8-4 4 4 4" }]
    ]
  ];

  const IndentIncrease = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 12H11" }],
      ["path", { d: "M21 18H11" }],
      ["path", { d: "M21 6H11" }],
      ["path", { d: "m3 8 4 4-4 4" }]
    ]
  ];

  const IndianRupee = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 3h12" }],
      ["path", { d: "M6 8h12" }],
      ["path", { d: "m6 13 8.5 8" }],
      ["path", { d: "M6 13h3" }],
      ["path", { d: "M9 13c6.667 0 6.667-10 0-10" }]
    ]
  ];

  const Infinity = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"
        }
      ]
    ]
  ];

  const Info = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M12 16v-4" }],
      ["path", { d: "M12 8h.01" }]
    ]
  ];

  const InspectionPanel = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }],
      ["path", { d: "M7 7h.01" }],
      ["path", { d: "M17 7h.01" }],
      ["path", { d: "M7 17h.01" }],
      ["path", { d: "M17 17h.01" }]
    ]
  ];

  const Instagram = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5" }],
      ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }],
      ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5" }]
    ]
  ];

  const Italic = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "19", x2: "10", y1: "4", y2: "4" }],
      ["line", { x1: "14", x2: "5", y1: "20", y2: "20" }],
      ["line", { x1: "15", x2: "9", y1: "4", y2: "20" }]
    ]
  ];

  const IterationCcw = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8" }],
      ["polyline", { points: "16 14 20 18 16 22" }]
    ]
  ];

  const IterationCw = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M4 10c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8H4" }],
      ["polyline", { points: "8 22 4 18 8 14" }]
    ]
  ];

  const JapaneseYen = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 9.5V21m0-11.5L6 3m6 6.5L18 3" }],
      ["path", { d: "M6 15h12" }],
      ["path", { d: "M6 11h12" }]
    ]
  ];

  const Joystick = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M21 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2Z" }],
      ["path", { d: "M6 15v-2" }],
      ["path", { d: "M12 15V9" }],
      ["circle", { cx: "12", cy: "6", r: "3" }]
    ]
  ];

  const Kanban = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M6 5v11" }],
      ["path", { d: "M12 5v6" }],
      ["path", { d: "M18 5v14" }]
    ]
  ];

  const KeyRound = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
        }
      ],
      ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" }]
    ]
  ];

  const KeySquare = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12.4 2.7a2.5 2.5 0 0 1 3.4 0l5.5 5.5a2.5 2.5 0 0 1 0 3.4l-3.7 3.7a2.5 2.5 0 0 1-3.4 0L8.7 9.8a2.5 2.5 0 0 1 0-3.4z"
        }
      ],
      ["path", { d: "m14 7 3 3" }],
      [
        "path",
        {
          d: "m9.4 10.6-6.814 6.814A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814"
        }
      ]
    ]
  ];

  const Key = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" }],
      ["path", { d: "m21 2-9.6 9.6" }],
      ["circle", { cx: "7.5", cy: "15.5", r: "5.5" }]
    ]
  ];

  const KeyboardMusic = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }],
      ["path", { d: "M6 8h4" }],
      ["path", { d: "M14 8h.01" }],
      ["path", { d: "M18 8h.01" }],
      ["path", { d: "M2 12h20" }],
      ["path", { d: "M6 12v4" }],
      ["path", { d: "M10 12v4" }],
      ["path", { d: "M14 12v4" }],
      ["path", { d: "M18 12v4" }]
    ]
  ];

  const KeyboardOff = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M 20 4 A2 2 0 0 1 22 6" }],
      ["path", { d: "M 22 6 L 22 16.41" }],
      ["path", { d: "M 7 16 L 16 16" }],
      ["path", { d: "M 9.69 4 L 20 4" }],
      ["path", { d: "M14 8h.01" }],
      ["path", { d: "M18 8h.01" }],
      ["path", { d: "m2 2 20 20" }],
      ["path", { d: "M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" }],
      ["path", { d: "M6 8h.01" }],
      ["path", { d: "M8 12h.01" }]
    ]
  ];

  const Keyboard = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M10 8h.01" }],
      ["path", { d: "M12 12h.01" }],
      ["path", { d: "M14 8h.01" }],
      ["path", { d: "M16 12h.01" }],
      ["path", { d: "M18 8h.01" }],
      ["path", { d: "M6 8h.01" }],
      ["path", { d: "M7 16h10" }],
      ["path", { d: "M8 12h.01" }],
      ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }]
    ]
  ];

  const LampCeiling = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M12 2v5" }],
      ["path", { d: "M6 7h12l4 9H2l4-9Z" }],
      ["path", { d: "M9.17 16a3 3 0 1 0 5.66 0" }]
    ]
  ];

  const LampDesk = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m14 5-3 3 2 7 8-8-7-2Z" }],
      ["path", { d: "m14 5-3 3-3-3 3-3 3 3Z" }],
      ["path", { d: "M9.5 6.5 4 12l3 6" }],
      ["path", { d: "M3 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H3Z" }]
    ]
  ];

  const LampFloor = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M9 2h6l3 7H6l3-7Z" }],
      ["path", { d: "M12 9v13" }],
      ["path", { d: "M9 22h6" }]
    ]
  ];

  const LampWallDown = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 13h6l3 7H8l3-7Z" }],
      ["path", { d: "M14 13V8a2 2 0 0 0-2-2H8" }],
      ["path", { d: "M4 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4v6Z" }]
    ]
  ];

  const LampWallUp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M11 4h6l3 7H8l3-7Z" }],
      ["path", { d: "M14 11v5a2 2 0 0 1-2 2H8" }],
      ["path", { d: "M4 15h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4v-6Z" }]
    ]
  ];

  const Lamp = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M8 2h8l4 10H4L8 2Z" }],
      ["path", { d: "M12 12v6" }],
      ["path", { d: "M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z" }]
    ]
  ];

  const LandPlot = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m12 8 6-3-6-3v10" }],
      [
        "path",
        {
          d: "m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"
        }
      ],
      ["path", { d: "m6.49 12.85 11.02 6.3" }],
      ["path", { d: "M17.51 12.85 6.5 19.15" }]
    ]
  ];

  const Landmark = [
    "svg",
    defaultAttributes,
    [
      ["line", { x1: "3", x2: "21", y1: "22", y2: "22" }],
      ["line", { x1: "6", x2: "6", y1: "18", y2: "11" }],
      ["line", { x1: "10", x2: "10", y1: "18", y2: "11" }],
      ["line", { x1: "14", x2: "14", y1: "18", y2: "11" }],
      ["line", { x1: "18", x2: "18", y1: "18", y2: "11" }],
      ["polygon", { points: "12 2 20 7 4 7" }]
    ]
  ];

  const Languages = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m5 8 6 6" }],
      ["path", { d: "m4 14 6-6 2-3" }],
      ["path", { d: "M2 5h12" }],
      ["path", { d: "M7 2h1" }],
      ["path", { d: "m22 22-5-10-5 10" }],
      ["path", { d: "M14 18h6" }]
    ]
  ];

  const LaptopMinimalCheck = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M2 20h20" }],
      ["path", { d: "m9 10 2 2 4-4" }],
      ["rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }]
    ]
  ];

  const LaptopMinimal = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "12", x: "3", y: "4", rx: "2", ry: "2" }],
      ["line", { x1: "2", x2: "22", y1: "20", y2: "20" }]
    ]
  ];

  const Laptop = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"
        }
      ]
    ]
  ];

  const LassoSelect = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 22a5 5 0 0 1-2-4" }],
      ["path", { d: "M7 16.93c.96.43 1.96.74 2.99.91" }],
      [
        "path",
        { d: "M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2" }
      ],
      ["path", { d: "M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" }],
      [
        "path",
        {
          d: "M14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14z"
        }
      ]
    ]
  ];

  const Lasso = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M7 22a5 5 0 0 1-2-4" }],
      [
        "path",
        { d: "M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1" }
      ],
      ["path", { d: "M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" }]
    ]
  ];

  const Laugh = [
    "svg",
    defaultAttributes,
    [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" }],
      ["line", { x1: "9", x2: "9.01", y1: "9", y2: "9" }],
      ["line", { x1: "15", x2: "15.01", y1: "9", y2: "9" }]
    ]
  ];

  const Layers2 = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L7.98 12"
        }
      ],
      [
        "path",
        {
          d: "M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z"
        }
      ]
    ]
  ];

  const Layers = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
        }
      ],
      ["path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }],
      ["path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" }]
    ]
  ];

  const LayoutDashboard = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }],
      ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" }]
    ]
  ];

  const LayoutGrid = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }]
    ]
  ];

  const LayoutList = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
      ["path", { d: "M14 4h7" }],
      ["path", { d: "M14 9h7" }],
      ["path", { d: "M14 15h7" }],
      ["path", { d: "M14 20h7" }]
    ]
  ];

  const LayoutPanelLeft = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }]
    ]
  ];

  const LayoutPanelTop = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
      ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }]
    ]
  ];

  const LayoutTemplate = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1" }],
      ["rect", { width: "9", height: "7", x: "3", y: "14", rx: "1" }],
      ["rect", { width: "5", height: "7", x: "16", y: "14", rx: "1" }]
    ]
  ];

  const Leaf = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        { d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" }
      ],
      ["path", { d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" }]
    ]
  ];

  const LeafyGreen = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"
        }
      ],
      ["path", { d: "M2 22 17 7" }]
    ]
  ];

  const Lectern = [
    "svg",
    defaultAttributes,
    [
      [
        "path",
        {
          d: "M16 12h3a2 2 0 0 0 1.902-1.38l1.056-3.333A1 1 0 0 0 21 6H3a1 1 0 0 0-.958 1.287l1.056 3.334A2 2 0 0 0 5 12h3"
        }
      ],
      ["path", { d: "M18 6V3a1 1 0 0 0-1-1h-3" }],
      ["rect", { width: "8", height: "12", x: "8", y: "10", rx: "1" }]
    ]
  ];

  const LetterText = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "M15 12h6" }],
      ["path", { d: "M15 6h6" }],
      ["path", { d: "m3 13 3.553-7.724a.5.5 0 0 1 .894 0L11 13" }],
      ["path", { d: "M3 18h18" }],
      ["path", { d: "M4 11h6" }]
    ]
  ];

  const LibraryBig = [
    "svg",
    defaultAttributes,
    [
      ["rect", { width: "8", height: "18", x: "3", y: "3", rx: "1" }],
      ["path", { d: "M7 3v18" }],
      [
        "path",
        {
          d: "M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"
        }
      ]
    ]
  ];

  const Library = [
    "svg",
    defaultAttributes,
    [
      ["path", { d: "m16 6 4 14" }],
      ["path", { d: "M12 6v14" }],
      ["p
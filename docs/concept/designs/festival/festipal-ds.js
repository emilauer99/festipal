/* @ds-bundle: {"format":4,"namespace":"FestipalDesignSystem_ee8ae6","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"EmptyState","sourcePath":"components/core/EmptyState.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ListRow","sourcePath":"components/core/ListRow.jsx"},{"name":"Photo","sourcePath":"components/core/Photo.jsx"},{"name":"Rating","sourcePath":"components/core/Rating.jsx"},{"name":"Sheet","sourcePath":"components/core/Sheet.jsx"},{"name":"StatTile","sourcePath":"components/core/StatTile.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"ActCard","sourcePath":"components/festival/ActCard.jsx"},{"name":"ActivityCard","sourcePath":"components/festival/ActivityCard.jsx"},{"name":"ArtistRow","sourcePath":"components/festival/ArtistRow.jsx"},{"name":"BalanceCard","sourcePath":"components/festival/BalanceCard.jsx"},{"name":"FestivalCard","sourcePath":"components/festival/FestivalCard.jsx"},{"name":"FriendRow","sourcePath":"components/festival/FriendRow.jsx"},{"name":"NewsCard","sourcePath":"components/festival/NewsCard.jsx"},{"name":"SafeNowCard","sourcePath":"components/festival/SafeNowCard.jsx"},{"name":"SocialRow","sourcePath":"components/festival/SocialRow.jsx"},{"name":"StageStatusCard","sourcePath":"components/festival/StageStatusCard.jsx"},{"name":"SwapListingCard","sourcePath":"components/festival/SwapListingCard.jsx"},{"name":"TimetableSlot","sourcePath":"components/festival/TimetableSlot.jsx"},{"name":"VendorCard","sourcePath":"components/festival/VendorCard.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"FloatingNav","sourcePath":"components/navigation/FloatingNav.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"6fce350498f0","components/core/Badge.jsx":"80dfb8031471","components/core/Button.jsx":"8b484fcfc8f2","components/core/Card.jsx":"1429f350536f","components/core/EmptyState.jsx":"2a182765eec5","components/core/Icon.jsx":"a125f19a3d42","components/core/IconButton.jsx":"a1ab9925eb12","components/core/ListRow.jsx":"432fb8745b4c","components/core/Photo.jsx":"660f131064bc","components/core/Rating.jsx":"f1409cde9a1a","components/core/Sheet.jsx":"62d2460f4bbb","components/core/StatTile.jsx":"c1b6d365d977","components/core/Tag.jsx":"c680128d3567","components/festival/ActCard.jsx":"210b0e95f622","components/festival/ActivityCard.jsx":"a1a1893d3b95","components/festival/ArtistRow.jsx":"c763b214a7a6","components/festival/BalanceCard.jsx":"8722b4800a01","components/festival/FestivalCard.jsx":"1284e59de309","components/festival/FriendRow.jsx":"50e6c78b3b9d","components/festival/NewsCard.jsx":"d4cf9f7c2038","components/festival/SafeNowCard.jsx":"bc12ffdfbbe4","components/festival/SocialRow.jsx":"c32d7f2e5969","components/festival/StageStatusCard.jsx":"7f2bb6181bd1","components/festival/SwapListingCard.jsx":"fa13ebde2afd","components/festival/TimetableSlot.jsx":"726053e1e049","components/festival/VendorCard.jsx":"3eb5d00779e9","components/forms/Checkbox.jsx":"65b82371f757","components/forms/Input.jsx":"62ad6f69122a","components/forms/SegmentedControl.jsx":"d4888f1e56ca","components/forms/Switch.jsx":"a50d24445129","components/navigation/FloatingNav.jsx":"5d7747915205","components/navigation/TopBar.jsx":"d3dc5eaf2b76","ui_kits/app/App.jsx":"ebe2c5867646","ui_kits/app/CrewScreen.jsx":"f16e6e76f42c","ui_kits/app/DashboardScreen.jsx":"77f60b99bc15","ui_kits/app/FriendsScreen.jsx":"41280f6c927a","ui_kits/app/MapScreen.jsx":"f67b32cb610b","ui_kits/app/MyArtistsScreen.jsx":"29b5560bdbb1","ui_kits/app/MyFestivalsScreen.jsx":"0e2ff80ba13f","ui_kits/app/NewsScreen.jsx":"781d2db66636","ui_kits/app/OverviewScreen.jsx":"01ed6cb44217","ui_kits/app/ProfileScreen.jsx":"f05118145323","ui_kits/app/SettingsScreen.jsx":"b93c2f6c1e06","ui_kits/app/SwapScreen.jsx":"7295bf3bdd59","ui_kits/app/TimetableScreen.jsx":"e8ca88a381f3","ui_kits/app/WalletScreen.jsx":"156abe28e75a","ui_kits/app/data.jsx":"b64c81a87509","ui_kits/app/parts.jsx":"c63046074672"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FestipalDesignSystem_ee8ae6 = window.FestipalDesignSystem_ee8ae6 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RING = {
  online: 'var(--brand-primary)',
  away: 'var(--amber-500)',
  none: 'transparent'
};

/** Round user image with initials fallback and presence ring. */
function Avatar({
  name = '',
  src,
  size = 40,
  presence = 'none',
  style,
  ...rest
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      flex: '0 0 auto',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--r-avatar)',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: src ? 'var(--surface-3)' : 'var(--fill-brand-quiet)',
      color: 'var(--green-200)',
      font: 'var(--fw-bold) ' + Math.round(size * 0.36) + 'px/1 var(--font-display)',
      border: presence !== 'none' ? '2px solid ' + RING[presence] : '1px solid var(--border-subtle)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials), presence === 'online' && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: Math.max(9, size * 0.26),
      height: Math.max(9, size * 0.26),
      borderRadius: 999,
      background: 'var(--brand-primary)',
      border: '2px solid var(--bg-app)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The base container: 22px radius, hairline border, soft shadow, no gradient. */
function Card({
  children,
  tone = 'default',
  padding = 16,
  interactive,
  onClick,
  style,
  ...rest
}) {
  const tones = {
    default: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    },
    inset: {
      background: 'var(--surface-inset)',
      border: '1px solid var(--border-subtle)'
    },
    brand: {
      background: 'var(--fill-brand-quiet)',
      border: '1px solid var(--border-brand)'
    },
    secondary: {
      background: 'var(--fill-secondary-quiet)',
      border: '1px solid rgba(90,77,255,.4)'
    },
    outline: {
      background: 'transparent',
      border: '1px solid var(--border-medium)'
    }
  };
  const [down, setDown] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onPointerDown: interactive ? () => setDown(true) : undefined,
    onPointerUp: interactive ? () => setDown(false) : undefined,
    onPointerLeave: interactive ? () => setDown(false) : undefined,
    style: {
      borderRadius: 'var(--r-card)',
      padding,
      boxShadow: 'var(--shadow-2)',
      cursor: interactive ? 'pointer' : undefined,
      transform: down ? 'scale(0.985)' : 'scale(1)',
      transition: 'transform var(--dur-instant) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
      ...(tones[tone] || tones.default),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Thin wrapper over the Lucide icon set (loaded from CDN as window.lucide). */
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  fill = 'none',
  style,
  ...rest
}) {
  const host = React.useRef(null);
  React.useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = '<i data-lucide="' + name + '" width="' + size + '" height="' + size + '" stroke-width="' + strokeWidth + '" fill="' + fill + '"></i>';
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }, [name, size, strokeWidth, fill]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: host,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      width: size,
      height: size,
      color,
      flex: '0 0 auto',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Small status pill: live, bald, bestätigt, offen. */
function Badge({
  children,
  tone = 'neutral',
  icon,
  dot,
  style,
  ...rest
}) {
  const tones = {
    neutral: ['var(--fill-quiet)', 'var(--text-secondary)'],
    brand: ['var(--fill-brand-quiet)', 'var(--green-300)'],
    secondary: ['var(--fill-secondary-quiet)', 'var(--violet-300)'],
    live: ['rgba(255,77,94,.16)', '#FF8792'],
    warning: ['rgba(255,197,61,.16)', 'var(--amber-500)'],
    info: ['rgba(95,180,255,.16)', 'var(--blue-500)']
  };
  const [bg, fg] = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 22,
      padding: '0 9px',
      borderRadius: 'var(--r-pill)',
      background: bg,
      color: fg,
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-label)',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: fg
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 36,
    px: 14,
    font: 'var(--text-label)',
    icon: 16,
    gap: 6
  },
  md: {
    h: 46,
    px: 20,
    font: 'var(--text-body-strong)',
    icon: 18,
    gap: 8
  },
  lg: {
    h: 54,
    px: 26,
    font: 'var(--fw-bold) var(--fs-title-3)/1 var(--font-body)',
    icon: 20,
    gap: 10
  }
};
function visual(variant) {
  switch (variant) {
    case 'secondary':
      return {
        background: 'var(--brand-secondary)',
        color: 'var(--text-on-secondary)',
        border: '1px solid transparent',
        boxShadow: 'var(--glow-secondary)'
      };
    case 'quiet':
      return {
        background: 'var(--fill-quiet)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'none'
      };
    case 'outline':
      return {
        background: 'transparent',
        color: 'var(--brand-primary)',
        border: '1.5px solid var(--border-brand)',
        boxShadow: 'none'
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid transparent',
        boxShadow: 'none'
      };
    case 'danger':
      return {
        background: 'var(--status-danger)',
        color: 'var(--ink-000)',
        border: '1px solid transparent',
        boxShadow: 'none'
      };
    default:
      return {
        background: 'var(--ci-primary)',
        color: 'var(--ci-on-primary)',
        border: '1px solid transparent',
        boxShadow: 'var(--glow-primary)'
      };
  }
}

/** Primary action control. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  disabled,
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const [down, setDown] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onPointerDown: () => setDown(true),
    onPointerUp: () => setDown(false),
    onPointerLeave: () => setDown(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      padding: `0 ${s.px}px`,
      width: fullWidth ? '100%' : undefined,
      font: s.font,
      letterSpacing: 'var(--ls-label)',
      borderRadius: 'var(--r-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transform: down && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
      transition: 'var(--transition-control)',
      WebkitTapHighlightColor: 'transparent',
      ...visual(variant),
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Centred placeholder for empty lists. */
function EmptyState({
  icon = 'sparkles',
  title,
  body,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 8,
      padding: '32px 18px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 52,
      height: 52,
      borderRadius: 'var(--r-pill)',
      background: 'var(--fill-quiet)',
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("h4", {
    style: {
      font: 'var(--text-title-3)'
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      maxWidth: 260
    }
  }, body), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square-ish translucent tap target holding a single glyph. */
function IconButton({
  icon,
  size = 44,
  variant = 'quiet',
  label,
  active,
  onClick,
  style,
  ...rest
}) {
  const [down, setDown] = React.useState(false);
  const fills = {
    quiet: {
      background: 'var(--fill-quiet)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)'
    },
    glass: {
      background: 'var(--glass-fill)',
      color: 'var(--text-primary)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))'
    },
    brand: {
      background: 'var(--ci-primary)',
      color: 'var(--text-on-brand)',
      border: '1px solid transparent',
      boxShadow: 'var(--glow-primary)'
    },
    bare: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    onClick: onClick,
    onPointerDown: () => setDown(true),
    onPointerUp: () => setDown(false),
    onPointerLeave: () => setDown(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      transform: down ? 'scale(var(--press-scale))' : 'scale(1)',
      transition: 'var(--transition-control)',
      WebkitTapHighlightColor: 'transparent',
      ...(fills[variant] || fills.quiet),
      ...(active ? {
        background: 'var(--fill-brand-quiet)',
        color: 'var(--ci-primary)',
        borderColor: 'var(--border-brand)'
      } : null),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.45)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Tappable settings / navigation row. */
function ListRow({
  icon,
  label,
  value,
  description,
  trailing,
  danger,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      minHeight: 'var(--hit-min)',
      padding: '12px 14px',
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      textAlign: 'left',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      color: danger ? 'var(--status-danger)' : 'var(--text-primary)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      background: 'var(--fill-quiet)',
      color: danger ? 'var(--status-danger)' : 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-body-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description)), value && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, value), trailing || /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 17,
    color: "var(--text-muted)"
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/core/Photo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TINTS = [['var(--green-900)', 'var(--green-300)'], ['var(--violet-900)', 'var(--violet-300)'], ['var(--ink-700)', 'var(--ink-100)'], ['var(--violet-800)', 'var(--dusk-300)']];

/**
 * Image surface with a deterministic initials placeholder.
 * No brand photography exists yet — every act/festival image falls back here.
 */
function Photo({
  src,
  name = '',
  ratio = '16 / 9',
  radius = 'var(--r-md)',
  scrim,
  children,
  style,
  ...rest
}) {
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [bg, fg] = TINTS[seed % TINTS.length];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: ratio,
      borderRadius: radius,
      background: bg,
      border: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: fg,
      font: 'var(--fw-black) 34px/1 var(--font-display)',
      letterSpacing: 'var(--ls-display)',
      opacity: 0.5
    }
  }, initials), scrim && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-bottom)'
    }
  }), children && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, children));
}
Object.assign(__ds_scope, { Photo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Photo.jsx", error: String((e && e.message) || e) }); }

// components/core/Rating.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Star rating — read-only display or tappable input. */
function Rating({
  value = 0,
  count,
  size = 14,
  onRate,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 2
    }
  }, [1, 2, 3, 4, 5].map(i => {
    const on = i <= Math.round(value);
    return onRate ? /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      onClick: () => onRate(i),
      "aria-label": i + ' Sterne',
      style: {
        background: 'transparent',
        border: 0,
        padding: 2,
        cursor: 'pointer',
        lineHeight: 0
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "star",
      size: size + 6,
      color: on ? 'var(--amber-500)' : 'var(--border-strong)',
      fill: on ? 'currentColor' : 'none'
    })) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      key: i,
      name: "star",
      size: size,
      color: on ? 'var(--amber-500)' : 'var(--border-strong)',
      fill: on ? 'currentColor' : 'none'
    });
  })), value ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-mono)',
      color: 'var(--text-secondary)'
    }
  }, value.toFixed(1).replace('.', ',')) : null, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "(", count, ")"));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Rating.jsx", error: String((e && e.message) || e) }); }

// components/core/Sheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Bottom sheet — Festipal's only modal pattern. */
function Sheet({
  open,
  title,
  children,
  footer,
  onClose,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 60,
      pointerEvents: open ? 'auto' : 'none'
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(7,8,11,.6)',
      backdropFilter: 'blur(3px)',
      opacity: open ? 1 : 0,
      transition: 'opacity var(--dur-base) var(--ease-out)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--surface-1)',
      borderTopLeftRadius: 'var(--r-sheet)',
      borderTopRightRadius: 'var(--r-sheet)',
      borderTop: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-sheet)',
      padding: '10px var(--screen-pad) calc(var(--sp-8) + env(safe-area-inset-bottom))',
      transform: open ? 'translateY(0)' : 'translateY(102%)',
      transition: 'transform var(--dur-sheet) var(--ease-spring)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 999,
      background: 'var(--border-strong)',
      margin: '0 auto 14px'
    }
  }), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-2)'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Schlie\xDFen",
    size: 34,
    variant: "bare",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", null, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, footer)));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/core/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Compact metric tile used in grids of 2–3. */
function StatTile({
  label,
  value,
  unit,
  icon,
  tone = 'default',
  style,
  ...rest
}) {
  const accent = tone === 'brand' ? 'var(--ci-primary)' : tone === 'secondary' ? 'var(--brand-secondary)' : 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      flex: 1,
      minWidth: 0,
      padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: accent,
      marginBottom: 10,
      minWidth: 0
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-title-1)',
      color: 'var(--text-primary)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, unit)));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Filter / genre chip. Selectable, 34px tall. */
function Tag({
  children,
  selected,
  icon,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-pressed": !!selected,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 34,
      padding: '0 14px',
      flex: '0 0 auto',
      whiteSpace: 'nowrap',
      borderRadius: 'var(--r-chip)',
      cursor: 'pointer',
      font: 'var(--text-label)',
      letterSpacing: 'var(--ls-label)',
      background: selected ? 'var(--ci-primary)' : 'var(--fill-quiet)',
      color: selected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
      border: '1px solid ' + (selected ? 'transparent' : 'var(--border-subtle)'),
      transition: 'var(--transition-control)',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/festival/ActCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Act with artwork — dashboard rails and featured lineup blocks. */
function ActCard({
  artist,
  stage,
  time,
  endTime,
  image,
  live,
  saved,
  genre,
  width,
  onToggleSave,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      width,
      flex: width ? '0 0 auto' : undefined,
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Photo, {
    name: artist,
    src: image,
    ratio: "4 / 3",
    radius: "var(--r-md)",
    scrim: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10,
      display: 'flex',
      gap: 6
    }
  }, live ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "live",
    dot: true
  }, "Live") : /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "neutral"
  }, time)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleSave && onToggleSave();
    },
    "aria-label": saved ? 'Nicht mehr merken' : 'Merken',
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 34,
      height: 34,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      cursor: 'pointer',
      background: 'var(--glass-fill)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      color: saved ? 'var(--ci-primary)' : 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 15,
    fill: saved ? 'currentColor' : 'none'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, artist), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
      font: 'var(--text-body-sm)',
      color: 'var(--ink-100)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "music-4",
    size: 12
  }), stage, endTime ? ' · bis ' + endTime : '', genre ? ' · ' + genre : ''))));
}
Object.assign(__ds_scope, { ActCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/ActCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/ActivityCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Open activity someone in the crowd started — "Wer kommt mit?". */
function ActivityCard({
  title,
  time,
  place,
  host,
  going = [],
  spots,
  joined,
  onJoin,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 14,
      borderRadius: 'var(--r-card)',
      background: 'var(--surface-card)',
      border: '1px solid ' + (joined ? 'var(--border-brand)' : 'var(--border-subtle)'),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)',
      marginBottom: 8
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar-clock",
    size: 13
  }), time), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 13
  }), place)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, going.slice(0, 4).map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: n + i,
    style: {
      marginLeft: i ? -9 : 0,
      borderRadius: 999,
      boxShadow: '0 0 0 2px var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: n,
    size: 26
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, going.length, " dabei", spots ? ' · ' + spots + ' Plätze frei' : ''), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onJoin,
    style: {
      height: 36,
      padding: '0 16px',
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      font: 'var(--text-label)',
      background: joined ? 'var(--fill-brand-quiet)' : 'var(--brand-secondary)',
      color: joined ? 'var(--ci-primary)' : 'var(--text-on-secondary)',
      border: '1px solid ' + (joined ? 'var(--border-brand)' : 'transparent'),
      transition: 'var(--transition-control)'
    }
  }, joined ? 'Dabei' : 'Mitmachen')), host && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "von ", host));
}
Object.assign(__ds_scope, { ActivityCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/ActivityCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/ArtistRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Followed artist and where they play next — "Meine Artists". */
function ArtistRow({
  name,
  genre,
  image,
  nextAt,
  nextFestival,
  upcoming,
  following = true,
  onToggleFollow,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Photo, {
    name: name,
    src: image,
    ratio: "1 / 1",
    radius: "var(--r-sm)",
    style: {
      width: 52,
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), upcoming ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "brand"
  }, upcoming, "\xD7 bald") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, genre, nextFestival ? ' · ' + nextFestival : '', nextAt ? ' · ' + nextAt : '')), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleFollow && onToggleFollow();
    },
    "aria-label": following ? 'Nicht mehr folgen' : 'Folgen',
    style: {
      width: 38,
      height: 38,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      cursor: 'pointer',
      background: following ? 'var(--fill-brand-quiet)' : 'transparent',
      border: '1px solid ' + (following ? 'var(--border-brand)' : 'var(--border-subtle)'),
      color: following ? 'var(--ci-primary)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: following ? 'bell-ring' : 'bell-plus',
    size: 16
  })));
}
Object.assign(__ds_scope, { ArtistRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/ArtistRow.jsx", error: String((e && e.message) || e) }); }

// components/festival/BalanceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Cashless wallet header card: balance, festival, pay + top-up actions. */
function BalanceCard({
  balance = '0,00',
  currency = '€',
  festival,
  chipId,
  onPay,
  onTopUp,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      overflow: 'hidden',
      padding: 20,
      borderRadius: 'var(--r-xl)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border-brand)',
      boxShadow: 'var(--shadow-3)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -90,
      right: -70,
      width: 240,
      height: 240,
      borderRadius: 999,
      background: 'radial-gradient(circle, var(--ci-tint) 0%, transparent 70%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Guthaben", festival ? ' · ' + festival : ''), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "wallet",
    size: 18,
    color: "var(--ci-primary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-display-1)',
      letterSpacing: 'var(--ls-display)'
    }
  }, balance), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-title-2)',
      color: 'var(--text-secondary)'
    }
  }, currency)), chipId && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-mono)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "Band \xB7 ", chipId), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onPay,
    style: {
      flex: 1,
      height: 46,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 'var(--r-pill)',
      border: 0,
      cursor: 'pointer',
      background: 'var(--ci-primary)',
      color: 'var(--text-on-brand)',
      font: 'var(--text-body-strong)',
      boxShadow: 'var(--glow-primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "qr-code",
    size: 18
  }), " Bezahlen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onTopUp,
    style: {
      flex: 1,
      height: 46,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      background: 'var(--fill-quiet)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)',
      font: 'var(--text-body-strong)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 18
  }), " Aufladen"))));
}
Object.assign(__ds_scope, { BalanceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/BalanceCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/FestivalCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Festival tile with countdown — the Home overview's main object. */
function FestivalCard({
  name,
  dates,
  place,
  image,
  countdown,
  ticket,
  status = 'angemeldet',
  friends,
  ratio = '16 / 9',
  onClick,
  style,
  ...rest
}) {
  const tone = status === 'angemeldet' ? 'brand' : status === 'empfohlen' ? 'secondary' : 'neutral';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      overflow: 'hidden',
      borderRadius: 'var(--r-card)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Photo, {
    name: name,
    src: image,
    ratio: ratio,
    radius: "0",
    scrim: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10,
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, status === 'angemeldet' ? 'Angemeldet' : status === 'empfohlen' ? 'Empfohlen' : 'Vorbei'), ticket && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "neutral",
    icon: "qr-code"
  }, ticket)), countdown && /*#__PURE__*/React.createElement("div", {
    className: "fp-glass",
    style: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      display: 'flex',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 'var(--r-pill)'
    }
  }, countdown.map(c => /*#__PURE__*/React.createElement("span", {
    key: c.label,
    style: {
      textAlign: 'center',
      minWidth: 28
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--fw-bold) var(--fs-title-3)/1 var(--font-mono)'
    }
  }, c.value), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, c.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12,
      maxWidth: '62%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-2)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--ink-100)',
      marginTop: 2
    }
  }, dates, place ? ' · ' + place : ''))), friends != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '11px 14px',
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "users",
    size: 14,
    color: "var(--ci-primary)"
  }), friends, " aus deiner Crew sind auch dabei", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-muted)",
    style: {
      marginLeft: 'auto'
    }
  })));
}
Object.assign(__ds_scope, { FestivalCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/FestivalCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/FriendRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Friend in the Crew list with live location context. */
function FriendRow({
  name,
  status,
  at,
  distance,
  presence = 'online',
  action,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      minHeight: 'var(--hit-min)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    size: 38,
    presence: presence
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, at && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 12
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, status || at))), distance && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-mono)',
      color: 'var(--text-secondary)'
    }
  }, distance), action);
}
Object.assign(__ds_scope, { FriendRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/FriendRow.jsx", error: String((e && e.message) || e) }); }

// components/festival/NewsCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** News / update item from the organiser. */
function NewsCard({
  title,
  body,
  time,
  kind = 'info',
  unread,
  image,
  onClick,
  style,
  ...rest
}) {
  const map = {
    info: ['info', 'Info'],
    warning: ['warning', 'Wichtig'],
    lineup: ['brand', 'Lineup']
  };
  const [tone, label] = map[kind] || map.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      overflow: 'hidden',
      borderRadius: 'var(--r-card)',
      background: 'var(--surface-card)',
      border: '1px solid ' + (unread ? 'var(--border-brand)' : 'var(--border-subtle)'),
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), image && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 108,
      background: 'var(--surface-3) center/cover no-repeat',
      backgroundImage: `url(${image})`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, time), unread && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: 'var(--ci-primary)',
      marginLeft: 'auto'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)',
      marginBottom: 4
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 10,
      color: 'var(--text-link)',
      font: 'var(--text-label)'
    }
  }, "Mehr lesen ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 14
  }))));
}
Object.assign(__ds_scope, { NewsCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/NewsCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/SafeNowCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SafeNow emergency entry point on the Lageplan.
 * Layout only — no real SafeNow SDK is wired up here.
 */
function SafeNowCard({
  status = 'Standort geteilt · Sanitäter 140 m',
  onAlarm,
  onInfo,
  compact,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: compact ? 12 : 14,
      borderRadius: 'var(--r-md)',
      background: 'rgba(255,77,94,.10)',
      border: '1px solid rgba(255,77,94,.38)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      background: 'rgba(255,77,94,.18)',
      color: '#FF8792'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "shield-alert",
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "SafeNow Notruf"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Integration")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, status)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAlarm,
    style: {
      height: 38,
      padding: '0 16px',
      borderRadius: 'var(--r-pill)',
      border: 0,
      cursor: 'pointer',
      background: 'var(--status-danger)',
      color: 'var(--ink-000)',
      font: 'var(--text-label)'
    }
  }, "Hilfe"), onInfo && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onInfo,
    "aria-label": "Info",
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      color: 'var(--text-muted)',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "info",
    size: 16
  })));
}
Object.assign(__ds_scope, { SafeNowCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/SafeNowCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/SocialRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICONS = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'music-2',
  youtube: 'youtube',
  spotify: 'audio-lines',
  web: 'globe',
  x: 'twitter'
};

/** Festival / artist social links as a row of quiet round buttons. */
function SocialRow({
  links = [],
  label,
  size = 42,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginRight: 2
    }
  }, label), links.map(l => {
    const key = typeof l === 'string' ? l : l.platform;
    return /*#__PURE__*/React.createElement("a", {
      key: key,
      href: typeof l === 'object' && l.href || '#',
      "aria-label": key,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 999,
        background: 'var(--fill-quiet)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: ICONS[key] || 'globe',
      size: Math.round(size * 0.42)
    }));
  }));
}
Object.assign(__ds_scope, { SocialRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/SocialRow.jsx", error: String((e && e.message) || e) }); }

// components/festival/StageStatusCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** One stage: who plays now, who is next. */
function StageStatusCard({
  stage,
  now,
  nowUntil,
  next,
  nextAt,
  progress = 0,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "music-4",
    size: 14,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, stage), now && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "live",
    dot: true
  }, "Live"))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)',
      marginTop: 8
    }
  }, now || 'Gerade Pause'), now && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 999,
      background: 'var(--fill-quiet)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: Math.min(100, progress) + '%',
      height: '100%',
      background: 'var(--ci-primary)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "bis ", nowUntil)), next && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid var(--border-subtle)',
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 13,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-mono)'
    }
  }, nextAt), " ", next));
}
Object.assign(__ds_scope, { StageStatusCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/StageStatusCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/SwapListingCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Tauschbörse listing: what someone offers and what they want. */
function SwapListingCard({
  title,
  offers,
  wants,
  owner,
  ownerAvatar,
  area,
  kind = 'tausch',
  distance,
  onClick,
  style,
  ...rest
}) {
  const kindTone = kind === 'suche' ? 'secondary' : kind === 'verschenkt' ? 'brand' : 'neutral';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      padding: 14,
      borderRadius: 'var(--r-card)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: kindTone
  }, kind === 'suche' ? 'Suche' : kind === 'verschenkt' ? 'Verschenkt' : 'Tausch'), area && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "tent",
    size: 13
  }), area)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)'
    }
  }, title)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 18,
    color: "var(--text-muted)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '12px 0',
      padding: '10px 12px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Biete"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-primary)',
      marginTop: 3
    }
  }, offers)), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "repeat-2",
    size: 17,
    color: "var(--ci-primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Suche"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-primary)',
      marginTop: 3
    }
  }, wants))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: owner,
    src: ownerAvatar,
    size: 26
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, owner), distance && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginLeft: 'auto'
    }
  }, distance)));
}
Object.assign(__ds_scope, { SwapListingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/SwapListingCard.jsx", error: String((e && e.message) || e) }); }

// components/festival/TimetableSlot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** One act in the timetable list. */
function TimetableSlot({
  time,
  endTime,
  artist,
  stage,
  live,
  saved,
  conflict,
  onToggleSave,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      display: 'flex',
      gap: 14,
      padding: 14,
      borderRadius: 'var(--r-md)',
      cursor: onClick ? 'pointer' : undefined,
      background: 'var(--surface-card)',
      border: '1px solid ' + (live ? 'rgba(255,77,94,.35)' : 'var(--border-subtle)'),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      flex: '0 0 auto',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) var(--fs-title-3)/1.1 var(--font-mono)',
      color: live ? '#FF8792' : 'var(--text-primary)'
    }
  }, time), endTime && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, "bis ", endTime)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-title-3)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, artist), live && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "live",
    dot: true
  }, "Live"), conflict && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "warning"
  }, "\xDCberschneidung")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 5,
      color: 'var(--text-muted)',
      font: 'var(--text-body-sm)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "music-4",
    size: 13
  }), " ", stage)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onToggleSave && onToggleSave();
    },
    "aria-label": saved ? 'Aus Merkliste entfernen' : 'Merken',
    style: {
      alignSelf: 'center',
      width: 38,
      height: 38,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      cursor: 'pointer',
      background: saved ? 'var(--fill-brand-quiet)' : 'transparent',
      border: '1px solid ' + (saved ? 'var(--border-brand)' : 'var(--border-subtle)'),
      color: saved ? 'var(--ci-primary)' : 'var(--text-muted)',
      transition: 'var(--transition-control)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 17
  })));
}
Object.assign(__ds_scope, { TimetableSlot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/TimetableSlot.jsx", error: String((e && e.message) || e) }); }

// components/festival/VendorCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Rated stand / bar / foodtruck on the Lageplan. */
function VendorCard({
  name,
  kind,
  rating,
  ratingCount,
  distance,
  wait,
  cashless = true,
  tags = [],
  onRate,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    style: {
      padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, kind, distance ? ' · ' + distance : '')), wait && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: wait.startsWith('0') || parseInt(wait, 10) <= 5 ? 'brand' : 'warning'
  }, wait, " Wartezeit")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Rating, {
    value: rating,
    count: ratingCount
  }), cashless && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "wallet",
    size: 13
  }), "Cashless"), tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "\xB7 ", t))), onRate && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Wie war's?"), /*#__PURE__*/React.createElement(__ds_scope.Rating, {
    onRate: onRate,
    style: {
      marginLeft: 'auto'
    }
  })));
}
Object.assign(__ds_scope, { VendorCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/festival/VendorCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square checkbox, also used as a radio when `round`. */
function Checkbox({
  checked,
  onChange,
  label,
  round,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      minHeight: 'var(--hit-min)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      width: 22,
      height: 22,
      borderRadius: round ? 999 : 'var(--r-xs)',
      background: checked ? 'var(--ci-primary)' : 'transparent',
      border: '1.5px solid ' + (checked ? 'transparent' : 'var(--border-strong)'),
      color: 'var(--text-on-brand)',
      transition: 'var(--transition-control)'
    }
  }, checked && (round ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: 'var(--text-on-brand)'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    strokeWidth: 3
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Single-line text field. */
function Input({
  label,
  value,
  placeholder,
  icon,
  type = 'text',
  hint,
  error,
  onChange,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const ring = error ? 'var(--status-danger)' : focus ? 'var(--ci-primary)' : 'var(--border-subtle)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-label)',
      color: 'var(--text-secondary)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 48,
      padding: '0 14px',
      background: 'var(--surface-inset)',
      border: '1.5px solid ' + ring,
      borderRadius: 'var(--r-control)',
      transition: 'border-color var(--dur-fast) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 0,
      outline: 'none',
      font: 'var(--text-body)',
      color: 'var(--text-primary)'
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-body-sm)',
      color: error ? 'var(--status-danger)' : 'var(--text-muted)',
      marginTop: 6
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Two-to-four way switch used for day pickers and list modes. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  style,
  ...rest
}) {
  const items = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const idx = Math.max(0, items.findIndex(o => o.value === value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      padding: 3,
      background: 'var(--surface-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--r-pill)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      bottom: 3,
      left: 3,
      width: `calc((100% - 6px) / ${items.length})`,
      transform: `translateX(${idx * 100}%)`,
      background: 'var(--fill-quiet-hover)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--r-pill)',
      transition: 'transform var(--dur-base) var(--ease-spring)'
    }
  }), items.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    onClick: () => onChange && onChange(o.value),
    style: {
      position: 'relative',
      flex: 1,
      height: 34,
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      borderRadius: 'var(--r-pill)',
      font: 'var(--text-label)',
      color: o.value === value ? 'var(--text-primary)' : 'var(--text-muted)',
      transition: 'color var(--dur-fast) var(--ease-out)'
    }
  }, o.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Settings toggle. */
function Switch({
  checked,
  onChange,
  label,
  description,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer',
      ...style
    }
  }, rest), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-body-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description)), /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked),
    style: {
      position: 'relative',
      flex: '0 0 auto',
      width: 48,
      height: 28,
      borderRadius: 'var(--r-pill)',
      background: checked ? 'var(--ci-primary)' : 'var(--fill-quiet-hover)',
      border: '1px solid ' + (checked ? 'transparent' : 'var(--border-subtle)'),
      transition: 'background-color var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 2,
      width: 22,
      height: 22,
      borderRadius: 999,
      background: checked ? 'var(--ink-1000)' : 'var(--ink-100)',
      boxShadow: 'var(--shadow-1)',
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--dur-base) var(--ease-spring)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/FloatingNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_ITEMS = [{
  value: 'home',
  icon: 'home',
  label: 'Start'
}, {
  value: 'map',
  icon: 'map-pin',
  label: 'Lageplan'
}, {
  value: 'timetable',
  icon: 'calendar-clock',
  label: 'Timetable'
}, {
  value: 'wallet',
  icon: 'wallet',
  label: 'Cashless'
}, {
  value: 'social',
  icon: 'users',
  label: 'Crew'
}];

/** The signature floating liquid-glass tab bar. */
function FloatingNav({
  items = DEFAULT_ITEMS,
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: 'absolute',
      left: 'var(--screen-pad)',
      right: 'var(--screen-pad)',
      bottom: 'calc(var(--nav-inset) + env(safe-area-inset-bottom))',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      height: 'var(--nav-h)',
      padding: '0 8px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--glass-fill)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-nav)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      "aria-label": it.label,
      "aria-current": active,
      style: {
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        height: 52,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        borderRadius: 'var(--r-pill)',
        color: active ? 'var(--ci-primary)' : 'var(--text-muted)',
        transition: 'color var(--dur-fast) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        inset: '2px 4px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--ci-tint)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 21,
      strokeWidth: active ? 2.4 : 2
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        font: 'var(--text-micro)',
        letterSpacing: '.01em'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { FloatingNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/FloatingNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Fixed glass header: home button, festival name / screen title, profile. */
function TopBar({
  title,
  subtitle,
  onHome,
  onProfile,
  profileName = 'Du',
  backIcon,
  glass = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: 'var(--topbar-h)',
      padding: '0 var(--screen-pad)',
      background: glass ? 'var(--glass-fill)' : 'transparent',
      backdropFilter: glass ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' : undefined,
      WebkitBackdropFilter: glass ? 'blur(var(--glass-blur)) saturate(var(--glass-saturate))' : undefined,
      borderBottom: glass ? '1px solid var(--border-subtle)' : '1px solid transparent',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: backIcon || 'home',
    label: backIcon ? 'Zurück' : 'Start',
    size: 38,
    variant: "bare",
    onClick: onHome
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)',
      letterSpacing: 'var(--ls-title)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginTop: 1
    }
  }, subtitle)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onProfile,
    "aria-label": "Profil",
    style: {
      background: 'transparent',
      border: 0,
      padding: 0,
      cursor: 'pointer',
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: profileName,
    size: 34
  })));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/App.jsx
try { (() => {
const {
  TopBar,
  FloatingNav,
  IconButton
} = window.FestipalDesignSystem_ee8ae6;

/* Two navigation contexts: the global Festipal shell and a single festival. */
const GLOBAL_NAV = [{
  value: 'overview',
  icon: 'home',
  label: 'Home'
}, {
  value: 'festivals',
  icon: 'tent',
  label: 'Festivals'
}, {
  value: 'artists',
  icon: 'music-4',
  label: 'Artists'
}, {
  value: 'friends',
  icon: 'users',
  label: 'Friends'
}, {
  value: 'settings',
  icon: 'settings',
  label: 'Mehr'
}];
const FESTIVAL_NAV = [{
  value: 'dashboard',
  icon: 'layout-dashboard',
  label: 'Dashboard'
}, {
  value: 'swap',
  icon: 'repeat-2',
  label: 'Tausch'
}, {
  value: 'social',
  icon: 'users',
  label: 'Crew'
}, {
  value: 'timetable',
  icon: 'calendar-clock',
  label: 'Timetable'
}, {
  value: 'map',
  icon: 'map-pin',
  label: 'Lageplan'
}];
function App() {
  const [festival, setFestival] = React.useState(null);
  const [tab, setTab] = React.useState('overview');
  const [acts, setActs] = React.useState(window.ACTS);
  const toggleSave = artist => setActs(prev => prev.map(a => a.artist === artist ? {
    ...a,
    saved: !a.saved
  } : a));
  const openFestival = fest => {
    setFestival(fest);
    setTab('dashboard');
  };
  const goHome = () => {
    setFestival(null);
    setTab('overview');
  };
  const inFestival = !!festival;
  const nav = inFestival ? FESTIVAL_NAV : GLOBAL_NAV;
  const navValue = nav.some(n => n.value === tab) ? tab : null;
  const TITLES = {
    overview: ['Festipal', 'Deine Festival Buddy App'],
    festivals: ['Meine Festivals', null],
    artists: ['Meine Artists', null],
    friends: ['Friends', '5 in deiner Crew'],
    settings: ['Einstellungen', null],
    dashboard: [festival ? festival.name : '', window.FESTIVAL.day],
    map: ['Lageplan', 'SafeNow aktiv'],
    timetable: ['Timetable', festival ? festival.name : ''],
    wallet: ['Cashless', window.FESTIVAL.chip],
    social: ['Aktivitäten & Friends', null],
    swap: ['Tauschbörse', 'Camping & Tickets'],
    news: ['News', festival ? festival.name : 'Festipal'],
    profile: ['Profil', null]
  };
  const [title, subtitle] = TITLES[tab] || TITLES.overview;
  const pushed = ['news', 'profile', 'wallet'].includes(tab);
  const fullBleed = tab === 'map';
  const screen = {
    overview: /*#__PURE__*/React.createElement(window.OverviewScreen, {
      go: setTab,
      openFestival: openFestival
    }),
    festivals: /*#__PURE__*/React.createElement(window.MyFestivalsScreen, {
      openFestival: openFestival
    }),
    artists: /*#__PURE__*/React.createElement(window.MyArtistsScreen, null),
    friends: /*#__PURE__*/React.createElement(window.FriendsScreen, null),
    settings: /*#__PURE__*/React.createElement(window.SettingsScreen, {
      go: setTab
    }),
    dashboard: /*#__PURE__*/React.createElement(window.DashboardScreen, {
      go: setTab,
      acts: acts,
      onToggleSave: toggleSave
    }),
    timetable: /*#__PURE__*/React.createElement(window.TimetableScreen, {
      acts: acts,
      onToggleSave: toggleSave
    }),
    map: /*#__PURE__*/React.createElement(window.MapScreen, {
      go: setTab
    }),
    wallet: /*#__PURE__*/React.createElement(window.WalletScreen, null),
    swap: /*#__PURE__*/React.createElement(window.SwapScreen, null),
    social: /*#__PURE__*/React.createElement(window.CrewScreen, null),
    news: /*#__PURE__*/React.createElement(window.NewsScreen, null),
    profile: /*#__PURE__*/React.createElement(window.ProfileScreen, null)
  }[tab];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 'var(--content-max)',
      height: 900,
      margin: '0 auto',
      overflow: 'hidden',
      background: 'var(--bg-app)',
      borderRadius: 42,
      border: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-3)'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: title,
    subtitle: subtitle,
    profileName: window.FESTIVAL.me,
    backIcon: pushed ? 'arrow-left' : undefined,
    onHome: pushed ? () => setTab(inFestival ? 'dashboard' : 'overview') : goHome,
    onProfile: () => setTab('profile')
  }), fullBleed ? screen : /*#__PURE__*/React.createElement("div", {
    className: "fp-scroll",
    style: {
      position: 'absolute',
      top: 'var(--topbar-h)',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '18px var(--screen-pad) var(--scroll-bottom-pad)'
    }
  }, screen), (tab === 'dashboard' || tab === 'overview') && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      right: 60,
      zIndex: 45
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "News",
    size: 36,
    variant: "bare",
    onClick: () => setTab('news')
  })), /*#__PURE__*/React.createElement(FloatingNav, {
    items: nav,
    value: navValue,
    onChange: setTab
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/CrewScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ActivityCard,
  FriendRow
} = window.FestipalDesignSystem_ee8ae6;
const {
  SegmentedControl
} = window.FestipalDesignSystem_ee8ae6;
const {
  Button,
  IconButton,
  Card,
  Icon,
  EmptyState,
  Sheet,
  Input
} = window.FestipalDesignSystem_ee8ae6;
function CrewScreen() {
  const [tab, setTab] = React.useState('aktivitaeten');
  const [joined, setJoined] = React.useState({});
  const [sheet, setSheet] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: 'aktivitaeten',
      label: 'Aktivitäten'
    }, {
      value: 'crew',
      label: 'Freunde'
    }],
    value: tab,
    onChange: setTab
  }), tab === 'aktivitaeten' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, window.ACTIVITIES.map(a => /*#__PURE__*/React.createElement(ActivityCard, _extends({
    key: a.id
  }, a, {
    joined: !!joined[a.id],
    onJoin: () => setJoined({
      ...joined,
      [a.id]: !joined[a.id]
    })
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "plus",
    fullWidth: true,
    onClick: () => setSheet(true)
  }, "Aktivit\xE4t starten")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "share-2",
    size: 18,
    color: "var(--ci-primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "Standort geteilt bis 03:00"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Nur f\xFCr 5 Personen aus deiner Crew.")))), window.FRIENDS.map(f => /*#__PURE__*/React.createElement(FriendRow, _extends({
    key: f.name
  }, f, {
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "message-circle",
      label: 'Nachricht an ' + f.name,
      size: 36
    })
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    icon: "user-plus",
    fullWidth: true
  }, "Freunde einladen")), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet,
    title: "Aktivit\xE4t starten",
    onClose: () => setSheet(false),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      variant: "secondary",
      onClick: () => setSheet(false)
    }, "Los, fragen")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Was machen wir?",
    placeholder: "Sonnenuntergang am H\xFCgel"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Wann?",
    placeholder: "Heute 20:40"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Wo treffen wir uns?",
    placeholder: "H\xFCgel hinter Camp Nord"
  }))));
}
Object.assign(window, {
  CrewScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/CrewScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DashboardScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ActCard,
  StageStatusCard,
  NewsCard,
  SocialRow,
  FestivalCard
} = window.FestipalDesignSystem_ee8ae6;
const {
  Card,
  Badge,
  Button,
  Icon,
  Photo,
  Tag
} = window.FestipalDesignSystem_ee8ae6;
function DashboardScreen({
  go,
  acts,
  onToggleSave
}) {
  const {
    SectionHead,
    Rail,
    FriendStack
  } = window;
  const live = acts.filter(a => a.live);
  const next = acts.filter(a => a.day === 'Sa' && !a.live).slice(2, 6);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Jetzt live",
    action: "Timetable",
    onAction: () => go('timetable')
  }), /*#__PURE__*/React.createElement(Rail, null, live.concat(next.slice(0, 2)).map(a => /*#__PURE__*/React.createElement(ActCard, _extends({
    key: a.artist
  }, a, {
    width: 252,
    onToggleSave: () => onToggleSave(a.artist),
    onClick: () => go('timetable')
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Alle Stages"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, window.STAGES.map(s => /*#__PURE__*/React.createElement(StageStatusCard, _extends({
    key: s.stage
  }, s, {
    onClick: () => go('timetable')
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Als N\xE4chstes",
    action: "Alle",
    onAction: () => go('timetable')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, next.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.artist,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    name: a.artist,
    ratio: "1 / 1",
    radius: "var(--r-sm)",
    style: {
      width: 48,
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-body)/1 var(--font-mono)'
    }
  }, a.time), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, a.artist)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, a.stage), /*#__PURE__*/React.createElement(FriendStack, {
    names: a.friends
  }))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 17,
    color: "var(--text-muted)"
  }))))), /*#__PURE__*/React.createElement(Card, {
    interactive: true,
    padding: 16,
    onClick: () => go('wallet')
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 42,
      height: 42,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--fill-brand-quiet)',
      color: 'var(--ci-primary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wallet",
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Cashless"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-title-1)'
    }
  }, window.FESTIVAL.balance), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-title-3)',
      color: 'var(--text-secondary)'
    }
  }, "\u20AC"))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    icon: "qr-code",
    onClick: e => {
      e.stopPropagation();
      go('wallet');
    }
  }, "Bezahlen"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "News",
    action: "Alle",
    onAction: () => go('news')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, window.NEWS.slice(0, 2).map(n => /*#__PURE__*/React.createElement(NewsCard, _extends({
    key: n.id
  }, n, {
    onClick: () => go('news')
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Featured am Gel\xE4nde"
  }), /*#__PURE__*/React.createElement(Rail, null, [{
    t: 'Silent Disco',
    s: 'Camp Nord · ab 02:00'
  }, {
    t: 'Sunrise Yoga',
    s: 'Seebühne · So 08:00'
  }, {
    t: 'Flohmarkt',
    s: 'Foodcourt · So 11:00'
  }].map(e => /*#__PURE__*/React.createElement("div", {
    key: e.t,
    style: {
      width: 190,
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    name: e.t,
    ratio: "4 / 3",
    scrim: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)'
    }
  }, e.t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--ink-100)',
      marginTop: 2
    }
  }, e.s))))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Nova Rise folgen"
  }), /*#__PURE__*/React.createElement(SocialRow, {
    links: window.FESTIVAL.social
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 10
    }
  }, "Kurzfristige \xC4nderungen posten wir zuerst hier in der App, dann auf Social.")));
}
Object.assign(window, {
  DashboardScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/FriendsScreen.jsx
try { (() => {
const {
  FriendRow
} = window.FestipalDesignSystem_ee8ae6;
const {
  Input
} = window.FestipalDesignSystem_ee8ae6;
const {
  IconButton,
  Button,
  Card,
  Icon,
  Avatar,
  Badge,
  Sheet
} = window.FestipalDesignSystem_ee8ae6;
function FriendsScreen() {
  const {
    SectionHead
  } = window;
  const [invite, setInvite] = React.useState(false);
  const [handled, setHandled] = React.useState({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Freund oder @name suchen \u2026"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Anfragen"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, window.FRIEND_REQUESTS.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.name,
    size: 38
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, handled[r.name] === 'ok' ? 'Angenommen' : handled[r.name] === 'no' ? 'Abgelehnt' : r.status)), !handled[r.name] && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setHandled({
      ...handled,
      [r.name]: 'ok'
    })
  }, "Annehmen"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "Ablehnen",
    size: 36,
    onClick: () => setHandled({
      ...handled,
      [r.name]: 'no'
    })
  })))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Meine Crew",
    action: "Einladen",
    onAction: () => setInvite(true)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, window.FRIENDS.map(f => /*#__PURE__*/React.createElement(FriendRow, {
    key: f.name,
    name: f.name,
    status: f.status || (f.at ? 'Zuletzt: ' + f.at : 'Nicht am Gelände'),
    presence: f.presence,
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "message-circle",
      label: 'Nachricht an ' + f.name,
      size: 36
    })
  })))), /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 19,
    color: "var(--ci-primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "Gemeinsame Festivals"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "7 aus deiner Crew sind bei Nova Rise, 4 beim Waldrand.")))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "user-plus",
    fullWidth: true,
    onClick: () => setInvite(true)
  }, "Freunde einladen"), /*#__PURE__*/React.createElement(Sheet, {
    open: invite,
    title: "Freunde einladen",
    onClose: () => setInvite(false),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      icon: "share-2",
      onClick: () => setInvite(false)
    }, "Link teilen")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-inset)',
      font: 'var(--text-mono)',
      textAlign: 'center'
    }
  }, "festipal.app/lena-m"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "Wer \xFCber deinen Link kommt, landet direkt in deiner Crew \u2014 Standort teilst du erst danach frei."))));
}
Object.assign(window, {
  FriendsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/FriendsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MapScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SafeNowCard,
  VendorCard
} = window.FestipalDesignSystem_ee8ae6;
const {
  IconButton,
  Tag,
  Badge,
  Icon,
  Button,
  Sheet,
  Rating,
  SegmentedControl
} = window.FestipalDesignSystem_ee8ae6;

/* Schematic plan — the real app renders a vector map tileset. Blocks stand in for it. */
const AREAS = [{
  id: 'main',
  label: 'Mainstage',
  x: 8,
  y: 10,
  w: 52,
  h: 24,
  tone: 'var(--green-800)'
}, {
  id: 'wald',
  label: 'Waldbühne',
  x: 64,
  y: 8,
  w: 30,
  h: 20,
  tone: 'var(--green-900)'
}, {
  id: 'see',
  label: 'Seezelt',
  x: 66,
  y: 34,
  w: 28,
  h: 16,
  tone: 'var(--ink-700)'
}, {
  id: 'food',
  label: 'Foodcourt',
  x: 8,
  y: 40,
  w: 32,
  h: 14,
  tone: 'var(--violet-800)'
}, {
  id: 'camp-n',
  label: 'Camp Nord',
  x: 6,
  y: 60,
  w: 42,
  h: 24,
  tone: 'var(--ink-700)'
}, {
  id: 'camp-s',
  label: 'Camp Süd',
  x: 52,
  y: 58,
  w: 42,
  h: 26,
  tone: 'var(--ink-700)'
}];
const PINS = [{
  id: 'me',
  label: 'Du',
  x: 46,
  y: 52,
  icon: 'user-round',
  me: true
}, {
  id: 'f1',
  label: 'Jonas',
  x: 30,
  y: 24,
  icon: 'user-round'
}, {
  id: 'f2',
  label: 'Sara',
  x: 22,
  y: 70,
  icon: 'user-round'
}, {
  id: 'v1',
  label: '4,3',
  x: 20,
  y: 44,
  icon: 'utensils',
  vendor: 0
}, {
  id: 'v2',
  label: '4,7',
  x: 60,
  y: 46,
  icon: 'utensils',
  vendor: 2
}, {
  id: 'help',
  label: 'Sanitäter',
  x: 84,
  y: 56,
  icon: 'shield-alert',
  help: true
}];
function MapScreen({
  go
}) {
  const [layer, setLayer] = React.useState('Freunde');
  const [sel, setSel] = React.useState(null);
  const [sheet, setSheet] = React.useState(null);
  const [rated, setRated] = React.useState({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--ink-1000)'
    }
  }, AREAS.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    onClick: () => setSel(a),
    style: {
      position: 'absolute',
      left: a.x + '%',
      top: a.y + '%',
      width: a.w + '%',
      height: a.h + '%',
      background: a.tone,
      border: '1px solid ' + (sel && sel.id === a.id ? 'var(--ci-primary)' : 'var(--border-medium)'),
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, a.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: '56%',
      width: '100%',
      height: 3,
      background: 'var(--ink-600)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '49%',
      top: 0,
      width: 3,
      height: '100%',
      background: 'var(--ink-600)'
    }
  }), PINS.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    type: "button",
    onClick: () => p.vendor != null ? setSheet(window.VENDORS[p.vendor]) : p.help ? setSheet('help') : null,
    style: {
      position: 'absolute',
      left: p.x + '%',
      top: p.y + '%',
      transform: 'translate(-50%,-100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      background: 'transparent',
      border: 0,
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: p.me ? 36 : 30,
      height: p.me ? 36 : 30,
      borderRadius: 999,
      background: p.me ? 'var(--ci-primary)' : p.help ? 'rgba(255,77,94,.9)' : 'var(--surface-1)',
      color: p.me ? 'var(--ci-on-primary)' : p.help ? 'var(--ink-000)' : 'var(--text-primary)',
      border: '2px solid ' + (p.me || p.help ? 'transparent' : 'var(--border-strong)'),
      boxShadow: p.me ? 'var(--glow-primary)' : 'var(--shadow-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: p.me ? 18 : 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-micro)',
      color: 'var(--text-secondary)',
      background: 'rgba(7,8,11,.7)',
      padding: '1px 6px',
      borderRadius: 999
    }
  }, p.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'var(--topbar-h)',
      left: 0,
      right: 0,
      height: 92,
      background: 'var(--scrim-top)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "fp-scroll fp-glass",
    style: {
      position: 'absolute',
      top: 'calc(var(--topbar-h) + 12px)',
      left: 'var(--screen-pad)',
      right: 'var(--screen-pad)',
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      padding: 6,
      borderRadius: 'var(--r-pill)'
    }
  }, ['Freunde', 'Bühnen', 'Essen & Bars', 'WC', 'Sanitäter', 'Camping'].map(l => /*#__PURE__*/React.createElement(Tag, {
    key: l,
    selected: layer === l,
    onClick: () => setLayer(l)
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 'var(--screen-pad)',
      bottom: 'calc(var(--scroll-bottom-pad) + 108px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "locate-fixed",
    variant: "glass",
    label: "Auf mich zentrieren"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "share-2",
    variant: "glass",
    label: "Standort teilen"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "star",
    variant: "glass",
    label: "Bewertete St\xE4nde",
    onClick: () => setSheet('vendors')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 'var(--screen-pad)',
      right: 'var(--screen-pad)',
      bottom: 'calc(var(--scroll-bottom-pad) - 8px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SafeNowCard, {
    status: "SafeNow aktiv \xB7 Sanit\xE4ter 140 m",
    onAlarm: () => setSheet('help'),
    onInfo: () => setSheet('help'),
    compact: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "fp-glass",
    style: {
      borderRadius: 'var(--r-lg)',
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 38,
      height: 38,
      borderRadius: 999,
      background: 'var(--ci-tint)',
      color: 'var(--ci-primary)',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: sel ? 'map-pin' : 'users',
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-3)'
    }
  }, sel ? sel.label : '4 Freunde am Gelände'), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, sel ? 'Von dir 3 Min zu Fuß · 240 m' : 'Jonas ist am nächsten — 120 m')), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "quiet",
    onClick: () => go('social')
  }, "Crew")))), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet === 'vendors',
    title: "St\xE4nde & Bars",
    onClose: () => setSheet(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxHeight: 420,
      overflowY: 'auto'
    },
    className: "fp-scroll"
  }, window.VENDORS.map(v => /*#__PURE__*/React.createElement(VendorCard, _extends({
    key: v.name
  }, v, {
    rating: rated[v.name] || v.rating,
    onRate: n => setRated({
      ...rated,
      [v.name]: n
    })
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "Bewertungen kommen von G\xE4sten am Gel\xE4nde. Wartezeiten sch\xE4tzen wir aus den Cashless-Zahlungen der letzten 15 Minuten."))), /*#__PURE__*/React.createElement(Sheet, {
    open: !!sheet && sheet !== 'vendors' && sheet !== 'help',
    title: sheet && sheet.name,
    onClose: () => setSheet(null),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      icon: "map-pin"
    }, "Hin navigieren")
  }, sheet && sheet !== 'vendors' && sheet !== 'help' && /*#__PURE__*/React.createElement(VendorCard, _extends({}, sheet, {
    rating: rated[sheet.name] || sheet.rating,
    onRate: n => setRated({
      ...rated,
      [sheet.name]: n
    })
  }))), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet === 'help',
    title: "SafeNow Notruf",
    onClose: () => setSheet(null),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      variant: "danger",
      icon: "shield-alert"
    }, "Hilfe rufen")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body)'
    }
  }, "Wir schicken deinen Standort an das SafeNow-Team am Gel\xE4nde. Der n\xE4chste Sanit\xE4terpunkt ist 140 m entfernt, beim Foodcourt."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['Standort', 'Camp Nord, Sektor C4'], ['Nächster Punkt', 'Sanitäter Foodcourt · 140 m'], ['Kontakt', 'Lena Mayr · +43 660 …']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)'
    }
  }, v)))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, "Design-Platzhalter: die echte SafeNow-Anbindung ist hier nicht implementiert."))));
}
Object.assign(window, {
  MapScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MapScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MyArtistsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  ArtistRow,
  SocialRow
} = window.FestipalDesignSystem_ee8ae6;
const {
  Input,
  SegmentedControl
} = window.FestipalDesignSystem_ee8ae6;
const {
  Tag,
  Button,
  Card,
  Icon,
  EmptyState,
  Sheet,
  Photo,
  Badge
} = window.FestipalDesignSystem_ee8ae6;
function MyArtistsScreen() {
  const {
    SectionHead
  } = window;
  const [artists, setArtists] = React.useState(window.ARTISTS);
  const [genre, setGenre] = React.useState('Alle');
  const [open, setOpen] = React.useState(null);
  const genres = ['Alle', 'Techno', 'House', 'Indie', 'Pop'];
  const list = artists.filter(a => genre === 'Alle' || a.genre === genre);
  const toggle = name => setArtists(prev => prev.map(a => a.name === name ? {
    ...a,
    following: !a.following
  } : a));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Artist suchen \u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto'
    },
    className: "fp-scroll"
  }, genres.map(g => /*#__PURE__*/React.createElement(Tag, {
    key: g,
    selected: genre === g,
    onClick: () => setGenre(g)
  }, g))), /*#__PURE__*/React.createElement(Card, {
    tone: "secondary",
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell-ring",
    size: 18,
    color: "var(--violet-300)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "Push bei neuen Terminen"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Wir sagen dir, sobald ein Artist auf einem Festival landet.")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Folge ich"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, list.filter(a => a.following).map(a => /*#__PURE__*/React.createElement(ArtistRow, _extends({
    key: a.name
  }, a, {
    onToggleFollow: () => toggle(a.name),
    onClick: () => setOpen(a)
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Vorschl\xE4ge"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, list.filter(a => !a.following).map(a => /*#__PURE__*/React.createElement(ArtistRow, _extends({
    key: a.name
  }, a, {
    onToggleFollow: () => toggle(a.name),
    onClick: () => setOpen(a)
  }))))), !list.length && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "music-4",
    title: "Keine Artists in diesem Genre",
    body: "Probier einen anderen Filter."
  }), /*#__PURE__*/React.createElement(Sheet, {
    open: !!open,
    title: open && open.name,
    onClose: () => setOpen(null),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      icon: "bell-ring"
    }, "Termine abonnieren")
  }, open && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    name: open.name,
    ratio: "16 / 9",
    scrim: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-2)'
    }
  }, open.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--ink-100)'
    }
  }, open.genre))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [[open.nextFestival, open.nextAt], ['Waldrand Open Air', 'Sa 22:00'], ['Hügelfest', 'Fr 23:30']].map(([fe, at], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 12px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-clock",
    size: 15,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--text-body-sm)'
    }
  }, fe), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-mono)',
      color: 'var(--text-secondary)'
    }
  }, at)))), /*#__PURE__*/React.createElement(SocialRow, {
    label: "H\xF6ren",
    links: ['spotify', 'youtube', 'instagram'],
    size: 38
  }))));
}
Object.assign(window, {
  MyArtistsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MyArtistsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MyFestivalsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  FestivalCard
} = window.FestipalDesignSystem_ee8ae6;
const {
  SegmentedControl,
  Input
} = window.FestipalDesignSystem_ee8ae6;
const {
  Button,
  EmptyState,
  Icon,
  Card
} = window.FestipalDesignSystem_ee8ae6;
function MyFestivalsScreen({
  openFestival
}) {
  const [tab, setTab] = React.useState('kommend');
  const list = window.FESTIVALS.filter(f => tab === 'kommend' ? f.status !== 'vorbei' : f.status === 'vorbei');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: 'kommend',
      label: 'Kommend'
    }, {
      value: 'vorbei',
      label: 'Vergangen'
    }],
    value: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Festival suchen \u2026"
  }), tab === 'kommend' && /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 18,
    color: "var(--ci-primary)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "2 Tickets in der Wallet"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Nova Rise und Waldrand sind bereit.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, list.map(f => /*#__PURE__*/React.createElement(FestivalCard, _extends({
    key: f.id
  }, f, {
    onClick: () => openFestival(f)
  })))), !list.length && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "tent",
    title: "Noch keine Festivals",
    body: "Sobald du ein Ticket hinzuf\xFCgst, taucht das Festival hier auf.",
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus"
    }, "Ticket hinzuf\xFCgen")
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    icon: "plus",
    fullWidth: true
  }, "Ticket oder Code hinzuf\xFCgen"));
}
Object.assign(window, {
  MyFestivalsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MyFestivalsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/NewsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  NewsCard,
  SocialRow
} = window.FestipalDesignSystem_ee8ae6;
const {
  Tag
} = window.FestipalDesignSystem_ee8ae6;
function NewsScreen() {
  const [kind, setKind] = React.useState('Alle');
  const map = {
    Wichtig: 'warning',
    Lineup: 'lineup',
    Info: 'info'
  };
  const all = window.NEWS.concat(window.GLOBAL_NEWS);
  const list = all.filter(n => kind === 'Alle' || n.kind === map[kind]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto'
    },
    className: "fp-scroll"
  }, ['Alle', 'Wichtig', 'Lineup', 'Info'].map(k => /*#__PURE__*/React.createElement(Tag, {
    key: k,
    selected: kind === k,
    onClick: () => setKind(k)
  }, k))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, list.map(n => /*#__PURE__*/React.createElement(NewsCard, _extends({
    key: n.id
  }, n)))), /*#__PURE__*/React.createElement(SocialRow, {
    label: "Auch auf Social",
    links: ['instagram', 'tiktok', 'youtube'],
    size: 38
  }));
}
Object.assign(window, {
  NewsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/NewsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/OverviewScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  FestivalCard,
  NewsCard,
  ArtistRow,
  SocialRow
} = window.FestipalDesignSystem_ee8ae6;
const {
  Card,
  Button,
  Icon,
  Badge,
  Photo
} = window.FestipalDesignSystem_ee8ae6;
function OverviewScreen({
  go,
  openFestival
}) {
  const {
    SectionHead,
    Rail
  } = window;
  const mine = window.FESTIVALS.filter(f => f.status === 'angemeldet');
  const rec = window.FESTIVALS.filter(f => f.status === 'empfohlen');
  const nextUp = mine[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 8
    }
  }, "Dein n\xE4chstes Festival"), /*#__PURE__*/React.createElement(FestivalCard, _extends({}, nextUp, {
    ratio: "4 / 3",
    onClick: () => openFestival(nextUp)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    icon: "arrow-right",
    onClick: () => openFestival(nextUp)
  }, "Festival \xF6ffnen"), /*#__PURE__*/React.createElement(Button, {
    variant: "quiet",
    icon: "qr-code",
    onClick: () => openFestival(nextUp)
  }, "Ticket"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Meine Festivals",
    action: "Alle",
    onAction: () => go('festivals')
  }), /*#__PURE__*/React.createElement(Rail, null, mine.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      width: 268,
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement(FestivalCard, _extends({}, f, {
    onClick: () => openFestival(f)
  })))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "K\xF6nnte dir gefallen",
    action: "Mehr",
    onAction: () => go('festivals')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, rec.map(f => /*#__PURE__*/React.createElement(FestivalCard, _extends({
    key: f.id
  }, f, {
    ratio: "21 / 9",
    onClick: () => openFestival(f)
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Deine Artists spielen bald",
    action: "Alle",
    onAction: () => go('artists')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, window.ARTISTS.filter(a => a.following).slice(0, 3).map(a => /*#__PURE__*/React.createElement(ArtistRow, _extends({
    key: a.name
  }, a))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "News"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, window.GLOBAL_NEWS.map(n => /*#__PURE__*/React.createElement(NewsCard, _extends({
    key: n.id
  }, n))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Festipal folgen"
  }), /*#__PURE__*/React.createElement(SocialRow, {
    links: ['instagram', 'tiktok', 'youtube', 'web']
  })));
}
Object.assign(window, {
  OverviewScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/OverviewScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProfileScreen.jsx
try { (() => {
const {
  Switch
} = window.FestipalDesignSystem_ee8ae6;
const {
  Avatar,
  Card,
  Badge,
  Button,
  StatTile,
  Icon
} = window.FestipalDesignSystem_ee8ae6;
function ProfileScreen() {
  const [share, setShare] = React.useState(true);
  const [push, setPush] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: window.FESTIVAL.me,
    size: 72,
    presence: "online"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-1)'
    }
  }, window.FESTIVAL.me), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, "@lenam \xB7 seit 2023 dabei"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    icon: "check"
  }, "Ticket aktiv"), /*#__PURE__*/React.createElement(Badge, null, "Camp Nord \xB7 C4")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    icon: "music-4",
    label: "Acts gemerkt",
    value: 12,
    tone: "brand"
  }), /*#__PURE__*/React.createElement(StatTile, {
    icon: "tent",
    label: "Festivals",
    value: 7
  }), /*#__PURE__*/React.createElement(StatTile, {
    icon: "repeat-2",
    label: "Tausche",
    value: 4,
    tone: "secondary"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-2)',
      marginBottom: 10
    }
  }, "Ticket & Band"), /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 40,
      height: 40,
      borderRadius: 999,
      background: 'var(--fill-quiet)',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "Nova Rise \xB7 Weekend + Camping"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-mono)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, window.FESTIVAL.chip)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "quiet"
  }, "Zeigen")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-2)',
      marginBottom: 10
    }
  }, "Einstellungen"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, [['Standort mit Freunden teilen', 'Nur während des Festivals', share, setShare], ['Push für Lineup-Änderungen', 'Auch wenn du offline warst', push, setPush], ['Auto-Aufladung', 'Lädt 25 € nach, wenn unter 10 € fallen', auto, setAuto]].map(([l, d, v, set]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: l,
    description: d,
    checked: v,
    onChange: set
  }))))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    fullWidth: true
  }, "Abmelden"));
}
Object.assign(window, {
  ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/SettingsScreen.jsx
try { (() => {
const {
  ListRow,
  Switch,
  Avatar,
  Badge,
  Button,
  Icon,
  Card
} = window.FestipalDesignSystem_ee8ae6;
const {
  SafeNowCard
} = window.FestipalDesignSystem_ee8ae6;
function SettingsScreen({
  go
}) {
  const {
    SectionHead
  } = window;
  const [loc, setLoc] = React.useState(true);
  const [push, setPush] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  const [artistPush, setArtistPush] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: window.FESTIVAL.me,
    size: 64,
    presence: "online"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-title-2)'
    }
  }, window.FESTIVAL.me), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, "@lenam \xB7 seit 2023 dabei")), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "quiet"
  }, "Bearbeiten")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Konto"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "user-round",
    label: "Profil & Sichtbarkeit",
    description: "Wer dich finden und sehen darf"
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "ticket",
    label: "Tickets & B\xE4nder",
    value: "2 aktiv",
    onClick: () => go('festivals')
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "wallet",
    label: "Cashless & Zahlungen",
    value: "48,50 \u20AC",
    onClick: () => go('wallet')
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Benachrichtigungen"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "bell",
    label: "Push allgemein",
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: push,
      onChange: setPush
    })
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "music-4",
    label: "Neue Artist-Termine",
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: artistPush,
      onChange: setArtistPush
    })
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "plus",
    label: "Auto-Aufladung",
    description: "L\xE4dt 25 \u20AC nach, wenn unter 10 \u20AC fallen",
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: auto,
      onChange: setAuto
    })
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "Standort & Sicherheit"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "share-2",
    label: "Standort mit Crew teilen",
    description: "Nur w\xE4hrend eines Festivals",
    trailing: /*#__PURE__*/React.createElement(Switch, {
      checked: loc,
      onChange: setLoc
    })
  }), /*#__PURE__*/React.createElement(SafeNowCard, {
    status: "SafeNow verkn\xFCpft \xB7 Notfallkontakt gesetzt"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionHead, {
    title: "App"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    icon: "globe",
    label: "Sprache",
    value: "Deutsch"
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "info",
    label: "\xDCber Festipal",
    value: "1.0.0"
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "x",
    label: "Konto l\xF6schen",
    danger: true
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    fullWidth: true
  }, "Abmelden"));
}
Object.assign(window, {
  SettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/SwapScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SwapListingCard
} = window.FestipalDesignSystem_ee8ae6;
const {
  SegmentedControl,
  Input
} = window.FestipalDesignSystem_ee8ae6;
const {
  Tag,
  Button,
  Sheet,
  EmptyState,
  Card,
  Icon
} = window.FestipalDesignSystem_ee8ae6;
function SwapScreen() {
  const [mode, setMode] = React.useState('alle');
  const [kind, setKind] = React.useState('Alle');
  const [sheet, setSheet] = React.useState(false);
  const list = window.LISTINGS.filter(l => kind === 'Alle' || kind === 'Tausch' && l.kind === 'tausch' || kind === 'Suche' && l.kind === 'suche' || kind === 'Verschenkt' && l.kind === 'verschenkt');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Zelt, Ticket, Shuttle \u2026"
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: 'alle',
      label: 'Alle Angebote'
    }, {
      value: 'nah',
      label: 'In der Nähe'
    }],
    value: mode,
    onChange: setMode
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto'
    },
    className: "fp-scroll"
  }, ['Alle', 'Tausch', 'Suche', 'Verschenkt'].map(k => /*#__PURE__*/React.createElement(Tag, {
    key: k,
    selected: kind === k,
    onClick: () => setKind(k)
  }, k))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, list.map(l => /*#__PURE__*/React.createElement(SwapListingCard, _extends({
    key: l.id
  }, l, {
    onClick: () => setSheet(l)
  })))), !list.length && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "repeat-2",
    title: "Noch keine Tauschangebote",
    body: "Sei die Erste, die hier etwas anbietet.",
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      icon: "plus",
      onClick: () => setSheet('new')
    }, "Angebot erstellen")
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "plus",
    fullWidth: true,
    onClick: () => setSheet('new')
  }, "Eigenes Angebot"), /*#__PURE__*/React.createElement(Sheet, {
    open: !!sheet && sheet !== 'new',
    title: sheet && sheet.title,
    onClose: () => setSheet(false),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      icon: "repeat-2"
    }, "Tausch anfragen")
  }, sheet && sheet !== 'new' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "inset",
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Biete"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      marginTop: 4
    }
  }, sheet.offers), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-micro)',
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginTop: 12
    }
  }, "Suche"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      marginTop: 4
    }
  }, sheet.wants)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "tent",
    size: 14
  }), sheet.area, " \xB7 ", sheet.distance, " zu Fu\xDF"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, "Wir schicken ", sheet.owner, " deine Anfrage. Erst wenn beide zustimmen, tauschen wir die Pl\xE4tze im System."))), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet === 'new',
    title: "Angebot erstellen",
    onClose: () => setSheet(false),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      onClick: () => setSheet(false)
    }, "Ver\xF6ffentlichen")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Titel",
    placeholder: "z. B. Zeltplatz-Nachbarschaft"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Was biete ich?",
    placeholder: "2 Pl\xE4tze Camp S\xFCd"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Was suche ich?",
    placeholder: "2 Pl\xE4tze Camp Nord",
    hint: "Leer lassen, wenn du es verschenkst."
  }))));
}
Object.assign(window, {
  SwapScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/SwapScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TimetableScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SegmentedControl
} = window.FestipalDesignSystem_ee8ae6;
const {
  TimetableSlot,
  Tag,
  EmptyState,
  Button,
  Icon,
  Switch
} = window.FestipalDesignSystem_ee8ae6;
function TimetableScreen({
  acts,
  onToggleSave
}) {
  const {
    FriendStack
  } = window;
  const [day, setDay] = React.useState('Sa');
  const [filter, setFilter] = React.useState('Alle');
  const [mode, setMode] = React.useState('alle');
  const stages = ['Alle', 'Mainstage', 'Waldbühne', 'Seezelt'];
  let list = acts.filter(a => a.day === day && (filter === 'Alle' || a.stage === filter));
  if (mode === 'meine') list = list.filter(a => a.saved);
  if (mode === 'friends') list = list.filter(a => a.friends && a.friends.length);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ['Fr', 'Sa', 'So'],
    value: day,
    onChange: setDay
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: [{
      value: 'alle',
      label: 'Alle'
    }, {
      value: 'meine',
      label: 'Meine'
    }, {
      value: 'friends',
      label: 'Friends'
    }],
    value: mode,
    onChange: setMode
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 2
    },
    className: "fp-scroll"
  }, stages.map(s => /*#__PURE__*/React.createElement(Tag, {
    key: s,
    selected: filter === s,
    onClick: () => setFilter(s)
  }, s))), mode === 'friends' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      borderRadius: 'var(--r-md)',
      background: 'var(--fill-brand-quiet)',
      border: '1px solid var(--border-brand)',
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 15,
    color: "var(--ci-primary)"
  }), "Acts, die deine Crew gemerkt hat."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, list.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.artist
  }, /*#__PURE__*/React.createElement(TimetableSlot, _extends({}, a, {
    onToggleSave: () => onToggleSave(a.artist)
  })), a.friends && a.friends.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px 0 66px'
    }
  }, /*#__PURE__*/React.createElement(FriendStack, {
    names: a.friends,
    label: a.friends.join(', ') + (a.friends.length > 1 ? ' merken' : ' merkt') + ' sich das'
  })) : null))), !list.length && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "calendar-clock",
    title: "Hier ist noch nichts",
    body: mode === 'meine' ? 'Du hast für diesen Tag noch nichts gemerkt.' : 'Für diesen Tag und diese Bühne haben wir noch keine Slots.',
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "quiet",
      onClick: () => {
        setFilter('Alle');
        setMode('alle');
      }
    }, "Filter zur\xFCcksetzen")
  }));
}
Object.assign(window, {
  TimetableScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TimetableScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/WalletScreen.jsx
try { (() => {
const {
  BalanceCard
} = window.FestipalDesignSystem_ee8ae6;
const {
  Card,
  Badge,
  Button,
  Sheet,
  Icon,
  Checkbox
} = window.FestipalDesignSystem_ee8ae6;
function WalletScreen() {
  const [sheet, setSheet] = React.useState(null);
  const [amount, setAmount] = React.useState('25');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement(BalanceCard, {
    balance: window.FESTIVAL.balance,
    festival: "Nova Rise",
    chipId: window.FESTIVAL.chip,
    onPay: () => setSheet('pay'),
    onTopUp: () => setSheet('top')
  }), /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 18,
    color: "var(--ci-primary)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, "Auto-Aufladung bei 10 \u20AC"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-secondary)',
      marginTop: 3
    }
  }, "Wir laden 25 \u20AC nach, damit du in der Bar-Schlange nicht stehen bleibst.")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-2)',
      marginBottom: 10
    }
  }, "Ums\xE4tze"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, window.TX.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.label + t.time,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 34,
      height: 34,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      background: t.positive ? 'var(--fill-brand-quiet)' : 'var(--fill-quiet)',
      color: t.positive ? 'var(--ci-primary)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: t.positive ? 'plus' : 'wallet',
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-strong)'
    }
  }, t.label), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, t.detail, " \xB7 ", t.time)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) var(--fs-body)/1 var(--font-mono)',
      color: t.positive ? 'var(--status-success)' : 'var(--text-primary)'
    }
  }, t.amount, " \u20AC")))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)',
      marginTop: 12
    }
  }, "Restguthaben zahlen wir bis 14 Tage nach dem Festival automatisch zur\xFCck.")), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet === 'pay',
    title: "An der Kassa zeigen",
    onClose: () => setSheet(null),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      variant: "quiet",
      onClick: () => setSheet(null)
    }, "Fertig")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 168,
      height: 168,
      borderRadius: 'var(--r-lg)',
      background: 'var(--ink-000)',
      display: 'grid',
      gridTemplateColumns: 'repeat(9,1fr)',
      gap: 3,
      padding: 14
    }
  }, Array.from({
    length: 81
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      background: i * 7 % 5 < 2 || i % 11 === 0 ? 'var(--ink-1000)' : 'transparent',
      borderRadius: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-mono)'
    }
  }, window.FESTIVAL.chip), /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    icon: "check"
  }, "Guthaben ", window.FESTIVAL.balance, " \u20AC"))), /*#__PURE__*/React.createElement(Sheet, {
    open: sheet === 'top',
    title: "Guthaben aufladen",
    onClose: () => setSheet(null),
    footer: /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      onClick: () => setSheet(null)
    }, amount, ",00 \u20AC aufladen")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, ['15', '25', '50'].map(a => /*#__PURE__*/React.createElement("button", {
    key: a,
    type: "button",
    onClick: () => setAmount(a),
    style: {
      flex: 1,
      height: 62,
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      background: amount === a ? 'var(--fill-brand-quiet)' : 'var(--surface-inset)',
      border: '1.5px solid ' + (amount === a ? 'var(--border-brand)' : 'var(--border-subtle)'),
      color: amount === a ? 'var(--ci-primary)' : 'var(--text-primary)',
      font: 'var(--text-title-2)'
    }
  }, a, " \u20AC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    round: true,
    label: "Apple Pay \xB7 Standard",
    checked: true,
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(Checkbox, {
    round: true,
    label: "Karte \xB7 **** 4417",
    checked: false,
    onChange: () => {}
  }))));
}
Object.assign(window, {
  WalletScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/WalletScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.jsx
try { (() => {
const FESTIVAL = {
  name: 'Nova Rise Festival',
  day: 'Sa · Tag 2',
  me: 'Lena Mayr',
  chip: 'NR-8842-K',
  balance: '48,50',
  social: ['instagram', 'tiktok', 'youtube', 'spotify']
};
const ACTS = [{
  time: '16:00',
  endTime: '17:00',
  artist: 'Halbmond',
  stage: 'Waldbühne',
  day: 'Sa',
  genre: 'Indie',
  friends: ['Sara Vogl']
}, {
  time: '17:30',
  endTime: '18:45',
  artist: 'Tina Kranz',
  stage: 'Seezelt',
  day: 'Sa',
  genre: 'Pop',
  saved: true,
  friends: ['Ida Pfeil', 'Tim Reiter']
}, {
  time: '19:00',
  endTime: '20:15',
  artist: 'Pferdeschau',
  stage: 'Mainstage',
  day: 'Sa',
  genre: 'Rock',
  friends: []
}, {
  time: '21:30',
  endTime: '22:45',
  artist: 'Kellerkind',
  stage: 'Mainstage',
  day: 'Sa',
  genre: 'Techno',
  live: true,
  saved: true,
  friends: ['Jonas Klar', 'Sara Vogl', 'Tim Reiter']
}, {
  time: '23:00',
  endTime: '00:15',
  artist: 'Mira Fluss',
  stage: 'Waldbühne',
  day: 'Sa',
  genre: 'House',
  conflict: true,
  saved: true,
  friends: ['Ida Pfeil']
}, {
  time: '00:30',
  endTime: '02:00',
  artist: 'Nachtschicht b2b Oma',
  stage: 'Seezelt',
  day: 'Sa',
  genre: 'Techno',
  friends: ['Jonas Klar']
}, {
  time: '15:00',
  endTime: '16:00',
  artist: 'Frühstückschor',
  stage: 'Seezelt',
  day: 'So',
  genre: 'Chor',
  friends: []
}, {
  time: '18:00',
  endTime: '19:30',
  artist: 'Vier Farben',
  stage: 'Mainstage',
  day: 'So',
  genre: 'Indie',
  saved: true,
  friends: ['Sara Vogl', 'Milan Berg']
}, {
  time: '14:00',
  endTime: '15:00',
  artist: 'Soundcheck offen',
  stage: 'Mainstage',
  day: 'Fr',
  genre: 'Open',
  friends: []
}];
const STAGES = [{
  stage: 'Mainstage',
  now: 'Kellerkind',
  nowUntil: '22:45',
  progress: 62,
  next: 'Vier Farben',
  nextAt: '23:15'
}, {
  stage: 'Waldbühne',
  now: 'Halbmond',
  nowUntil: '22:20',
  progress: 41,
  next: 'Mira Fluss',
  nextAt: '23:00'
}, {
  stage: 'Seezelt',
  next: 'Nachtschicht b2b Oma',
  nextAt: '00:30'
}, {
  stage: 'Camp Stage',
  now: 'Offene Bühne',
  nowUntil: '23:30',
  progress: 18,
  next: 'Sara & Band',
  nextAt: '23:45'
}];
const NEWS = [{
  id: 1,
  kind: 'warning',
  time: 'vor 20 Min',
  unread: true,
  title: 'Gewitter ab 18 Uhr',
  body: 'Die Mainstage pausiert kurz. Geh bitte zurück zu den Zelten — wir melden uns, sobald es weitergeht.'
}, {
  id: 2,
  kind: 'lineup',
  time: 'vor 2 Std',
  unread: true,
  title: 'Kellerkind spielt eine Stunde länger',
  body: 'Aus dem 60-Minuten-Set werden 75. Der Rest vom Samstag verschiebt sich um 15 Minuten.'
}, {
  id: 3,
  kind: 'info',
  time: 'heute, 09:15',
  title: 'Wasserstellen bei C4 offen',
  body: 'Neue Trinkwasserstelle zwischen Camp Nord und dem Foodcourt. Flasche mitnehmen, Becher gibt es keine.'
}];
const GLOBAL_NEWS = [{
  id: 11,
  kind: 'lineup',
  time: 'vor 1 Std',
  unread: true,
  title: 'Kellerkind spielt vier Festivals im August',
  body: 'Nova Rise, Waldrand, Donaubeat und Hügelfest — alle Termine liegen jetzt in deinen Artists.'
}, {
  id: 12,
  kind: 'info',
  time: 'gestern',
  title: 'Cashless jetzt auf 12 Festivals',
  body: 'Dein Festipal-Guthaben funktioniert ab dieser Saison auch am Waldrand und beim Hügelfest.'
}];
const FRIENDS = [{
  name: 'Jonas Klar',
  at: 'Mainstage',
  distance: '120 m',
  presence: 'online'
}, {
  name: 'Ida Pfeil',
  status: 'Schläft noch im Zelt',
  distance: '450 m',
  presence: 'away'
}, {
  name: 'Tim Reiter',
  at: 'Foodcourt',
  distance: '210 m',
  presence: 'online'
}, {
  name: 'Sara Vogl',
  at: 'Camp Nord · C4',
  distance: '80 m',
  presence: 'online'
}, {
  name: 'Milan Berg',
  status: 'Kommt Samstag 14 Uhr an',
  presence: 'none'
}];
const FRIEND_REQUESTS = [{
  name: 'Nora Berger',
  status: 'Kennt dich vom Waldrand 2025'
}, {
  name: 'Elias Prem',
  status: '3 gemeinsame Freunde'
}];
const ACTIVITIES = [{
  id: 1,
  title: 'Sonnenuntergang am Hügel',
  time: 'Heute 20:40',
  place: 'Hügel hinter Camp Nord',
  host: 'Tim Reiter',
  going: ['Jonas Klar', 'Ida Pfeil', 'Sara Vogl'],
  spots: 5
}, {
  id: 2,
  title: 'Frühstück & Kaffee kochen',
  time: 'Morgen 09:30',
  place: 'Camp Süd · S2',
  host: 'Jonas Klar',
  going: ['Sara Vogl', 'Milan Berg'],
  spots: 3
}, {
  id: 3,
  title: 'Gemeinsam zu Mira Fluss',
  time: 'Heute 22:50',
  place: 'Treffpunkt Waldbühne links',
  host: 'Lena Mayr',
  going: ['Ida Pfeil'],
  spots: 8
}];
const LISTINGS = [{
  id: 1,
  kind: 'tausch',
  title: 'Zeltplatz-Nachbarschaft',
  offers: '2 Plätze Camp Süd',
  wants: '2 Plätze Camp Nord',
  owner: 'Jonas Klar',
  area: 'Camp Süd · S2',
  distance: '6 Min'
}, {
  id: 2,
  kind: 'suche',
  title: 'Shuttle-Ticket Sonntag früh',
  offers: '15 € oder 2 Bier',
  wants: 'Shuttle 07:30 Richtung Bahnhof',
  owner: 'Ida Pfeil',
  area: 'Camp Nord · C1',
  distance: '3 Min'
}, {
  id: 3,
  kind: 'verschenkt',
  title: 'Halber Sack Grillkohle',
  offers: 'Kohle + Anzünder',
  wants: 'Nichts, einfach abholen',
  owner: 'Sara Vogl',
  area: 'Camp Nord · C4',
  distance: '2 Min'
}, {
  id: 4,
  kind: 'tausch',
  title: 'Camping-Upgrade',
  offers: 'Green Camping Stellplatz',
  wants: 'Standard + 30 €',
  owner: 'Milan Berg',
  area: 'Green Camping · G7',
  distance: '11 Min'
}];
const TX = [{
  label: 'Bar Waldbühne',
  detail: '2× Radler',
  amount: '−9,00',
  time: '21:04'
}, {
  label: 'Foodcourt · Kaskrainer',
  detail: 'Wurst mit Senf',
  amount: '−6,50',
  time: '19:48'
}, {
  label: 'Aufladung',
  detail: 'Apple Pay',
  amount: '+40,00',
  time: '17:12',
  positive: true
}, {
  label: 'Merch Container',
  detail: 'Shirt Nova Rise',
  amount: '−28,00',
  time: '15:33'
}];
const VENDORS = [{
  name: 'Kaskrainer Kurt',
  kind: 'Foodtruck',
  rating: 4.3,
  ratingCount: 128,
  distance: '90 m',
  wait: '4 Min',
  tags: ['vegetarisch']
}, {
  name: 'Bar Waldbühne',
  kind: 'Bar',
  rating: 3.8,
  ratingCount: 214,
  distance: '140 m',
  wait: '11 Min'
}, {
  name: 'Curry Sisters',
  kind: 'Foodtruck',
  rating: 4.7,
  ratingCount: 96,
  distance: '210 m',
  wait: '6 Min',
  tags: ['vegan']
}, {
  name: 'Merch Container',
  kind: 'Merch',
  rating: 4.0,
  ratingCount: 41,
  distance: '260 m'
}];
const FESTIVALS = [{
  id: 'nova',
  name: 'Nova Rise',
  dates: '31. Juli – 2. Aug 2026',
  place: 'Wiesen',
  status: 'angemeldet',
  ticket: 'Weekend + Camping',
  friends: 7,
  countdown: [{
    value: '04',
    label: 'Tage'
  }, {
    value: '11',
    label: 'Std'
  }, {
    value: '38',
    label: 'Min'
  }]
}, {
  id: 'waldrand',
  name: 'Waldrand Open Air',
  dates: '21. – 23. Aug 2026',
  place: 'Mühlviertel',
  status: 'angemeldet',
  ticket: 'Weekend',
  friends: 4,
  countdown: [{
    value: '26',
    label: 'Tage'
  }, {
    value: '03',
    label: 'Std'
  }]
}, {
  id: 'donaubeat',
  name: 'Donaubeat',
  dates: '11. – 12. Sep 2026',
  place: 'Linz',
  status: 'empfohlen',
  friends: 2
}, {
  id: 'huegel',
  name: 'Hügelfest',
  dates: '25. – 27. Sep 2026',
  place: 'Steiermark',
  status: 'empfohlen',
  friends: 1
}, {
  id: 'nova25',
  name: 'Nova Rise 2025',
  dates: '1. – 3. Aug 2025',
  place: 'Wiesen',
  status: 'vorbei'
}, {
  id: 'wald25',
  name: 'Waldrand 2025',
  dates: '22. – 24. Aug 2025',
  place: 'Mühlviertel',
  status: 'vorbei'
}];
const ARTISTS = [{
  name: 'Kellerkind',
  genre: 'Techno',
  nextFestival: 'Nova Rise',
  nextAt: 'Sa 21:30',
  upcoming: 4,
  following: true
}, {
  name: 'Mira Fluss',
  genre: 'House',
  nextFestival: 'Nova Rise',
  nextAt: 'Sa 23:00',
  upcoming: 2,
  following: true
}, {
  name: 'Vier Farben',
  genre: 'Indie',
  nextFestival: 'Waldrand',
  nextAt: 'Fr 20:00',
  upcoming: 3,
  following: true
}, {
  name: 'Tina Kranz',
  genre: 'Pop',
  nextFestival: 'Donaubeat',
  nextAt: 'Sa 19:00',
  upcoming: 1,
  following: true
}, {
  name: 'Halbmond',
  genre: 'Indie',
  nextFestival: 'Hügelfest',
  nextAt: 'So 17:30',
  following: false
}];
Object.assign(window, {
  FESTIVAL,
  ACTS,
  STAGES,
  NEWS,
  GLOBAL_NEWS,
  FRIENDS,
  FRIEND_REQUESTS,
  ACTIVITIES,
  LISTINGS,
  TX,
  VENDORS,
  FESTIVALS,
  ARTISTS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/parts.jsx
try { (() => {
const {
  Icon,
  Avatar
} = window.FestipalDesignSystem_ee8ae6;
function SectionHead({
  title,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: 'var(--text-title-2)'
    }
  }, title), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      color: 'var(--text-link)',
      font: 'var(--text-label)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3
    }
  }, action, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  })));
}

/** Horizontal scroll rail that bleeds into the screen gutter. */
function Rail({
  children,
  gap = 12
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fp-scroll",
    style: {
      display: 'flex',
      gap,
      overflowX: 'auto',
      margin: '0 calc(-1 * var(--screen-pad))',
      padding: '0 var(--screen-pad)'
    }
  }, children);
}

/** Stacked avatars of friends who saved / joined something. */
function FriendStack({
  names = [],
  size = 22,
  label
}) {
  if (!names.length) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex'
    }
  }, names.slice(0, 3).map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      marginLeft: i ? -7 : 0,
      borderRadius: 999,
      boxShadow: '0 0 0 2px var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: size
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body-sm)',
      color: 'var(--text-muted)'
    }
  }, label || names.length + (names.length === 1 ? ' Freund' : ' Freunde')));
}
Object.assign(window, {
  SectionHead,
  Rail,
  FriendStack
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/parts.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Photo = __ds_scope.Photo;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.ActCard = __ds_scope.ActCard;

__ds_ns.ActivityCard = __ds_scope.ActivityCard;

__ds_ns.ArtistRow = __ds_scope.ArtistRow;

__ds_ns.BalanceCard = __ds_scope.BalanceCard;

__ds_ns.FestivalCard = __ds_scope.FestivalCard;

__ds_ns.FriendRow = __ds_scope.FriendRow;

__ds_ns.NewsCard = __ds_scope.NewsCard;

__ds_ns.SafeNowCard = __ds_scope.SafeNowCard;

__ds_ns.SocialRow = __ds_scope.SocialRow;

__ds_ns.StageStatusCard = __ds_scope.StageStatusCard;

__ds_ns.SwapListingCard = __ds_scope.SwapListingCard;

__ds_ns.TimetableSlot = __ds_scope.TimetableSlot;

__ds_ns.VendorCard = __ds_scope.VendorCard;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.FloatingNav = __ds_scope.FloatingNav;

__ds_ns.TopBar = __ds_scope.TopBar;

})();

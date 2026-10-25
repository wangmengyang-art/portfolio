/* 技遇 · 线性图标 */
(function (root) {
  function wrap(path, extra) {
    return '<svg class="icon ' + (extra || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + '</svg>';
  }

  const icons = {
    arrowUpRight: wrap('<path d="M7 17 17 7"/><path d="M8 7h9v9"/>'),
    arrowRight: wrap('<path d="M4 12h15"/><path d="m14 6 6 6-6 6"/>'),
    arrowLeft: wrap('<path d="M20 12H5"/><path d="m10 18-6-6 6-6"/>'),
    swap: wrap('<path d="M4 8h14"/><path d="m14 4 4 4-4 4"/><path d="M20 16H6"/><path d="m10 20-4-4 4-4"/>'),
    close: wrap('<path d="m6 6 12 12M18 6 6 18"/>'),
    check: wrap('<path d="m5 12.5 4.6 4.6L19 6.8"/>'),
    star: '<svg class="icon icon-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m12 2.8 2.8 5.9 6.4.9-4.6 4.6 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.6l6.4-.9L12 2.8Z"/></svg>',
    starOutline: wrap('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9L12 3.5Z"/>'),
    clock: wrap('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    coin: wrap('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.2"/><path d="M12 9v3l1.8 1.2"/>'),
    shield: wrap('<path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.6-7 9.6-4.1-2-7-5.2-7-9.6V6l7-2.8Z"/><path d="m9 11.8 2.1 2.1 4-4.2"/>'),
    verified: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.5 14.4 5l3.4-.2.6 3.4 3 1.8-1.5 3.1 1.5 3.1-3 1.8-.6 3.4-3.4-.2-2.4 2.5-2.4-2.5-3.4.2-.6-3.4-3-1.8L4 12l-1.5-3.1 3-1.8.6-3.4 3.4.2L12 2.5Zm-1 13.7 5-5.1-1.4-1.4-3.6 3.7-1.7-1.7-1.4 1.5 3.1 3Z"/></svg>',
    edit: wrap('<path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 7.7 2.8 2.8"/>'),
    calendar: wrap('<rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"/><path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2"/>'),
    video: wrap('<rect x="3" y="6" width="12.5" height="12" rx="2"/><path d="m15.5 10 5-3v10l-5-3z"/>'),
    pin: wrap('<path d="M20 10.5c0 5.2-8 10-8 10s-8-4.8-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10.5" r="2.6"/>'),
    message: wrap('<path d="M20.5 11.5a8.5 8.5 0 0 1-12.5 7.6L3 20.5l1.4-4.8A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8 10.5h8M8 14h5"/>'),
    search: wrap('<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/>'),
    chevronDown: wrap('<path d="m6 9 6 6 6-6"/>'),
    plus: wrap('<path d="M12 5v14M5 12h14"/>'),
    sparkle: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2.5c.5 5.2 3 7.7 8.2 8.2-5.2.5-7.7 3-8.2 8.2-.5-5.2-3-7.7-8.2-8.2 5.2-.5 7.7-3 8.2-8.2Z"/><path d="M19 15.5c.2 2.2 1.3 3.3 3.5 3.5-2.2.2-3.3 1.3-3.5 3.5-.2-2.2-1.3-3.3-3.5-3.5 2.2-.2 3.3-1.3 3.5-3.5Z"/></svg>',
    lock: wrap('<rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><path d="M12 14.5v2"/>'),
    users: wrap('<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19.5c.5-3.3 2.6-5.1 5.5-5.1s5 1.8 5.5 5.1"/><path d="M15.5 6.3a3.2 3.2 0 0 1 0 6.2M17 14.7c2.2.4 3.3 2 3.6 4.3"/>'),
    ticket: wrap('<path d="M3.5 8.5V6.8c0-.7.6-1.3 1.3-1.3h14.4c.7 0 1.3.6 1.3 1.3v1.7a2.4 2.4 0 0 0 0 4.8v2.2c0 .7-.6 1.3-1.3 1.3H4.8c-.7 0-1.3-.6-1.3-1.3v-2.2a2.4 2.4 0 0 0 0-4.8Z"/><path d="M12 8v1.5M12 12v1.5M12 16v1.5"/>'),
    quote: wrap('<path d="M10 11.5H5.5c0-3 1.7-5 4.5-5.7"/><path d="M20 11.5h-4.5c0-3 1.7-5 4.5-5.7"/><path d="M5.5 11.5c0 4 1.8 6.2 4.8 6.5M15.5 11.5c0 4 1.8 6.2 4.8 6.5"/>'),
    leaf: wrap('<path d="M20 4C11 4.5 5.5 8.5 4.5 15.5c4.5.8 8.5-1 11.5-5-2 3.8-5 6.4-9.5 7.5"/><path d="M6.5 17.5C12 15 16 10.5 20 4"/>'),
    arrowDown: wrap('<path d="M12 4v15"/><path d="m6 14 6 6 6-6"/>')
  };

  root.SWAP_ICONS = icons;
})(globalThis);

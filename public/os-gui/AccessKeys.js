// & defines access keys (contextual hotkeys) in menus and buttons and form labels, which get underlined in the UI.
// & can be escaped by doubling it, e.g. "&Taskbar && Start Menu" for "Taskbar & Start Menu" with T as the access key.
export const AccessKeys = {
  escape: function (label) {
    return label.replace(/&/g, "&&");
  },
  unescape: function (label) {
    return label.replace(/&&/g, "&");
  },
  indexOf: function (label) {
    // Note: the space is a hack for the search, to find the FIRST ampersand, but not if it's the very first character.
    // To specify the access key for the first character, you can use a parenthetical, like "(&A)BC".
    // This seems to be a quirk/feature of Windows.
    // And since this seems to be intended for menu items, and not labels in general, this is fine.
    // If it were for labels, you'd want to find an ampersand that's not preceded by another ampersand.
    return ` ${label}`.search(/[^&]&[^&\s]/);
  },
  has: function (label) {
    return this.indexOf(label) >= 0;
  },
  get: function (label) {
    const index = this.indexOf(label);
    if (index >= 0) {
      return label.charAt(index + 1).toUpperCase();
    }
    return null;
  },
  remove: function (label) {
    const parentheticalRegex = /\s?\(&[^&]\)/;
    if (parentheticalRegex.test(label)) {
      // e.g. "Properties (&R)" -> "Properties"
      return this.unescape(label.replace(parentheticalRegex, ""));
    }
    return this.toText(label);
  },
  toText: function (label) {
    const index = this.indexOf(label);
    if (index >= 0) {
      return (
        this.unescape(label.substring(0, index)) +
        this.unescape(label.substring(index + 1))
      );
    }
    return this.unescape(label);
  },
  toHTML: function (label) {
    const fragment = this.toFragment(label);
    const dummy = document.createElement("div");
    dummy.appendChild(fragment);
    return dummy.innerHTML;
  },
  toFragment: function (label) {
    const fragment = document.createDocumentFragment();
    const index = this.indexOf(label);
    if (index >= 0) {
      fragment.appendChild(
        document.createTextNode(this.unescape(label.substring(0, index))),
      );
      // a <u> element would be more semantic, but would need CSS to remove the underline from all <u>s
      // and only add it back for this specific case.
      // A class like "menu-hotkey" could be used on a <span>, and the class could apply the underline.
      const span = document.createElement("span");
      span.className = "menu-hotkey"; // you can style this with text-decoration: underline;
      span.appendChild(document.createTextNode(label.charAt(index + 1)));
      fragment.appendChild(span);
      fragment.appendChild(
        document.createTextNode(this.unescape(label.substring(index + 2))),
      );
    } else {
      fragment.appendChild(document.createTextNode(this.unescape(label)));
    }
    return fragment;
  },
};

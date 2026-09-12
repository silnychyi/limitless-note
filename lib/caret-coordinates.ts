const STYLE_PROPS = [
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number,
) {
  const style = window.getComputedStyle(element);
  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");

  const mirrorStyle = mirror.style;
  mirrorStyle.position = "absolute";
  mirrorStyle.visibility = "hidden";
  mirrorStyle.whiteSpace = "pre-wrap";
  mirrorStyle.overflowWrap = "break-word";
  mirrorStyle.top = "0";
  mirrorStyle.left = "-9999px";

  for (const prop of STYLE_PROPS) {
    mirrorStyle[prop] = style[prop];
  }

  mirror.textContent = element.value.slice(0, position);
  const marker = document.createElement("span");
  marker.textContent = element.value.slice(position) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const coordinates = {
    top: marker.offsetTop - element.scrollTop,
    left: marker.offsetLeft - element.scrollLeft,
    height: Number.parseFloat(style.lineHeight) || element.offsetHeight,
  };

  mirror.remove();
  return coordinates;
}

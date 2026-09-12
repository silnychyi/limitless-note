function isHeading(element: Element) {
  return /^H[1-6]$/.test(element.tagName);
}

export function paginateElements(elements: HTMLElement[], pageHeight: number) {
  const pages: HTMLElement[][] = [[]];
  let used = 0;

  const pageHasItems = () => pages[pages.length - 1].length > 0;

  const startPage = () => {
    pages.push([]);
    used = 0;
  };

  const add = (element: HTMLElement) => {
    pages[pages.length - 1].push(element);
    used += Math.ceil(element.getBoundingClientRect().height);
  };

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    const next = elements[index + 1];
    const height = Math.ceil(element.getBoundingClientRect().height);
    const keepWithNext =
      isHeading(element) && next
        ? height + Math.ceil(next.getBoundingClientRect().height)
        : height;

    if (pageHasItems() && used + keepWithNext > pageHeight) {
      startPage();
    }

    add(element);
  }

  return pages.filter((page) => page.length > 0);
}

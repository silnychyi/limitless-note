import { createRoot } from "react-dom/client";
import { MarkdownBody } from "@/components/markdown-body";
import { filenameFromMarkdown } from "@/lib/note-filename";
import { paginateElements } from "@/lib/paginate-blocks";

function waitForImages(root: ParentNode) {
  return Promise.all(
    [...root.querySelectorAll("img")].map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

function ExportTree({ markdown }: { markdown: string }) {
  return (
    <div className="pdf-export">
      <div className="pdf-measure">
        <div className="pdf-sheet">
          <div className="pdf-sheet-body" data-pdf-height="" />
          <p className="pdf-sheet-number">0 / 0</p>
        </div>
        <div className="pdf-measure-body" data-pdf-measure="">
          <MarkdownBody markdown={markdown} />
        </div>
      </div>
      <div className="pdf-stack" data-pdf-sheets="" />
    </div>
  );
}

export async function downloadNotePdf(markdown: string) {
  if (!markdown.trim()) return;

  const host = document.createElement("div");
  host.className = "pdf-export-host";
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<ExportTree markdown={markdown} />);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const measure = host.querySelector("[data-pdf-measure] .note-md");
    const heightBox = host.querySelector("[data-pdf-height]");
    const stack = host.querySelector("[data-pdf-sheets]");
    if (!measure || !heightBox || !stack) return;

    await waitForImages(measure);

    const pageHeight = (heightBox as HTMLElement).clientHeight;
    const groups = paginateElements(
      [...measure.children] as HTMLElement[],
      pageHeight,
    );
    const pages = groups.length ? groups : [[]];

    stack.innerHTML = pages
      .map((group, index) => {
        const html = group.map((block) => block.outerHTML).join("");
        return `<section class="pdf-sheet is-capturing"><div class="pdf-sheet-body note-md">${html}</div><p class="pdf-sheet-number">${index + 1} / ${pages.length}</p></section>`;
      })
      .join("");

    await waitForImages(stack);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const [{ jsPDF }, html2canvas] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const sheets = stack.querySelectorAll<HTMLElement>(".pdf-sheet");

    for (let index = 0; index < sheets.length; index += 1) {
      const canvas = await html2canvas.default(sheets[index], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
    }

    pdf.save(filenameFromMarkdown(markdown));
  } finally {
    root.unmount();
    host.remove();
  }
}

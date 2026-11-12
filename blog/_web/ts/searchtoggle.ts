/**
 * On narrow screens the search box is collapsed behind a button in the top
 * bar. This wires that button up, and makes "/" jump to the search box at
 * any width, opening it first if it is collapsed.
 */
export class SearchToggle {
  private readonly header = document.querySelector<HTMLElement>(
    "#container > header",
  );
  private readonly button =
    document.querySelector<HTMLButtonElement>("#search-toggle");
  private readonly input =
    document.querySelector<HTMLInputElement>("#searchbox");

  public enhance() {
    if (this.header == null || this.button == null || this.input == null) {
      return;
    }
    this.button.hidden = false;
    this.button.addEventListener("click", () =>
      this.isOpen() ? this.close() : this.open(),
    );
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.close();
      }
    });
    document.addEventListener("keydown", (event) => this.onKeydown(event));
  }

  private onKeydown(event: KeyboardEvent) {
    if (
      event.key !== "/" ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.isTyping(event.target)
    ) {
      return;
    }
    // Also stops Firefox's quick find, which "/" would otherwise open.
    event.preventDefault();
    this.open();
  }

  /** Don't steal "/" from anything the reader is typing into. */
  private isTyping(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.closest("input, textarea, select") != null)
    );
  }

  private isOpen(): boolean {
    return this.header!.classList.contains("search-open");
  }

  public open() {
    this.header!.classList.add("search-open");
    this.button!.setAttribute("aria-expanded", "true");
    this.input!.focus();
    this.input!.select();
  }

  private close() {
    this.header!.classList.remove("search-open");
    this.button!.setAttribute("aria-expanded", "false");
    // Hand focus back to the button if it is on screen (narrow layout),
    // otherwise just leave the box.
    if (this.button!.offsetParent != null) {
      this.button!.focus();
    } else {
      this.input!.blur();
    }
  }
}

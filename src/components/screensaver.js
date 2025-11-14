class Screensaver {
  constructor() {
    this.element = null;
    this.active = false;
  }

  show() {
    if (!this.element) {
      this.element = document.createElement('iframe');
      this.element.src = `${import.meta.env.BASE_URL}screensaver/index.html`;
      console.log('Screensaver src:', this.element.src);
      this.element.style.position = 'fixed';
      this.element.style.top = '0';
      this.element.style.left = '0';
      this.element.style.width = '100%';
      this.element.style.height = '100%';
      this.element.style.border = 'none';
      this.element.style.zIndex = '9999';
      document.body.appendChild(this.element);
    }
    this.element.style.display = 'block';
    this.active = true;
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
    this.active = false;
  }
}

export default new Screensaver();

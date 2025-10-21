import { Application } from '../Application.js';

export class AudioConverterApp extends Application {
    constructor(config) {
        super(config);
        this.ffmpeg = FFmpeg.createFFmpeg({ log: true });
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        win.$content.html(`
            <div class="audio-converter-container" style="padding: 10px;">
                <h2>WAV to WebM Converter</h2>
                <p>Select one or more .wav files to convert to .webm format.</p>
                <input type="file" id="wav-file-input" accept=".wav" multiple>
                <button id="convert-button" style="margin-top: 10px;">Convert</button>
                <p id="status-message" style="margin-top: 10px;"></p>
                <div id="download-links" style="margin-top: 10px;"></div>
            </div>
        `);
        return win;
    }

    _onLaunch() {
        this.fileInput = this.win.$content.find('#wav-file-input')[0];
        this.convertButton = this.win.$content.find('#convert-button')[0];
        this.statusMessage = this.win.$content.find('#status-message')[0];
        this.downloadLinksContainer = this.win.$content.find('#download-links')[0];

        this.convertButton.addEventListener('click', () => {
            this.convertFiles();
        });
    }

    async convertFiles() {
        const files = this.fileInput.files;
        if (files.length === 0) {
            this.statusMessage.textContent = 'Please select one or more files.';
            return;
        }

        this.downloadLinksContainer.innerHTML = '';
        this.statusMessage.textContent = 'Loading ffmpeg-core.js...';
        if (!this.ffmpeg.isLoaded()) {
            await this.ffmpeg.load();
        }

        for (const file of files) {
            try {
                this.statusMessage.textContent = `Converting ${file.name}...`;
                const outputFilename = file.name.replace(/\.wav$/, '.webm');
                this.ffmpeg.FS('writeFile', file.name, await FFmpeg.fetchFile(file));
                await this.ffmpeg.run('-i', file.name, outputFilename);
                const data = this.ffmpeg.FS('readFile', outputFilename);

                const blob = new Blob([data.buffer], { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = outputFilename;
                link.textContent = `Download ${outputFilename}`;
                link.style.display = 'block';
                this.downloadLinksContainer.appendChild(link);

                this.ffmpeg.FS('unlink', file.name);
                this.ffmpeg.FS('unlink', outputFilename);
            } catch (error) {
                this.statusMessage.textContent = `Error converting ${file.name}.`;
                console.error(error);
            }
        }

        this.statusMessage.textContent = 'All conversions complete!';
    }
}

import { IFrameApplication } from '../IFrameApplication.js';

export class MediaPlayerApp extends IFrameApplication {
    constructor(config) {
        super(config, 'https://benwiley4000.github.io/win95-media-player/');
    }
}

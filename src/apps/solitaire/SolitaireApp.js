import { IFrameApplication } from '../IFrameApplication.js';
import { ICONS } from '../../config/icons.js';

export class SolitaireApp extends IFrameApplication {
    static config = {
        id: 'solitaire',
        title: 'Solitaire',
        icon: ICONS.solitaire,
        width: 680,
        height: 520,
        url: 'apps/solitaire/index.html'
    };
}

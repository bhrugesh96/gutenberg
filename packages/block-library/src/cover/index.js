/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { cover as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			customOverlayColor: '#065174',
			dimRatio: 40,
			url: 'https://s.w.org/images/core/5.3/Windbuchencom.jpg',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					customFontSize: 48,
					content: __( '<strong>Snow Patrol</strong>' ),
					align: 'center',
				},
			},
		],
	},
	transforms,
	save,
	edit,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );

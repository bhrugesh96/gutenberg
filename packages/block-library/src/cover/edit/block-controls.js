/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

import {
	BlockControls,
	MediaReplaceFlow,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalBlockFullHeightAligmentControl as FullHeightAlignmentControl,
} from '@wordpress/block-editor';
import { __, isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES } from '../shared';

export default function CoverBlockControls( {
	attributes,
	setAttributes,
	onSelectMedia,
	currentSettings,
	toggleUseFeaturedImage,
} ) {
	const { contentPosition, id, useFeaturedImage, minHeight, minHeightUnit } =
		attributes;
	const { hasInnerBlocks, url } = currentSettings;

	const [ prevMinHeightValue, setPrevMinHeightValue ] = useState( minHeight );
	const [ prevMinHeightUnit, setPrevMinHeightUnit ] =
		useState( minHeightUnit );
	const isMinFullHeight = minHeightUnit === 'vh' && minHeight === 100;
	const toggleMinFullHeight = () => {
		if ( isMinFullHeight ) {
			// If there aren't previous values, take the default ones.
			if ( prevMinHeightUnit === 'vh' && prevMinHeightValue === 100 ) {
				return setAttributes( {
					minHeight: undefined,
					minHeightUnit: undefined,
				} );
			}

			// Set the previous values of height.
			return setAttributes( {
				minHeight: prevMinHeightValue,
				minHeightUnit: prevMinHeightUnit,
			} );
		}

		setPrevMinHeightValue( minHeight );
		setPrevMinHeightUnit( minHeightUnit );

		// Set full height.
		return setAttributes( {
			minHeight: 100,
			minHeightUnit: 'vh',
		} );
	};

	// Flip value horizontally to match the physical direction indicated by
	// AlignmentMatrixControl with the logical direction indicated by cover
	// block in RTL languages.
	const flipHorizontalPosition = ( ltrContentPosition ) => {
		return isRTL()
			? ltrContentPosition.replace( /left|right/, ( match ) =>
					match === 'left' ? 'right' : 'left'
			  )
			: ltrContentPosition;
	};

	return (
		<>
			<BlockControls group="block">
				<BlockAlignmentMatrixControl
					label={ __( 'Change content position' ) }
					value={ flipHorizontalPosition( contentPosition ) }
					onChange={ ( nextPosition ) =>
						setAttributes( {
							contentPosition:
								flipHorizontalPosition( nextPosition ),
						} )
					}
					isDisabled={ ! hasInnerBlocks }
				/>
				<FullHeightAlignmentControl
					isActive={ isMinFullHeight }
					onToggle={ toggleMinFullHeight }
					isDisabled={ ! hasInnerBlocks }
				/>
			</BlockControls>
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ id }
					mediaURL={ url }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					accept="image/*,video/*"
					onSelect={ onSelectMedia }
					onToggleFeaturedImage={ toggleUseFeaturedImage }
					useFeaturedImage={ useFeaturedImage }
					name={ ! url ? __( 'Add Media' ) : __( 'Replace' ) }
				/>
			</BlockControls>
		</>
	);
}

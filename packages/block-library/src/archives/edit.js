/**
 * WordPress dependencies
 */
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Disabled,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';

export default function ArchivesEdit( { attributes, setAttributes } ) {
	const { showLabel, showPostCounts, displayAsDropdown, type } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ () =>
							setAttributes( {
								displayAsDropdown: ! displayAsDropdown,
							} )
						}
					/>
					{ displayAsDropdown && (
						<ToggleControl
							label={ __( 'Show label' ) }
							checked={ showLabel }
							onChange={ () =>
								setAttributes( {
									showLabel: ! showLabel,
								} )
							}
						/>
					) }
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ () =>
							setAttributes( {
								showPostCounts: ! showPostCounts,
							} )
						}
					/>
					<SelectControl
						label={ __( 'Group by:' ) }
						options={ [
							{ label: __( 'Year' ), value: 'yearly' },
							{ label: __( 'Month' ), value: 'monthly' },
							{ label: __( 'Week' ), value: 'weekly' },
							{ label: __( 'Day' ), value: 'daily' },
						] }
						value={ type }
						onChange={ ( value ) =>
							setAttributes( { type: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<Disabled>
					<ServerSideRender
						block="core/archives"
						attributes={ attributes }
					/>
				</Disabled>
			</div>
		</>
	);
}

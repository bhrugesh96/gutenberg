/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostTemplateForm from './form';
import { store as editPostStore } from '../../../store';

export default function PostTemplate() {
	const anchorRef = useRef();

	const isVisible = useSelect( ( select ) => {
		const postTypeSlug = select( editorStore ).getCurrentPostType();
		const postType = select( coreStore ).getPostType( postTypeSlug );
		if ( ! postType?.viewable ) {
			return false;
		}

		const settings = select( editorStore ).getEditorSettings();
		const hasTemplates =
			!! settings.availableTemplates &&
			Object.keys( settings.availableTemplates ).length > 0;
		if ( hasTemplates ) {
			return true;
		}

		if ( ! settings.supportsTemplateMode ) {
			return false;
		}

		const canCreateTemplates =
			select( coreStore ).canUser( 'create', 'templates' ) ?? false;
		return canCreateTemplates;
	}, [] );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<PanelRow className="edit-post-post-template" ref={ anchorRef }>
			<span>{ __( 'Template' ) }</span>
			<Dropdown
				popoverProps={ { anchorRef } }
				position="bottom left"
				className="edit-post-post-template__dropdown"
				contentClassName="edit-post-post-template__dialog"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<PostTemplateToggle
						isOpen={ isOpen }
						onClick={ onToggle }
					/>
				) }
				renderContent={ ( { onClose } ) => (
					<PostTemplateForm onClose={ onClose } />
				) }
			/>
		</PanelRow>
	);
}

function PostTemplateToggle( { isOpen, onClick } ) {
	const templateTitle = useSelect( ( select ) => {
		const templateSlug =
			select( editorStore ).getEditedPostAttribute( 'template' );

		const { supportsTemplateMode, availableTemplates } =
			select( editorStore ).getEditorSettings();
		if ( ! supportsTemplateMode && availableTemplates[ templateSlug ] ) {
			return availableTemplates[ templateSlug ];
		}

		const template = select( editPostStore ).getEditedPostTemplate();
		return template?.title ?? template?.slug;
	}, [] );

	return (
		<Button
			className="edit-post-post-template__toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			aria-label={
				templateTitle
					? sprintf(
							// translators: %s: Name of the currently selected template.
							__( 'Select template: %s' ),
							templateTitle
					  )
					: __( 'Select template' )
			}
			onClick={ onClick }
		>
			{ templateTitle ?? __( 'Default template' ) }
		</Button>
	);
}
